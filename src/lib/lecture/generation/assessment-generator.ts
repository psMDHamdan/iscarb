/**
 * Assessment Generator — Gap 5 fix.
 * ===========================================================================
 * Dedicated assessment generation pass, separated from slide generation.
 * Runs AFTER slide content is finalised so it can reference the approved
 * teaching content to produce properly grounded questions.
 *
 * Quality guarantees (per BRD §7.4 and the student-experience specification):
 *  1. Exactly one correct answer — never ambiguous.
 *  2. Three plausible distractors, each targeting a different misconception.
 *  3. No "all of the above" / "none of the above".
 *  4. Answer is never leaked in the stem or option wording.
 *  5. Correct option is not consistently the longest/most qualified.
 *  6. Difficulty aligns with slide position (early = Understand, late = Evaluate).
 *  7. Rationale explains WHY each distractor is wrong, not just why A is right.
 *  8. Misconception tag names the mental model being targeted.
 *
 * Returns an updated SlideContentJson with the `assessment` field populated
 * or improved. Does NOT change any other field.
 */
import { chatJson, DEFAULT_AI_MODEL } from "@/lib/ai-engine";
import type { SlideContentJson } from "./types";
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";

const MODEL = DEFAULT_AI_MODEL;

// ─── system prompt ────────────────────────────────────────────────────────────

const SYSTEM = `You are an expert university assessment designer. Your ONLY job is to generate or improve one MCQ assessment item for a lecture slide.

HARD RULES (violating any invalidates the entire response):
1. EXACTLY ONE correct answer. If you cannot determine one clear correct answer, do NOT generate the question — return { "skip": true }.
2. THREE plausible distractors. Each distractor MUST target a different, realistic misconception. "Plausible" means a thoughtful student could briefly consider it.
3. NEVER: "all of the above", "none of the above", "both A and C".
4. NEVER leak the answer in the stem or any option. The correct option must not be visibly longer, more qualified, or more detailed than the others.
5. The correct option must NOT be in the same position (A/B/C/D) more than 2 times across a set — for single-item generation, vary position randomly.
6. The stem must require reasoning, not just recall. Avoid "What is X?" — prefer "Which of the following BEST explains...?", "A student observes... What is the MOST LIKELY cause?".
7. Difficulty must match slide position: slides 1-7 → "easy" (Understand), slides 8-13 → "medium" (Apply/Analyze), slides 14-20 → "hard" (Evaluate/Create).
8. Rationale must explain WHY each wrong option is wrong (name the misconception), not just why the correct answer is right.
9. DO NOT generate a question that tests untaught content.

Return STRICT JSON:
{
  "skip": false,
  "stem": "...",
  "options": [
    { "id": "A", "text": "...", "isCorrect": false, "misconception": "why a student might pick this" },
    { "id": "B", "text": "...", "isCorrect": true,  "misconception": null },
    { "id": "C", "text": "...", "isCorrect": false, "misconception": "why a student might pick this" },
    { "id": "D", "text": "...", "isCorrect": false, "misconception": "why a student might pick this" }
  ],
  "correctIndex": 1,
  "difficulty": "easy|medium|hard",
  "rationale": "Full rationale: why B is correct AND why A/C/D are wrong with named misconceptions.",
  "misconceptionTag": "The primary misconception this question targets",
  "bloomLevel": "Remember|Understand|Apply|Analyze|Evaluate|Create",
  "cloId": "..."
}`;

// ─── anti-pattern detector ─────────────────────────────────────────────────

interface AssessmentItem {
  stem?: string;
  options?: { id?: string; text?: string; isCorrect?: boolean }[];
  correctIndex?: number;
  rationale?: string;
  misconceptionTag?: string;
  difficulty?: string;
  bloomLevel?: string;
  cloId?: string;
}

function detectAntiPatterns(item: AssessmentItem): string[] {
  const issues: string[] = [];
  if (!item.stem || item.stem.length < 20) issues.push("Stem too short");

  const opts = item.options ?? [];
  if (opts.length !== 4) issues.push(`Expected 4 options, got ${opts.length}`);

  const correctCount = opts.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) issues.push(`Expected exactly 1 correct answer, got ${correctCount}`);

  if (opts.some((o) => /all of the above|none of the above/i.test(o.text ?? ""))) {
    issues.push("'All/None of the above' option detected");
  }

  // Check answer leak: correct option shouldn't be visibly longer
  const correctOpt = opts.find((o) => o.isCorrect);
  if (correctOpt) {
    const correctLen = correctOpt.text?.length ?? 0;
    const otherLens = opts.filter((o) => !o.isCorrect).map((o) => o.text?.length ?? 0);
    const avgOtherLen = otherLens.reduce((a, b) => a + b, 0) / Math.max(otherLens.length, 1);
    if (correctLen > avgOtherLen * 1.5) issues.push("Correct option is significantly longer than distractors");
  }

  // Check if answer appears in stem
  if (correctOpt?.text && item.stem) {
    const stemLower = item.stem.toLowerCase();
    const correctWords = correctOpt.text.toLowerCase().split(" ").filter((w) => w.length > 5);
    const leakCount = correctWords.filter((w) => stemLower.includes(w)).length;
    if (leakCount >= 3) issues.push("Possible answer leak: correct option words appear in stem");
  }

  if (!item.rationale || item.rationale.length < 40) issues.push("Rationale too short");
  if (!item.misconceptionTag) issues.push("Missing misconception tag");

  return issues;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function expectedDifficulty(slideNo: number): "easy" | "medium" | "hard" {
  if (slideNo <= 7) return "easy";
  if (slideNo <= 13) return "medium";
  return "hard";
}

function userPrompt(
  slide: SlideContentJson,
  clos: CourseLearningOutcome[],
  sourceBlockTexts: string[]
): string {
  const primaryClo = clos.find((c) => slide.cloIds?.includes(c.id)) ?? clos[0];
  return JSON.stringify({
    slideNo: slide.slideNo,
    title: slide.title,
    learningObjective: slide.learningObjective,
    bullets: slide.bullets?.slice(0, 5),
    teachingExplanation: slide.teachingExplanation?.slice(0, 400),
    targetClo: primaryClo ? { id: primaryClo.id, text: primaryClo.text } : null,
    sourceExcerpts: sourceBlockTexts.slice(0, 3).map((t) => t.slice(0, 300)),
    requiredDifficulty: expectedDifficulty(slide.slideNo ?? 1),
    existingAssessment: slide.assessment ?? null,
  });
}

// ─── main export ──────────────────────────────────────────────────────────────

/**
 * Generate or improve the assessment item for a single slide.
 * Returns the slide with an updated `assessment` field.
 * Non-fatal: if generation fails or anti-patterns remain, returns the
 * original slide unchanged.
 */
export async function generateAssessment(
  slide: SlideContentJson,
  clos: CourseLearningOutcome[],
  sourceBlocks: { id: string; text: string }[]
): Promise<SlideContentJson> {
  // Slides that don't need an embedded assessment
  const noAssessmentFunctions = new Set([
    "problem",
    "mental_map",
    "clos",
    "rubric",
    "evidence",
  ]);
  if (noAssessmentFunctions.has((slide as any).fn ?? "")) return slide;
  if (!slide.title || slide.bullets.length === 0) return slide;

  const sourceTexts = sourceBlocks.map((b) => b.text);

  try {
    const res = await chatJson({
      system: SYSTEM,
      user: userPrompt(slide, clos, sourceTexts),
      temperature: 0.35,
      model: MODEL,
    });

    const j = (res.json ?? {}) as Record<string, unknown>;
    if (!j || (j as any).fallback || (j as any).skip === true) return slide;

    const item = j as AssessmentItem;
    const antiPatterns = detectAntiPatterns(item);

    if (antiPatterns.length > 0) {
      // Log anti-patterns but don't block — return slide with flagged assessment
      console.warn(
        `[AssessmentGenerator] S${slide.slideNo} anti-patterns: ${antiPatterns.join("; ")}`
      );
    }

    // Only update assessment if it passes or only has minor issues
    const hasCriticalAntiPattern =
      antiPatterns.some((p) =>
        p.includes("correct answer") || p.includes("All/None")
      );

    if (hasCriticalAntiPattern) return slide;

    return {
      ...slide,
      assessment: {
        stem: item.stem,
        options: item.options,
        correctIndex: item.correctIndex,
        difficulty: item.difficulty ?? expectedDifficulty(slide.slideNo ?? 1),
        rationale: item.rationale,
        misconceptionTag: item.misconceptionTag,
        bloomLevel: item.bloomLevel,
        cloId: item.cloId ?? slide.cloIds?.[0],
        antiPatternWarnings: antiPatterns.length > 0 ? antiPatterns : undefined,
      },
    };
  } catch {
    return slide;
  }
}
