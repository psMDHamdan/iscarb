import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { resolveStudentIdFromSession } from "@/lib/assessment/resolve-student";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import { finalizeAttemptReport } from "@/lib/assessment/finalize-attempt-report";
import { computeOverallPercentile } from "@/lib/assessment/percentile";

/**
 * POST /api/iscarb/assessment/batch-score
 *
 * Full-exam submit: requires every question answered, then finalizes server-side
 * (ISC-QA-001 / ISC-QA-002).
 */
export const POST = guard({ tier: "write", roles: ["student"] }, async (req, ctx) => {
  const body = await parseJSON(req);
  if (!body) return jsonErrorResponse("Invalid request body");

  const { attemptId } = body as { attemptId: string };
  if (!attemptId) return jsonErrorResponse("attemptId required", 400);

  const resolved = await resolveStudentIdFromSession(ctx.session);
  if (!resolved.ok) return NextResponse.json({ error: resolved.message }, { status: resolved.status });

  const result = await finalizeAttemptReport({
    attemptId,
    studentId: resolved.studentId,
    requireComplete: true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  const overallPercentile = await computeOverallPercentile(
    result.attempt.profile.composite,
    resolved.studentId,
  );

  return NextResponse.json({
    success: true,
    profile: { ...result.attempt.profile, percentile: overallPercentile },
    attempt: result.attempt,
    completed: result.completed,
  });
});
