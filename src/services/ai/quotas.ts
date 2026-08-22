/**
 * Per-User AI Usage Quotas
 * ===========================================================================
 * Application-level rate limiting per user, separate from provider rate limits.
 * Uses Redis sorted sets for sliding window counting.
 *
 * Four layers of protection:
 *   1. Daily quota (requests per user per day)
 *   2. Burst protection (requests per minute)
 *   3. Concurrent active generations per user
 *   4. Global concurrency (handled by concurrency.ts)
 */
import "server-only";
import { redis } from "@/config/redis";
import { logger, moduleLogger } from "@/config/logger";

const log = moduleLogger("ai-quotas");

// ─── Configuration (all configurable via env) ───────────────────────────────

export const QUOTA_CONFIG = {
  /** Max AI requests per user per day */
  dailyLimit: Math.max(100, Number.parseInt(process.env.AI_QUOTA_DAILY || "1000", 10) || 1000),
  /** Max burst requests per minute */
  burstLimit: Math.max(5, Number.parseInt(process.env.AI_QUOTA_BURST || "30", 10) || 30),
  /** Max concurrent active AI generations per user */
  concurrentLimit: Math.max(1, Number.parseInt(process.env.AI_QUOTA_CONCURRENT || "5", 10) || 5),
  /** Max input tokens per request */
  maxInputTokens: Number.parseInt(process.env.AI_MAX_INPUT_TOKENS || "16000", 10) || 16000,
  /** Max output tokens per request */
  maxOutputTokens: Number.parseInt(process.env.AI_MAX_OUTPUT_TOKENS || "4096", 10) || 4096,
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  dailyRemaining: number;
  burstRemaining: number;
  concurrentRemaining: number;
}

// ─── Redis Keys ─────────────────────────────────────────────────────────────

function dailyKey(userId: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `iscarb:ai:quota:daily:${userId}:${today}`;
}

function burstKey(userId: string): string {
  const now = Math.floor(Date.now() / 60_000);
  return `iscarb:ai:quota:burst:${userId}:${now}`;
}

function concurrentKey(userId: string): string {
  return `iscarb:ai:quota:concurrent:${userId}`;
}

// ─── Quota Check ────────────────────────────────────────────────────────────

/**
 * Check if a user is within their AI usage quotas.
 * Does NOT consume the quota — call `consumeQuota` after successful execution.
 */
export async function checkQuota(userId: string): Promise<QuotaCheckResult> {
  try {
    const pipeline = redis.pipeline();

    // Daily count
    pipeline.get(dailyKey(userId));
    // Burst count (current minute)
    pipeline.get(burstKey(userId));
    // Concurrent count
    pipeline.get(concurrentKey(userId));

    const results = await Promise.race([
      pipeline.exec(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 100)),
    ]);

    if (!results) {
      // Redis timeout — allow with warning
      log.warn({ userId }, "Redis quota check timed out, allowing request");
      return {
        allowed: true,
        dailyRemaining: QUOTA_CONFIG.dailyLimit,
        burstRemaining: QUOTA_CONFIG.burstLimit,
        concurrentRemaining: QUOTA_CONFIG.concurrentLimit,
      };
    }

    const dailyCount = parseInt((results[0]?.[1] as string) ?? "0", 10);
    const burstCount = parseInt((results[1]?.[1] as string) ?? "0", 10);
    const concurrentCount = parseInt((results[2]?.[1] as string) ?? "0", 10);

    const dailyRemaining = Math.max(0, QUOTA_CONFIG.dailyLimit - dailyCount);
    const burstRemaining = Math.max(0, QUOTA_CONFIG.burstLimit - burstCount);
    const concurrentRemaining = Math.max(0, QUOTA_CONFIG.concurrentLimit - concurrentCount);

    if (dailyCount >= QUOTA_CONFIG.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily AI quota exceeded (${QUOTA_CONFIG.dailyLimit}/day)`,
        dailyRemaining,
        burstRemaining,
        concurrentRemaining,
      };
    }

    if (burstCount >= QUOTA_CONFIG.burstLimit) {
      return {
        allowed: false,
        reason: `Burst limit exceeded (${QUOTA_CONFIG.burstLimit}/min)`,
        dailyRemaining,
        burstRemaining,
        concurrentRemaining,
      };
    }

    if (concurrentCount >= QUOTA_CONFIG.concurrentLimit) {
      return {
        allowed: false,
        reason: `Concurrent generation limit exceeded (${QUOTA_CONFIG.concurrentLimit})`,
        dailyRemaining,
        burstRemaining,
        concurrentRemaining,
      };
    }

    return {
      allowed: true,
      dailyRemaining,
      burstRemaining,
      concurrentRemaining,
    };
  } catch (err) {
    log.warn({ userId, error: (err as Error).message }, "Quota check failed, allowing request");
    return {
      allowed: true,
      dailyRemaining: QUOTA_CONFIG.dailyLimit,
      burstRemaining: QUOTA_CONFIG.burstLimit,
      concurrentRemaining: QUOTA_CONFIG.concurrentLimit,
    };
  }
}

/**
 * Consume quota after a successful AI request.
 */
export async function consumeQuota(userId: string): Promise<void> {
  try {
    const pipeline = redis.pipeline();

    // Increment daily counter (TTL = 25 hours for safety)
    const dKey = dailyKey(userId);
    pipeline.incr(dKey);
    pipeline.expire(dKey, 90_000);

    // Increment burst counter (TTL = 2 minutes)
    const bKey = burstKey(userId);
    pipeline.incr(bKey);
    pipeline.expire(bKey, 120);

    // Increment concurrent counter (no TTL — released explicitly)
    pipeline.incr(concurrentKey(userId));

    await pipeline.exec();
  } catch (err) {
    log.warn({ userId, error: (err as Error).message }, "Quota consume failed");
  }
}

/**
 * Release concurrent quota slot after AI request completes.
 */
export async function releaseConcurrentQuota(userId: string): Promise<void> {
  try {
    const key = concurrentKey(userId);
    const current = await redis.get(key);
    if (current && parseInt(current, 10) > 0) {
      await redis.decr(key);
    }
  } catch (err) {
    log.warn({ userId, error: (err as Error).message }, "Concurrent quota release failed");
  }
}

/**
 * Get user's current quota status for monitoring.
 */
export async function getUserQuotaStatus(
  userId: string
): Promise<QuotaCheckResult> {
  return checkQuota(userId);
}
