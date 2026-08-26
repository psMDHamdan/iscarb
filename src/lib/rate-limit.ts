/**
 * iSCARB Rate Limiting — Redis-backed sliding window
 * ===========================================================================
 * Masterplan Section 6.6: Production rate limiting for multi-instance.
 * Uses Redis for distributed rate limiting across all app instances.
 *
 * Limits are per-identity (userId or authMethod) + per-route-tier:
 *   - ai:     100 req / min  (expensive LLM calls, per-student limit)
 *   - write:  60 req / min   (POST/PATCH mutations)
 *   - read:   300 req / min  (GET)
 * ===========================================================================
 */
import "server-only";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/redis";

type Tier = "ai" | "write" | "read";

const isProd = process.env.NODE_ENV === "production";

/** Production keeps tight caps; local/demo needs headroom for multi-question exams. */
const LIMITS: Record<Tier, { max: number; windowMs: number }> = {
  ai: { max: isProd ? 100 : 500, windowMs: 60_000 },
  write: { max: isProd ? 60 : 300, windowMs: 60_000 },
  read: { max: isProd ? 300 : 1000, windowMs: 60_000 },
};

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/** In-memory sliding window store for fallback when Redis is unavailable. */
const fallbackStore = new Map<string, number[]>();

function cleanupFallbackStore(): void {
  const now = Date.now();
  for (const [key, timestamps] of fallbackStore) {
    const windowMs = 60_000;
    const windowStart = now - windowMs;
    const filtered = timestamps.filter((t) => t > windowStart);
    if (filtered.length === 0) {
      fallbackStore.delete(key);
    } else {
      fallbackStore.set(key, filtered);
    }
  }
}

/**
 * Check rate limit using Redis sliding window.
 * Falls back to in-memory if Redis is unavailable.
 */
export async function rateLimit(
  req: NextRequest,
  tier: Tier,
  identity: string
): Promise<RateLimitResult> {
  const { max, windowMs } = LIMITS[tier];
  const key = `iscarb:rl:${tier}:${identity}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Redis sliding window: remove expired entries, count remaining, add current.
    // Bounded by a hard 200ms race — if Redis is down/slow we fall back to the
    // in-memory limiter instantly instead of stalling every guarded request.
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now.toString(), `${now}:${Math.random()}`);
    pipeline.zcard(key);
    pipeline.pexpire(key, windowMs);
    const results = await Promise.race([
      pipeline.exec(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 200)),
    ]);

    if (results) {
      const count = (results[2]?.[1] as number) || 0;
      const remaining = Math.max(0, max - count);

      return {
        allowed: count <= max,
        limit: max,
        remaining,
        resetMs: windowMs,
      };
    }
    throw new Error("Redis rate-limit timed out");
  } catch {
    // Fallback: in-memory sliding window
    cleanupFallbackStore();
    const timestamps = fallbackStore.get(key) || [];
    const filtered = timestamps.filter((t) => t > windowStart);
    filtered.push(now);
    fallbackStore.set(key, filtered);
    const count = filtered.length;
    const remaining = Math.max(0, max - count);

    return {
      allowed: count <= max,
      limit: max,
      remaining,
      resetMs: windowMs,
    };
  }
}

/**
 * Set rate-limit headers on a Response object.
 */
export function rateLimitHeaders(res: Response, result: RateLimitResult): void {
  const headers = res.headers;
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", Math.ceil(result.resetMs / 1000).toString());
  if (!result.allowed) {
    headers.set("Retry-After", Math.max(1, Math.ceil(result.resetMs / 1000)).toString());
  }
}
