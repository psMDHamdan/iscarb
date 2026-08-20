/**
 * Career Match Consumer
 * ===========================================================================
 * Handles assessment.completed and portfolio.imported events
 * to update student profiles for job matching.
 * ===========================================================================
 */
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { PlatformEvent } from "@/lib/event-bus";

export async function handleAssessmentCompleted(event: PlatformEvent): Promise<void> {
  const { studentId, score } = event as any;

  logger.info({ studentId }, "career match: processing assessment completion");

  // Update student's employability profile for matching
  const profile = await db.employabilityProfile.findUnique({ where: { studentId } });
  if (profile) {
    await db.employabilityProfile.update({
      where: { studentId },
      data: { computedAt: new Date() },
    });
  }

  logger.info({ studentId }, "career match: profile updated");
}

export async function handlePortfolioImported(event: PlatformEvent): Promise<void> {
  const { studentId } = event as any;

  logger.info({ studentId }, "career match: processing portfolio import");

  // Invalidate cached job matches to trigger recomputation
  await db.jobMatch.deleteMany({ where: { studentId } });

  logger.info({ studentId }, "career match: cache invalidated");
}
