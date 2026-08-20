/**
 * Lecture Generation — special slide logic (TASK-04 §D).
 * ===========================================================================
 * S3 copies faculty CLO text VERBATIM (never paraphrased). S8, S9/S10, S18
 * and S20 contribute mandatory prompt additions and, for S20, the default
 * readiness gate definition.
 *
 * CRITICAL: All output uses STUDENT-FACING language only.
 * Framework labels (Core Principle, Key Requirement, etc.) are BANNED.
 */
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";
import type { SlideContentJson } from "./types";

/** §D S3 — CLO slide. Verbatim CLO text; no invented content. */
export function buildCLOSlide(selectedClos: CourseLearningOutcome[]): SlideContentJson {
  return {
    title: "What You Will Learn",
    bullets: selectedClos.map((c) => `${c.number}: ${c.text}`),
    studentAction: "Which learning outcome connects most directly to your current role? Select one and explain why.",
    speakerNotes: "Read each learning outcome. Ask students to predict how each will be assessed.",
    citations: [],
    claims: [],
    cloIds: selectedClos.map((c) => c.id),
    sourceBlockIds: [],
    wordCount: selectedClos.reduce((n, c) => n + c.text.split(" ").length, 0),
    visualIntent: "numbered list with Bloom level badge per learning outcome",
  };
}

/** §D S8 — misconception slide mandatory pattern. */
export function misconceptionPromptAddendum(): string {
  return [
    "This slide MUST follow the misconception-teaching pattern.",
    'Title format: "Why [Common Simplification] Fails" — name the specific misconception.',
    "",
    "Structure your bullets as:",
    "  1. State the misconception students commonly hold (no framework labels)",
    "  2. Explain WHY it seems reasonable at first",
    "  3. Explain WHY it fails — use evidence from the source material",
    "  4. Provide the correct mental model that replaces the misconception",
    "",
    "Student action: A poll with 4 plausible options where option A is the misconception. Start with 'Poll:' or 'True or False:'.",
    "The correct answer must reveal the deeper truth — not just 'A is wrong'.",
    "Include the full poll question text and all 4 options in the studentAction field. Do NOT reveal the answer here.",
    "",
    "Speaker notes: Put the correct answer here. Explain how to reveal the misconception dramatically, what reaction to expect from students, and how the correct answer connects to the next slide.",
  ].join("\n");
}

/** §D S9/S10 — worked calculation mandatory pattern. ENFORCED STRUCTURE. */
export function workedCalculationPromptAddendum(): string {
  return [
    "This slide MUST include a worked numerical/analytical example.",
    "",
    "MANDATORY STRUCTURE (enforced):",
    "  Bullet 1: CONTEXT — Why are we calculating this? What does the result tell us?",
    "  Bullet 2: GIVEN DATA — List all known values with units, straight from the source material",
    "  Bullet 3: FORMULA — Show the equation. Define each variable. Explain WHY this formula applies here.",
    "  Bullet 4: STEP-BY-STEP — Show the substitution and calculation clearly",
    "  Bullet 5: RESULT — State the final answer with units AND interpret what it means",
    "",
    "CRITICAL RULES:",
    "- NEVER invent numbers. If the source does not provide a value, write 'value from source material'.",
    "- ALL numbers MUST come from the uploaded source documents.",
    "- If no quantitative data is available in the source, write: 'This concept is taught qualitatively — no numerical calculation applies.'",
    "- Show dimensional analysis (unit checking) as a verification step when applicable.",
    "",
    "studentAction: Give students a VARIATION of the worked example with different numbers (from the source) to solve themselves. Start with 'Calculate:' or 'Solve:'.",
    "Include the actual practice problem in the studentAction text. Only the problem statement is visible. Steps are hidden.",
    "",
    "Visual intent: WORKSPACE layout showing calculation steps clearly.",
    "Speaker notes: Provide the full step-by-step solution here. Explain common mistakes students make. State the correct answer.",
  ].join("\n");
}

/** §D S18 — rubric: 4 performance levels mapping to observable criteria. */
export function rubricPromptAddendum(): string {
  return [
    "Generate a rubric with exactly 4 performance levels: Novice | Developing | Proficient | Distinguished.",
    "",
    "Each level maps to OBSERVABLE, CONCRETE criteria that students can self-assess:",
    "  BAD: 'Shows good understanding of the concept' — unmeasurable and vague.",
    "  GOOD: 'Correctly identifies 3+ key mechanisms, maps each to an outcome, and explains one trade-off' — specific and countable.",
    "",
    "Criteria must reference the lecture learning outcomes directly.",
    "Format bullets as: 'Novice: [criteria] | Developing: [criteria] | Proficient: [criteria] | Distinguished: [criteria]'",
    "",
    "Speaker notes: explain how students should use the rubric for self-assessment, what evidence they need for each level, and how this connects to the final check.",
  ].join("\n");
}

/** §D S20 — readiness gate default (3/4 correct + rubric level 3+). */
export function readinessGatePromptAddendum(mode: string): string {
  const official =
    mode === "OFFICIAL_JAHEZIAH"
      ? "\nIn OFFICIAL_JAHEZIAH mode: add the official outcome locator (SKU/SLO reference) and map each readiness item to its standard."
      : "";
  return [
    "This slide MUST contain the final understanding check (Check 4 of 4).",
    "",
    "Include an actual multiple-choice question in studentAction with 4 options. Do NOT mark or reveal the correct answer in this field.",
    "The question should synthesize concepts from across the lecture, not just test one slide.",
    "",
    "Pass criteria: 3/4 correct readiness checks + rubric level 3+ (Proficient or Distinguished).",
    "Bullets should show: (1) pass criteria, (2) learning outcome coverage, (3) what 'ready' means, (4) next action for students.",
    "",
    `Alignment mode: ${mode}.${official}`,
    "",
    "Speaker notes: state the correct answer for the readiness check here. Explain how to run the final check, how to help students who don't meet the threshold, and what the next lecture or assignment is.",
  ].join("\n");
}
