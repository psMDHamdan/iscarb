import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, type GuardContext } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { rdfSyncService } from "@/services/rdf/rdf-sync.service";
import {
  assertSubmissionOwnership,
  enforceDeadlineOrExpire,
  isMutableStatus,
} from "@/lib/assessment/attempt-auth";

/**
 * POST /api/iscarb/assessment/submissions/[id]/submit
 * Body: { answers?: Record<string, { responseText?: string; selectedAnswer?: string }>,
 *         submissionToken?: string }
 *
 * Atomic DRAFT → SUBMITTED/SCORED with ownership + deadline enforcement.
 */
export const POST = guard(
  { tier: "write", roles: ["student", "faculty", "admin"] },
  async (req, ctx: GuardContext) => {
    const id = req.nextUrl.pathname.split("/submissions/")[1]?.split("/")[0];
    if (!id) return apiError("Submission ID is required", 400);

    const body = await parseJSON(req);
    if (!body) return jsonErrorResponse("Invalid request body");
    const { answers, submissionToken } = body as {
      answers?: Record<string, { responseText?: string; selectedAnswer?: string }>;
      submissionToken?: string;
      idempotencyKey?: string;
    };

    const submission = await db.assessmentSubmission.findFirst({
      where: { id },
      include: {
        assessment: { include: { questions: true } },
        responses: true,
      },
    });

    if (!submission) return apiError("Submission not found", 404);

    const ownership = await assertSubmissionOwnership(ctx, submission);
    if (!ownership.ok) return apiError(ownership.message, ownership.status);

    // Idempotent: already submitted with matching token
    if (
      !isMutableStatus(submission.status) &&
      submissionToken &&
      submission.submissionToken === submissionToken
    ) {
      return NextResponse.json({
        data: {
          id: submission.id,
          status: submission.status,
          score: submission.totalScore,
          percentageScore: submission.percentageScore,
          message: "Already submitted",
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    if (!isMutableStatus(submission.status)) {
      return apiError(
        `Cannot submit non-draft submission. Current status: ${submission.status}`,
        409
      );
    }

    if (
      submissionToken &&
      submission.submissionToken &&
      submissionToken !== submission.submissionToken
    ) {
      return apiError("Invalid submission token", 403);
    }

    const expired = await enforceDeadlineOrExpire(submission);
    let isLate = expired.expired;
    if (expired.expired) {
      return NextResponse.json({
        data: {
          id: submission.id,
          status: "SUBMITTED",
          isLate: true,
          message: "Time limit expired — attempt locked",
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    if (answers && typeof answers === "object") {
      for (const [questionId, response] of Object.entries(answers)) {
        const r = response ?? {};
        const sequenceNumber =
          (await db.assessmentQuestionResponse.count({
            where: { submissionId: id, questionId },
          })) + 1;
        await db.assessmentQuestionResponse.create({
          data: {
            submissionId: id,
            questionId,
            responseText: r.responseText ?? null,
            selectedAnswer: r.selectedAnswer ?? null,
            sequenceNumber,
            idempotencyKey: `${id}-${questionId}-submit-${sequenceNumber}`,
            savedAt: new Date(),
            submittedAt: new Date(),
          },
        });
      
      // RDF sync
      rdfSyncService.insertEntity("AssessmentQuestionResponse", "unknown", "ISCARB", data).catch(() => {});}
    }

    if (submission.assessment.timeLimit) {
      const elapsed =
        (Date.now() - submission.startedAt.getTime()) / (1000 * 60);
      if (elapsed > submission.assessment.timeLimit) {
        isLate = true;
      }
    }

    const totalPoints = submission.assessment.questions.reduce(
      (sum, q) => sum + q.pointsPossible,
      0
    );

    const latestByQuestion = new Map<string, { selectedAnswer?: string | null }>();
    for (const r of submission.responses) {
      latestByQuestion.set(r.questionId, r);
    }
    if (answers) {
      for (const [qid, r] of Object.entries(answers)) {
        latestByQuestion.set(qid, r);
      }
    }

    let earned = 0;
    let scoredObjective = 0;
    for (const q of submission.assessment.questions) {
      if (q.type !== "multiple_choice" || !q.optionsJson) continue;
      scoredObjective++;
      try {
        const options = JSON.parse(q.optionsJson) as Array<{
          id: string;
          isCorrect?: boolean;
        }>;
        const correct = options.find((o) => o.isCorrect);
        const answer = latestByQuestion.get(q.id)?.selectedAnswer;
        if (correct && answer && answer === correct.id) {
          earned += q.pointsPossible;
        }
      } catch {
        /* ignore */
      }
    }

    const hasOnlyObjective =
      scoredObjective > 0 &&
      scoredObjective === submission.assessment.questions.length;
    const percentageScore =
      totalPoints > 0 && hasOnlyObjective ? (earned / totalPoints) * 100 : null;

    const locked = await db.assessmentSubmission.updateMany({
      where: { id, status: "DRAFT" },
      data: {
        status: hasOnlyObjective ? "SCORED" : "SUBMITTED",
        submittedAt: new Date(),
        scoredAt: hasOnlyObjective ? new Date() : undefined,
        totalPoints,
        totalScore: hasOnlyObjective ? earned : undefined,
        percentageScore: percentageScore ?? undefined,
        lastActivityAt: new Date(),
      },
    });

    if (locked.count === 0) {
      return apiError("Assessment already submitted", 409);
    }

    const updated = await db.assessmentSubmission.findUnique({ where: { id } });

    return NextResponse.json({
      data: {
        id: updated?.id,
        status: updated?.status,
        isLate,
        score: updated?.totalScore,
        percentageScore: updated?.percentageScore,
        objectiveScored: hasOnlyObjective,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
);
