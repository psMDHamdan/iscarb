/**
 * iSCARB Event Publisher — typed event publishing
 * ===========================================================================
 * Provides type-safe event publishing with automatic idempotency key generation.
 * Wraps the event-bus publishEvent with typed overloads.
 * ===========================================================================
 */
import { publishEvent as busPublish } from "@/lib/event-bus";
import type {
  PlatformEventPayload,
  AssessmentCompletedEvent,
  AssessmentScoreAdjustedEvent,
  AssessmentScoredEvent,
  AssessmentReviewedEvent,
  UserCreatedEvent,
  RoleChangedEvent,
  PortfolioImportedEvent,
  ReportRequestedEvent,
} from "./types";

function generateIdempotencyKey(type: string, ...parts: string[]): string {
  return `${type}:${parts.join(":")}:${Date.now()}`;
}

export async function publishAssessmentCompleted(
  data: Omit<AssessmentCompletedEvent, "type" | "idempotencyKey" | "timestamp">
): Promise<void> {
  await busPublish({
    type: "assessment.completed",
    idempotencyKey: generateIdempotencyKey("assessment.completed", data.assessmentId, data.studentId),
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export async function publishAssessmentScoreAdjusted(
  data: Omit<AssessmentScoreAdjustedEvent, "type" | "idempotencyKey" | "timestamp">
): Promise<void> {
  await busPublish({
    type: "assessment.score_adjusted",
    idempotencyKey: generateIdempotencyKey("assessment.score_adjusted", data.assessmentId, data.calibrationSessionId),
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export async function publishAssessmentScored(
  data: Omit<AssessmentScoredEvent, "type" | "idempotencyKey" | "timestamp">
): Promise<void> {
  await busPublish({
    type: "assessment.scored",
    idempotencyKey: generateIdempotencyKey("assessment.scored", data.submissionId),
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export async function publishAssessmentReviewed(
  data: Omit<AssessmentReviewedEvent, "type" | "idempotencyKey" | "timestamp">
): Promise<void> {
  await busPublish({
    type: "assessment.reviewed",
    idempotencyKey: generateIdempotencyKey("assessment.reviewed", data.reviewId, data.submissionId),
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export async function publishUserCreated(
  data: Omit<UserCreatedEvent, "type" | "idempotencyKey" | "timestamp">
): Promise<void> {
  await busPublish({
    type: "user.created",
    idempotencyKey: generateIdempotencyKey("user.created", data.userId),
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export async function publishRoleChanged(
  data: Omit<RoleChangedEvent, "type" | "idempotencyKey" | "timestamp">
): Promise<void> {
  await busPublish({
    type: "role.changed",
    idempotencyKey: generateIdempotencyKey("role.changed", data.userId, data.roleId),
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export async function publishPortfolioImported(
  data: Omit<PortfolioImportedEvent, "type" | "idempotencyKey" | "timestamp">
): Promise<void> {
  await busPublish({
    type: "portfolio.imported",
    idempotencyKey: generateIdempotencyKey("portfolio.imported", data.assessmentId, data.studentId),
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export async function publishReportRequested(
  data: Omit<ReportRequestedEvent, "type" | "idempotencyKey" | "timestamp">
): Promise<void> {
  await busPublish({
    type: "report.requested",
    idempotencyKey: generateIdempotencyKey("report.requested", data.reportId),
    timestamp: new Date().toISOString(),
    ...data,
  });
}
