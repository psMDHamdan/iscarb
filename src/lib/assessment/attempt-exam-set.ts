/**
 * Attempt-bound validated exam set.
 *
 * Stored on AssessmentAttempt.blueprintJson. correctIndex lives here only —
 * candidate payloads must go through sanitizeExamModuleForClient.
 */
import "server-only";

import type { AssessmentModuleSpec } from "@/lib/assessment/framework";
import { sanitizeExamModuleForClient } from "@/lib/assessment/public-question-payload";

export const ATTEMPT_EXAM_SET_VERSION = 2;
export const EXAM_QUESTION_COUNT = 47;

export type AttemptExamContentSource = "live_ai" | "bank_fallback" | "generating_in_background";

export type AttemptExamQuestion = {
  code: string;
  title: string;
  titleAr: string | null;
  dimension: string;
  level: string;
  framework: string;
  focus: string;
  passThreshold: number;
  estimateMinutes: number | null;
  specialization: string | null;
  scenario: string;
  scenarioAr?: string | null;
  instructions: string;
  instructionsAr?: string | null;
  choices: string[];
  choicesAr?: string[] | null;
  correctIndex: number;
  contentSource: AttemptExamContentSource;
  validation: {
    structural: boolean;
    independentVerify: boolean;
    generateAttempts: number;
    verifyAttempts: number;
    regenerated: boolean;
  };
};

export type AttemptExamSet = {
  version: number;
  status: "preparing" | "ready" | "failed";
  specialization: string;
  progress: { done: number; total: number };
  questions: AttemptExamQuestion[];
  generatedAt?: string;
  error?: string | null;
};

import { resolveAssessmentModuleSet } from "@/lib/assessment/catalog";

export function emptyPreparingSet(specialization: string, total = EXAM_QUESTION_COUNT): AttemptExamSet {
  const skeleton = resolveAssessmentModuleSet(specialization);
  const placeholders: AttemptExamQuestion[] = skeleton.modules.map((m) => ({
    code: m.code,
    title: m.title,
    titleAr: m.titleAr ?? null,
    dimension: m.dimension,
    level: m.level,
    framework: m.framework,
    focus: m.focus,
    passThreshold: m.passThreshold,
    estimateMinutes: m.estimateMinutes ?? null,
    specialization: m.specialization ?? specialization,
    scenario: "",
    scenarioAr: null,
    instructions: "",
    instructionsAr: null,
    choices: [],
    choicesAr: null,
    correctIndex: -1,
    contentSource: "generating_in_background",
    validation: {
      structural: false,
      independentVerify: false,
      generateAttempts: 0,
      verifyAttempts: 0,
      regenerated: false,
    },
  }));

  return {
    version: ATTEMPT_EXAM_SET_VERSION,
    status: "preparing",
    specialization,
    progress: { done: 0, total },
    questions: placeholders,
    error: null,
  };
}

export function parseAttemptExamSet(raw: string | null | undefined): AttemptExamSet | null {
  if (!raw || raw === "{}") return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AttemptExamSet> & Record<string, unknown>;
    if (parsed && typeof parsed === "object" && parsed.version === ATTEMPT_EXAM_SET_VERSION) {
      const status =
        parsed.status === "ready" || parsed.status === "failed" || parsed.status === "preparing"
          ? parsed.status
          : "preparing";
      return {
        version: ATTEMPT_EXAM_SET_VERSION,
        status,
        specialization: String(parsed.specialization ?? ""),
        progress: {
          done: Number(parsed.progress?.done ?? 0),
          total: Number(parsed.progress?.total ?? EXAM_QUESTION_COUNT),
        },
        questions: Array.isArray(parsed.questions) ? (parsed.questions as AttemptExamQuestion[]) : [],
        generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : undefined,
        error: typeof parsed.error === "string" ? parsed.error : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeAttemptExamSet(set: AttemptExamSet): string {
  return JSON.stringify(set);
}

export function isAttemptExamSetReady(set: AttemptExamSet | null): boolean {
  return Boolean(
    set &&
      set.status === "ready" &&
      set.questions.length === EXAM_QUESTION_COUNT &&
      set.questions.every(
        (q) =>
          q.validation?.structural &&
          Number.isInteger(q.correctIndex) &&
          q.correctIndex >= 0 &&
          q.correctIndex <= 3 &&
          Array.isArray(q.choices) &&
          q.choices.length === 4 &&
          typeof q.scenario === "string" &&
          q.scenario.length >= 15 &&
          !q.scenario.includes("...") &&
          typeof q.instructions === "string" &&
          q.instructions.length >= 10 &&
          !q.instructions.includes("..."),
      ),
  );
}

export function findAttemptQuestion(
  set: AttemptExamSet | null,
  moduleCode: string,
): AttemptExamQuestion | null {
  if (!set) return null;
  return set.questions.find((q) => q.code === moduleCode) ?? null;
}

/** Candidate-safe modules: shuffled choices, no correctIndex. */
export function publicModulesFromAttemptSet(
  set: AttemptExamSet,
  opts: { studentId?: string | null; attemptId?: string | null },
): ReturnType<typeof sanitizeExamModuleForClient>[] {
  return set.questions.map((q) =>
    sanitizeExamModuleForClient(
      {
        code: q.code,
        title: q.title,
        titleAr: q.titleAr,
        dimension: q.dimension,
        level: q.level,
        framework: q.framework,
        focus: q.focus,
        scenario: q.scenario,
        scenarioAr: q.scenarioAr ?? null,
        instructions: q.instructions,
        instructionsAr: q.instructionsAr ?? null,
        rubric: [],
        passThreshold: q.passThreshold,
        specialization: q.specialization,
        generated: q.contentSource === "live_ai",
        estimateMinutes: q.estimateMinutes,
        questionType: "mcq" as const,
        choices: q.choices,
        choicesAr: q.choicesAr ?? null,
        contentSource: q.contentSource,
      },
      { studentId: opts.studentId, attemptId: opts.attemptId },
    ),
  );
}

export function catalogFieldsFromQuestion(
  q: AttemptExamQuestion,
): Pick<
  AssessmentModuleSpec,
  "code" | "title" | "dimension" | "level" | "framework" | "focus" | "scenario" | "instructions" | "passThreshold"
> {
  return {
    code: q.code,
    title: q.title,
    dimension: q.dimension as AssessmentModuleSpec["dimension"],
    level: q.level,
    framework: q.framework,
    focus: q.focus,
    scenario: q.scenario,
    instructions: q.instructions,
    passThreshold: q.passThreshold,
  };
}
