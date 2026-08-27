/**
 * Employability exam sitting timer — deadline-based so navigation and refresh
 * cannot reset remaining time. Start time is stored; remaining = duration − elapsed.
 */

export const ASSESSMENT_DURATION_MINUTES = 45;
export const ASSESSMENT_DURATION_SECONDS = ASSESSMENT_DURATION_MINUTES * 60;

/** sessionStorage key for in-progress exam + timer start. */
export const EXAM_SESSION_STORAGE_KEY = "iscarb:employability-exam-session:v1";

/**
 * Build version stamp — sessions created under a different commit are
 * automatically discarded so stale / broken AI content from older
 * deployments is never silently served after a hotfix redeploy.
 */
const BUILD_SHA = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? "dev";

export type ExamTimerSessionV1 = {
  version: 1;
  startedAtMs: number;
  durationMinutes: number;
  specialization: string;
  studentId: string | null;
  attemptId?: string | null;
  /** Build commit SHA — used to auto-invalidate sessions from old deployments. */
  buildSha?: string;
  modules: unknown[];
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  /** Current question — atomic navigation key (QA-008). */
  activeCode?: string | null;
  /** Legacy dimension/module indices — kept so older stored sessions restore. */
  dimIdx?: number;
  modIdx?: number;
  completedCodes: string[];
  savedResults: unknown[];
  lastScoredText: Record<string, string>;
};

/** Seconds remaining from a fixed start timestamp (floor at 0). */
export function computeSecondsLeft(
  startedAtMs: number,
  durationMinutes: number = ASSESSMENT_DURATION_MINUTES,
  nowMs: number = Date.now(),
): number {
  if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) return 0;
  const totalMs = Math.max(0, durationMinutes) * 60_000;
  const elapsed = Math.max(0, nowMs - startedAtMs);
  return Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
}

export function examDeadlineMs(
  startedAtMs: number,
  durationMinutes: number = ASSESSMENT_DURATION_MINUTES,
): number {
  return startedAtMs + Math.max(0, durationMinutes) * 60_000;
}

export function clearExamSession(storage: Storage | null = getSessionStorage()): void {
  try {
    storage?.removeItem(EXAM_SESSION_STORAGE_KEY);
  } catch {
    // ignore quota / private mode
  }
}

export function saveExamSession(
  session: ExamTimerSessionV1,
  storage: Storage | null = getSessionStorage(),
): void {
  try {
    storage?.setItem(EXAM_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function loadExamSession(
  storage: Storage | null = getSessionStorage(),
  nowMs: number = Date.now(),
): ExamTimerSessionV1 | null {
  try {
    const raw = storage?.getItem(EXAM_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ExamTimerSessionV1>;
    if (
      parsed.version !== 1 ||
      typeof parsed.startedAtMs !== "number" ||
      !Number.isFinite(parsed.startedAtMs) ||
      typeof parsed.durationMinutes !== "number" ||
      !Array.isArray(parsed.modules) ||
      parsed.modules.length === 0
    ) {
      clearExamSession(storage);
      return null;
    }

    // Discard sessions from a different build (deployment hotfix invalidation).
    if (parsed.buildSha && BUILD_SHA !== "dev" && parsed.buildSha !== BUILD_SHA) {
      clearExamSession(storage);
      return null;
    }

    // Discard sessions older than duration + 2h (stale / abandoned).
    const maxAgeMs = (parsed.durationMinutes + 120) * 60_000;
    if (nowMs - parsed.startedAtMs > maxAgeMs) {
      clearExamSession(storage);
      return null;
    }

    return {
      version: 1,
      startedAtMs: parsed.startedAtMs,
      durationMinutes: parsed.durationMinutes,
      specialization: typeof parsed.specialization === "string" ? parsed.specialization : "",
      studentId: parsed.studentId ?? null,
      modules: parsed.modules,
      answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      flagged: parsed.flagged && typeof parsed.flagged === "object" ? parsed.flagged : {},
      dimIdx: typeof parsed.dimIdx === "number" ? parsed.dimIdx : 0,
      modIdx: typeof parsed.modIdx === "number" ? parsed.modIdx : 0,
      completedCodes: Array.isArray(parsed.completedCodes) ? parsed.completedCodes.map(String) : [],
      savedResults: Array.isArray(parsed.savedResults) ? parsed.savedResults : [],
      lastScoredText:
        parsed.lastScoredText && typeof parsed.lastScoredText === "object"
          ? (parsed.lastScoredText as Record<string, string>)
          : {},
    };
  } catch {
    clearExamSession(storage);
    return null;
  }
}

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
