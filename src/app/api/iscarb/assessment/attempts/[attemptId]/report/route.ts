import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { resolveStudentIdFromSession, resolveOwnedStudentId } from "@/lib/assessment/resolve-student";
import {
  buildLiveEmployabilityReport,
  toAttemptSnapshotView,
} from "@/lib/assessment/live-employability-report";

/**
 * GET /api/iscarb/assessment/attempts/[attemptId]/report
 *
 * Idempotent read of the employability report for a specific attempt.
 * Prefer POST .../finalize after submit; this route is for refresh / deep-link.
 */
export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ attemptId: string }> },
  ) => {
    const { attemptId } = await params;
    const { searchParams } = new URL(req.url);
    const requestedStudentId = searchParams.get("studentId")?.trim() ?? undefined;

    let studentId: string;
    if (ctx.session.role === "student") {
      const resolved = await resolveStudentIdFromSession(ctx.session);
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.message }, { status: resolved.status });
      }
      studentId = resolved.studentId;
    } else {
      const resolved = await resolveOwnedStudentId(ctx.session, requestedStudentId);
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: resolved.status });
      }
      studentId = resolved.studentId;
    }

    const attempt = await db.assessmentAttempt.findFirst({
      where: { id: attemptId, studentId },
      select: { id: true, status: true, specialization: true },
    });
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Prefer the latest durable snapshot for this attempt when present.
    const snapshots = await db.assessmentSnapshot.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const snap of snapshots) {
      try {
        const parsed = JSON.parse(snap.dataJson) as {
          attemptId?: string;
          attempt?: unknown;
        };
        if (parsed.attemptId === attemptId && parsed.attempt) {
          return NextResponse.json({
            success: true,
            status: attempt.status,
            attempt: parsed.attempt,
            source: "snapshot",
          });
        }
      } catch {
        /* skip corrupt row */
      }
    }

    const report = await buildLiveEmployabilityReport(studentId, attempt.specialization);
    if ("error" in report) {
      return NextResponse.json({ error: report.error }, { status: report.status });
    }
    const view = toAttemptSnapshotView(report);
    view.id = attempt.id;

    return NextResponse.json({
      success: true,
      status: attempt.status,
      attempt: view,
      source: "live",
    });
  },
);
