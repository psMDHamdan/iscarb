import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { resolveStudentIdFromSession } from "@/lib/assessment/resolve-student";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";

export const POST = guard({ tier: "read", roles: ["student"] }, async (req, ctx) => {
  const body = await parseJSON(req);
  if (!body) return jsonErrorResponse("Invalid request body");

  const { attemptId, moduleCode, answer } = body as { attemptId: string; moduleCode: string; answer: string };
  if (!attemptId || !moduleCode) return jsonErrorResponse("attemptId and moduleCode required", 400);

  const resolved = await resolveStudentIdFromSession(ctx.session);
  if (!resolved.ok) return NextResponse.json({ error: resolved.message }, { status: resolved.status });

  // Get active attempt
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt || attempt.studentId !== resolved.studentId || attempt.status !== "in_progress") {
    return jsonErrorResponse("Active attempt not found", 404);
  }

  const answers = JSON.parse(attempt.answersJson);
  answers[moduleCode] = answer;

  await db.assessmentAttempt.update({
    where: { id: attemptId },
    data: { answersJson: JSON.stringify(answers) }
  });

  return NextResponse.json({ success: true });
});
