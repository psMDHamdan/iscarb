/**
 * Lecture RAG — Source Block Embedder + Semantic Retrieval
 * =========================================================================
 * Embeds source blocks via NVIDIA embedding model and stores them in pgvector.
 * Provides similarity search to retrieve the most relevant blocks for each
 * slide during generation — replacing the current "pass all blocks" approach.
 *
 * Embedding model: nvidia/llama-3.2-nv-embedqa-1b-v2 (1024 dims)
 * Storage: pgvector column on LectureSourceBlock
 * Search: cosine similarity via HNSW index
 */
import { db } from "@/lib/db";
import { redis } from "@/config/redis";
import { vectorDbConfig } from "@/config/vector-db";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const EMBEDDING_MODEL = vectorDbConfig.embeddingModel;
const EMBEDDING_DIMS = vectorDbConfig.dimensions;
const BATCH_SIZE = vectorDbConfig.batchSize; // 50 blocks per embedding call
const MAX_BLOCK_CHARS = 2000; // Truncate very long blocks before embedding
const SIMILARITY_THRESHOLD = vectorDbConfig.similarityThreshold; // 0.7
const MAX_RESULTS_PER_QUERY = vectorDbConfig.maxResults; // 20
const ENABLED = vectorDbConfig.enabled && vectorDbConfig.optionalEmbeddings !== true
  ? true
  : vectorDbConfig.enabled;

// Cache key prefix for embedding status
const EMBED_STATUS_PREFIX = "lecture:embed:";

// ---------------------------------------------------------------------------
// NVIDIA Embedding API
// ---------------------------------------------------------------------------

interface EmbeddingResponse {
  data: { embedding: number[]; index: number }[];
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

/**
 * Get the NVIDIA API key from environment (supports multiple keys for round-robin).
 */
function getApiKey(): string {
  const keys = [
    process.env.NVIDIA_API_KEY,
    process.env.NVIDIA_API_KEY_2,
    process.env.NVIDIA_API_KEY_3,
    process.env.NVIDIA_API_KEY_4,
    process.env.NVIDIA_API_KEY_5,
  ].filter(Boolean) as string[];
  return keys[0] || "";
}

/**
 * Get the base URL for NVIDIA API calls.
 */
function getBaseUrl(): string {
  return process.env.NVIDIA_BASE_URL || process.env.OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1";
}

/**
 * Generate embeddings for a batch of texts via NVIDIA embedding API.
 */
async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[RAG] No NVIDIA API key configured — skipping embedding");
    return texts.map(() => []);
  }

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/embeddings`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        encoding_format: "float",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`[RAG] Embedding API returned ${response.status}: ${body.slice(0, 200)}`);
      return texts.map(() => []);
    }

    const result = (await response.json()) as EmbeddingResponse;

    // Sort by index to ensure ordering matches input
    const sorted = result.data.sort((a, b) => a.index - b.index);
    return sorted.map((d) => d.embedding);
  } catch (err) {
    console.warn("[RAG] Embedding API call failed:", err);
    return texts.map(() => []);
  }
}

// ---------------------------------------------------------------------------
// Public API: Embed Source Blocks
// ---------------------------------------------------------------------------

/**
 * Embed all source blocks for a project that don't yet have embeddings.
 * Called after document parsing completes. Batches by BATCH_SIZE.
 *
 * Returns the count of newly embedded blocks.
 */
export async function embedProjectBlocks(projectId: string): Promise<number> {
  if (!ENABLED) return 0;

  const blocks = await db.$queryRaw<Array<{ id: string; text: string; embedding: string | null }>>(
    `SELECT id, text, "embedding"::text FROM "LectureSourceBlock" WHERE "projectId" = $1`,
    [projectId]
  );

  // Filter to blocks that need embedding (null or empty embedding)
  const unembedded = blocks.filter((b: { embedding: string | null }) => !b.embedding);
  if (unembedded.length === 0) return 0;

  console.log(`[RAG] Embedding ${unembedded.length}/${blocks.length} source blocks for project ${projectId}`);

  let embedded = 0;

  // Process in batches
  for (let i = 0; i < unembedded.length; i += BATCH_SIZE) {
    const batch = unembedded.slice(i, i + BATCH_SIZE);

    // Prepare texts: truncate and clean
    const texts = batch.map((b: { text: string }) => b.text.slice(0, MAX_BLOCK_CHARS).trim());

    // Get embeddings
    const vectors = await embedBatch(texts);

    // Store embeddings in DB using raw SQL (Prisma doesn't support vector type)
    for (let j = 0; j < batch.length; j++) {
      const vec = vectors[j];
      if (!vec || vec.length === 0) continue;

      // Convert float array to pgvector string format: '[0.1,0.2,...]'
      const vecStr = `[${vec.join(",")}]`;

      try {
        await db.$executeRawUnsafe(
          `UPDATE "LectureSourceBlock"
           SET "embedding" = $1::vector, "embeddingModel" = $2
           WHERE "id" = $3`,
          vecStr,
          EMBEDDING_MODEL,
          batch[j].id
        );
        embedded++;
      } catch (err) {
        console.warn(`[RAG] Failed to store embedding for block ${batch[j].id}:`, err);
      }
    }

    // Progress update in Redis
    try {
      const progress = Math.round(((i + batch.length) / unembedded.length) * 100);
      await redis.hset(`${EMBED_STATUS_PREFIX}${projectId}`, {
        status: "embedding",
        progress: String(progress),
      });
    } catch {
      // best-effort progress
    }
  }

  console.log(`[RAG] Embedded ${embedded}/${unembedded.length} blocks for project ${projectId}`);

  // Mark complete
  try {
    await redis.hset(`${EMBED_STATUS_PREFIX}${projectId}`, {
      status: "done",
      progress: "100",
    });
  } catch {
    // best-effort
  }

  return embedded;
}

// ---------------------------------------------------------------------------
// Public API: Semantic Retrieval
// ---------------------------------------------------------------------------

export interface RetrievedBlock {
  id: string;
  locator: string;
  text: string;
  criticality: string;
  similarity: number;
}

/**
 * Retrieve the most semantically similar source blocks for a query.
 * Used during slide generation to scope blocks per slide instead of
 * sending all blocks in the prompt.
 *
 * @param projectId - The lecture project ID
 * @param query - The slide title + function + CLO text as search query
 * @param excludeIds - Block IDs to exclude (already mapped to other slides)
 * @param maxResults - Maximum blocks to return (default 8)
 * @param minSimilarity - Minimum cosine similarity threshold (default from config)
 */
export async function retrieveRelevantBlocks(
  projectId: string,
  query: string,
  excludeIds: string[] = [],
  maxResults: number = 8,
  minSimilarity: number = SIMILARITY_THRESHOLD
): Promise<RetrievedBlock[]> {
  if (!ENABLED) return [];

  // Embed the query
  const queryVectors = await embedBatch([query.slice(0, MAX_BLOCK_CHARS)]);
  const queryVec = queryVectors[0];
  if (!queryVec || queryVec.length === 0) return [];

  const queryVecStr = `[${queryVec.join(",")}]`;

  // Build exclusion filter
  let excludeClause = "";
  const params: unknown[] = [projectId, queryVecStr, maxResults, minSimilarity];

  if (excludeIds.length > 0) {
    // Add exclude IDs as additional params
    const placeholders = excludeIds.map((_, i) => `$${i + 5}`).join(",");
    excludeClause = `AND id NOT IN (${placeholders})`;
    params.push(...excludeIds);
  }

  try {
    const results = await db.$queryRawUnsafe<RetrievedBlock[]>(
      `
      SELECT
        id,
        locator,
        text,
        criticality,
        1 - (embedding <=> $2::vector) AS similarity
      FROM "LectureSourceBlock"
      WHERE "projectId" = $1
        AND embedding IS NOT NULL
        ${excludeClause}
      ORDER BY embedding <=> $2::vector
      LIMIT $3
      `,
      ...params
    );

    // Filter by minimum similarity
    return results.filter((r: { similarity: number }) => r.similarity >= minSimilarity);
  } catch (err) {
    console.warn("[RAG] Similarity search failed:", err);
    return [];
  }
}

/**
 * Retrieve blocks for a specific slide by combining semantic search with
 * explicit source block mappings from the slide plan.
 *
 * Strategy:
 * 1. Start with explicitly mapped blocks (from slide plan's sourceBlockIds)
 * 2. Supplement with semantically similar blocks up to maxResults
 * 3. Never duplicate blocks
 */
export async function retrieveBlocksForSlide(
  projectId: string,
  slideTitle: string,
  slideFunction: string,
  cloTexts: string[],
  explicitBlockIds: string[],
  allAnalysedBlocks: Array<{ id: string; text: string; criticality: string; canonicalConcept: string }>,
  maxResults: number = 8
): Promise<Array<{ id: string; locator: string; text: string; criticality: string }>> {
  // 1. Get explicitly mapped blocks from the full set
  const explicitBlocks = allAnalysedBlocks
    .filter((b: { id: string }) => explicitBlockIds.includes(b.id))
    .map((b: { id: string; text: string; criticality: string; canonicalConcept: string }) => ({ ...b, locator: "" })); // locator will be filled below

  if (explicitBlocks.length > 0) {
    // Get locators from DB for explicit blocks
    const locators = await db.$queryRaw<Array<{ id: string; locator: string }>>(
      `SELECT id, locator FROM "LectureSourceBlock" WHERE id = ANY($1)`,
      [explicitBlockIds]
    );
    const locatorMap = new Map<string, string>(locators.map((l: { id: string; locator: string }) => [l.id, l.locator]));
    explicitBlocks.forEach((b: { id: string; locator: string }) => { b.locator = locatorMap.get(b.id) || ""; });
  }

  if (explicitBlocks.length >= maxResults) {
    return explicitBlocks.slice(0, maxResults);
  }

  // 2. Build semantic query from slide context
  const semanticQuery = [
    slideTitle,
    slideFunction,
    ...cloTexts,
  ].join(". ");

  // 3. Retrieve additional blocks via similarity
  const additionalBlocks = await retrieveRelevantBlocks(
    projectId,
    semanticQuery,
    explicitBlockIds, // exclude already-mapped blocks
    maxResults - explicitBlocks.length
  );

  // 4. Get locators for additional blocks
  if (additionalBlocks.length > 0) {
    const additionalIds = additionalBlocks.map((b: { id: string }) => b.id);
    const locators = await db.$queryRaw<Array<{ id: string; locator: string }>>(
      `SELECT id, locator FROM "LectureSourceBlock" WHERE id = ANY($1)`,
      [additionalIds]
    );
    const locatorMap = new Map<string, string>(locators.map((l: { id: string; locator: string }) => [l.id, l.locator]));
    additionalBlocks.forEach((b: { id: string; locator: string }) => { b.locator = locatorMap.get(b.id) || b.locator; });
  }

  // 5. Merge: explicit first, then semantic补充
  const merged = [
    ...explicitBlocks.map((b) => ({
      id: b.id,
      locator: b.locator,
      text: b.text,
      criticality: b.criticality,
    })),
    ...additionalBlocks.map((b) => ({
      id: b.id,
      locator: b.locator,
      text: b.text,
      criticality: b.criticality,
    })),
  ];

  // Deduplicate by ID
  const seen = new Set<string>();
  return merged.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Utility: Check embedding status
// ---------------------------------------------------------------------------

export async function getEmbeddingStatus(projectId: string): Promise<{
  status: string;
  progress: number;
  totalBlocks: number;
  embeddedBlocks: number;
}> {
  const [status, counts] = await Promise.all([
    redis.hgetall(`${EMBED_STATUS_PREFIX}${projectId}`).catch(() => ({})),
    db.$queryRaw<Array<{ total: bigint; embedded: bigint }>>(
      `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as embedded
      FROM "LectureSourceBlock"
      WHERE "projectId" = $1
      `,
      [projectId]
    ),
  ]);

  const c = counts[0] || { total: BigInt(0), embedded: BigInt(0) };
  return {
    status: (status as Record<string, string>).status || "idle",
    progress: parseInt((status as Record<string, string>).progress || "0", 10),
    totalBlocks: Number(c.total),
    embeddedBlocks: Number(c.embedded),
  };
}
