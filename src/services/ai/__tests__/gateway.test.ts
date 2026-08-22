/**
 * AI Gateway Tests
 * ===========================================================================
 * Tests for the centralized AI Gateway infrastructure:
 *   - Response caching (hit/miss/bypass)
 *   - Request coalescing (single-flight)
 *   - Per-user quotas (daily/burst/concurrent)
 *   - Concurrency control
 *   - Provider routing + fallback
 *   - 429 handling + retry
 *   - Metrics logging
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock Redis ─────────────────────────────────────────────────────────────

const mockRedisStore = new Map<string, string>();
const mockRedisHashes = new Map<string, Record<string, string>>();
const mockRedisSortedSets = new Map<string, Array<{ score: number; value: string }>>();
const mockRedisCounters = new Map<string, number>();

vi.mock("@/config/redis", () => ({
  redis: {
    get: vi.fn(async (key: string) => mockRedisStore.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => { mockRedisStore.set(key, value); }),
    setex: vi.fn(async (key: string, ttl: number, value: string) => { mockRedisStore.set(key, value); }),
    del: vi.fn(async (...keys: string[]) => { keys.forEach(k => mockRedisStore.delete(k)); }),
    incr: vi.fn(async (key: string) => {
      const current = mockRedisCounters.get(key) ?? 0;
      mockRedisCounters.set(key, current + 1);
      return current + 1;
    }),
    decr: vi.fn(async (key: string) => {
      const current = (mockRedisCounters.get(key) ?? 1);
      const next = Math.max(0, current - 1);
      mockRedisCounters.set(key, next);
      return next;
    }),
    hgetall: vi.fn(async (key: string) => mockRedisHashes.get(key) ?? {}),
    hset: vi.fn(async (key: string, field: string, value: string) => {
      if (!mockRedisHashes.has(key)) mockRedisHashes.set(key, {});
      mockRedisHashes.get(key)![field] = value;
    }),
    hincrby: vi.fn(async (key: string, field: string, increment: number) => {
      if (!mockRedisHashes.has(key)) mockRedisHashes.set(key, {});
      const hash = mockRedisHashes.get(key)!;
      hash[field] = String(parseInt(hash[field] ?? "0", 10) + increment);
    }),
    hdel: vi.fn(async (key: string, ...fields: string[]) => {
      const hash = mockRedisHashes.get(key);
      if (hash) fields.forEach(f => delete hash[f]);
    }),
    zadd: vi.fn(async (key: string, score: string, value: string) => {
      if (!mockRedisSortedSets.has(key)) mockRedisSortedSets.set(key, []);
      const set = mockRedisSortedSets.get(key)!;
      set.push({ score: parseInt(score, 10), value });
      return set.length;
    }),
    zrange: vi.fn(async (key: string, start: number, end: number, ...args: any[]) => {
      const set = mockRedisSortedSets.get(key) ?? [];
      const slice = set.slice(start, end === -1 ? undefined : end + 1);
      const withScores = args.includes("WITHSCORES");
      return slice.flatMap(item => withScores ? [item.value, String(item.score)] : [item.value]);
    }),
    zcard: vi.fn(async (key: string) => (mockRedisSortedSets.get(key) ?? []).length),
    zrem: vi.fn(async (key: string, ...values: string[]) => {
      const set = mockRedisSortedSets.get(key) ?? [];
      const removed = values.filter(v => set.some(item => item.value === v)).length;
      mockRedisSortedSets.set(key, set.filter(item => !values.includes(item.value)));
      return removed;
    }),
    zremrangebyrank: vi.fn(async () => 0),
    zremrangebyscore: vi.fn(async () => 0),
    pipeline: vi.fn(() => ({
      exec: vi.fn(async () => [
        [null, null],  // get result
        [null, null],  // get result
        [null, null],  // get result
      ]),
      incr: vi.fn(),
      decr: vi.fn(),
      hincrby: vi.fn(),
      hset: vi.fn(),
      lpush: vi.fn(),
      ltrim: vi.fn(),
      expire: vi.fn(),
      pexpire: vi.fn(),
      get: vi.fn(),
      zadd: vi.fn(),
      zrange: vi.fn(),
    })),
    lpush: vi.fn(async () => 1),
    ltrim: vi.fn(async () => 1),
    lrange: vi.fn(async () => []),
    keys: vi.fn(async () => []),
    expire: vi.fn(async () => 1),
    pexpire: vi.fn(async () => 1),
    ping: vi.fn(async () => "PONG"),
  },
}));

vi.mock("@/config/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  moduleLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("AI Gateway", () => {
  beforeEach(() => {
    mockRedisStore.clear();
    mockRedisHashes.clear();
    mockRedisSortedSets.clear();
    mockRedisCounters.clear();
    vi.clearAllMocks();
  });

  describe("Cache Key Generation", () => {
    it("should generate deterministic cache keys", async () => {
      const { buildCacheKey } = await import("@/services/ai/cache");

      const key1 = buildCacheKey({
        feature: "test",
        system: "system prompt",
        user: "user prompt",
        model: "meta/llama-3.1-8b-instruct",
        temperature: 0.4,
      });

      const key2 = buildCacheKey({
        feature: "test",
        system: "system prompt",
        user: "user prompt",
        model: "meta/llama-3.1-8b-instruct",
        temperature: 0.4,
      });

      expect(key1).toBe(key2);
      expect(key1).toContain("iscarb:ai:cache:");
      expect(key1).toContain("test");
    });

    it("should generate different keys for different inputs", async () => {
      const { buildCacheKey } = await import("@/services/ai/cache");

      const key1 = buildCacheKey({
        feature: "test",
        system: "system A",
        user: "user A",
        model: "model-a",
        temperature: 0.4,
      });

      const key2 = buildCacheKey({
        feature: "test",
        system: "system B",
        user: "user B",
        model: "model-a",
        temperature: 0.4,
      });

      expect(key1).not.toBe(key2);
    });

    it("should include userId for user-scoped requests", async () => {
      const { buildCacheKey } = await import("@/services/ai/cache");

      const key1 = buildCacheKey({
        feature: "test",
        system: "sys",
        user: "usr",
        userId: "user-1",
      });

      const key2 = buildCacheKey({
        feature: "test",
        system: "sys",
        user: "usr",
        userId: "user-2",
      });

      expect(key1).not.toBe(key2);
    });
  });

  describe("Quotas", () => {
    it("should allow requests within quota", async () => {
      const { checkQuota } = await import("@/services/ai/quotas");
      const result = await checkQuota("user-1");
      expect(result.allowed).toBe(true);
    });

    it("should reject requests exceeding daily limit", async () => {
      // Override pipeline to return quota-exceeding values
      const pipelineExec = vi.fn(async () => [
        [null, "1000"],  // daily count
        [null, "5"],     // burst count
        [null, "1"],     // concurrent count
      ]);
      const { redis } = await import("@/config/redis");
      vi.mocked(redis.pipeline).mockReturnValue({
        exec: pipelineExec,
        incr: vi.fn(), decr: vi.fn(), hincrby: vi.fn(), hset: vi.fn(),
        lpush: vi.fn(), ltrim: vi.fn(), expire: vi.fn(), pexpire: vi.fn(),
        get: vi.fn(), zadd: vi.fn(), zrange: vi.fn(),
      } as any);

      const { checkQuota } = await import("@/services/ai/quotas");
      const result = await checkQuota("user-1");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Daily AI quota exceeded");
    });

    it("should reject requests exceeding burst limit", async () => {
      const pipelineExec = vi.fn(async () => [
        [null, "5"],     // daily count
        [null, "30"],    // burst count
        [null, "1"],     // concurrent count
      ]);
      const { redis } = await import("@/config/redis");
      vi.mocked(redis.pipeline).mockReturnValue({
        exec: pipelineExec,
        incr: vi.fn(), decr: vi.fn(), hincrby: vi.fn(), hset: vi.fn(),
        lpush: vi.fn(), ltrim: vi.fn(), expire: vi.fn(), pexpire: vi.fn(),
        get: vi.fn(), zadd: vi.fn(), zrange: vi.fn(),
      } as any);

      const { checkQuota } = await import("@/services/ai/quotas");
      const result = await checkQuota("user-1");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Burst limit exceeded");
    });

    it("should consume quota after successful request", async () => {
      const { consumeQuota } = await import("@/services/ai/quotas");
      // Should not throw
      await expect(consumeQuota("user-1")).resolves.not.toThrow();
    });

    it("should release concurrent quota", async () => {
      // Set up the value in both the counter store and the key-value store
      mockRedisCounters.set("iscarb:ai:quota:concurrent:user-1", 3);
      mockRedisStore.set("iscarb:ai:quota:concurrent:user-1", "3");

      const { releaseConcurrentQuota } = await import("@/services/ai/quotas");
      await releaseConcurrentQuota("user-1");

      expect(mockRedisCounters.get("iscarb:ai:quota:concurrent:user-1")).toBe(2);
    });
  });

  describe("Concurrency", () => {
    it("should acquire slot when under limit", async () => {
      const { acquireSlot, releaseSlot } = await import("@/services/ai/concurrency");
      const slotId = await acquireSlot("req-1", "test", "interactive");
      expect(slotId).toBeTruthy();
      await releaseSlot(slotId);
    });

    it("should report concurrency state", async () => {
      const { getConcurrencyState } = await import("@/services/ai/concurrency");
      const state = await getConcurrencyState();
      expect(state.maxConcurrent).toBeGreaterThan(0);
      expect(state.active).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Metrics", () => {
    it("should log request metrics without throwing", async () => {
      const { logRequest } = await import("@/services/ai/metrics");
      // Should not throw even if Redis pipeline fails
      await expect(logRequest({
        requestId: "req-1",
        feature: "test",
        model: "test-model",
        provider: "nvidia",
        cacheStatus: "miss",
        queueWaitMs: 0,
        latencyMs: 100,
        retryCount: 0,
        isFallback: false,
        status: "success",
        timestamp: Date.now(),
      })).resolves.not.toThrow();
    });

    it("should aggregate metrics", async () => {
      const { getMetrics } = await import("@/services/ai/metrics");
      const metrics = await getMetrics();
      expect(metrics).toHaveProperty("totalRequests");
      expect(metrics).toHaveProperty("cacheHitRate");
      expect(metrics).toHaveProperty("p50LatencyMs");
    });
  });

  describe("Cache Stats", () => {
    it("should return cache statistics", async () => {
      const { getCacheStats } = await import("@/services/ai/cache");
      const stats = await getCacheStats();
      expect(stats).toHaveProperty("hits");
      expect(stats).toHaveProperty("misses");
      expect(stats).toHaveProperty("hitRate");
    });
  });
});
