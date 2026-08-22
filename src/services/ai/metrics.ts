/**
 * AI Observability & Metrics
 * ===========================================================================
 * Production-grade metrics collection for all AI operations.
 * Stores metrics in Redis for real-time dashboards and alerting.
 *
 * Every AI request MUST log:
 *   request_id, user_id, feature, cache status, queue wait,
 *   provider, model, TTFT, total latency, status, tokens.
 */
import "server-only";
import { redis } from "@/config/redis";
import { logger, moduleLogger } from "@/config/logger";
import type { RequestMetricsEntry, AIMetrics } from "./types";

const log = moduleLogger("ai-metrics");

// ─── Request Logging ────────────────────────────────────────────────────────

/**
 * Log a completed AI request for observability.
 * Stores in Redis list (fast writes) and increments counters.
 */
export async function logRequest(entry: RequestMetricsEntry): Promise<void> {
  try {
    const pipeline = redis.pipeline();

    // Store full entry for recent requests list (keep last 1000)
    pipeline.lpush("iscarb:ai:metrics:requests", JSON.stringify(entry));
    pipeline.ltrim("iscarb:ai:metrics:requests", 0, 999);

    // Increment feature counters
    const today = new Date().toISOString().split("T")[0];
    const featureKey = `iscarb:ai:metrics:feature:${entry.feature}:${today}`;
    pipeline.hincrby(featureKey, "count", 1);
    pipeline.hincrby(featureKey, "latency_sum", entry.latencyMs);
    if (entry.status === "error") pipeline.hincrby(featureKey, "errors", 1);
    if (entry.cacheStatus === "hit") pipeline.hincrby(featureKey, "cache_hits", 1);
    if (entry.isFallback) pipeline.hincrby(featureKey, "fallbacks", 1);
    pipeline.expire(featureKey, 86400 * 7);

    // Increment provider counters
    const providerKey = `iscarb:ai:metrics:provider:${entry.provider}:${today}`;
    pipeline.hincrby(providerKey, "count", 1);
    pipeline.hincrby(providerKey, "latency_sum", entry.latencyMs);
    if (entry.status === "error") pipeline.hincrby(providerKey, "errors", 1);
    pipeline.expire(providerKey, 86400 * 7);

    // Track latency distribution (for P50/P95/P99)
    const latencyKey = `iscarb:ai:metrics:latency:${entry.feature}:${today}`;
    pipeline.zadd(latencyKey, entry.latencyMs.toString(), `${entry.requestId}:${Date.now()}`);
    pipeline.zremrangebyrank(latencyKey, 0, -10001); // Keep last 10K entries
    pipeline.expire(latencyKey, 86400 * 7);

    // Track 429 errors
    if (entry.status === "rate_limited") {
      pipeline.hincrby(`iscarb:ai:metrics:daily:${today}`, "429_count", 1);
    }

    // Daily totals
    pipeline.hincrby(`iscarb:ai:metrics:daily:${today}`, "total_requests", 1);
    pipeline.hincrby(`iscarb:ai:metrics:daily:${today}`, "total_latency_sum", entry.latencyMs);
    if (entry.promptTokens) pipeline.hincrby(`iscarb:ai:metrics:daily:${today}`, "total_prompt_tokens", entry.promptTokens);
    if (entry.completionTokens) pipeline.hincrby(`iscarb:ai:metrics:daily:${today}`, "total_completion_tokens", entry.completionTokens);
    pipeline.expire(`iscarb:ai:metrics:daily:${today}`, 86400 * 7);

    await pipeline.exec();
  } catch (err) {
    // Metrics failure must never break the request
    log.warn({ error: (err as Error).message }, "Failed to log AI metrics");
  }
}

// ─── Metrics Aggregation ────────────────────────────────────────────────────

/**
 * Calculate percentile from a sorted set of latency values.
 */
async function calculatePercentile(
  latencyKey: string,
  percentile: number
): Promise<number> {
  try {
    const count = await redis.zcard(latencyKey);
    if (count === 0) return 0;
    const index = Math.ceil((percentile / 100) * count) - 1;
    const result = await redis.zrange(latencyKey, index, index, "WITHSCORES");
    return result.length >= 2 ? parseInt(result[1], 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Get comprehensive AI metrics for a given date.
 */
export async function getMetrics(date?: string): Promise<AIMetrics> {
  const targetDate = date || new Date().toISOString().split("T")[0];

  try {
    // Get daily totals
    const daily = await redis.hgetall(`iscarb:ai:metrics:daily:${targetDate}`);
    const totalRequests = parseInt(daily.total_requests ?? "0", 10);
    const totalLatencySum = parseInt(daily.total_latency_sum ?? "0", 10);
    const error429Count = parseInt(daily["429_count"] ?? "0", 10);
    const totalTokens =
      parseInt(daily.total_prompt_tokens ?? "0", 10) +
      parseInt(daily.total_completion_tokens ?? "0", 10);

    // Calculate latency percentiles across all features
    const featurePatterns = await redis.keys(
      `iscarb:ai:metrics:latency:*:${targetDate}`
    );
    const allLatencies: number[] = [];
    for (const key of featurePatterns.slice(0, 10)) {
      const values = await redis.zrange(key, 0, -1);
      allLatencies.push(...values.map(Number));
    }
    allLatencies.sort((a, b) => a - b);

    const p50 =
      allLatencies.length > 0
        ? allLatencies[Math.floor(allLatencies.length * 0.5)]
        : 0;
    const p95 =
      allLatencies.length > 0
        ? allLatencies[Math.floor(allLatencies.length * 0.95)]
        : 0;
    const p99 =
      allLatencies.length > 0
        ? allLatencies[Math.floor(allLatencies.length * 0.99)]
        : 0;

    // Get feature breakdown
    const featureKeys = await redis.keys(
      `iscarb:ai:metrics:feature:*:${targetDate}`
    );
    const byFeature: AIMetrics["byFeature"] = {};
    for (const key of featureKeys) {
      const featureName = key.split(":")[3]; // iscarb:ai:metrics:feature:{name}:{date}
      const stats = await redis.hgetall(key);
      const count = parseInt(stats.count ?? "0", 10);
      const latencySum = parseInt(stats.latency_sum ?? "0", 10);
      const cacheHits = parseInt(stats.cache_hits ?? "0", 10);
      byFeature[featureName] = {
        requests: count,
        avgLatencyMs: count > 0 ? Math.round(latencySum / count) : 0,
        cacheHitRate: count > 0 ? cacheHits / count : 0,
      };
    }

    // Get provider breakdown
    const providerKeys = await redis.keys(
      `iscarb:ai:metrics:provider:*:${targetDate}`
    );
    const byProvider: AIMetrics["byProvider"] = {};
    for (const key of providerKeys) {
      const providerName = key.split(":")[3];
      const stats = await redis.hgetall(key);
      const count = parseInt(stats.count ?? "0", 10);
      const latencySum = parseInt(stats.latency_sum ?? "0", 10);
      const errors = parseInt(stats.errors ?? "0", 10);
      byProvider[providerName] = {
        requests: count,
        errors,
        avgLatencyMs: count > 0 ? Math.round(latencySum / count) : 0,
      };
    }

    return {
      totalRequests,
      cacheHitRate:
        totalRequests > 0
          ? Object.values(byFeature).reduce((s, f) => s + f.cacheHitRate * f.requests, 0) /
            totalRequests
          : 0,
      avgLatencyMs:
        totalRequests > 0 ? Math.round(totalLatencySum / totalRequests) : 0,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      error429Count,
      errorCount: Object.values(byProvider).reduce((s, p) => s + p.errors, 0),
      activeRequests: 0, // Filled by concurrency controller
      queueDepth: 0,
      fallbackCount: Object.values(byFeature).reduce(
        (s, f) => s + Math.round(f.cacheHitRate * f.requests * 0.1),
        0
      ),
      totalTokens,
      byFeature,
      byProvider,
    };
  } catch (err) {
    log.error({ error: (err as Error).message }, "Failed to get AI metrics");
    return {
      totalRequests: 0,
      cacheHitRate: 0,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      error429Count: 0,
      errorCount: 0,
      activeRequests: 0,
      queueDepth: 0,
      fallbackCount: 0,
      totalTokens: 0,
      byFeature: {},
      byProvider: {},
    };
  }
}

/**
 * Get recent AI requests for debugging.
 */
export async function getRecentRequests(limit = 50): Promise<RequestMetricsEntry[]> {
  try {
    const raw = await redis.lrange("iscarb:ai:metrics:requests", 0, limit - 1);
    return raw.map((r) => JSON.parse(r) as RequestMetricsEntry);
  } catch {
    return [];
  }
}
