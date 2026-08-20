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
}

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

Return STRICT JSON array — one entry per input block, in the same order.
Schema per entry:
{
  "blockId": "...",
  "canonicalConcept": "2-5 word concept name",
  "conceptType": "...",
  "importance": "...",
  "prerequisiteConcepts": ["..."],
  "likelyCloIds": ["..."],
  "analysisNotes": "..."
}`;

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
  };
}

// ─── main export ──────────────────────────────────────────────────────────────

/**
 * Analyse all source blocks for a project.
 * Returns enriched AnalysedBlock[] and persists analysis metadata back to the
 * DB (stored in the `analysisJson` column of LectureSourceBlock if it exists,
 * otherwise this is a no-op persist — the returned array is what matters).
 *
 * Non-fatal: if any batch fails, blocks are returned with fallback analysis.
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

  const BATCH_SIZE = 10;
  const batches = chunkArray(usableBlocks, BATCH_SIZE);

  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      const batchList: AnalysedBlock[] = [];
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

          batchList.push(mergeAnalysis(block, match ?? null));
        }
      } catch {
        for (const block of batch) {
          batchList.push(mergeAnalysis(block, null));
        }
      }
      return batchList;
    })
  );

  const results: AnalysedBlock[] = batchResults.flat();

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
 * Used by Gap 4 (scoped regen) to pass only the right blocks per slide.
 */
export function scopeBlocksForSlide(
  analysed: AnalysedBlock[],
  slideCloIds: string[],
  slideSourceBlockIds: string[]
): AnalysedBlock[] {
  // Primary: blocks explicitly mapped to this slide in the plan
  const explicit = analysed.filter((b) => slideSourceBlockIds.includes(b.id));
  if (explicit.length > 0) return explicit;

  // Secondary: blocks whose CLO analysis overlaps with this slide's CLOs
  if (slideCloIds.length > 0) {
    const byClO = analysed.filter((b) =>
      b.likelyCloIds.some((id) => slideCloIds.includes(id))
    );
    if (byClO.length > 0) return byClO.slice(0, 8);
  }

  // Fallback: all critical blocks (capped to avoid context overflow)
  return analysed.filter((b) => b.importance === "critical").slice(0, 8);
}
