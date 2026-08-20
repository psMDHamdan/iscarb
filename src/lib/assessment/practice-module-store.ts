/**
 * Server-side store for AI practice modules.
 * Full rubric + fewShot are kept here for scoring; clients only receive a sanitized view.
 */
import "server-only";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";

type StoredPractice = {
  module: AssessmentModuleSpec;
  ownerStudentId: string | null;
  createdAt: number;
};

const STORE = new Map<string, StoredPractice>();
const TTL_MS = 6 * 60 * 60 * 1000; // 6h

function prune(): void {
  const now = Date.now();
  for (const [code, row] of STORE) {
    if (now - row.createdAt > TTL_MS) STORE.delete(code);
  }
}

export function storePracticeModule(
  module: AssessmentModuleSpec,
  ownerStudentId?: string | null,
): void {
  prune();
  STORE.set(module.code, {
    module: {
      ...module,
      rubric: module.rubric.map((r) => ({ ...r })),
      fewShot: (module.fewShot ?? []).map((a) => ({ ...a })),
    },
    ownerStudentId: ownerStudentId ?? null,
    createdAt: Date.now(),
  });
}

/**
 * Retrieve a practice module for scoring. When ownerStudentId is set on the
 * store entry, a mismatched studentId is rejected (null).
 */
export function getPracticeModuleForScoring(
  code: string,
  studentId?: string | null,
): AssessmentModuleSpec | null {
  prune();
  const row = STORE.get(code);
  if (!row) return null;
  if (row.ownerStudentId && studentId && row.ownerStudentId !== studentId) {
    return null;
  }
  return {
    ...row.module,
    rubric: row.module.rubric.map((r) => ({ ...r })),
    fewShot: (row.module.fewShot ?? []).map((a) => ({ ...a })),
  };
}

/** Test helper — clear store between cases. */
export function __clearPracticeModuleStoreForTests(): void {
  STORE.clear();
}
