import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import { resolveOwnedStudentId, resolveStudentIdFromSession } from "@/lib/assessment/resolve-student";
import { finalizeAttemptReport } from "@/lib/assessment/finalize-attempt-report";

/**
 * POST /api/iscarb/assessment/attempts/[attemptId]/finalize
 *
 * ISC-QA-001: server-side idempotent report build.
 * Body (optional): { answers?: Record<string,string>, requireComplete?: boolean }
 */
export const POST = guard(
  { tier: "write", roles: ["student", "faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ attemptId: string }> },
  ) => {
    const { attemptId } = await params;

    const attemptRow = await db.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, studentId: true },
    });
    if (!attemptRow) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    let studentId: string;
    if (ctx.session.role === "student") {
      const resolved = await resolveStudentIdFromSession(ctx.session);
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.message }, { status: resolved.status });
      }
      if (resolved.studentId !== attemptRow.studentId) {
        return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
      }
      studentId = resolved.studentId;
    } else {
      const resolved = await resolveOwnedStudentId(ctx.session, attemptRow.studentId);
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: resolved.status });
      }
      studentId = resolved.studentId;
    }

    const body = await parseJSON(req);
    const answers =
      body && typeof body === "object" && (body as { answers?: unknown }).answers &&
      typeof (body as { answers: unknown }).answers === "object"
        ? ((body as { answers: Record<string, string> }).answers)
        : undefined;
    const requireComplete = Boolean(
      body && typeof body === "object" && (body as { requireComplete?: boolean }).requireComplete,
    );

    const result = await finalizeAttemptReport({
      attemptId,
      studentId,
      answers,
      requireComplete,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      completed: result.completed,
      scoredCount: result.scoredCount,
      requiredCount: result.requiredCount,
      attempt: result.attempt,
    });
  },
);
