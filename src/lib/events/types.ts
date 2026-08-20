/**
 * iSCARB Event Types — Masterplan Section 6.3.1
 * ===========================================================================
 * Typed event definitions for all 8 core platform events.
 * Each event has a defined producer, consumers, and idempotency key format.
 * ===========================================================================
 */

// ─── Base Event ────────────────────────────────────────────────────────────

export interface BaseEvent {
  idempotencyKey: string;
  timestamp: string;
  universityId?: string;
}

// ─── Assessment Events ─────────────────────────────────────────────────────

export interface AssessmentCompletedEvent extends BaseEvent {
  type: "assessment.completed";
  assessmentId: string;
  studentId: string;
  submissionId: string;
  score: number;
  scoredBy: "ai" | "heuristic";
  confidence: number;
}

export interface AssessmentScoreAdjustedEvent extends BaseEvent {
  type: "assessment.score_adjusted";
  assessmentId: string;
  calibrationSessionId: string;
  adjustmentTimestamp: string;
  studentId: string;
  oldScore: number;
  newScore: number;
}

export interface AssessmentScoredEvent extends BaseEvent {
  type: "assessment.scored";
  submissionId: string;
  scoreTimestamp: string;
  aiProvider: string;
  confidence: number;
  needsReview: boolean;
}

export interface AssessmentReviewedEvent extends BaseEvent {
  type: "assessment.reviewed";
  reviewId: string;
  submissionId: string;
  reviewerId: string;
  reviewTimestamp: string;
  scoreChanged: boolean;
  newScore?: number;
}

// ─── User Events ───────────────────────────────────────────────────────────

export interface UserCreatedEvent extends BaseEvent {
  type: "user.created";
  userId: string;
  email: string;
  role: string;
  universityId: string;
}

export interface RoleChangedEvent extends BaseEvent {
  type: "role.changed";
  userId: string;
  roleId: string;
  changeTimestamp: string;
  oldRole: string;
  newRole: string;
}

// ─── Portfolio Events ──────────────────────────────────────────────────────

export interface PortfolioImportedEvent extends BaseEvent {
  type: "portfolio.imported";
  assessmentId: string;
  studentId: string;
  portfolioId: string;
}

// ─── Report Events ─────────────────────────────────────────────────────────

export interface ReportRequestedEvent extends BaseEvent {
  type: "report.requested";
  reportId: string;
  requestTimestamp: string;
  requestedBy: string;
}

// ─── Union Type ────────────────────────────────────────────────────────────

export type PlatformEventPayload =
  | AssessmentCompletedEvent
  | AssessmentScoreAdjustedEvent
  | AssessmentScoredEvent
  | AssessmentReviewedEvent
  | UserCreatedEvent
  | RoleChangedEvent
  | PortfolioImportedEvent
  | ReportRequestedEvent;

// ─── Event Type Constants ──────────────────────────────────────────────────

export const EVENT_TYPES = {
  ASSESSMENT_COMPLETED: "assessment.completed",
  ASSESSMENT_SCORE_ADJUSTED: "assessment.score_adjusted",
  ASSESSMENT_SCORED: "assessment.scored",
  ASSESSMENT_REVIEWED: "assessment.reviewed",
  USER_CREATED: "user.created",
  ROLE_CHANGED: "role.changed",
  PORTFOLIO_IMPORTED: "portfolio.imported",
  REPORT_REQUESTED: "report.requested",
} as const;

// ─── Consumer Groups ───────────────────────────────────────────────────────

export const CONSUMER_GROUPS = {
  PORTFOLIO: "portfolio-consumer",
  CAREER: "career-consumer",
  NOTIFICATION: "notification-consumer",
  ANALYTICS: "analytics-consumer",
  AUTH_CACHE: "auth-cache-consumer",
  AUDIT_LOG: "audit-log-consumer",
  REVIEW_QUEUE: "review-queue-consumer",
  REPORTING: "reporting-consumer",
} as const;
