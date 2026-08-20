/**
 * Phase 5 — Signup-time Job-Fit bank coverage helpers (DB).
 * NEVER called from the exam path.
 */
import "server-only";

import {
  expectedGenericJobFitCodes,
  specialtyNeedsSignupJobFitGeneration,
} from "@/lib/assessment/jobfit-signup-coverage-pure";
import {
  BankQuestionStatus,
  listBankQuestions,
} from "@/lib/assessment/question-bank-repository";

export {
  expectedGenericJobFitCodes,
  specialtyNeedsSignupJobFitGeneration,
} from "@/lib/assessment/jobfit-signup-coverage-pure";

/**
 * Count published Job-Fit bank rows for this specialty (exact specialization match).
 */
export async function countPublishedJobFitForSpecialty(
  specialization: string,
): Promise<number> {
  const codes = expectedGenericJobFitCodes(specialization);
  const rows = await listBankQuestions({
    status: BankQuestionStatus.published,
    specialization: specialization.trim(),
    dimension: "job_fit",
    take: 50,
  });
  const codeSet = new Set(codes);
  const matched = rows.filter((r) => codeSet.has(r.moduleCode));
  return new Set(matched.map((r) => r.moduleCode)).size;
}

/** Idempotency: specialty already has a full published Job-Fit trio in the bank. */
export async function hasPublishedJobFitCoverage(
  specialization: string,
): Promise<boolean> {
  if (!specialtyNeedsSignupJobFitGeneration(specialization)) return true;
  const count = await countPublishedJobFitForSpecialty(specialization);
  return count >= 3;
}
