/**
 * iSCARB Redis Client — singleton connection pool
 * ===========================================================================
 * Provides a shared Redis client for event bus, rate limiting, and caching.
 * Uses ioredis with connection pooling and graceful shutdown.
 *
 * Environment variables:
 *   REDIS_URL — Redis connection string. Supports:
 *     - redis://localhost:6379            (local dev — the running redis-server)
 *     - rediss://default:TOKEN@host:6379  (Upstash / managed TLS Redis — the
 *       connection to use on Vercel; works with ioredis as-is)
 *   REDIS_PASSWORD — Redis password (optional)
 *
 * On managed serverless Redis (Upstash) the CONFIG command is not available;
 * the old `CONFIG SET stop-writes-on-bgsave-error` call is now skipped for
 * rediss:// endpoints instead of erroring on every connect.
 * ===========================================================================
 */
import Redis from "ioredis";
import { logger } from "./logger";

const REDIS_URL_DEFAULT = "redis://localhost:6379";
const REDIS_URL = process.env.REDIS_URL || REDIS_URL_DEFAULT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Log warning if REDIS_URL not explicitly set in environment
if (!process.env.REDIS_URL) {
  logger.warn(
    { env: "REDIS_URL", default: REDIS_URL_DEFAULT },
    "REDIS_URL not set, using default redis://localhost:6380",
  );
}

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const redisUrl = new URL(REDIS_URL);
  const isTls = redisUrl.protocol === "rediss:";
  const client = new Redis({
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port, 10),
    username: redisUrl.username || undefined,
    password: REDIS_PASSWORD || redisUrl.password || undefined,
    // Upstash Redis speaks TLS on its RESP endpoint — ioredis needs tls: {}
    // when the connection string uses rediss://
    ...(isTls ? { tls: {} } : {}),
    // Serverless fast-fail: never queue commands while offline and bound every
    // connect/command attempt. A dead or unset Redis must cost MILLISECONDS,
    // not seconds — callers (rate limiter, session service) fall back to their
    // in-memory paths instead of stalling every request (Vercel: set REDIS_URL
    // to an Upstash rediss:// endpoint for real distributed rate limiting).
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
