/**
 * Pending employability report build — answers are frozen at exam submit,
 * then scoring + profile assembly run on /student/results/[attemptId].
 * Stored in sessionStorage so refresh resumes Building Report (not the exam).
 */
import { authHeaders } from "@/lib/client-auth";
import { ensureFourChoices, getExamQuestionType } from "@/lib/assessment/exam-mcq";
import { recordScoredText, shouldScoreOnFinish } from "@/lib/assessment/finish-scoring";
import { mapWithConcurrency } from "@/lib/assessment/score-concurrency";
import {
  saveEmployabilityAttempt,
  type EmployabilityAttemptSnapshot,
  type AttemptModuleResult,
} from "@/lib/assessment/attempt-report-store";
import { buildDimensionChapters } from "@/lib/assessment/dimension-report-sections";

export const REPORT_BUILD_STORAGE_KEY = "iscarb:employability-report-build:v1";

const SCORE_REQUEST_TIMEOUT_MS = 60_000;
const SCORE_NETWORK_RETRIES = 2;
const SCORE_AI_CONCURRENCY = 8;

/** HTTP statuses the scoring route returns when the stored attempt id no longer
 *  resolves (missing row, synthetic fallback id, mid-regeneration set). */
const HEALABLE_SCORE_STATUSES = [400, 404, 409] as const;

export type ReportBuildModule = {
  code: string;
  title: string;
  titleAr: string | null;
  dimension: string;
  scenario: string;
  instructions: string;
  questionType?: string;
  choices?: string[];
};

export type ReportBuildScoreResult = {
  moduleCode: string;
  moduleTitle: string;
  dimension: string;
  score: number;
  band: string;
  passed: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
  perCriterion?: { criterion: string; weight: number; score: number; max: number }[];
  source?: string;
};

export type ReportBuildJobV1 = {
  version: 1;
  attemptId: string;
  studentId: string;
  specialization: string;
  timedOut: boolean;
  modules: ReportBuildModule[];
  answers: Record<string, string>;
  lastScoredText: Record<string, string>;
  savedResults: ReportBuildScoreResult[];
  status: "pending" | "building" | "error";
  error: string | null;
  progress: { done: number; total: number } | null;
  createdAt: string;
};

export type ReportBuildProgress = {
  phase: "scoring" | "assembling";
  done: number;
  total: number;
  message: string;
};

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function createAttemptId(): string {
  return `emp_${Date.now().toString(36)}_${crypto.randomUUID()}`;
}

export function loadReportBuildJob(
  attemptId?: string,
  storage: Storage | null = getSessionStorage(),
): ReportBuildJobV1 | null {
  try {
    const raw = storage?.getItem(REPORT_BUILD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReportBuildJobV1>;
    if (
      parsed.version !== 1 ||
      typeof parsed.attemptId !== "string" ||
      typeof parsed.studentId !== "string" ||
      !Array.isArray(parsed.modules) ||
      !parsed.answers ||
      typeof parsed.answers !== "object"
    ) {
      clearReportBuildJob(storage);
      return null;
    }
    if (attemptId && parsed.attemptId !== attemptId) return null;

    // Discard abandoned builds older than 6 hours.
    const created = Date.parse(parsed.createdAt || "");
    if (Number.isFinite(created) && Date.now() - created > 6 * 60 * 60_000) {
      clearReportBuildJob(storage);
      return null;
    }

    return {
      version: 1,
      attemptId: parsed.attemptId,
      studentId: parsed.studentId,
      specialization: typeof parsed.specialization === "string" ? parsed.specialization : "",
      timedOut: Boolean(parsed.timedOut),
      modules: parsed.modules as ReportBuildModule[],
      answers: parsed.answers as Record<string, string>,
      lastScoredText:
        parsed.lastScoredText && typeof parsed.lastScoredText === "object"
          ? (parsed.lastScoredText as Record<string, string>)
          : {},
      savedResults: Array.isArray(parsed.savedResults)
        ? (parsed.savedResults as ReportBuildScoreResult[])
        : [],
      status: parsed.status === "error" || parsed.status === "building" ? parsed.status : "pending",
      error: typeof parsed.error === "string" ? parsed.error : null,
      progress:
        parsed.progress &&
        typeof parsed.progress.done === "number" &&
        typeof parsed.progress.total === "number"
          ? { done: parsed.progress.done, total: parsed.progress.total }
          : null,
      createdAt:
        typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
    };
  } catch {
    clearReportBuildJob(storage);
    return null;
  }
}

export function saveReportBuildJob(
  job: ReportBuildJobV1,
  storage: Storage | null = getSessionStorage(),
): void {
  try {
    storage?.setItem(REPORT_BUILD_STORAGE_KEY, JSON.stringify(job));
  } catch {
    // ignore quota / private mode
  }
}

export function clearReportBuildJob(storage: Storage | null = getSessionStorage()): void {
  try {
    storage?.removeItem(REPORT_BUILD_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function answeredModules(job: ReportBuildJobV1): ReportBuildModule[] {
  return job.modules.filter((m) => (job.answers[m.code] ?? "").trim().length > 0);
}

/** Every answered module has a matching successful score for the current answer text. */
export function isJobFullyScored(job: ReportBuildJobV1): boolean {
  const answered = answeredModules(job);
  if (answered.length === 0) return false;
  return answered.every((m) => {
    const text = (job.answers[m.code] ?? "").trim();
    if (job.lastScoredText[m.code] !== text) return false;
    return job.savedResults.some((r) => r.moduleCode === m.code);
  });
}

async function postScoreOnce(
  job: ReportBuildJobV1,
  module: ReportBuildModule,
  text: string,
  uiChoices: string[] | undefined,
  attemptId: string | null,
): Promise<Response> {
  const payload = JSON.stringify({
    specialization: job.specialization,
    moduleCode: module.code,
    response: text,
    studentId: job.studentId || undefined,
    attemptId: attemptId || undefined,
    selectedIndex: (() => {
      const i = uiChoices?.indexOf(text);
      return typeof i === "number" && i >= 0 ? i : undefined;
    })(),
    validate: false,
  });

  let res: Response | null = null;
  let lastErr: unknown = null;
  let lastAborted = false;

  for (let attempt = 0; attempt <= SCORE_NETWORK_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), SCORE_REQUEST_TIMEOUT_MS);
    try {
      res = await fetch("/api/iscarb/assessment/score", {
        method: "POST",
        headers: authHeaders({
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
        body: payload,
        signal: controller.signal,
      });
      break;
    } catch (err) {
      lastErr = err;
      lastAborted = controller.signal.aborted;
    } finally {
      window.clearTimeout(timer);
    }
    if (attempt < SCORE_NETWORK_RETRIES) await sleep(1500 * (attempt + 1));
  }

  if (!res) {
    throw new Error(
      lastAborted
        ? `Scoring timed out after ${Math.round(SCORE_REQUEST_TIMEOUT_MS / 1000)}s for ${module.code}`
        : `Lost connection to the scoring service while scoring ${module.code}`,
      { cause: lastErr },
    );
  }

  return res;
}

async function scoreOneModule(
  job: ReportBuildJobV1,
  module: ReportBuildModule,
  text: string,
): Promise<ReportBuildScoreResult> {
  const uiType = getExamQuestionType(module);
  const uiChoices = uiType === "mcq" ? ensureFourChoices(module, module.choices) : module.choices;

  let res = await postScoreOnce(job, module, text, uiChoices, job.attemptId);

  // Self-heal a stale/missing attempt id: 400/404/409 mean the stored id no
  // longer resolves (synthetic fallback, regenerated set, another specialty).
  // Re-resolve the canonical in-progress attempt and retry once — bounded, so
  // a persistent server error still surfaces instead of looping.
  if (!res.ok && HEALABLE_SCORE_STATUSES.includes(res.status as (typeof HEALABLE_SCORE_STATUSES)[number])) {
    try {
      const resolveRes = await fetch("/api/iscarb/assessment/attempt", {
        method: "POST",
        headers: authHeaders({
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
        body: JSON.stringify({ specialization: job.specialization }),
      });
      const resolveJson = (await resolveRes.json().catch(() => ({}))) as { attemptId?: string };
      if (resolveRes.ok && resolveJson.attemptId && resolveJson.attemptId !== job.attemptId) {
        res = await postScoreOnce(job, module, text, uiChoices, resolveJson.attemptId);
      }
    } catch {
      // Keep the original response — the caller surfaces the real error below.
    }
  }

  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as {
      error?: string;
      score?: number;
      moduleCode?: string;
    };
    if (typeof j.score === "number") {
      return j as unknown as ReportBuildScoreResult;
    }
    throw new Error(j.error || `Scoring failed (${res.status}) for ${module.code}`);
  }

  return (await res.json()) as ReportBuildScoreResult;
}

function upsertResult(
  results: ReportBuildScoreResult[],
  result: ReportBuildScoreResult,
): ReportBuildScoreResult[] {
  return [...results.filter((r) => r.moduleCode !== result.moduleCode), result];
}

const buildsInFlight = new Map<string, Promise<EmployabilityAttemptSnapshot>>();

/**
 * Score any unanswered/changed modules, assemble profile, persist attempt snapshot.
 * Does not reveal a report until every answered module is fully scored.
 */
export async function runReportBuild(
  attemptId: string,
  opts?: {
    onProgress?: (p: ReportBuildProgress) => void;
  },
): Promise<EmployabilityAttemptSnapshot> {
  const existing = buildsInFlight.get(attemptId);
  if (existing) return existing;

  const promise = doReportBuild(attemptId, opts);
  buildsInFlight.set(attemptId, promise);
  try {
    return await promise;
  } finally {
    buildsInFlight.delete(attemptId);
  }
}

async function doReportBuild(
  attemptId: string,
  opts?: {
    onProgress?: (p: ReportBuildProgress) => void;
  },
): Promise<EmployabilityAttemptSnapshot> {
  let job = loadReportBuildJob(attemptId);
  if (!job) {
    throw new Error("No pending report build found for this attempt.");
  }

  try {
    const sessionRes = await fetch("/api/iscarb/session", { headers: authHeaders() });
    if (sessionRes.ok) {
      const sessionJson = (await sessionRes.json()) as { studentId?: string | null };
      if (sessionJson.studentId && sessionJson.studentId !== job.studentId) {
        job = { ...job, studentId: sessionJson.studentId };
        saveReportBuildJob(job);
      }
    }
  } catch {
    // Keep the stored job id; the profile API binds students to the session.
  }

  if (!job.studentId) {
    throw new Error("Missing student session for report build.");
  }

  const answered = answeredModules(job);
  if (answered.length === 0) {
    job = {
      ...job,
      status: "error",
      error: "You must answer at least one question to generate a report.",
    };
    saveReportBuildJob(job);
    throw new Error(job.error!);
  }

  job = { ...job, status: "building", error: null };
  saveReportBuildJob(job);

  const pending = answered.filter((m) =>
    shouldScoreOnFinish(m.code, job!.answers[m.code] ?? "", job!.lastScoredText),
  );
  const alreadyDone = answered.length - pending.length;
  const total = answered.length;

  opts?.onProgress?.({
    phase: "scoring",
    done: alreadyDone,
    total,
    message: `Scoring your answers… ${alreadyDone}/${total}`,
  });
  job = {
    ...job,
    progress: { done: alreadyDone, total },
  };
  saveReportBuildJob(job);

  if (pending.length > 0) {
    let completed = alreadyDone;
    const lastScoredText = { ...job.lastScoredText };
    let savedResults = [...job.savedResults];

    const settled = await mapWithConcurrency(pending, SCORE_AI_CONCURRENCY, async (mod) => {
      const text = (job!.answers[mod.code] ?? "").trim();
      const result = await scoreOneModule(job!, mod, text);
      recordScoredText(lastScoredText, mod.code, text);
      savedResults = upsertResult(savedResults, result);
      completed++;
      opts?.onProgress?.({
        phase: "scoring",
        done: completed,
        total,
        message: `Scoring your answers… ${completed}/${total}`,
      });
      const latest = loadReportBuildJob(attemptId) ?? job!;
      const next: ReportBuildJobV1 = {
        ...latest,
        lastScoredText: { ...lastScoredText },
        savedResults: [...savedResults],
        status: "building",
        progress: { done: completed, total },
        error: null,
      };
      saveReportBuildJob(next);
      return result;
    });

    job = loadReportBuildJob(attemptId) ?? {
      ...job,
      lastScoredText,
      savedResults,
    };

    const failures = settled.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      const first = failures[0]!;
      const reason =
        first.status === "rejected"
          ? first.reason instanceof Error
            ? first.reason.message
            : String(first.reason)
          : "Scoring failed";
      job = {
        ...job,
        status: "error",
        error: `Could not score all answers (${failures.length} failed). ${reason}`,
        progress: { done: total - failures.length, total },
      };
      saveReportBuildJob(job);
      throw new Error(job.error);
    }
  }

  job = loadReportBuildJob(attemptId) ?? job;
  if (!isJobFullyScored(job)) {
    job = {
      ...job,
      status: "error",
      error: "Report is incomplete — not all answers were scored. Please retry.",
    };
    saveReportBuildJob(job);
    throw new Error(job.error!);
  }

  opts?.onProgress?.({
    phase: "assembling",
    done: total,
    total,
    message: "Assembling your report…",
  });
  job = { ...job, progress: { done: total, total }, status: "building", error: null };
  saveReportBuildJob(job);

  const profileRes = await fetch("/api/iscarb/assessment/profile", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
    body: JSON.stringify({
      specialization: job.specialization,
    }),
  });
  if (!profileRes.ok) {
    const j = await profileRes.json().catch(() => ({}));
    const msg = (j as { error?: string }).error || `Profile failed (${profileRes.status})`;
    job = { ...job, status: "error", error: msg };
    saveReportBuildJob(job);
    throw new Error(msg);
  }
  const profileJson = await profileRes.json();
  const profile = profileJson.profile as {
    composite: number;
    band: string;
    passed: boolean;
    specialization: string | null;
    dimensions: EmployabilityAttemptSnapshot["profile"]["dimensions"];
    covered: string[];
    computedAt: string;
  };
  if (!profile?.dimensions) {
    const msg = "Profile response was incomplete.";
    job = { ...job, status: "error", error: msg };
    saveReportBuildJob(job);
    throw new Error(msg);
  }

  job = loadReportBuildJob(attemptId) ?? job;
  if (!isJobFullyScored(job)) {
    job = {
      ...job,
      status: "error",
      error: "Report is incomplete — not all answers were scored. Please retry.",
    };
    saveReportBuildJob(job);
    throw new Error(job.error!);
  }

  const results: AttemptModuleResult[] = job.savedResults.map((r) => ({
    moduleCode: r.moduleCode,
    moduleTitle: r.moduleTitle,
    dimension: r.dimension,
    score: r.score,
    band: r.band,
    passed: r.passed,
    feedback: r.feedback,
    strengths: r.strengths,
    improvements: r.improvements,
    perCriterion: r.perCriterion,
  }));

  let studentName: string | undefined;
  try {
    const me = await fetch("/api/iscarb/student/profile", {
      headers: authHeaders({ Accept: "application/json" }),
    });
    if (me.ok) {
      const json = (await me.json()) as { data?: { name?: string } };
      const n = json?.data?.name?.trim();
      if (n) studentName = n;
    }
  } catch {
    /* optional */
  }

  const dimensionChapters = buildDimensionChapters(
    results.map((r) => ({
      moduleCode: r.moduleCode,
      moduleTitle: r.moduleTitle,
      dimension: r.dimension,
      score: r.score,
      band: r.band,
      strengths: r.strengths,
      improvements: r.improvements,
      feedback: r.feedback,
    })),
    profile.dimensions,
  );

  const snapshot = saveEmployabilityAttempt({
    id: job.attemptId,
    studentId: job.studentId,
    studentName,
    specialization: job.specialization,
    computedAt: profile.computedAt || new Date().toISOString(),
    timedOut: job.timedOut,
    profile: {
      composite: profile.composite,
      band: profile.band,
      passed: profile.passed,
      specialization: profile.specialization,
      dimensions: profile.dimensions,
      covered: profile.covered,
      computedAt: profile.computedAt,
    },
    results,
    modules: job.modules.map((m) => ({
      code: m.code,
      title: m.title,
      titleAr: m.titleAr,
      dimension: m.dimension,
      scenario: m.scenario,
      instructions: m.instructions,
    })),
    answers: { ...job.answers },
    dimensionChapters,
  });

  clearReportBuildJob();
  return snapshot;
}
