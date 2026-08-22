import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { resolveStudentIdFromSession } from "@/lib/assessment/resolve-student";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import { ensureAttemptExamGeneration } from "@/lib/assessment/attempt-exam-generator";
import {
  isAttemptExamSetReady,
  parseAttemptExamSet,
  publicModulesFromAttemptSet,
} from "@/lib/assessment/attempt-exam-set";

export const POST = guard({ tier: "write", roles: ["student"] }, async (req, ctx) => {
  const body = await parseJSON(req);
  if (!body) return jsonErrorResponse("Invalid request body");

  const bodyObj = body as Record<string, unknown>;
  let specialization = (bodyObj.specialization as string | undefined)?.trim();
  const backgroundType = (bodyObj.backgroundType as string | undefined)?.trim() || "unspecified";
  const customQuestionContext = (bodyObj.customQuestionContext as string | undefined)?.trim() || null;
  const selectedDomain = (bodyObj.selectedDomain as string | undefined)?.trim() || null;

  const resolved = await resolveStudentIdFromSession(ctx.session);
  if (!resolved.ok) return NextResponse.json({ error: resolved.message }, { status: resolved.status });

  // Fetch stored specialization from DB if not provided by frontend to ensure SINGLE SOURCE OF TRUTH
  if (!specialization) {
    const studentRecord = await db.student.findUnique({
      where: { id: resolved.studentId },
      select: { program: true },
    });
    if (studentRecord?.program) {
      specialization = studentRecord.program;
    }
  }

  if (!specialization) {
    return jsonErrorResponse("Specialization is required to generate an assessment.", 400);
  } else {
    // Save specialization permanently to Student profile
    try {
      await db.student.update({
        where: { id: resolved.studentId },
        data: { program: specialization },
      });
    } catch {
      // Ignore update error if schema constraints differ
    }
  }

  const { attemptId, set } = await ensureAttemptExamGeneration({
    studentId: resolved.studentId,
    specialization,
    context: {
      userId: resolved.studentId,
      backgroundType,
      customQuestionContext,
      selectedDomain
    }
  });

  return NextResponse.json({
    attemptId,
    preparing: !isAttemptExamSetReady(set),
    progress: set?.progress ?? { done: 0, total: 47 },
  });
});

export const GET = guard({ tier: "read", roles: ["student"] }, async (req, ctx) => {
  const resolved = await resolveStudentIdFromSession(ctx.session);
  if (!resolved.ok) return NextResponse.json({ error: resolved.message }, { status: resolved.status });

  const attempt = await db.assessmentAttempt.findFirst({
    where: { studentId: resolved.studentId, status: "in_progress" },
    orderBy: { createdAt: "desc" },
  });

  if (!attempt) return NextResponse.json({ attempt: null });

  let answers: unknown = {};
  try {
    answers = JSON.parse(attempt.answersJson);
  } catch {
    answers = {};
  }

  const set = parseAttemptExamSet(attempt.blueprintJson);
  const ready = isAttemptExamSetReady(set);

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      specialization: attempt.specialization,
      preparing: !ready,
      progress: set?.progress ?? { done: 0, total: 47 },
      modules: ready
        ? publicModulesFromAttemptSet(set!, {
            studentId: attempt.studentId,
            attemptId: attempt.id,
          })
        : [],
      answers,
    },
  });
});
