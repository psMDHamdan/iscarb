/**
 * Analytics Consumer
 * ===========================================================================
 * Handles events for analytics aggregation and reporting.
 * ===========================================================================
 */
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { PlatformEvent } from "@/lib/event-bus";

export async function handleAssessmentCompleted(event: PlatformEvent): Promise<void> {
  const { universityId, assessmentId, score, scoredBy } = event as any;

  logger.info({ universityId, assessmentId }, "analytics: recording assessment completion");

  // Record analytics event for dashboard aggregation
  await db.$executeRaw`
    INSERT INTO "AnalyticsEvent" (id, "eventType", "entityType", "entityId", metadata, "createdAt")
    VALUES (gen_random_uuid()::text, 'assessment.completed', 'assessment', ${assessmentId}, ${JSON.stringify({ score, scoredBy, universityId })}::jsonb, NOW())
  `;
}

export async function handleUserCreated(event: PlatformEvent): Promise<void> {
  const { universityId, userId, role } = event as any;

  logger.info({ universityId, userId }, "analytics: recording user creation");

  await db.$executeRaw`
    INSERT INTO "AnalyticsEvent" (id, "eventType", "entityType", "entityId", metadata, "createdAt")
    VALUES (gen_random_uuid()::text, 'user.created', 'user', ${userId}, ${JSON.stringify({ role, universityId })}::jsonb, NOW())
  `;
}
