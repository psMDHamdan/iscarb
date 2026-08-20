/**
 * Exam Background Jobs — local execution queue helper.
 * ===========================================================================
 * Hardcoded to run in-process for local development and non-serverless deployments.
 */
import { generateAllForAttempt } from "./attempt-exam-generator";
import { resolveAssessmentModuleSet } from "./catalog";

/** Modules per generation job (maintained for structural compatibility if needed) */
export const EXAM_GENERATE_CHUNK_SIZE = Math.max(
  1,
  Number.parseInt(process.env.EXAM_GENERATE_CHUNK_SIZE || "8", 10) || 8,
);

export async function enqueueExamGeneration(attemptId: string): Promise<number> {
  const attempt = await (await import("@/lib/db")).db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: { specialization: true },
  });
  if (!attempt) return 0;

  const skeleton = resolveAssessmentModuleSet(attempt.specialization);
  const moduleCodes = skeleton.modules.map((m) => m.code);
  if (moduleCodes.length === 0) return 0;

  // Run in-process
  void generateAllForAttempt(attemptId);
  return moduleCodes.length;
}
