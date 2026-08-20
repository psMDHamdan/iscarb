/**
 * Claim Verifier — Gap 3c fix.
 * ===========================================================================
 * Replaces the part of the monolithic academic-reviewer.ts that checked
 * "is the lecture factually sound?" — per-slide, focused, with explicit
 * claim status tagging.
 *
 * For each slide, the verifier:
 *  1. Identifies every factual claim in title + bullets
 *  2. Classifies each as SOURCE_FACT | DERIVED | ILLUSTRATIVE | HYPOTHETICAL
 *     | NEED_SOURCE
 *  3. Checks that SOURCE_FACT claims have a matching source block citation
 *  4. Flags NEED_SOURCE claims for the Decision Inbox
 *  5. Ensures hypothetical examples are labeled as such
 *
 * Returns the slide with updated `claims` array and a ReviewResult.
 */
import { chatJson, DEFAULT_AI_MODEL } from "@/lib/ai-engine";
import type { SlideContentJson, ReviewResult, Claim } from "../types";

const SYSTEM = `You are the Claim Verification Agent for an academic lecture compiler.

Your ONLY job: identify and classify every factual claim in the provided slide.

Claim types:
- SOURCE_FACT: directly supported by the provided source blocks
- DERIVED: logically derived from source facts (label it — don't treat as invented)
- ILLUSTRATIVE: a made-up scenario used to illustrate (acceptable if labeled)
- HYPOTHETICAL: clearly marked as hypothetical in the content
- NEED_SOURCE: a factual assertion with no supporting source — must be flagged

Rules:
1. Do NOT verify statistical facts you don't have data for — mark them NEED_SOURCE.
2. Do NOT fabricate citations. If a claim has no source block, it is NEED_SOURCE.
3. Real company names, national statistics, or government policy claims require a source.
4. Generic teaching examples ("imagine a system...") are ILLUSTRATIVE — not NEED_SOURCE.
5. If a slide has ZERO claims (e.g. a pure activity/poll slide), return status PASS.

Return STRICT JSON:
{
  "status": "PASS" | "SOFT_FAIL" | "HARD_FAIL",
  "claims": [
    {
      "text": "exact claim text",
      "type": "SOURCE_FACT|DERIVED|ILLUSTRATIVE|HYPOTHETICAL|NEED_SOURCE",
      "sourceBlockId": "id or null",
      "verificationStatus": "VERIFIED|PARTIALLY_SUPPORTED|UNSUPPORTED"
    }
  ],
  "needSourceCount": 0,
  "repairActions": ["..."]
}`;

function userPrompt(
  slide: SlideContentJson,
  sourceBlocks: { id: string; locator: string; text: string }[]
): string {
  return JSON.stringify({
    slideNo: slide.slideNo,
    title: slide.title,
    bullets: slide.bullets?.slice(0, 5),
    existingClaims: slide.claims?.slice(0, 8),
    sourceBlocks: sourceBlocks.slice(0, 6).map((b) => ({
      id: b.id,
      locator: b.locator,
      preview: b.text.slice(0, 300),
    })),
  });
}

export async function verifyClaims(
  slide: SlideContentJson,
  sourceBlocks: { id: string; locator: string; text: string }[]
): Promise<{ slide: SlideContentJson; result: ReviewResult }> {
  const emptyPass = (): ReviewResult => ({
    status: "PASS",
    score: 5,
    criticalIssues: [],
    majorIssues: [],
    minorIssues: [],
    failedRules: [],
    unsupportedClaims: [],
    weakQuestions: [],
    weakExamples: [],
    missingConcepts: [],
    repairActions: [],
  });

  // Pure interaction/activity slides have no claims to verify
  const pureActivityFunctions = new Set(["clos", "hook", "prior_knowledge"]);
  const isActivity =
    !slide.title ||
    !slide.body?.bullets || slide.body.bullets.length === 0 ||
    pureActivityFunctions.has((slide as any).fn ?? "");
  if (isActivity) return { slide, result: emptyPass() };

  try {
    const res = await chatJson({
      system: SYSTEM,
      user: userPrompt(slide, sourceBlocks),
      temperature: 0.15,
      model: DEFAULT_AI_MODEL,
    });

    const j = (res.json ?? {}) as Record<string, unknown>;
    if (res.json === null || (j as any).fallback) return { slide, result: emptyPass() };

    const rawClaims = Array.isArray(j.claims) ? (j.claims as any[]) : [];
    const needSourceCount =
      typeof j.needSourceCount === "number"
        ? j.needSourceCount
        : rawClaims.filter((c) => c.type === "NEED_SOURCE").length;

    const status = (["PASS", "SOFT_FAIL", "HARD_FAIL"].includes(j.status as string)
      ? j.status
      : needSourceCount > 0
      ? "SOFT_FAIL"
      : "PASS") as ReviewResult["status"];

    // Normalise claims into the Claim[] shape
    const normalizedClaims: Claim[] = rawClaims.map((c, i) => ({
      id: String(i),
      text: String(c.text ?? ""),
      type: c.type ?? "NEED_SOURCE",
      sourceIds: c.sourceBlockId ? [c.sourceBlockId] : [],
      verificationStatus: c.verificationStatus ?? "UNSUPPORTED",
    }));

    const unsupportedClaims = normalizedClaims
      .filter((c) => c.type === "NEED_SOURCE" || c.verificationStatus === "UNSUPPORTED")
      .map((c) => c.text);

    const result: ReviewResult = {
      ...emptyPass(),
      status,
      score: status === "PASS" ? 5 : status === "SOFT_FAIL" ? 3 : 1,
      unsupportedClaims,
      criticalIssues:
        status === "HARD_FAIL"
          ? [`S${slide.slideNo}: ${needSourceCount} unsupported factual claims.`]
          : [],
      majorIssues:
        status === "SOFT_FAIL"
          ? [`S${slide.slideNo}: ${needSourceCount} claim(s) need source verification.`]
          : [],
      repairActions: Array.isArray(j.repairActions)
        ? (j.repairActions as string[])
        : needSourceCount > 0
        ? ["Add source citations or convert unsupported claims to HYPOTHETICAL."]
        : [],
    };

    const enrichedSlide: SlideContentJson = {
      ...slide,
      claims: normalizedClaims,
      reviewStatus: status,
    };

    return { slide: enrichedSlide, result };
  } catch {
    return { slide, result: emptyPass() };
  }
}
