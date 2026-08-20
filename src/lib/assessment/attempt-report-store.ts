/**
 * Client-side store for employability exam attempt snapshots.
 * Enables Result → Detailed Report deep-links and a student-scoped attempt list
 * without changing the 4D scoring engine or DB schema.
 */
import type { DimensionChapter } from "./dimension-report-sections";

export interface AttemptDimensionScore {
  dimension: string;
  label: string;
  labelAr: string;
  weight: number;
  score: number;
  moduleCount: number;
  band: string;
}

export interface AttemptProfile {
  composite: number;
  band: string;
  passed: boolean;
  specialization: string | null;
  dimensions: AttemptDimensionScore[];
  covered: string[];
  computedAt: string;
}

export interface AttemptModuleResult {
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
  isFallback?: boolean;
}

export interface AttemptModuleBrief {
  code: string;
  title: string;
  titleAr: string | null;
  dimension: string;
  scenario: string;
  instructions: string;
}

export interface EmployabilityAttemptSnapshot {
  id: string;
  kind: "employability";
  studentId: string;
  studentName?: string;
  specialization: string;
  computedAt: string;
  timedOut: boolean;
  profile: AttemptProfile;
  results: AttemptModuleResult[];
  modules: AttemptModuleBrief[];
  answers: Record<string, string>;
  dimensionChapters?: DimensionChapter[];
}

const PREFIX = "iscarb:employability-attempts:";

function storageKey(studentId: string): string {
  return `${PREFIX}${studentId}`;
}

function safeParse(raw: string | null): EmployabilityAttemptSnapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is EmployabilityAttemptSnapshot =>
        !!a &&
        typeof a === "object" &&
        (a as EmployabilityAttemptSnapshot).kind === "employability" &&
        typeof (a as EmployabilityAttemptSnapshot).id === "string",
    );
  } catch {
    return [];
  }
}

export function listEmployabilityAttempts(
  studentId: string,
): EmployabilityAttemptSnapshot[] {
  if (typeof window === "undefined" || !studentId) return [];
  const list = safeParse(window.localStorage.getItem(storageKey(studentId)));
  return list.sort(
    (a, b) =>
      new Date(b.computedAt).getTime() - new Date(a.computedAt).getTime(),
  );
}

export function getEmployabilityAttempt(
  studentId: string,
  attemptId: string,
): EmployabilityAttemptSnapshot | null {
  if (!studentId || !attemptId) return null;
  return listEmployabilityAttempts(studentId).find((a) => a.id === attemptId) ?? null;
}

/** Also search all keys if studentId is unknown (fallback for deep-link). */
export function findEmployabilityAttempt(
  attemptId: string,
  preferredStudentId?: string | null,
): EmployabilityAttemptSnapshot | null {
  if (typeof window === "undefined" || !attemptId) return null;
  if (preferredStudentId) {
    const hit = getEmployabilityAttempt(preferredStudentId, attemptId);
    if (hit) return hit;
  }
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    const list = safeParse(window.localStorage.getItem(key));
    const found = list.find((a) => a.id === attemptId);
    if (found) return found;
  }
  return null;
}

export function saveEmployabilityAttempt(
  snapshot: Omit<EmployabilityAttemptSnapshot, "kind" | "id"> & { id?: string },
): EmployabilityAttemptSnapshot {
  const id =
    snapshot.id ??
    `emp_${Date.now().toString(36)}_${crypto.randomUUID()}`;
  const full: EmployabilityAttemptSnapshot = {
    ...snapshot,
    id,
    kind: "employability",
  };
  if (typeof window === "undefined") return full;

  const key = storageKey(full.studentId);
  const existing = safeParse(window.localStorage.getItem(key));
  const without = existing.filter((a) => a.id !== full.id);
  without.unshift(full);
  // Keep a reasonable history per student
  const trimmed = without.slice(0, 20);
  window.localStorage.setItem(key, JSON.stringify(trimmed));

  // Background sync to Postgres and RDF Knowledge Graph
  fetch('/api/iscarb/assessment/save-attempt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(full)
  }).catch(err => console.error("Failed to persist attempt to DB/RDF:", err));

  return full;
}

export function isEmployabilityAttemptId(id: string): boolean {
  return id.startsWith("emp_");
}
