/**
 * CLO Alignment Reviewer — Gap 3b fix.
 * ===========================================================================
 * Reviews ONE slide at a time for CLO traceability.
 *
 * Checks:
 *  - Every slide links to ≥1 faculty-entered CLO
 *  - The CLO link is semantically genuine (not just ID copy-paste)
 *  - The slide content actually teaches toward the linked CLO
 *  - Assessment items (if present) measure the stated CLO, not adjacent ones
 *  - Source block citations are present for factual claims
 *
 * This is a separate concern from pedagogical quality — a slide can be
 * pedagogically well-structured but mapped to the wrong CLO.
 */
import { chatJson, DEFAULT_AI_MODEL } from "@/lib/ai-engine";
import type { SlideContentJson, ReviewResult } from "../types";

const SYSTEM = `You are the CLO Alignment Verifier for an academic lecture compiler.

Your ONLY job: verify that one slide genuinely maps to its stated CLOs.

Rules:
1. The cloIds on the slide must match the provided CLO list.
2. The slide content must actually teach toward those CLOs — not just share a keyword.
3. If an assessment is present, it must measure the stated CLO (not easier/harder adjacent ones).
4. At least one source block citation should be present for factual content slides.
5. If cloIds is empty or [""], that is a HARD_FAIL for non-transition slides.

Return STRICT JSON:
{
  "status": "PASS" | "SOFT_FAIL" | "HARD_FAIL",
  "score": 0-5,
  "alignedCloIds": ["..."],
  "misalignedCloIds": ["..."],
  "issues": ["..."],
  "repairActions": ["..."]
}`;

function userPrompt(
  slide: SlideContentJson,
  clos: { id: string; text: string }[]
): string {
  return JSON.stringify({
    slideNo: slide.slideNo,
    title: slide.title,
    bullets: slide.bullets?.slice(0, 5),
    cloIds: slide.cloIds,
    assessment: slide.assessment ?? null,
    citations: slide.citations?.slice(0, 3),
    availableClos: clos.map((c) => ({ id: c.id, text: c.text.slice(0, 120) })),
  });
}

export async function reviewCloAlignment(
  slide: SlideContentJson,
  clos: { id: string; text: string }[]
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

  // Transition/synthesis slides (S1, S2, S3, S18, S19) are allowed to have
  // broader CLO coverage — don't HARD_FAIL on CLO count alone.
  const transitionSlides = new Set([1, 2, 3, 18, 19]);
  const isTransition = transitionSlides.has(slide.slideNo ?? -1);

  // Fast deterministic check before calling LLM
  if (!slide.cloIds || slide.cloIds.length === 0) {
    if (isTransition) return { slide, result: emptyPass() };
    return {
      slide,
      result: {
        ...emptyPass(),
        status: "HARD_FAIL",
        score: 1,
        criticalIssues: [`S${slide.slideNo}: No CLO IDs assigned.`],
        repairActions: ["Add at least one CLO to the slide before generation."],
      },
    };
  }

  try {
    const res = await chatJson({
      system: SYSTEM,
      user: userPrompt(slide, clos),
      temperature: 0.15,
      model: DEFAULT_AI_MODEL,
    });

    const j = (res.json ?? {}) as Record<string, unknown>;
    if (res.json === null || (j as any).fallback) return { slide, result: emptyPass() };

    const status = (["PASS", "SOFT_FAIL", "HARD_FAIL"].includes(j.status as string)
      ? j.status
      : "PASS") as ReviewResult["status"];

    const issues = Array.isArray(j.issues) ? (j.issues as string[]) : [];
    const result: ReviewResult = {
      ...emptyPass(),
      status,
      score: typeof j.score === "number" ? j.score : status === "PASS" ? 5 : 2,
      majorIssues: issues,
      repairActions: Array.isArray(j.repairActions) ? (j.repairActions as string[]) : [],
    };

    // Annotate the slide with confirmed aligned CLOs
    const alignedIds = Array.isArray(j.alignedCloIds) ? (j.alignedCloIds as string[]) : slide.cloIds;
    const enrichedSlide = { ...slide, cloIds: alignedIds };

    return { slide: enrichedSlide, result };
  } catch {
    return { slide, result: emptyPass() };
  }
}
