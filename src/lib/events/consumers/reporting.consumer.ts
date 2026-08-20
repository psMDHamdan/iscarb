/**
 * Reporting Consumer
 * ===========================================================================
 * Handles report.requested events to trigger background report generation.
 * ===========================================================================
 */
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { PlatformEvent } from "@/lib/event-bus";

export async function handleReportRequested(event: PlatformEvent): Promise<void> {
  const { reportId, requestedBy } = event as any;

  logger.info({ reportId, requestedBy }, "reporting: processing report request");

  // Update report status to generating
  await db.report.update({
    where: { id: reportId },
    data: { status: "generating" },
  });

  // Create execution record
  await db.reportExecution.create({
    data: {
      reportId,
      executedBy: requestedBy,
      status: "running",
    },
  });

  logger.info({ reportId }, "reporting: report generation started");
}
