/**
 * Review Queue Consumer
 * ===========================================================================
 * Handles assessment.scored events to flag low-confidence submissions
 * for human review.
 * ===========================================================================
 */
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { PlatformEvent } from "@/lib/event-bus";

const REVIEW_CONFIDENCE_THRESHOLD = 0.7;

export async function handleAssessmentScored(event: PlatformEvent): Promise<void> {
  const { submissionId, confidence, needsReview } = event as any;

  if (!needsReview && confidence >= REVIEW_CONFIDENCE_THRESHOLD) {
    logger.debug({ submissionId, confidence }, "review queue: high confidence, skipping");
    return;
  }

  logger.info({ submissionId, confidence }, "review queue: flagging for human review");

  // Create review queue entry
  await db.$executeRaw`
    INSERT INTO "ReviewQueue" (id, "submissionId", confidence, status, "createdAt")
    VALUES (gen_random_uuid()::text, ${submissionId}, ${confidence}, 'pending', NOW())
    ON CONFLICT ("submissionId") DO NOTHING
  `;
}
