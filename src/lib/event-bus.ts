/**
 * iSCARB Event Bus — Redis Streams implementation
 * ===========================================================================
 * Masterplan Section 6.3: Event-driven cross-app integration.
 * Uses Redis Streams for persistent, idempotent event delivery.
 *
 * Events are published with idempotency keys. Consumers use consumer groups
 * for at-least-once delivery with automatic deduplication.
 * ===========================================================================
 */
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

export interface PlatformEvent {
  type: string;
  idempotencyKey?: string;
  [key: string]: unknown;
}

type Handler = (event: PlatformEvent) => void | Promise<void>;

// ─── Event Types (Masterplan Section 6.3.1) ────────────────────────────────

export const EVENT_TYPES = {
  ASSESSMENT_COMPLETED: "assessment.completed",
  ASSESSMENT_SCORE_ADJUSTED: "assessment.score_adjusted",
  ASSESSMENT_SCORED: "assessment.scored",
  ASSESSMENT_REVIEWED: "assessment.reviewed",
  USER_CREATED: "user.created",
  ROLE_CHANGED: "role.changed",
  PORTFOLIO_IMPORTED: "portfolio.imported",
  REPORT_REQUESTED: "report.requested",

  // IDD-03: Organization events
  ORGANIZATION_CREATED: "organization.created",
  ORGANIZATION_UPDATED: "organization.updated",
  ORGANIZATION_ARCHIVED: "organization.archived",
  ORGANIZATION_SETTINGS_CHANGED: "organization.settings_changed",
  ORGANIZATION_INVITATION_SENT: "organization.invitation_sent",
  ORGANIZATION_INVITATION_ACCEPTED: "organization.invitation_accepted",

  // IDD-04: Role & Permission events
  ROLE_CREATED: "role.created",
  ROLE_UPDATED: "role.updated",
  ROLE_DELETED: "role.deleted",
  ROLE_ASSIGNED: "role.assigned",
  ROLE_REVOKED: "role.revoked",
  PERMISSION_CHANGED: "permission.changed",

  // IDD-05: Security events
  MFA_ENABLED: "mfa.enabled",
  MFA_DISABLED: "mfa.disabled",
  MFA_VERIFIED: "mfa.verified",
  DEVICE_TRUSTED: "device.trusted",
  DEVICE_REVOKED: "device.revoked",
  API_KEY_CREATED: "api_key.created",
  API_KEY_REVOKED: "api_key.revoked",
  LOGIN_SUCCESS: "login.success",
  LOGIN_FAILED: "login.failed",
  LOGOUT: "logout",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",

  // IDD-06: Audit & Compliance events
  AUDIT_LOG_CREATED: "audit.log_created",
  ACCESS_REVIEW_CREATED: "access_review.created",
  ACCESS_REVIEW_COMPLETED: "access_review.completed",
  COMPLIANCE_REPORT_GENERATED: "compliance.report_generated",
  INCIDENT_CREATED: "incident.created",
  INCIDENT_RESOLVED: "incident.resolved",

  // IDD-07: Sync events
  SYNC_COMPLETED: "sync.completed",
  SYNC_FAILED: "sync.failed",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

// ─── In-process subscribers (for fallback / dev mode) ──────────────────────

const localSubscribers = new Map<string, Handler[]>();

export function subscribeEvent(type: string, handler: Handler): void {
  const list = localSubscribers.get(type) ?? [];
  list.push(handler);
  localSubscribers.set(type, list);
}

// ─── Redis Streams publisher ───────────────────────────────────────────────

const STREAM_KEY = "iscarb:events";
const DEDUP_TTL = 86400; // 24 hours

/**
 * Publish an event to Redis Streams with idempotency.
 * Falls back to in-process pub/sub if Redis is unavailable.
 */
export async function publishEvent(event: PlatformEvent): Promise<void> {
  const { type, idempotencyKey, ...payload } = event;

  // Check idempotency (dedup within 24h)
  if (idempotencyKey) {
    const exists = await redis.exists(`iscarb:event-dedup:${idempotencyKey}`);
    if (exists) {
      logger.debug({ type, idempotencyKey }, "event deduplicated");
      return;
    }
    // Mark as seen
    await redis.setex(`iscarb:event-dedup:${idempotencyKey}`, DEDUP_TTL, "1");
  }

  // Publish to Redis Stream
  try {
    await redis.xadd(
      STREAM_KEY,
      "*",
      "type",
      type,
      "payload",
      JSON.stringify(payload),
      "idempotencyKey",
      idempotencyKey || "",
      "timestamp",
      new Date().toISOString()
    );
    logger.info({ type, idempotencyKey }, "event published to Redis Streams");
  } catch (err) {
    // Fallback to in-process pub/sub
    logger.warn({ type, err: (err as Error).message }, "Redis unavailable, falling back to in-process bus");
    const handlers = localSubscribers.get(type) ?? [];
    await Promise.allSettled(handlers.map((h) => h(event)));
  }

  // Also trigger local subscribers (for dev mode and in-process consumers)
  const localHandlers = localSubscribers.get(type) ?? [];
  await Promise.allSettled(localHandlers.map((h) => h(event)));
}

// ─── Redis Streams consumer ────────────────────────────────────────────────

/**
 * Start consuming events from Redis Streams.
 * Each consumer group gets its own position tracking.
 */
export async function startEventConsumer(
  consumerGroup: string,
  consumerName: string,
  handlers: Record<string, Handler>
): Promise<void> {
  // Create consumer group (idempotent)
  try {
    await redis.xgroup("CREATE", STREAM_KEY, consumerGroup, "0", "MKSTREAM");
  } catch (err) {
    // Group already exists — ignore
    if (!(err as Error).includes("BUSYGROUP")) {
      throw err;
    }
  }

  logger.info({ consumerGroup, consumerName }, "event consumer started");

  // Poll loop
  const poll = async () => {
    try {
      const results = await redis.xreadgroup(
        "GROUP",
        consumerGroup,
        consumerName,
        "COUNT",
        10,
        "BLOCK",
        5000,
        "STREAMS",
        STREAM_KEY,
        ">"
      );

      if (!results) return;

      for (const [, messages] of results) {
        for (const [messageId, fields] of messages) {
          const type = fields[fields.indexOf("type") + 1];
          const payloadStr = fields[fields.indexOf("payload") + 1];
          const idempotencyKey = fields[fields.indexOf("idempotencyKey") + 1];

          const event: PlatformEvent = {
            type,
            idempotencyKey: idempotencyKey || undefined,
            ...(payloadStr ? JSON.parse(payloadStr) : {}),
          };

          // Dispatch to handler
          const handler = handlers[type];
          if (handler) {
            try {
              await handler(event);
            } catch (err) {
              logger.error({ type, messageId, err: (err as Error).message }, "event handler failed");
            }
          }

          // Acknowledge message
          await redis.xack(STREAM_KEY, consumerGroup, messageId);
        }
      }
    } catch (err) {
      logger.error({ consumerGroup, err: (err as Error).message }, "consumer poll error");
    }
  };

  // Start polling loop
  while (true) {
    await poll();
  }
}
