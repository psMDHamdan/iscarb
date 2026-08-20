import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import { sanitizeMcqPayloadForClient } from "@/lib/assessment/public-question-payload";
import { findAttemptQuestion, isAttemptExamSetReady, parseAttemptExamSet } from "@/lib/assessment/attempt-exam-set";

/**
 * POST /api/iscarb/assessment/generate-scenario
 * Serves the pre-validated attempt question. Never generates mid-exam.
 */
export const POST = guard({ tier: "read", roles: ["student"] }, async (req, ctx) => {
  const body = await parseJSON(req);
  if (!body) return jsonErrorResponse("Invalid request body");

  const { moduleCode, attemptId } = body as { moduleCode: string; attemptId: string };
  if (!moduleCode || !attemptId) {
    return jsonErrorResponse("moduleCode and attemptId are required", 400);
  }

  const attempt = await db.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return jsonErrorResponse("Attempt not found", 404);

  if (ctx.session.role === "student") {
    const sid = ctx.session.studentId;
    if (!sid || attempt.studentId !== sid) {
      return jsonErrorResponse("Forbidden — you may only access your own assessment data", 403);
    }
  }

  const set = parseAttemptExamSet(attempt.blueprintJson);
  if (!isAttemptExamSetReady(set)) {
    return NextResponse.json(
      { preparing: true, error: "Exam questions are still being prepared" },
      { status: 202 },
    );
  }

  const question = findAttemptQuestion(set, moduleCode);
  if (!question) return jsonErrorResponse("Module not found", 404);

  return NextResponse.json(
    sanitizeMcqPayloadForClient(
      {
        scenario: question.scenario,
        instructions: question.instructions,
        questionType: "mcq" as const,
        choices: question.choices,
        contentSource: question.contentSource,
      },
      { studentId: attempt.studentId, code: moduleCode, attemptId: attempt.id },
    ),
  );
});
