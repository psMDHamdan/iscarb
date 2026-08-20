import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, type GuardContext } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { resolveActingStudent } from "@/lib/assessment/attempt-auth";

/**
 * GET /api/iscarb/assessment/my-submissions
 * Lists the authenticated student's assessment attempts (for my-assessments UI).
 */
export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (req, ctx: GuardContext) => {
    const requested = req.nextUrl.searchParams.get("studentId");
    const acting = await resolveActingStudent(ctx, requested);
    if (!acting.ok) return apiError(acting.message, acting.status);

    const rows = await db.assessmentSubmission.findMany({
      where: { studentId: acting.student.id },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            timeLimit: true,
            status: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        assessmentId: r.assessmentId,
        title: r.assessment.title,
        status: r.status,
        score: r.percentageScore ?? r.totalScore,
        percentageScore: r.percentageScore,
        timeLimitMinutes: r.assessment.timeLimit,
        startedAt: r.startedAt,
        submittedAt: r.submittedAt,
        scoredAt: r.scoredAt,
      })),
      meta: { timestamp: new Date().toISOString(), count: rows.length },
    });
  }
);
