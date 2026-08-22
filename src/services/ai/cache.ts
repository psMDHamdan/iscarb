/**
 * AI Response Cache + Request Coalescing
 * ===========================================================================
 * Redis-backed cache for AI responses with deterministic keys.
 * Includes single-flight (request coalescing) so N identical concurrent
 * requests result in only 1 LLM call.
 *
 * Cache key = hash(feature + model + system_prompt + user_prompt + temperature)
 * Only safe-to-share results are cached (no private user data in shared keys).
 */
import "server-only";
import { createHash } from "crypto";
import { redis } from "@/config/redis";
import { logger, moduleLogger } from "@/config/logger";
import type { AIRequest, AIResponse } from "./types";

const log = moduleLogger("ai-cache");

// ─── Cache Key Generation ───────────────────────────────────────────────────

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

/**
 * Build a deterministic cache key from request parameters.
 * User-scoped requests include userId to prevent data leakage.
 */
export function buildCacheKey(request: AIRequest): string {
  const parts = [
    request.feature,
    request.model ?? "default",
    sha256(request.system),
    sha256(request.user),
    String(request.temperature ?? 0.4),
    request.guardrails === false ? "unguarded" : "guarded",
  ];

  // Include userId for user-scoped features (prevents cross-user data leak)
  if (request.userId) {
    parts.push(`u:${request.userId}`);
  }

  return `iscarb:ai:cache:${parts.join(":")}`;
}

// ─── Cache Operations ───────────────────────────────────────────────────────

/**
 * Get a cached AI response. Returns null on miss.
 */
export async function getCachedResponse(
  key: string
): Promise<AIResponse | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as {
      response: AIResponse;
      storedAt: number;
      ttlMs: number;
    };

    // Check if expired (belt-and-suspenders with Redis TTL)
    if (Date.now() - entry.storedAt > entry.ttlMs) {
      await redis.del(key).catch(() => {});
      return null;
    }

    // Increment hit count for analytics
    await redis.hincrby("iscarb:ai:cache:stats", "hits", 1).catch(() => {});

    log.debug({ cacheKey: key }, "cache hit");
    return entry.response;
  } catch (err) {
    log.warn({ cacheKey: key, error: (err as Error).message }, "cache get failed");
    return null;
  }
}

/**
 * Store an AI response in cache.
 */
export async function setCachedResponse(
  key: string,
  response: AIResponse,
  ttlSeconds: number
): Promise<void> {
  try {
    const entry = {
      response,
      storedAt: Date.now(),
      ttlMs: ttlSeconds * 1000,
    };

    await redis.setex(key, ttlSeconds, JSON.stringify(entry));
    await redis.hincrby("iscarb:ai:cache:stats", "misses", 1).catch(() => {});

    log.debug({ cacheKey: key, ttlSeconds }, "cache set");
  } catch (err) {
    log.warn({ cacheKey: key, error: (err as Error).message }, "cache set failed");
  }
}

// ─── Request Coalescing (Single-Flight) ─────────────────────────────────────

/**
 * In-flight request tracking for single-flight coalescing.
 * Key = cache key. Value = Promise that resolves to the response.
 */
const inflightRequests = new Map<string, Promise<AIResponse>>();

/**
 * Execute a request with single-flight coalescing.
 * If an identical request is already in-flight, returns the same Promise.
 * This is CRITICAL for preventing duplicate NVIDIA API calls.
 */
export async function coalescedExecute(
  cacheKey: string,
  execute: () => Promise<AIResponse>,
  ttlSeconds: number
): Promise<AIResponse> {
  // 1. Check cache first
  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return { ...cached, cacheStatus: "hit" };
  }

  // 2. Check if an identical request is already in-flight
  const existing = inflightRequests.get(cacheKey);
  if (existing) {
    log.debug({ cacheKey }, "request coalesced — waiting for in-flight");
    const response = await existing;
    return { ...response, cacheStatus: "hit" };
  }

  // 3. Execute and track
  const promise = execute()
    .then(async (response) => {
      // Cache the successful result
      if (!response.isFallback && response.content && ttlSeconds > 0) {
        await setCachedResponse(cacheKey, response, ttlSeconds);
      }
      return response;
    })
    .finally(() => {
      // Always clean up inflight tracking
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, promise);

  try {
    const response = await promise;
    return { ...response, cacheStatus: "miss" };
  } catch (err) {
    // If the request fails, clear the inflight so retries can happen
    inflightRequests.delete(cacheKey);
    throw err;
  }
}

// ─── Cache Statistics ───────────────────────────────────────────────────────

export async function getCacheStats(): Promise<{
  hits: number;
  misses: number;
  hitRate: number;
  inflight: number;
}> {
  try {
    const stats = await redis.hgetall("iscarb:ai:cache:stats");
    const hits = parseInt(stats.hits ?? "0", 10);
    const misses = parseInt(stats.misses ?? "0", 10);
    const total = hits + misses;
    return {
      hits,
      misses,
      hitRate: total > 0 ? hits / total : 0,
      inflight: inflightRequests.size,
    };
  } catch {
    return { hits: 0, misses: 0, hitRate: 0, inflight: inflightRequests.size };
  }
}

/**
 * Invalidate all cached responses for a specific feature.
 */
export async function invalidateFeatureCache(feature: string): Promise<void> {
  try {
    const pattern = `iscarb:ai:cache:${feature}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      log.info({ feature, count: keys.length }, "feature cache invalidated");
    }
  } catch (err) {
    log.warn({ feature, error: (err as Error).message }, "cache invalidation failed");
  }
}
