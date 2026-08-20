/**
 * Candidate-facing question/option sanitizer.
 *
 * Single choke-point for stripping correct-answer markers and answer-encoding
 * option order before any payload leaves the server for a candidate. Scoring
 * continues to use server-side / DB sources that retain full keys.
 */
import "server-only";
import { createHash } from "crypto";

/** Fields that identify or encode the correct option — never send to candidates. */
export const CORRECTNESS_FIELD_KEYS = new Set([
  "isCorrect",
  "correct",
  "correctAnswer",
  "correct_answer",
  "correctIndex",
  "correct_index",
  "answerKey",
  "answer_key",
  "pointsEarned",
  "points_earned",
  "optionScore",
  "option_score",
]);

/** Rubric / scoring internals that must not reach candidates pre-answer. */
export const SCORING_INTERNAL_KEYS = new Set([
  "descriptor",
  "descriptors",
  "fewShot",
  "few_shot",
  "anchors",
  "anchor",
  "exemplar",
  "exemplars",
  "modelAnswer",
  "model_answer",
  "scoringRubric",
  "scoring_rubric",
]);

type QuestionRow = {
  id: string;
  order: number;
  type: string;
  prompt: string;
  pointsPossible: number;
  optionsJson: string | null;
  instructionsJson?: string | null;
  scenarioContext?: string | null;
  correctAnswer?: string | null;
};

function mulberry32(seed: number): () => number {
  let h = seed >>> 0;
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable seed from attempt/student + question identity (refresh-safe shuffle). */
export function choiceShuffleSeed(
  ...parts: Array<string | null | undefined>
): string {
  return createHash("sha256")
    .update(parts.filter((p) => p != null && String(p).length > 0).join("|"))
    .digest("hex");
}

/** Fisher–Yates with optional deterministic seed. */
export function shuffleChoices<T>(items: T[], seed?: string | null): T[] {
  const arr = [...items];
  if (arr.length <= 1) return arr;
  let rand: () => number;
  if (seed) {
    const n = parseInt(seed.slice(0, 8), 16) || 1;
    rand = mulberry32(n);
  } else {
    rand = Math.random;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function stripKeysFromObject(
  obj: Record<string, unknown>,
  keys: Set<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (keys.has(k)) continue;
    out[k] = v;
  }
  return out;
}

/** Remove correctness markers from a single option / choice object. */
export function stripOptionCorrectness(
  option: Record<string, unknown>,
): Record<string, unknown> {
  return stripKeysFromObject(option, CORRECTNESS_FIELD_KEYS);
}

/**
 * Sanitize an array of MCQ options (objects or plain strings).
 * - Objects: strip correctness fields, keep id/text for selection, shuffle.
 * - Strings: shuffle only (text is the selectable value).
 */
export function sanitizeOptionsForClient(
  options: unknown,
  seed?: string | null,
): unknown[] {
  if (!Array.isArray(options)) return [];

  const cleaned = options.map((opt) => {
    if (opt != null && typeof opt === "object" && !Array.isArray(opt)) {
      return stripOptionCorrectness(opt as Record<string, unknown>);
    }
    return opt;
  });

  return shuffleChoices(cleaned, seed);
}

/** Sanitize plain string choice lists used by the employability exam. */
export function sanitizeChoiceStrings(
  choices: unknown,
  seed?: string | null,
): string[] {
  if (!Array.isArray(choices)) return [];
  const strings = choices
    .map((c) => String(c ?? "").replace(/^(?:Option\s*\d+|Option\s*[A-D]|[A-D])\s*[\:\.\-]\s*/i, "").trim())
    .filter(Boolean);
  return shuffleChoices(strings, seed);
}

/**
 * Parse optionsJson, strip answer keys, shuffle, re-serialize.
 * Malformed JSON is returned unchanged (fail closed on structure only).
 */
export function sanitizeOptionsJson(
  optionsJson: string | null | undefined,
  seed?: string | null,
): string | null {
  if (optionsJson == null || optionsJson === "") return optionsJson ?? null;
  try {
    const parsed = JSON.parse(optionsJson) as unknown;
    if (!Array.isArray(parsed)) return optionsJson;
    return JSON.stringify(sanitizeOptionsForClient(parsed, seed));
  } catch {
    return optionsJson;
  }
}

/**
 * Strip answer keys from Assessment OS question rows before client delivery.
 * Omits correctAnswer / scenario internals; keeps display fields only.
 */
export function publicQuestions<T extends QuestionRow>(
  questions: T[],
  seedBase?: string | null,
): Array<{
  id: string;
  order: number;
  type: string;
  prompt: string;
  pointsPossible: number;
  optionsJson: string | null;
}> {
  return questions.map((q) => {
    const seed = seedBase
      ? choiceShuffleSeed(seedBase, q.id, String(q.order))
      : choiceShuffleSeed(q.id, String(q.order));
    return {
      id: q.id,
      order: q.order,
      type: q.type,
      prompt: q.prompt,
      pointsPossible: q.pointsPossible,
      optionsJson: sanitizeOptionsJson(q.optionsJson, seed),
    };
  });
}

/** Candidate-safe rubric: criterion names only (no weights or descriptors). */
export function sanitizeRubricForClient(
  rubric: unknown,
): Array<{ criterion: string }> {
  if (!Array.isArray(rubric)) return [];
  return rubric.map((r) => {
    const row = (r ?? {}) as Record<string, unknown>;
    return {
      criterion: String(row.criterion ?? ""),
    };
  });
}

export type PublicExamModule = {
  code: string;
  title: string;
  titleAr?: string | null;
  dimension?: string;
  level?: string;
  framework?: string;
  focus?: string;
  scenario: string;
  instructions: string;
  rubric: Array<{ criterion: string }>;
  passThreshold?: number;
  specialization?: string | null;
  generated?: boolean;
  estimateMinutes?: number | null;
  questionType: "mcq";
  choices: string[];
  dynamicLoaded?: boolean;
  [key: string]: unknown;
};

/**
 * Sanitize one employability exam module for the candidate client.
 * Shuffles choices (seeded when studentId provided) and strips rubric descriptors / few-shot.
 */
export function sanitizeExamModuleForClient<T extends Record<string, unknown>>(
  module: T,
  opts?: { studentId?: string | null; attemptId?: string | null },
): T & {
  questionType: "mcq";
  choices: string[];
  rubric: Array<{ criterion: string }>;
} {
  const code = String(module.code ?? "");
  const seed = choiceShuffleSeed(
    opts?.attemptId,
    opts?.studentId,
    code,
  );
  const choices = sanitizeChoiceStrings(module.choices, seed);
  const rubric = sanitizeRubricForClient(module.rubric);

  const {
    fewShot: _fs,
    few_shot: _fs2,
    anchors: _a,
    descriptor: _d,
    correctAnswer: _ca,
    correct_answer: _ca2,
    correctIndex: _ci,
    isCorrect: _ic,
    ...rest
  } = module;

  return {
    ...rest,
    questionType: "mcq" as const,
    choices,
    rubric,
  } as T & {
    questionType: "mcq";
    choices: string[];
    rubric: Array<{ criterion: string }>;
  };
}

/** Sanitize dynamic / generate-scenario MCQ payloads. */
export function sanitizeMcqPayloadForClient<
  T extends {
    scenario?: string;
    instructions?: string;
    questionType?: string;
    choices?: string[];
  },
>(
  payload: T,
  opts?: { studentId?: string | null; code?: string | null; attemptId?: string | null },
): T {
  const seed = choiceShuffleSeed(
    opts?.attemptId,
    opts?.studentId,
    opts?.code,
  );
  const {
    correctAnswer: _ca,
    correct_answer: _ca2,
    correctIndex: _ci,
    isCorrect: _ic,
    fewShot: _fs,
    ...rest
  } = payload as T & Record<string, unknown>;

  const choicesAr = (payload as Record<string, unknown>).choicesAr;

  return {
    ...rest,
    choices: Array.isArray(payload.choices)
      ? sanitizeChoiceStrings(payload.choices, seed)
      : payload.choices,
    choicesAr: Array.isArray(choicesAr)
      ? sanitizeChoiceStrings(choicesAr as string[], seed)
      : choicesAr,
  } as T;
}

/**
 * Strip answer keys from AI-generated practice questions before client delivery.
 * Keeps options selectable; removes correctAnswer / explanations that reveal the key.
 */
export function sanitizeGeneratedQuestionsForClient(
  questions: unknown[],
  seedBase?: string | null,
): unknown[] {
  return questions.map((q, i) => {
    if (q == null || typeof q !== "object") return q;
    const row = { ...(q as Record<string, unknown>) };
    for (const key of CORRECTNESS_FIELD_KEYS) {
      delete row[key];
    }
    delete row.explanation;
    delete row.answer;
    if (Array.isArray(row.options)) {
      const seed = choiceShuffleSeed(seedBase, String(i), String(row.question ?? ""));
      row.options = sanitizeOptionsForClient(row.options, seed);
    }
    return row;
  });
}

/** Adaptive-quiz style options: strip keys + shuffle display order (ids preserved for scoring). */
export function sanitizeAdaptiveQuestionForClient<
  T extends { options?: Array<Record<string, unknown>> },
>(question: T | null | undefined, seed?: string | null): T | null {
  if (!question) return null;
  const options = Array.isArray(question.options)
    ? (sanitizeOptionsForClient(question.options, seed) as Array<
        Record<string, unknown>
      >)
    : question.options;
  return { ...question, options };
}

/**
 * Deep-scan a JSON-serializable value and drop known correctness / scoring-internal keys.
 * Use for nested blueprints or miscellaneous payloads.
 */
export function deepStripCorrectness(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepStripCorrectness);
  }
  if (value != null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (CORRECTNESS_FIELD_KEYS.has(k) || SCORING_INTERNAL_KEYS.has(k)) continue;
      if (k === "choices" && Array.isArray(v) && v.every((x) => typeof x === "string")) {
        out[k] = sanitizeChoiceStrings(v);
        continue;
      }
      if (k === "options" && Array.isArray(v)) {
        out[k] = sanitizeOptionsForClient(v);
        continue;
      }
      if (k === "rubric" && Array.isArray(v)) {
        out[k] = sanitizeRubricForClient(v);
        continue;
      }
      out[k] = deepStripCorrectness(v);
    }
    return out;
  }
  return value;
}
