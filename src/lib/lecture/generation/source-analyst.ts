/**
 * Source Analyst — Gap 1 fix.
 * ===========================================================================
 * Runs BEFORE slide generation. Analyses every source block from the parsed
 * documents and enriches each block with:
 *   - canonicalConcept  — short human-readable concept name
 *   - conceptType       — definition | mechanism | example | calculation |
 *                         case | misconception | prerequisite | application
 *   - importance        — critical | important | supporting
 *   - prerequisiteConcepts — other concepts that must come first
 *   - likelyCloIds      — faculty CLO ids this block supports
 *   - analysisNotes     — free-text insight for the curriculum planner
 *
 * The enriched blocks are returned as AnalysedBlock[] and stored back in the
 * DB via upsert so the plan-generator and slide-generator can use them as
 * scoped, typed inputs rather than raw text dumps.
 *
 * Design principles:
 *  - One LLM call per batch of ≤10 blocks (avoids context overflow).
 *  - The LLM is asked to IDENTIFY only — never to generate new content.
 *  - Falls back to the original block if LLM call fails (non-fatal).
 *  - Deduplication key: (projectId, blockId) — safe to re-run.
 */
import { chatJson, DEFAULT_AI_MODEL } from "@/lib/ai-engine";
import { db } from "@/lib/db";
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";

export type ConceptType =
  | "definition"
  | "mechanism"
  | "example"
  | "calculation"
  | "case"
  | "misconception"
  | "prerequisite"
  | "application"
  | "unknown";

export type ImportanceLevel = "critical" | "important" | "supporting";

export interface AnalysedBlock {
  id: string;
  locator: string;
  text: string;
  criticality: string;
  // Analyst-added fields
  canonicalConcept: string;
  conceptType: ConceptType;
  importance: ImportanceLevel;
  prerequisiteConcepts: string[];
  likelyCloIds: string[];
  analysisNotes: string;
  // Concept graph fields
  conceptClusterId?: string;     // groups related blocks into a coherent concept cluster
  clusterLabel?: string;         // human-readable label for the cluster
  clusterCLOIds?: string[];      // CLOs this cluster supports
}

// ─── Concept Graph types ─────────────────────────────────────────────────────

export interface ConceptCluster {
  id: string;
  label: string;               // e.g. "EcoRI Restriction Enzyme"
  blockIds: string[];
  cloIds: string[];
  prerequisites: string[];     // other cluster IDs this depends on
  conceptType: ConceptType;    // dominant type in the cluster
  importance: ImportanceLevel; // highest importance in the cluster
}

export type ConceptRelationship = {
  from: string;   // cluster ID
  to: string;     // cluster ID
  type: "PREREQUISITE_OF" | "PART_OF" | "ENABLES" | "CONTRASTS_WITH" | "EXAMPLE_OF" | "APPLICATION_OF";
};

// ─── system prompt ────────────────────────────────────────────────────────────

const SYSTEM = `You are the Source Analysis Agent for an academic lecture compiler.

Your ONLY job is to IDENTIFY and CLASSIFY content in the provided source blocks.

Rules:
1. Do NOT rewrite, improve, or generate new content.
2. Do NOT add facts that are not in the source text.
3. For each block, return ONLY what can be directly inferred from its text.
4. conceptType must be one of: definition | mechanism | example | calculation | case | misconception | prerequisite | application | unknown
5. importance must be one of: critical | important | supporting
6. prerequisiteConcepts: short names of concepts a student must know BEFORE this block.
7. likelyCloIds: match against the provided CLO ids — only assign if the block clearly supports that CLO.
8. analysisNotes: one sentence about what this block contributes pedagogically.
9. conceptClusterLabel: 2-5 word label for the CONCEPT CLUSTER this block belongs to. Blocks about the SAME concept (e.g. 'EcoRI enzyme' and 'EcoRI recognition sequence') share the same cluster label. Do NOT group unrelated concepts even if they appear on nearby pages.

Return STRICT JSON array — one entry per input block, in the same order.
Schema per entry:
{
  "blockId": "...",
  "canonicalConcept": "2-5 word concept name",
  "conceptType": "...",
  "importance": "...",
  "prerequisiteConcepts": ["..."],
  "likelyCloIds": ["..."],
  "analysisNotes": "...",
  "conceptClusterLabel": "2-5 word cluster name (e.g. 'Restriction Enzymes', 'mRNA Purification')"
}`;

// ─── Concept clustering system prompt (second LLM pass) ──────────────────────

const CLUSTER_SYSTEM = `You are the Concept Graph Builder for an academic lecture compiler.

You receive the ANALYSED source blocks (with concept labels, types, importance, and CLO mappings).
Your job is to:
1. GROUP blocks into coherent CONCEPT CLUSTERS — each cluster covers ONE cohesive concept.
2. Determine PREREQUISITE relationships between clusters.
3. Assign each cluster to relevant CLOs.

RULES:
- A concept cluster must contain ONLY blocks that teach the SAME concept or closely related sub-concepts.
- Do NOT combine unrelated concepts just because they appear in nearby pages.
- Example: 'EcoRI restriction enzyme' and 'EcoRI recognition sequence' belong to the SAME cluster.
  But 'EcoRI enzyme' and 'mRNA purification' are DIFFERENT clusters.
- Prerequisites: if understanding cluster B requires understanding cluster A first, mark A→B as PREREQUISITE_OF.
- Return 4-8 clusters (merge very small clusters that are tightly related).

Return STRICT JSON:
{
  "clusters": [
    {
      "id": "cluster-1",
      "label": "2-5 word concept name",
      "blockIds": ["block-id-1", "block-id-2"],
      "cloIds": ["clo-id-1"],
      "prerequisites": ["cluster-id-that-must-come-first"],
      "dominantConceptType": "mechanism",
      "highestImportance": "critical"
    }
  ],
  "relationships": [
    {
      "from": "cluster-1",
      "to": "cluster-2",
      "type": "PREREQUISITE_OF"
    }
  ]
}`;

const CLUSTER_RELATIONSHIP_TYPES = new Set([
  "PREREQUISITE_OF", "PART_OF", "ENABLES", "CONTRASTS_WITH", "EXAMPLE_OF", "APPLICATION_OF"
]);

// ─── helpers ──────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function buildUserPrompt(
  blocks: { id: string; locator: string; text: string }[],
  clos: CourseLearningOutcome[]
): string {
  const cloSummary = clos
    .map((c) => `- ${c.id || c.number}: ${c.text.slice(0, 120)}`)
    .join("\n");

  const blockSummary = blocks
    .map(
      (b) =>
        `{"blockId":"${b.id}","locator":"${b.locator}","text":${JSON.stringify(b.text.slice(0, 600))}}`
    )
    .join(",\n");

  return [
    "CLOs:",
    cloSummary,
    "",
    "Source blocks to analyse:",
    `[${blockSummary}]`,
    "",
    "Return the JSON array.",
  ].join("\n");
}

/** Merge LLM analysis result back into the block, tolerating malformed output. */
function mergeAnalysis(
  block: { id: string; locator: string; text: string; criticality: string },
  raw: Record<string, unknown> | null
): AnalysedBlock {
  const validConceptTypes: ConceptType[] = [
    "definition",
    "mechanism",
    "example",
    "calculation",
    "case",
    "misconception",
    "prerequisite",
    "application",
    "unknown",
  ];
  const validImportance: ImportanceLevel[] = ["critical", "important", "supporting"];

  return {
    id: block.id,
    locator: block.locator,
    text: block.text,
    criticality: block.criticality,
    canonicalConcept:
      typeof raw?.canonicalConcept === "string" && raw.canonicalConcept.trim()
        ? raw.canonicalConcept.trim()
        : block.locator,
    conceptType: validConceptTypes.includes(raw?.conceptType as ConceptType)
      ? (raw!.conceptType as ConceptType)
      : "unknown",
    importance:
      validImportance.includes(raw?.importance as ImportanceLevel)
        ? (raw!.importance as ImportanceLevel)
        : block.criticality === "critical"
        ? "critical"
        : "supporting",
    prerequisiteConcepts: Array.isArray(raw?.prerequisiteConcepts)
      ? (raw!.prerequisiteConcepts as string[]).map(String).slice(0, 5)
      : [],
    likelyCloIds: Array.isArray(raw?.likelyCloIds)
      ? (raw!.likelyCloIds as string[]).map(String).slice(0, 5)
      : [],
    analysisNotes:
      typeof raw?.analysisNotes === "string" ? raw.analysisNotes : "",
    conceptClusterId: typeof raw?.conceptClusterLabel === "string" ? undefined : undefined, // assigned by cluster pass
    clusterLabel: typeof raw?.conceptClusterLabel === "string" ? raw.conceptClusterLabel.trim() : undefined,
  };
}

// ─── main export ──────────────────────────────────────────────────────────────

/**
 * Build concept clusters from analysed blocks via a second LLM pass.
 * This groups blocks into coherent concept clusters and determines prerequisite
 * relationships between clusters. Returns the blocks with cluster IDs assigned.
 */
async function buildConceptClusters(
  analysed: AnalysedBlock[],
  clos: CourseLearningOutcome[]
): Promise<AnalysedBlock[]> {
  if (analysed.length === 0) return analysed;

  // If there are few blocks, skip clustering — one cluster per block is fine
  if (analysed.length <= 6) {
    return analysed.map((b, i) => ({
      ...b,
      conceptClusterId: `cluster-${i + 1}`,
      clusterCLOIds: b.likelyCloIds,
    }));
  }

  try {
    const cloSummary = clos.map((c) => `- ${c.id || c.number}: ${c.text.slice(0, 100)}`).join("\n");
    const blockSummary = analysed
      .map((b) =>
        JSON.stringify({
          id: b.id,
          canonicalConcept: b.canonicalConcept,
          conceptType: b.conceptType,
          importance: b.importance,
          likelyCloIds: b.likelyCloIds,
          clusterLabel: b.clusterLabel,
          textPreview: b.text.slice(0, 200),
        })
      )
      .join(",\n");

    const userPrompt = [
      "CLOs:",
      cloSummary,
      "",
      "Analysed blocks:",
      `[${blockSummary}]`,
      "",
      "Return the JSON with clusters and relationships.",
    ].join("\n");

    const res = await chatJson({
      system: CLUSTER_SYSTEM,
      user: userPrompt,
      temperature: 0.1,
      model: DEFAULT_AI_MODEL,
    });

    const json = (res.json ?? {}) as Record<string, unknown>;
    const clusters = Array.isArray(json.clusters) ? json.clusters : [];
    const relationships = Array.isArray(json.relationships) ? json.relationships : [];

    if (clusters.length === 0) return analysed; // fallback — no clustering

    // Build cluster lookup: clusterId → cluster info
    const clusterMap = new Map<string, { label: string; cloIds: string[]; prerequisites: string[] }>();
    for (const c of clusters) {
      const cid = (c as any).id || `cluster-${clusterMap.size + 1}`;
      clusterMap.set(cid, {
        label: (c as any).label || cid,
        cloIds: Array.isArray((c as any).cloIds) ? (c as any).cloIds : [],
        prerequisites: Array.isArray((c as any).prerequisites) ? (c as any).prerequisites : [],
      });
    }

    // Build block → cluster mapping
    const blockToCluster = new Map<string, string>();
    for (const c of clusters) {
      const cid = (c as any).id || "";
      const blockIds = Array.isArray((c as any).blockIds) ? (c as any).blockIds : [];
      for (const bid of blockIds) {
        blockToCluster.set(String(bid), cid);
      }
    }

    // Assign cluster IDs to blocks
    const enriched = analysed.map((b) => {
      const cid = blockToCluster.get(b.id);
      if (!cid) return b;
      const cluster = clusterMap.get(cid);
      return {
        ...b,
        conceptClusterId: cid,
        clusterLabel: cluster?.label || b.clusterLabel,
        clusterCLOIds: cluster?.cloIds || b.likelyCloIds,
      };
    });

    return enriched;
  } catch (err) {
    console.warn("[SourceAnalyst] Concept clustering non-fatal failure:", err);
    // Fallback: use the clusterLabel from the first pass
    const labelToId = new Map<string, string>();
    let counter = 0;
    return analysed.map((b) => {
      const label = b.clusterLabel || b.canonicalConcept;
      if (!labelToId.has(label)) {
        counter++;
        labelToId.set(label, `cluster-${counter}`);
      }
      return {
        ...b,
        conceptClusterId: labelToId.get(label)!,
        clusterCLOIds: b.likelyCloIds,
      };
    });
  }
}

/**
 * Analyse all source blocks for a project.
 * Returns enriched AnalysedBlock[] with concept clusters assigned.
 *
 * Pipeline:
 *  1. Per-block classification (parallel batches of 10)
 *  2. Concept clustering (single LLM call on all analysed blocks)
 *  3. Assign cluster IDs to blocks
 *
 * Non-fatal: if any step fails, blocks are returned with fallback analysis.
 */
export async function analyseSourceBlocks(
  projectId: string,
  rawBlocks: { id: string; locator: string; text: string; criticality: string }[],
  clos: CourseLearningOutcome[]
): Promise<AnalysedBlock[]> {
  if (rawBlocks.length === 0) return [];

  // Filter out pure noise before sending to LLM
  const usableBlocks = rawBlocks.filter(
    (b) =>
      b.text.trim().length > 30 &&
      !/^(references|table of contents|index|bibliography)\b/i.test(b.text.trim())
  );

  const BATCH_SIZE = 5;
  const batches = chunkArray(usableBlocks, BATCH_SIZE);

  // Step 1: Per-block classification — sequential with circuit-breaker
  const classified: AnalysedBlock[] = [];
  let consecutiveFailures = 0;
  for (const batch of batches) {
    // Circuit breaker: if 3 consecutive batches fail, skip remaining
    if (consecutiveFailures >= 3) {
      console.warn("[SourceAnalyst] Circuit breaker: skipping remaining batches after", consecutiveFailures, "failures");
      for (const block of batch) {
        classified.push(mergeAnalysis(block, null));
      }
      continue;
    }
    try {
      const res = await chatJson({
        system: SYSTEM,
        user: buildUserPrompt(batch, clos),
        temperature: 0.15,
        model: DEFAULT_AI_MODEL,
      });

      const jsonArr = Array.isArray(res.json) ? res.json : [];

      for (const block of batch) {
        const match = jsonArr.find(
          (entry: unknown) =>
            typeof entry === "object" &&
            entry !== null &&
            (entry as Record<string, unknown>).blockId === block.id
        ) as Record<string, unknown> | undefined;

        classified.push(mergeAnalysis(block, match ?? null));
      }
      consecutiveFailures = 0;
    } catch {
      consecutiveFailures++;
      for (const block of batch) {
        classified.push(mergeAnalysis(block, null));
      }
    }
    // Yield to event loop between batches to free memory
    await new Promise((r) => setTimeout(r, 100));
  }

  // Step 2: Build concept clusters
  const results = await buildConceptClusters(classified, clos);

  // Persist analysis back to DB where column exists (best-effort, non-fatal)
  try {
    await persistAnalysis(projectId, results);
  } catch {
    // DB column may not exist in all migrations — never block generation
  }

  return results;
}

/**
 * Persist analysis metadata to DB.
 * Uses updateMany so we never create duplicate rows.
 */
async function persistAnalysis(
  projectId: string,
  analysed: AnalysedBlock[]
): Promise<void> {
  // Fire background updates without blocking the worker thread
  Promise.all(
    analysed.map((block) =>
      db.lectureSourceBlock
        .updateMany({
          where: { id: block.id, projectId },
          data: {
            status: `analysed:${JSON.stringify({
              canonicalConcept: block.canonicalConcept,
              conceptType: block.conceptType,
              importance: block.importance,
              likelyCloIds: block.likelyCloIds,
            })}`,
          },
        })
        .catch(() => {})
    )
  ).catch(() => {});
}

/**
 * Filter analysed blocks to only those relevant for a specific slide plan.
 * Uses CONCEPT CLUSTER scoping — prefer blocks from the same cluster,
 * then fall back to CLO matching, then critical blocks.
 *
 * This prevents mixing unrelated concepts in a single slide.
 */
export function scopeBlocksForSlide(
  analysed: AnalysedBlock[],
  slideCloIds: string[],
  slideSourceBlockIds: string[]
): AnalysedBlock[] {
  // Primary: blocks explicitly mapped to this slide in the plan
  const explicit = analysed.filter((b) => slideSourceBlockIds.includes(b.id));
  if (explicit.length >= 2) {
    // If explicit blocks span multiple clusters, warn but still use them
    // (faculty deliberately mapped them to this slide)
    return explicit;
  }

  // Secondary: use concept cluster scoping
  // Find the dominant cluster among the explicit blocks (if any)
  if (explicit.length === 1 && explicit[0].conceptClusterId) {
    const clusterId = explicit[0].conceptClusterId;
    const clusterBlocks = analysed.filter((b) => b.conceptClusterId === clusterId);
    if (clusterBlocks.length >= 2) {
      return clusterBlocks;
    }
  }

  // Tertiary: blocks whose CLO analysis overlaps with this slide's CLOs,
  // but ONLY from the same or related clusters
  if (slideCloIds.length > 0) {
    const byClO = analysed.filter((b) =>
      b.likelyCloIds.some((id) => slideCloIds.includes(id))
    );
    if (byClO.length >= 2) {
      // Group by cluster and pick the largest coherent cluster
      const clusterGroups = new Map<string, AnalysedBlock[]>();
      for (const b of byClO) {
        const cid = b.conceptClusterId || "unclustered";
        if (!clusterGroups.has(cid)) clusterGroups.set(cid, []);
        clusterGroups.get(cid)!.push(b);
      }
      // Pick the cluster with the most blocks (most coherent)
      let bestCluster: AnalysedBlock[] = [];
      for (const group of clusterGroups.values()) {
        if (group.length > bestCluster.length) bestCluster = group;
      }
      if (bestCluster.length >= 2) return bestCluster;
      // If no cluster has 2+ blocks, fall through to CLO-based but cap at 6
      return byClO.slice(0, 6);
    }
  }

  // Fallback: return empty — NEVER mix unrelated concepts.
  // The slide generator will produce a focused response from the slide plan alone.
  // Returning unrelated critical blocks causes the exact mixing problem the user reported.
  console.warn(`[SourceAnalyst] No coherent cluster found for slide with CLOs: ${slideCloIds.join(', ')}. Returning empty blocks.`);
  return [];
}

/**
 * Get all clusters for a project. Useful for validation and debugging.
 */
export function getConceptClusters(analysed: AnalysedBlock[]): ConceptCluster[] {
  const clusterMap = new Map<string, ConceptCluster>();
  for (const b of analysed) {
    const cid = b.conceptClusterId || `unclustered-${b.id}`;
    if (!clusterMap.has(cid)) {
      clusterMap.set(cid, {
        id: cid,
        label: b.clusterLabel || b.canonicalConcept,
        blockIds: [],
        cloIds: [],
        prerequisites: [],
        conceptType: b.conceptType,
        importance: b.importance,
      });
    }
    const cluster = clusterMap.get(cid)!;
    cluster.blockIds.push(b.id);
    for (const cloId of b.likelyCloIds) {
      if (!cluster.cloIds.includes(cloId)) cluster.cloIds.push(cloId);
    }
    // Upgrade importance if needed
    const impOrder: ImportanceLevel[] = ["supporting", "important", "critical"];
    if (impOrder.indexOf(b.importance) > impOrder.indexOf(cluster.importance)) {
      cluster.importance = b.importance;
    }
  }
  return Array.from(clusterMap.values());
}

/**
 * Section 9: Source Availability Gate.
 * Verifies that source documents and text blocks exist before generation begins.
 */
export async function checkSourceAvailability(projectId: string): Promise<{ available: boolean; reason?: string }> {
  const docs = await db.lectureSourceDocument.findMany({
    where: { projectId },
    select: { id: true, originalName: true, type: true, parseStatus: true },
  });
  if (docs.length === 0) {
    return { available: false, reason: "SOURCE_MATERIAL_UNAVAILABLE: No source documents uploaded for project." };
  }
  const blocks = await db.lectureSourceBlock.count({ where: { projectId } });
  if (blocks === 0) {
    return { available: false, reason: "SOURCE_MATERIAL_UNAVAILABLE: Source files present but zero text blocks extracted." };
  }
  return { available: true };
}
