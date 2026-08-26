/**
 * Server-side employability report finalize (ISC-QA-001).
 * ===========================================================================
 * Idempotent: scores unanswered keyed-MCQ modules from the attempt, upserts
 * profile, marks attempt completed when all exam questions are answered, and
 * returns the live report snapshot. Re-running is safe (skips already-scored
 * module codes).
 */
import "server-only";
import { db } from "@/lib/db";
import { assembleProfile } from "@/lib/assessment/engine";
import {
  findAttemptQuestion,
  parseAttemptExamSet,
} from "@/lib/assessment/attempt-exam-set";
import { resolveSelectedCanonicalIndex, scoreKeyedMcq } from "@/lib/assessment/keyed-mcq-scoring";
import { liveCurrentResponseWhere } from "@/lib/assessment/live-response-where";
import {
  buildLiveEmployabilityReport,
  toAttemptSnapshotView,
} from "@/lib/assessment/live-employability-report";
import type { EmployabilityAttemptSnapshot } from "@/lib/assessment/attempt-report-store";

export type FinalizeAttemptResult =
  | {
      ok: true;
      completed: boolean;
      scoredCount: number;
      requiredCount: number;
      attempt: EmployabilityAttemptSnapshot;
    }
  | {
      ok: false;
      status: number;
      code: string;
      error: string;
    };

function parseAnswersJson(raw: string | null | undefined): Record<string, string> {
  try {
    const parsed = JSON.parse(raw || "{}") as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function finalizeAttemptReport(opts: {
  attemptId: string;
  studentId: string;
  /** Optional answer freeze from the client submit handoff. */
  answers?: Record<string, string>;
  /** When true, refuse unless every exam question has a non-empty answer. */
  requireComplete?: boolean;
}): Promise<FinalizeAttemptResult> {
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: opts.attemptId },
  });
  if (!attempt || attempt.studentId !== opts.studentId) {
    return { ok: false, status: 404, code: "ATTEMPT_NOT_FOUND", error: "Attempt not found" };
  }

  const student = await db.student.findUnique({
    where: { id: opts.studentId },
    select: { id: true, universityId: true, name: true },
  });
  if (!student) {
    return { ok: false, status: 404, code: "STUDENT_NOT_FOUND", error: "Student not found" };
  }

  // Merge client freeze into durable attempt answers (idempotent overwrite).
  let answers = parseAnswersJson(attempt.answersJson);
  if (opts.answers && typeof opts.answers === "object") {
    for (const [code, value] of Object.entries(opts.answers)) {
      if (typeof value === "string" && value.trim().length > 0) {
        answers[code] = value;
      }
    }
  }

  const set = parseAttemptExamSet(attempt.blueprintJson);
  if (!set || set.status !== "ready") {
    return {
      ok: false,
      status: 409,
      code: "EXAM_NOT_READY",
      error: "Exam questions are not ready",
    };
  }

  const requiredCodes = set.questions.map((q) => q.code);

  // Hydrate from AssessmentResponse rows written by POST /score when answersJson
  // was never updated (live exam path scores durable responses but historically
  // left answersJson as "{}"). Without this, batch-score returns NO_ANSWERS.
  const scoredRows = await db.assessmentResponse.findMany({
    where: {
      ...liveCurrentResponseWhere(opts.studentId),
      moduleCode: { in: requiredCodes },
    },
    select: { moduleCode: true, rawResponse: true },
  });
  let hydratedFromResponses = false;
  for (const row of scoredRows) {
    const raw = String(row.rawResponse ?? "").trim();
    if (!raw) continue;
    if (!String(answers[row.moduleCode] ?? "").trim()) {
      answers[row.moduleCode] = raw;
      hydratedFromResponses = true;
    }
  }

  if ((opts.answers && typeof opts.answers === "object") || hydratedFromResponses) {
    await db.assessmentAttempt.update({
      where: { id: attempt.id },
      data: { answersJson: JSON.stringify(answers) },
    });
  }

  const answeredCodes = requiredCodes.filter(
    (code) => String(answers[code] ?? "").trim().length > 0,
  );

  if (answeredCodes.length === 0) {
    return {
      ok: false,
      status: 409,
      code: "NO_ANSWERS",
      error: "You must answer at least one question to generate a report.",
    };
  }

  const missing = requiredCodes.filter((code) => !answeredCodes.includes(code));
  if (opts.requireComplete && missing.length > 0) {
    return {
      ok: false,
      status: 409,
      code: "ATTEMPT_INCOMPLETE",
      error: `ATTEMPT_INCOMPLETE: scored ${answeredCodes.length}/${requiredCodes.length} modules — finish all questions before submitting.`,
    };
  }

  // Already completed → return live report (idempotent read path).
  if (attempt.status === "completed") {
    const report = await buildLiveEmployabilityReport(opts.studentId, attempt.specialization);
    if ("error" in report) {
      return { ok: false, status: report.status, code: "NO_LIVE_DATA", error: report.error };
    }
    const snapshot = toAttemptSnapshotView(report);
    snapshot.id = attempt.id;
    snapshot.timedOut = missing.length > 0;
    return {
      ok: true,
      completed: true,
      scoredCount: answeredCodes.length,
      requiredCount: requiredCodes.length,
      attempt: snapshot,
    };
  }

  const existing = await db.assessmentResponse.findMany({
    where: liveCurrentResponseWhere(opts.studentId),
    select: { moduleCode: true },
  });
  const alreadyScored = new Set(existing.map((r) => r.moduleCode));
  const toScore = answeredCodes.filter((code) => !alreadyScored.has(code));

  if (toScore.length > 0) {
    const scoredResponses = toScore.map((code) => {
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
            studentId: student.id,
            universityId: student.universityId,
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
    await db.employabilityProfile.upsert({
      where: { studentId: student.id },
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
        studentId: student.id,
        specialization: attempt.specialization,
        composite: profileData.composite,
        band: profileData.band,
        passed: profileData.passed,
        dimensionsJson: JSON.stringify(profileData.dimensions),
        coveredJson: JSON.stringify(profileData.covered),
      },
    });
  }

  const markCompleted = missing.length === 0;
  if (markCompleted) {
    await db.assessmentAttempt.update({
      where: { id: attempt.id },
      data: { status: "completed" },
    });
  }

  const report = await buildLiveEmployabilityReport(opts.studentId, attempt.specialization);
  if ("error" in report) {
    return { ok: false, status: report.status, code: "NO_LIVE_DATA", error: report.error };
  }

  const snapshot = toAttemptSnapshotView(report);
  snapshot.id = attempt.id;
  snapshot.timedOut = missing.length > 0;
  if (student.name) snapshot.studentName = student.name;

  // Durable snapshot for refresh / deep-link without sessionStorage.
  await db.assessmentSnapshot.create({
    data: {
      studentId: student.id,
      dataJson: JSON.stringify({
        attemptId: attempt.id,
        kind: "employability-finalize",
        attempt: snapshot,
        completed: markCompleted,
        createdAt: new Date().toISOString(),
      }),
    },
  });

  return {
    ok: true,
    completed: markCompleted,
    scoredCount: answeredCodes.length,
    requiredCount: requiredCodes.length,
    attempt: snapshot,
  };
}
