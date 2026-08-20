/**
 * Normalize AssessmentResponse.source to ontology scoringSource concepts:
 * ai | fallback | human | seed (see /api/rdf/ontology scoringSource enum).
 *
 * "seed" = demo/fixture rows — never treat as live AI grades.
 */
export type ScoringSourceConcept = "ai" | "fallback" | "human" | "seed";

const ALLOWED: ReadonlySet<string> = new Set(["ai", "fallback", "human", "seed"]);

export function normalizeScoringSource(
  source: string | null | undefined,
): ScoringSourceConcept {
  const raw = (source ?? "").trim().toLowerCase();
  if (ALLOWED.has(raw)) return raw as ScoringSourceConcept;
  // Legacy / alternate labels
  if (raw === "llm" || raw === "k2-think" || raw === "openai") return "ai";
  if (raw === "heuristic" || raw === "gate" || raw === "rules") return "fallback";
  if (raw === "faculty" || raw === "manual" || raw === "reviewer") return "human";
  if (raw === "fixture" || raw === "demo" || raw === "sample") return "seed";
  // Unknown empty → fallback (never invent "AI")
  return "fallback";
}

/** True only for live AI scoring path — seed/fallback/human must not show as AI-graded. */
export function isAiGradedSource(source: string | null | undefined): boolean {
  return normalizeScoringSource(source) === "ai";
}
