import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, tenantWhere, type GuardContext } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { rdfSyncService } from "@/services/rdf/rdf-sync.service";
import {
  enforceDeadlineOrExpire,
  resolveActingStudent,
} from "@/lib/assessment/attempt-auth";

/**
 * POST /api/iscarb/assessment/submissions
 * Body: { assessmentId: string, studentId?: string }
 *
 * Create or resume a DRAFT AssessmentSubmission (Assessment OS schema).
 */
export const POST = guard(
  { tier: "write", roles: ["student", "faculty", "admin"] },
  async (req, ctx: GuardContext) => {
    const body = await parseJSON(req);
    if (!body) return jsonErrorResponse("Invalid request body");
    const { assessmentId } = body as { assessmentId?: string; studentId?: string };

    if (!assessmentId) {
      return apiError("assessmentId is required", 400);
    }

    const acting = await resolveActingStudent(ctx, body.studentId);
    if (!acting.ok) return apiError(acting.message, acting.status);

    const assessment = await db.assessment.findFirst({
      where: { id: assessmentId, status: "published", ...tenantWhere(ctx) },
    });

    if (!assessment) {
      return apiError("Assessment not found or not published", 404);
    }

    const existingDraft = await db.assessmentSubmission.findFirst({
      where: {
        assessmentId,
        studentId: acting.student.id,
        status: "DRAFT",
      },
      orderBy: { startedAt: "desc" },
      include: { responses: true, assessment: { select: { timeLimit: true } } },
    });

    if (existingDraft) {
      const expired = await enforceDeadlineOrExpire(existingDraft);
      if (expired.expired) {
        return apiError("Assessment time limit expired", 409);
      }
      const answers: Record<string, unknown> = {};
      for (const r of existingDraft.responses) {
        answers[r.questionId] = {
          responseText: r.responseText,
          selectedAnswer: r.selectedAnswer,
        };
      }
      return NextResponse.json({
        data: {
          id: existingDraft.id,
          status: existingDraft.status,
          submissionToken: existingDraft.submissionToken,
          answers,
          lastSaved: existingDraft.lastActivityAt,
          timeLimitMinutes: assessment.timeLimit,
          startedAt: existingDraft.startedAt,
          isResume: true,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const priorTerminal = await db.assessmentSubmission.findFirst({
      where: {
        assessmentId,
        studentId: acting.student.id,
        status: { in: ["SUBMITTED", "SCORED", "REVIEWED", "FINAL"] },
      },
    });
    if (priorTerminal) {
      return apiError("Assessment already submitted", 409);
    }

    const universityId =
      acting.student.universityId ||
      ctx.session.universityId ||
      assessment.universityId;
    if (!universityId) {
      return apiError("University context required", 400);
    }

    const attemptNumber =
      (await db.assessmentSubmission.count({
        where: { assessmentId, studentId: acting.student.id },
      })) + 1;

    const submission = await db.assessmentSubmission.create({
      data: {
        assessmentId,
        studentId: acting.student.id,
        universityId,
        submissionToken: randomBytes(32).toString("hex"),
        attemptNumber,
        status: "DRAFT",
        startedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    
      
      // RDF sync
      rdfSyncService.insertEntity("AssessmentSubmission", "unknown", ctx.session.universityCode || "ISCARB", data).catch(() => {});// RDF sync
      rdfSyncService.insertEntity("AssessmentSubmission", submission.id, ctx.session.universityCode || "ISCARB", submission).catch(() => {});return NextResponse.json(
      {
        data: {
          id: submission.id,
          status: submission.status,
          submissionToken: submission.submissionToken,
          answers: {},
          lastSaved: submission.lastActivityAt,
          timeLimitMinutes: assessment.timeLimit,
          startedAt: submission.startedAt,
          isResume: false,
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  }
);
