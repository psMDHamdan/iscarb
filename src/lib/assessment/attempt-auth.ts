/**
 * Shared helpers for Assessment OS attempt routes (start / autosave / submit / resume / state).
 * Fail-closed ownership: students may only touch their own submissions.
 */
import "server-only";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { GuardContext } from "@/lib/api-guard";
import { resolveStudentIdForCaller } from "@/lib/assessment/ownership";

const TERMINAL_STATUSES = new Set(["SUBMITTED", "SCORED", "REVIEWED", "FINAL"]);

export function assessmentIdFromPath(req: NextRequest): string | null {
  const parts = new URL(req.url).pathname.split("/");
  // /api/v1/assessments/{id}/...
  const i = parts.indexOf("assessments");
  if (i < 0 || !parts[i + 1]) return null;
  return parts[i + 1];
}

/**
 * Resolve the acting student row for an attempt.
 * Students: bound to session.studentId (or User→Student via session.userId).
 * Faculty/admin: must pass studentId in body/query.
 */
export async function resolveActingStudent(
  ctx: GuardContext,
  requestedStudentId?: string | null,
): Promise<
  | { ok: true; student: { id: string; universityId: string | null } }
  | { ok: false; status: 400 | 403 | 404; message: string }
> {
  if (ctx.session.role === "student") {
    let studentId = ctx.session.studentId;
    if (!studentId && ctx.session.userId) {
      const byUser = await db.student.findFirst({
        where: { userId: ctx.session.userId },
        select: { id: true, universityId: true },
      });
      if (!byUser) {
        return { ok: false, status: 404, message: "Student not found for session" };
      }
      return { ok: true, student: byUser };
    }
    const resolved = resolveStudentIdForCaller(ctx.session, requestedStudentId ?? undefined);
    if (!resolved.ok) return resolved;
    const student = await db.student.findFirst({
      where: { id: resolved.studentId },
      select: { id: true, universityId: true },
    });
    if (!student) return { ok: false, status: 404, message: "Student not found" };
    return { ok: true, student };
  }

  const resolved = resolveStudentIdForCaller(ctx.session, requestedStudentId ?? undefined);
  if (!resolved.ok) return resolved;
  const student = await db.student.findFirst({
    where: { id: resolved.studentId },
    select: { id: true, universityId: true },
  });
  if (!student) return { ok: false, status: 404, message: "Student not found" };
  return { ok: true, student };
}

export async function assertSubmissionOwnership(
  ctx: GuardContext,
  submission: { studentId: string; universityId: string },
): Promise<{ ok: true } | { ok: false; status: 403; message: string }> {
  if (ctx.session.role === "student") {
    const acting = await resolveActingStudent(ctx);
    if (!acting.ok) {
      return { ok: false, status: 403, message: acting.message };
    }
    if (acting.student.id !== submission.studentId) {
      return {
        ok: false,
        status: 403,
        message: "Forbidden — you may only access your own assessment data",
      };
    }
  }
  if (
    ctx.session.universityId &&
    submission.universityId &&
    ctx.session.universityId !== submission.universityId
  ) {
    return { ok: false, status: 403, message: "Forbidden — tenant mismatch" };
  }
  return { ok: true };
}

export function isMutableStatus(status: string): boolean {
  return status === "DRAFT";
}

export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Assessment.timeLimit is minutes (schema). Returns deadline Date or null if unlimited.
 */
export function deadlineForAttempt(
  startedAt: Date,
  timeLimitMinutes: number | null | undefined,
): Date | null {
  if (timeLimitMinutes == null || timeLimitMinutes <= 0) return null;
  return new Date(startedAt.getTime() + timeLimitMinutes * 60_000);
}

export function isPastDeadline(
  startedAt: Date,
  timeLimitMinutes: number | null | undefined,
  now: Date = new Date(),
): boolean {
  const deadline = deadlineForAttempt(startedAt, timeLimitMinutes);
  if (!deadline) return false;
  return now.getTime() > deadline.getTime();
}

/**
 * If DRAFT is past the assessment time limit, lock it as SUBMITTED (late auto-submit).
 * Returns the (possibly updated) status.
 */
export async function enforceDeadlineOrExpire(submission: {
  id: string;
  status: string;
  startedAt: Date;
  assessment?: { timeLimit?: number | null } | null;
  timeLimitMinutes?: number | null;
}): Promise<{ status: string; expired: boolean }> {
  if (!isMutableStatus(submission.status)) {
    return { status: submission.status, expired: false };
  }
  const limit =
    submission.timeLimitMinutes ??
    submission.assessment?.timeLimit ??
    null;
  if (!isPastDeadline(submission.startedAt, limit)) {
    return { status: submission.status, expired: false };
  }
  const locked = await db.assessmentSubmission.updateMany({
    where: { id: submission.id, status: "DRAFT" },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      lastActivityAt: new Date(),
    },
  });
  return {
    status: locked.count > 0 ? "SUBMITTED" : submission.status,
    expired: locked.count > 0,
  };
}

/** Fisher–Yates shuffle (in-place copy). */
export function shuffleCopy<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** @deprecated Prefer importing from `@/lib/assessment/public-question-payload` — re-exported for existing callers. */
export { publicQuestions } from "@/lib/assessment/public-question-payload";

/** Latest saved answer per question for a draft submission. */
export async function latestResponsesForSubmission(submissionId: string): Promise<
  Array<{
    questionId: string;
    responseText: string | null;
    selectedAnswer: string | null;
  }>
> {
  const rows = await db.assessmentQuestionResponse.findMany({
    where: { submissionId },
    orderBy: { sequenceNumber: "desc" },
    select: {
      questionId: true,
      responseText: true,
      selectedAnswer: true,
    },
  });
  const seen = new Set<string>();
  const latest: typeof rows = [];
  for (const row of rows) {
    if (seen.has(row.questionId)) continue;
    seen.add(row.questionId);
    latest.push(row);
  }
  return latest;
}

