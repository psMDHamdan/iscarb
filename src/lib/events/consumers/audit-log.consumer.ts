/**
 * Audit Log Consumer
 * ===========================================================================
 * Handles all events for audit trail logging (PDPL compliance).
 * ===========================================================================
 */
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { PlatformEvent } from "@/lib/event-bus";

export async function handleAllEvents(event: PlatformEvent): Promise<void> {
  const { type, idempotencyKey, timestamp, ...payload } = event;

  logger.debug({ type, idempotencyKey }, "audit log: recording event");

  await db.auditLog.create({
    data: {
      action: type,
      entityType: type.split(".")[0],
      entityId: (payload as any).assessmentId || (payload as any).userId || (payload as any).submissionId || null,
      afterJson: JSON.stringify(payload),
      category: "data_modification",
      severity: "info",
      details: JSON.stringify({ idempotencyKey, timestamp }),
    },
  });
}
