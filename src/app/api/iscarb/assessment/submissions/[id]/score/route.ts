import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, type GuardContext } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { assertSubmissionOwnership } from "@/lib/assessment/attempt-auth";
import { rdfSyncService } from "@/services/rdf/rdf-sync.service";

/**
 * PATCH /api/iscarb/assessment/submissions/[id]/score
 * Faculty/admin override of total score after review.
 * Body: { totalScore: number, feedback?: string }
 */
export const PATCH = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (req, ctx: GuardContext) => {
    const id = req.nextUrl.pathname.split("/submissions/")[1]?.split("/")[0];
    if (!id) return apiError("Submission ID is required", 400);

    const body = await parseJSON(req);
    if (!body) return jsonErrorResponse("Invalid request body");
    const { totalScore, feedback } = body as {
      totalScore?: number;
      feedback?: string;
    };

    if (typeof totalScore !== "number" || Number.isNaN(totalScore)) {
      return apiError("totalScore (number) is required", 400);
    }

    const submission = await db.assessmentSubmission.findFirst({
      where: { id },
      include: { assessment: true },
    });

    if (!submission) return apiError("Submission not found", 404);

    const ownership = await assertSubmissionOwnership(ctx, submission);
    if (!ownership.ok) return apiError(ownership.message, ownership.status);

    if (!["SUBMITTED", "SCORED", "REVIEWED"].includes(submission.status)) {
      return apiError(`Cannot score submission in status ${submission.status}`, 409);
    }

    const totalPoints = submission.totalPoints ?? 0;
    const percentageScore =
      totalPoints > 0 ? (totalScore / totalPoints) * 100 : totalScore;

    const updated = await db.assessmentSubmission.update({
      where: { id },
      data: {
        totalScore,
        percentageScore,
        status: "REVIEWED",
        scoredAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    
      
      // RDF sync
      rdfSyncService.insertEntity("AssessmentSubmission", "unknown", "ISCARB", data).catch(() => {});// RDF sync
      rdfSyncService.insertEntity("AssessmentSubmission", updated.id, "ISCARB", updated).catch(() => {});// Optional audit note as a criterion-less score row is not possible without criterionId;
    // store feedback on lastActivity meta via a CalibrationScoreAdjustment only if session exists.
    void feedback;

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        totalScore: updated.totalScore,
        percentageScore: updated.percentageScore,
        scoredAt: updated.scoredAt,
        feedback: feedback ?? null,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
);
