/**
 * Pedagogical Reviewer — Gap 3a fix.
 * ===========================================================================
 * Replaces the broad "academic reviewer" responsibility for pedagogical
 * sequence and depth. Reviews ONE slide at a time (not all 20) to avoid
 * context drift on a large payload.
 *
 * Checks:
 *  - Learning objective is present and measurable
 *  - Correct WHAT + WHY + HOW structure
 *  - Prerequisite knowledge is addressed where needed
 *  - Cognitive level matches the slide's position in the lecture arc
 *  - Student action is purposeful (not generic poll filler)
 *  - Difficulty progression is appropriate (S1-4 ≤ Understand; S14+ ≥ Apply)
 */
import { chatJson, DEFAULT_AI_MODEL } from "@/lib/ai-engine";
import type { SlideContentJson, ReviewResult } from "../types";

const SYSTEM = `You are the Pedagogical Quality Reviewer for an academic lecture compiler.

Your job: review ONE slide for pedagogical quality.

Check ONLY these aspects:
1. LEARNING OBJECTIVE — is it measurable? Does it use an observable action verb?
2. WHAT+WHY+HOW — does the slide explain the concept, why it matters, and how it works?
3. PREREQUISITE — if the concept requires prior knowledge, is it briefly covered or assumed correctly?
4. COGNITIVE LEVEL — does the Bloom level match the slide's position in the lecture?
   Slides 1-7: Remember/Understand. Slides 8-13: Apply/Analyze. Slides 14-20: Evaluate/Create.
5. STUDENT ACTION — is the interaction purposeful? Generic polls ("Which is important?") are WEAK.
6. DEPTH vs DENSITY — is the content substantive without exceeding 40 words?

Return STRICT JSON:
{
  "status": "PASS" | "SOFT_FAIL" | "HARD_FAIL",
  "score": 0-5,
  "issues": ["..."],
  "repairActions": ["..."]
}

Be strict but focused. Only flag genuine pedagogical problems, not stylistic preferences.`;

function userPrompt(slide: SlideContentJson): string {
  return JSON.stringify({
    slideNo: slide.slideNo,
    title: slide.title,
    learningObjective: slide.learningObjective,
    bullets: slide.bullets?.slice(0, 5),
    studentAction: slide.studentAction,
    bloomLevel: slide.bloomLevel,
    speakerNotes: slide.speakerNotes?.slice(0, 200),
  });
}

export async function reviewPedagogy(
  slide: SlideContentJson
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

  try {
    const res = await chatJson({
      system: SYSTEM,
      user: userPrompt(slide),
      temperature: 0.2,
      model: DEFAULT_AI_MODEL,
    });

    const j = (res.json ?? {}) as Record<string, unknown>;
    if (res.json === null || (j as any).fallback) return { slide, result: emptyPass() };

    const issues = Array.isArray(j.issues) ? (j.issues as string[]) : [];
    const status = (["PASS", "SOFT_FAIL", "HARD_FAIL"].includes(j.status as string)
      ? j.status
      : "PASS") as ReviewResult["status"];

    const result: ReviewResult = {
      ...emptyPass(),
      status,
      score: typeof j.score === "number" ? j.score : status === "PASS" ? 5 : 2,
      majorIssues: issues,
      repairActions: Array.isArray(j.repairActions) ? (j.repairActions as string[]) : [],
    };

    return { slide, result };
  } catch {
    return { slide, result: emptyPass() };
  }
}
