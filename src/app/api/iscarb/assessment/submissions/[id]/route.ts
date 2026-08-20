import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, type GuardContext } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import {
  assertSubmissionOwnership,
  enforceDeadlineOrExpire,
  isMutableStatus,
} from "@/lib/assessment/attempt-auth";

/**
 * GET /api/iscarb/assessment/submissions/[id]
 * Ownership-scoped submission detail for results viewing.
 */
export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (req, ctx: GuardContext) => {
    const id = req.nextUrl.pathname.split("/submissions/")[1]?.split("/")[0];
    if (!id) return apiError("Submission ID is required", 400);

    const submission = await db.assessmentSubmission.findFirst({
      where: { id },
      include: {
        assessment: { select: { id: true, title: true, timeLimit: true, passPercentage: true } },
        responses: true,
        scores: true,
      },
    });

    if (!submission) return apiError("Submission not found", 404);

    const ownership = await assertSubmissionOwnership(ctx, submission);
    if (!ownership.ok) return apiError(ownership.message, ownership.status);

    const answers: Record<string, unknown> = {};
    for (const r of submission.responses) {
      answers[r.questionId] = {
        responseText: r.responseText,
        selectedAnswer: r.selectedAnswer,
      };
    }

    const timeSpentMinutes =
      submission.submittedAt != null
        ? Math.max(
            0,
            Math.round(
              (submission.submittedAt.getTime() - submission.startedAt.getTime()) / 60_000
            )
          )
        : Math.max(
            0,
            Math.round((Date.now() - submission.startedAt.getTime()) / 60_000)
          );

    return NextResponse.json({
      data: {
        id: submission.id,
        assessmentId: submission.assessmentId,
        title: submission.assessment.title,
        studentId: submission.studentId,
        status: submission.status,
        answers,
        score: submission.totalScore,
        percentageScore: submission.percentageScore,
        totalPoints: submission.totalPoints,
        passPercentage: submission.assessment.passPercentage,
        submittedAt: submission.submittedAt,
        scoredAt: submission.scoredAt,
        startedAt: submission.startedAt,
        timeSpentMinutes,
        criterionScores: submission.scores.map((s) => ({
          id: s.id,
          criterionId: s.criterionId,
          score: s.score,
          maxScore: s.maxScore,
          provider: s.provider,
          confidence: s.confidence,
          feedback: s.feedback,
        })),
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
);
