import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, tenantWhere } from "@/lib/api-guard";
import { resolveStudentIdFromSession } from "@/lib/assessment/resolve-student";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import { assembleProfile } from "@/lib/assessment/engine";
import { computeOverallPercentile } from "@/lib/assessment/percentile";
import { findAttemptQuestion, parseAttemptExamSet } from "@/lib/assessment/attempt-exam-set";
import { resolveSelectedCanonicalIndex, scoreKeyedMcq } from "@/lib/assessment/keyed-mcq-scoring";

export const POST = guard({ tier: "write", roles: ["student"] }, async (req, ctx) => {
  const body = await parseJSON(req);
  if (!body) return jsonErrorResponse("Invalid request body");

  const { attemptId } = body as { attemptId: string };
  if (!attemptId) return jsonErrorResponse("attemptId required", 400);

  const resolved = await resolveStudentIdFromSession(ctx.session);
  if (!resolved.ok) return NextResponse.json({ error: resolved.message }, { status: resolved.status });

  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt || attempt.studentId !== resolved.studentId || attempt.status !== "in_progress") {
    return jsonErrorResponse("Active attempt not found", 404);
  }

  const student = await db.student.findUnique({
    where: { id: resolved.studentId, ...tenantWhere(ctx) }
  });
  if (!student) {
    const unscoped = await db.student.findUnique({ where: { id: resolved.studentId } });
    if (!unscoped) return jsonErrorResponse("Student not found", 404);
  }
  const studentRow = student ?? (await db.student.findUnique({ where: { id: resolved.studentId } }))!;

  const set = parseAttemptExamSet(attempt.blueprintJson);
  if (!set || set.status !== "ready") {
    return jsonErrorResponse("Exam questions are not ready", 409);
  }

  let answers: Record<string, string> = {};
  try {
    answers = JSON.parse(attempt.answersJson) as Record<string, string>;
  } catch {
    answers = {};
  }

  const answeredCodes = Object.entries(answers)
    .filter(([, v]) => String(v ?? "").trim().length > 0)
    .map(([code]) => code);

  if (answeredCodes.length === 0) {
    return jsonErrorResponse("No live assessment data", 404);
  }

  const scoredResponses = answeredCodes.map((code) => {
    const question = findAttemptQuestion(set, code);
    if (!question) throw new Error(`Missing validated question ${code}`);
    const selectedCanonical = resolveSelectedCanonicalIndex({
      question,
      responseText: answers[code],
      studentId: attempt.studentId,
      attemptId: attempt.id,
    });
    return scoreKeyedMcq({ question, selectedCanonicalIndex: selectedCanonical });
  });

  await db.$transaction(
    scoredResponses.map((s) =>
      db.assessmentResponse.create({
        data: {
          studentId: studentRow.id,
          universityId: studentRow.universityId,
          moduleCode: s.moduleCode,
          dimension: s.dimension,
          specialization: attempt.specialization,
          score: s.score,
          band: s.band,
          passed: s.passed,
          perCriterionJson: JSON.stringify(s.perCriterion),
          feedback: s.feedback,
          strengthsJson: JSON.stringify(s.strengths),
          improvementsJson: JSON.stringify(s.improvements),
          validationPassed: s.validationPassed,
          model: s.model,
          source: s.source,
          rawResponse: answers[s.moduleCode],
          latencyMs: s.latencyMs,
          tokensInput: 0,
          tokensOutput: 0,
        },
      }),
    ),
  );

  const profileData = assembleProfile(scoredResponses, attempt.specialization);

  // Overall cohort percentile for the post-submit result screen (null below the
  // minimum live-sample threshold — the UI hides the line then).
  const overallPercentile = await computeOverallPercentile(
    profileData.composite,
    studentRow.id,
  );

  await db.employabilityProfile.upsert({
    where: { studentId: studentRow.id },
    update: {
      specialization: attempt.specialization,
      composite: profileData.composite,
      band: profileData.band,
      passed: profileData.passed,
      dimensionsJson: JSON.stringify(profileData.dimensions),
      coveredJson: JSON.stringify(profileData.covered),
      computedAt: new Date(),
    },
    create: {
      studentId: studentRow.id,
      specialization: attempt.specialization,
      composite: profileData.composite,
      band: profileData.band,
      passed: profileData.passed,
      dimensionsJson: JSON.stringify(profileData.dimensions),
      coveredJson: JSON.stringify(profileData.covered),
    },
  });

  await db.assessmentAttempt.update({
    where: { id: attempt.id },
    data: { status: "completed" },
  });

  return NextResponse.json({
    success: true,
    profile: { ...profileData, percentile: overallPercentile },
  });
});
