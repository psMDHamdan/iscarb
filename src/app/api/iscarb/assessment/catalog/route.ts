import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, tenantWhere, type GuardContext } from "@/lib/api-guard";

/**
 * GET /api/iscarb/assessment/catalog
 * Published quiz assessments available to the caller's tenant (student journey entry).
 */
export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin", "dean"] },
  async (_req, ctx: GuardContext) => {
    const tenant = tenantWhere(ctx);
    const rows = await db.assessment.findMany({
      where: {
        status: "published",
        ...(tenant.universityId ? { universityId: tenant.universityId } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        timeLimit: true,
        passPercentage: true,
        publishedAt: true,
        _count: { select: { questions: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    // Attach caller's latest attempt status when student
    let attemptByAssessment = new Map<
      string,
      { submissionId: string; status: string; startedAt: Date }
    >();

    if (ctx.session.role === "student" && ctx.session.studentId) {
      const attempts = await db.assessmentSubmission.findMany({
        where: {
          studentId: ctx.session.studentId,
          assessmentId: { in: rows.map((r) => r.id) },
        },
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          assessmentId: true,
          status: true,
          startedAt: true,
        },
      });
      for (const a of attempts) {
        if (!attemptByAssessment.has(a.assessmentId)) {
          attemptByAssessment.set(a.assessmentId, {
            submissionId: a.id,
            status: a.status,
            startedAt: a.startedAt,
          });
        }
      }
    }

    return NextResponse.json({
      data: rows.map((r) => {
        const attempt = attemptByAssessment.get(r.id) ?? null;
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          timeLimitMinutes: r.timeLimit,
          passPercentage: r.passPercentage,
          questionCount: r._count.questions,
          publishedAt: r.publishedAt,
          myAttempt: attempt
            ? {
                submissionId: attempt.submissionId,
                status: attempt.status,
                startedAt: attempt.startedAt,
              }
            : null,
        };
      }),
      meta: { count: rows.length, timestamp: new Date().toISOString() },
    });
  }
);
