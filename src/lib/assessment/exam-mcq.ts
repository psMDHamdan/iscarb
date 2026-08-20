/**
 * Live employability exam is MCQ-only. Dynamic AI may fail or return open-ended
 * catalog text without choices — these helpers guarantee the UI never demotes
 * a question to a free-text box.
 */
import { getChoicesForModule, type ModuleBriefForChoices } from "./default-choices";

export type ExamMcqPayload = {
  scenario?: string;
  instructions?: string;
  questionType?: string;
  choices?: string[];
};

export type ExamModuleMcqState = ModuleBriefForChoices & {
  questionType?: string;
  choices?: string[];
  dynamicLoaded?: boolean;
  scenario?: string;
  instructions?: string;
  contentSource?: string;
  generationError?: string | null;
};

/** Normalize to exactly 4 non-empty choice strings (pad from curated defaults). */
export function ensureFourChoices(module: ModuleBriefForChoices, incoming?: string[]): string[] {
  const cleaned = (incoming ?? [])
    .map((c) => String(c ?? "").trim())
    .filter(Boolean);

  if (cleaned.length >= 4) return cleaned.slice(0, 4);
  if (cleaned.length >= 2) {
    const pad = getChoicesForModule({ ...module, choices: undefined });
    const out = [...cleaned];
    for (const p of pad) {
      if (out.length >= 4) break;
      if (!out.includes(p)) out.push(p);
    }
    while (out.length < 4) out.push(`Option ${String.fromCharCode(65 + out.length)}`);
    return out.slice(0, 4);
  }

  return getChoicesForModule({ ...module, choices: undefined }).slice(0, 4);
}

/** True when payload is a usable MCQ (scenario + instructions + type mcq + ≥2 choices). */
export function isUsableMcqPayload(data: ExamMcqPayload | null | undefined): boolean {
  if (!data) return false;
  const scenario = typeof data.scenario === "string" ? data.scenario.trim() : "";
  const instructions = typeof data.instructions === "string" ? data.instructions.trim() : "";
  const choices = Array.isArray(data.choices)
    ? data.choices.map((c) => String(c ?? "").trim()).filter(Boolean)
    : [];
  return Boolean(scenario && instructions && data.questionType === "mcq" && choices.length >= 2);
}

/**
 * Live exam question type is always MCQ. STAR / DMAIC / open_ended are legacy
 * and must never drive the employability exam UI.
 */
export function getExamQuestionType(_module?: ExamModuleMcqState): "mcq" {
  return "mcq";
}

/**
 * Merge a dynamic API payload without demoting a good MCQ to open-ended /
 * choice-less catalog text. On failure or bad payload, keep curated MCQ choices.
 */
export function mergeDynamicModule<T extends ExamModuleMcqState>(
  pm: T,
  data: ExamMcqPayload,
): T {
  if (isUsableMcqPayload(data)) {
    const choices = ensureFourChoices(pm, data.choices);
    return {
      ...pm,
      scenario: (data.scenario && data.scenario.trim()) || pm.scenario,
      instructions: (data.instructions && data.instructions.trim()) || pm.instructions,
      questionType: "mcq",
      choices,
      dynamicLoaded: true,
    };
  }

  // Failed / open-ended / choice-less payload: never wipe MCQ or swap to text box.
  const choices = ensureFourChoices(pm, pm.choices);
  return {
    ...pm,
    questionType: "mcq",
    choices,
    dynamicLoaded: true,
  };
}

/** True when the module is a live-AI generation failure (retryable, no content). */
export function isGenerationFailedModule(m: { contentSource?: string; generationError?: string | null } | null | undefined): boolean {
  return m?.contentSource === "generation_failed";
}

/**
 * Mark a module loaded. Live-AI failures keep their empty choices (the UI
 * shows a retry card) — they are NEVER padded from curated defaults.
 */
export function markMcqLoaded<T extends ExamModuleMcqState>(pm: T): T {
  if (isGenerationFailedModule(pm)) {
    return {
      ...pm,
      questionType: "mcq",
      choices: [],
      dynamicLoaded: true,
    };
  }
  return {
    ...pm,
    questionType: "mcq",
    choices: ensureFourChoices(pm, pm.choices),
    dynamicLoaded: true,
  };
}

/**
 * Prepare the full exam set once before the first question.
 * Live-AI failures are kept as-is (empty choices + retry state); everything
 * else resolves curated/pregen MCQ choices. No default content for failures.
 */
export function prepareExamModules<T extends ExamModuleMcqState>(modules: T[]): T[] {
  return modules.map((m) => markMcqLoaded(m));
}

/**
 * True when every module is exam-ready. Live-AI failure modules are allowed
 * (the UI shows a retry card for them instead of an answerable MCQ).
 */
export function isExamSetReady(modules: ExamModuleMcqState[]): boolean {
  if (!modules.length) return false;
  return modules.every(
    (m) =>
      m.dynamicLoaded !== false &&
      getExamQuestionType(m) === "mcq" &&
      (isGenerationFailedModule(m)
        ? true
        : ensureFourChoices(m, m.choices).length === 4),
  );
}
