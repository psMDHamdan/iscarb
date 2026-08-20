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

  const { specialization } = body as { specialization: string };
  if (!specialization) return jsonErrorResponse("specialization required", 400);

  const resolved = await resolveStudentIdFromSession(ctx.session);
  if (!resolved.ok) return NextResponse.json({ error: resolved.message }, { status: resolved.status });

  const { attemptId, set } = await ensureAttemptExamGeneration({
    studentId: resolved.studentId,
    specialization,
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
