/**
 * Phase 5 — Automated quality gates for signup-time Job-Fit generation.
 * Failures must NOT auto-publish (go to in_review instead).
 */
import type { BankQuestionRubricCriterion } from "@/lib/assessment/question-bank-repository";

export type GeneratedMcqOption = {
  text: string;
  /** Exactly one option must be "correct". */
  label: "correct" | "incorrect";
  /** Why this option is right/wrong — required for the one-correct gate. */
  rationale: string;
};

export type GeneratedJobFitDraft = {
  moduleCode: string;
  title: string;
  focus: string;
  framework: string;
  scenario: string;
  instructions: string;
  choices: GeneratedMcqOption[];
  correctIndex: number;
  rubric: BankQuestionRubricCriterion[];
};

export type SafeguardResult = {
  ok: boolean;
  reasons: string[];
};

function distinctNonEmpty(texts: string[]): boolean {
  const cleaned = texts.map((t) => t.trim()).filter(Boolean);
  if (cleaned.length !== texts.length) return false;
  return new Set(cleaned.map((t) => t.toLowerCase())).size === cleaned.length;
}

function rubricWeightsOk(rubric: BankQuestionRubricCriterion[]): boolean {
  if (!Array.isArray(rubric) || rubric.length < 2) return false;
  if (rubric.some((r) => !String(r.criterion ?? "").trim() || !(Number(r.weight) > 0))) {
    return false;
  }
  const sum = rubric.reduce((acc, r) => acc + Number(r.weight ?? 0), 0);
  return Math.abs(sum - 100) <= 1.5;
}

/**
 * Specialty relevance: scenario/instructions/choices must mention the specialty
 * (or a substantial token from it), not be generic filler only.
 */
export function specialtyRelevanceOk(
  specialization: string,
  draft: Pick<GeneratedJobFitDraft, "scenario" | "instructions" | "choices" | "title">,
): boolean {
  const field = specialization.trim().toLowerCase();
  if (!field) return false;
  const tokens = field
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 4);
  if (tokens.length === 0) {
    tokens.push(field);
  }
  const blob = [
    draft.title,
    draft.scenario,
    draft.instructions,
    ...draft.choices.map((c) => c.text),
  ]
    .join("\n")
    .toLowerCase();

  const hit = tokens.some((t) => blob.includes(t));
  // Reject obvious generic filler when specialty tokens are absent.
  const genericOnly =
    /general professional practice|any field|your major|this discipline/i.test(blob) &&
    !hit;
  return hit && !genericOnly;
}

/**
 * Exactly-one-correct-answer gate (mirrors options-pack verify label rule):
 * - Exactly one choice labeled "correct"
 * - correctIndex points at that choice
 * - Each option has a non-empty rationale (distractor flaw or why correct)
 */
export function oneCorrectAnswerOk(draft: GeneratedJobFitDraft): SafeguardResult {
  const reasons: string[] = [];
  const choices = draft.choices ?? [];
  if (choices.length !== 4) {
    reasons.push(`expected_4_choices_got_${choices.length}`);
    return { ok: false, reasons };
  }

  const corrects = choices
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.label === "correct");
  if (corrects.length !== 1) {
    reasons.push(`correct_label_count_${corrects.length}`);
  } else if (corrects[0].i !== draft.correctIndex) {
    reasons.push(
      `correctIndex_${draft.correctIndex}_mismatch_label_at_${corrects[0].i}`,
    );
  }

  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    if (!String(c.rationale ?? "").trim()) {
      reasons.push(`missing_rationale_option_${i}`);
    }
    if (c.label === "incorrect" && String(c.rationale ?? "").trim().length < 12) {
      reasons.push(`weak_distractor_rationale_${i}`);
    }
  }

  if (
    draft.correctIndex < 0 ||
    draft.correctIndex > 3 ||
    !Number.isInteger(draft.correctIndex)
  ) {
    reasons.push(`invalid_correctIndex_${draft.correctIndex}`);
  }

  return { ok: reasons.length === 0, reasons };
}

export function structuralCompletenessOk(draft: GeneratedJobFitDraft): SafeguardResult {
  const reasons: string[] = [];
  if (!String(draft.scenario ?? "").trim() || draft.scenario.trim().length < 40) {
    reasons.push("scenario_missing_or_short");
  }
  if (
    !String(draft.instructions ?? "").trim() ||
    draft.instructions.trim().length < 20
  ) {
    reasons.push("instructions_missing_or_short");
  }
  if (!String(draft.title ?? "").trim()) reasons.push("title_missing");
  if (!String(draft.moduleCode ?? "").trim()) reasons.push("moduleCode_missing");

  const texts = (draft.choices ?? []).map((c) => String(c.text ?? ""));
  if (texts.length !== 4) reasons.push("choices_not_4");
  else if (!distinctNonEmpty(texts)) reasons.push("choices_not_distinct_nonempty");

  if (!rubricWeightsOk(draft.rubric ?? [])) {
    reasons.push("rubric_weights_invalid");
  }

  return { ok: reasons.length === 0, reasons };
}

/** Run all Phase 5 auto-publish gates. */
export function runSignupJobFitSafeguards(
  specialization: string,
  draft: GeneratedJobFitDraft,
): SafeguardResult {
  const reasons: string[] = [];
  const structural = structuralCompletenessOk(draft);
  if (!structural.ok) reasons.push(...structural.reasons);

  const oneCorrect = oneCorrectAnswerOk(draft);
  if (!oneCorrect.ok) reasons.push(...oneCorrect.reasons);

  if (!specialtyRelevanceOk(specialization, draft)) {
    reasons.push("specialty_relevance_failed");
  }

  return { ok: reasons.length === 0, reasons };
}
