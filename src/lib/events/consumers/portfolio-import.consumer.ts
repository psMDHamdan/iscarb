/**
 * Portfolio Import Consumer
 * ===========================================================================
 * Handles assessment.completed and assessment.score_adjusted events
 * to import/update student competency profiles in the Portfolio.
 * ===========================================================================
 */
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { PlatformEvent } from "@/lib/event-bus";

export async function handleAssessmentCompleted(event: PlatformEvent): Promise<void> {
  const { assessmentId, studentId, score, scoredBy, confidence } = event as any;

  logger.info({ assessmentId, studentId }, "portfolio import: processing assessment completion");

  // Upsert competency profile in portfolio
  await db.portfolio.upsert({
    where: { studentId },
    create: {
      studentId,
      competencyJson: JSON.stringify({ [assessmentId]: { score, scoredBy, confidence } }),
      lastUpdated: new Date(),
    },
    update: {
      competencyJson: JSON.stringify({ [assessmentId]: { score, scoredBy, confidence } }),
      lastUpdated: new Date(),
    },
  });

  logger.info({ assessmentId, studentId }, "portfolio import: completed");
}

export async function handleScoreAdjusted(event: PlatformEvent): Promise<void> {
  const { assessmentId, studentId, newScore } = event as any;

  logger.info({ assessmentId, studentId }, "portfolio import: processing score adjustment");

  // Update portfolio with adjusted score
  const portfolio = await db.portfolio.findUnique({ where: { studentId } });
  if (portfolio) {
    const competencies = JSON.parse(portfolio.competencyJson || "{}");
    competencies[assessmentId] = { ...competencies[assessmentId], score: newScore };
    await db.portfolio.update({
      where: { studentId },
      data: { competencyJson: JSON.stringify(competencies) },
    });
  }

  logger.info({ assessmentId, studentId, newScore }, "portfolio import: score adjusted");
}
