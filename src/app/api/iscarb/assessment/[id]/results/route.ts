import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, tenantWhere, type GuardContext } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { resolveActingStudent } from "@/lib/assessment/attempt-auth";

/**
 * GET /api/iscarb/assessment/[id]/results
 *
 * Students see only their own AssessmentSubmission results.
 * Faculty/Admin see all submissions for the assessment (tenant-scoped).
 */
export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (req, ctx: GuardContext) => {
    const id = req.nextUrl.pathname.split("/assessment/")[1]?.split("/")[0];
    if (!id) {
      return apiError("Assessment ID is required", 400);
    }

    const assessment = await db.assessment.findFirst({
      where: { id, ...tenantWhere(ctx) },
    });

    if (!assessment) {
      return apiError("Assessment not found", 404);
    }

    if (ctx.session.role === "student") {
      const acting = await resolveActingStudent(ctx);
      if (!acting.ok) return apiError(acting.message, acting.status);

      const submission = await db.assessmentSubmission.findFirst({
        where: {
          assessmentId: id,
          studentId: acting.student.id,
          status: { in: ["SUBMITTED", "SCORED", "REVIEWED", "FINAL"] },
        },
        include: { scores: true },
        orderBy: { submittedAt: "desc" },
      });

      if (!submission) {
        return apiError("No submission found", 404);
      }

      return NextResponse.json({
        data: {
          submissionId: submission.id,
          assessmentId: id,
          studentId: acting.student.id,
          status: submission.status,
          score: submission.totalScore,
          percentageScore: submission.percentageScore,
          totalPoints: submission.totalPoints,
          criterionScores: submission.scores,
          submittedAt: submission.submittedAt,
          scoredAt: submission.scoredAt,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const status = url.searchParams.get("status") || undefined;

    const where: {
      assessmentId: string;
      universityId?: string;
      status?: string;
    } = {
      assessmentId: id,
    };
    if (ctx.session.universityId) {
      where.universityId = ctx.session.universityId;
    }
    if (status) where.status = status;

    const [submissions, total] = await Promise.all([
      db.assessmentSubmission.findMany({
        where,
        include: { scores: true },
        orderBy: { submittedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.assessmentSubmission.count({ where }),
    ]);

    return NextResponse.json({
      data: {
        submissions: submissions.map((s) => ({
          id: s.id,
          studentId: s.studentId,
          status: s.status,
          score: s.totalScore,
          percentageScore: s.percentageScore,
          submittedAt: s.submittedAt,
          scoredAt: s.scoredAt,
          criterionCount: s.scores.length,
        })),
        total,
        limit,
        offset,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
);
