/**
 * iSCARB Redis Client — singleton connection pool
 * ===========================================================================
 * Provides a shared Redis client for event bus, rate limiting, and caching.
 * Uses ioredis with connection pooling and graceful shutdown.
 *
 * Environment variables:
 *   REDIS_URL — Redis connection string. Supports:
 *     - redis://localhost:6380            (local docker-compose Redis)
 *     - rediss://default:TOKEN@host:6379  (managed TLS Redis — Upstash etc.)
 *       works with ioredis as-is
 *   REDIS_PASSWORD — Redis password (optional)
 *
 * On managed Redis the CONFIG command is not available;
 * the old `CONFIG SET stop-writes-on-bgsave-error` call is skipped for
 * rediss:// endpoints instead of erroring on every connect.
 * ===========================================================================
 */
import Redis from "ioredis";
import { logger } from "./logger";

const REDIS_URL_DEFAULT = "redis://localhost:6379";
const REDIS_URL = (process.env.REDIS_URL || REDIS_URL_DEFAULT).trim().replace(/^["']|["']$/g, "");
const REDIS_PASSWORD = process.env.REDIS_PASSWORD?.trim().replace(/^["']|["']$/g, "");

// Log warning if REDIS_URL not explicitly set in environment
if (!process.env.REDIS_URL) {
  logger.warn(
    { env: "REDIS_URL", default: REDIS_URL_DEFAULT },
    "REDIS_URL not set, using default redis://localhost:6379",
  );
}

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  let redisUrl: URL;
  try {
    redisUrl = new URL(REDIS_URL);
  } catch {
    redisUrl = new URL(REDIS_URL_DEFAULT);
  }
  const isTls = redisUrl.protocol === "rediss:";
  const client = new Redis({
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port, 10),
    username: redisUrl.username || undefined,
    password: REDIS_PASSWORD || redisUrl.password || undefined,
    // Upstash Redis speaks TLS on its RESP endpoint — ioredis needs tls: {}
    // when the connection string uses rediss://
    ...(isTls ? { tls: {} } : {}),
    // Serverless/managed fast-fail: never queue commands while offline and bound every
    // connect/command attempt. A dead or unset Redis must cost MILLISECONDS,
    // not seconds — callers (rate limiter, session service) fall back to their
    // in-memory paths instead of stalling every request. For production VM deploy
    // set REDIS_URL to the compose/VM Redis (or a managed rediss:// endpoint).
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    commandTimeout: 3000,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    logger.warn({ err: err.message }, "[redis] connection error");
  });

  client.on("connect", () => {
    logger.info({ url: REDIS_URL }, "[redis] connected");
    // CONFIG is not supported on managed serverless Redis (Upstash).
    if (!isTls) {
      client.config("SET", "stop-writes-on-bgsave-error", "no").catch(() => {});
    }
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Health check — returns true if Redis is reachable.
 */
export async function redisHealthCheck(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

/**
 * Graceful shutdown — call on process exit.
 */
export async function redisDisconnect(): Promise<void> {
  await redis.quit();
}

// ---------------------------------------------------------------------------
// In-memory fallback for when Redis is unavailable.
// Stores progress data so generation tracking works without Redis.
// ---------------------------------------------------------------------------
const inMemoryStore = new Map<string, Record<string, string>>();
let _redisAvailable: boolean | null = null;
let _lastRedisCheck = 0;
const REDIS_CHECK_INTERVAL_MS = 10_000; // Re-check every 10s

async function isRedisAvailable(): Promise<boolean> {
  const now = Date.now();
  if (_redisAvailable !== null && now - _lastRedisCheck < REDIS_CHECK_INTERVAL_MS) {
    return _redisAvailable;
  }
  _lastRedisCheck = now;
  try {
    await redis.ping();
    if (!_redisAvailable) {
      logger.info("[redis] connection restored — switching from in-memory fallback");
    }
    _redisAvailable = true;
  } catch {
    if (_redisAvailable !== false) {
      logger.warn("[redis] unavailable — using in-memory progress store fallback");
    }
    _redisAvailable = false;
  }
  return _redisAvailable;
}

/**
 * Safe hset — tries Redis, falls back to in-memory Map.
 * Used by generation progress tracking so progress bars work without Redis.
 */
export async function safeHset(
  key: string,
  data: Record<string, string | number>
): Promise<void> {
  const strData: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    strData[k] = String(v);
  }

  if (await isRedisAvailable()) {
    try {
      await redis.hset(key, strData);
      return;
    } catch {
      // Fall through to in-memory
    }
  }
  // In-memory fallback
  const existing = inMemoryStore.get(key) || {};
  inMemoryStore.set(key, { ...existing, ...strData });
}

/**
 * Safe hgetall — tries Redis, falls back to in-memory Map.
 */
export async function safeHgetall(
  key: string
): Promise<Record<string, string> | null> {
  if (await isRedisAvailable()) {
    try {
      const result = await redis.hgetall(key);
      if (result && Object.keys(result).length > 0) return result;
    } catch {
      // Fall through to in-memory
    }
  }
  return inMemoryStore.get(key) || null;
}
