/**
 * Certificate issuance gate (ISC-QA-002).
 * ===========================================================================
 * A certificate may only be minted when:
 *   1. The student owns a AssessmentAttempt with status "completed"
 *   2. Live scored responses cover the full 47-module catalog for that attempt
 *
 * Incomplete / in-progress attempts must never produce a credential PNG.
 */
import "server-only";
import { db } from "@/lib/db";
import { EXAM_QUESTION_COUNT } from "@/lib/assessment/attempt-exam-set";
import {
  canonicalSpecializationLabel,
  resolveAssessmentModuleSet,
} from "@/lib/assessment/catalog";
import { liveCurrentResponseWhere } from "@/lib/assessment/live-response-where";

export type CertificateEligibilityOk = {
  ok: true;
  attemptId: string;
  scoredCount: number;
  requiredCount: number;
  specialization: string;
};

export type CertificateEligibilityFail = {
  ok: false;
  status: number;
  code: "ATTEMPT_INCOMPLETE" | "ATTEMPT_NOT_FOUND" | "STUDENT_NOT_FOUND";
  error: string;
  scoredCount?: number;
  requiredCount?: number;
};

export type CertificateEligibility = CertificateEligibilityOk | CertificateEligibilityFail;

/**
 * Assert the student (optionally a specific attempt) is eligible for a certificate.
 */
export async function assertCertificateEligibility(
  studentId: string,
  attemptId?: string,
): Promise<CertificateEligibility> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  });
  if (!student) {
    return { ok: false, status: 404, code: "STUDENT_NOT_FOUND", error: "Student not found" };
  }

  const attempt = attemptId
    ? await db.assessmentAttempt.findFirst({
        where: { id: attemptId, studentId },
        select: { id: true, status: true, specialization: true },
      })
    : await db.assessmentAttempt.findFirst({
        where: { studentId, status: "completed" },
        orderBy: { updatedAt: "desc" },
        select: { id: true, status: true, specialization: true },
      });

  if (!attempt) {
    return {
      ok: false,
      status: 409,
      code: "ATTEMPT_NOT_FOUND",
      error: "No completed assessment attempt found for this student.",
    };
  }

  if (attempt.status !== "completed") {
    return {
      ok: false,
      status: 409,
      code: "ATTEMPT_INCOMPLETE",
      error: "Certificate requires a completed assessment attempt (all modules scored).",
    };
  }

  const specialization =
    canonicalSpecializationLabel(attempt.specialization) || attempt.specialization;
  const catalogCodes = new Set(
    resolveAssessmentModuleSet(specialization || "General Studies").modules.map((m) => m.code),
  );
  const requiredCount = Math.max(EXAM_QUESTION_COUNT, catalogCodes.size);

  const responses = await db.assessmentResponse.findMany({
    where: liveCurrentResponseWhere(studentId),
    select: { moduleCode: true },
    orderBy: [{ moduleCode: "asc" }, { createdAt: "desc" }],
  });

  const scoredCodes = new Set<string>();
  for (const r of responses) {
    if (catalogCodes.has(r.moduleCode)) scoredCodes.add(r.moduleCode);
  }
  const scoredCount = scoredCodes.size;

  if (scoredCount < requiredCount) {
    return {
      ok: false,
      status: 409,
      code: "ATTEMPT_INCOMPLETE",
      error: `Certificate requires ${requiredCount}/${requiredCount} scored modules; found ${scoredCount}.`,
      scoredCount,
      requiredCount,
    };
  }

  return {
    ok: true,
    attemptId: attempt.id,
    scoredCount,
    requiredCount,
    specialization,
  };
}
