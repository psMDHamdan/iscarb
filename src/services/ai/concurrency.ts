/**
 * Distributed Concurrency Controller
 * ===========================================================================
 * Redis-backed concurrency limiter that works across multiple backend instances.
 * Prevents overwhelming the NVIDIA API with too many simultaneous requests.
 *
 * Uses Redis sorted sets as a distributed semaphore with priority support.
 */
import "server-only";
import { redis } from "@/config/redis";
import { logger, moduleLogger } from "@/config/logger";
import type { ConcurrencyState } from "./types";

const log = moduleLogger("ai-concurrency");

// ─── Configuration ──────────────────────────────────────────────────────────

const MAX_CONCURRENT = Math.min(
  40,
  Math.max(
    1,
    Number.parseInt(process.env.AI_CONCURRENCY_MAX || "20", 10) || 20
  )
);

const SLOT_TIMEOUT_MS = 60_000;
const REDIS_KEY = "iscarb:ai:concurrency:slots";
const REDIS_COUNTER_KEY = "iscarb:ai:concurrency:active";
const REDIS_QUEUE_KEY = "iscarb:ai:concurrency:queue";

// ─── Slot Management ────────────────────────────────────────────────────────

/**
 * Acquire a concurrency slot. Returns the slot ID, or throws on timeout.
 * Uses Redis INCR as an atomic counter + sorted set for queue tracking.
 */
export async function acquireSlot(
  requestId: string,
  feature: string,
  priority: "interactive" | "background" | "critical" = "interactive",
  timeoutMs: number = SLOT_TIMEOUT_MS
): Promise<string> {
  const startTime = Date.now();

  while (true) {
    try {
      // Try to increment the active counter atomically
      const active = await redis.incr(REDIS_COUNTER_KEY);

      if (active <= MAX_CONCURRENT) {
        // Slot acquired
        await redis.pexpire(REDIS_COUNTER_KEY, SLOT_TIMEOUT_MS);
        const slotId = `${requestId}:${Date.now()}`;

        // Track the slot for monitoring
        await redis.hset(REDIS_KEY, slotId, JSON.stringify({
          requestId,
          feature,
          priority,
          acquiredAt: Date.now(),
        }));
        await redis.pexpire(REDIS_KEY, SLOT_TIMEOUT_MS);

        log.debug({ requestId, feature, active, max: MAX_CONCURRENT }, "slot acquired");
        return slotId;
      }

      // Over limit — decrement and wait
      await redis.decr(REDIS_COUNTER_KEY);

      // Add to queue for monitoring
      const queuePos = await redis.zadd(
        REDIS_QUEUE_KEY,
        Date.now().toString(),
        `${requestId}:${feature}:${priority}`
      );
      await redis.pexpire(REDIS_QUEUE_KEY, SLOT_TIMEOUT_MS);

      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        await redis.zrem(REDIS_QUEUE_KEY, `${requestId}:${feature}:${priority}`);
        throw new Error(`Concurrency slot wait timed out after ${timeoutMs}ms`);
      }

      // Wait with priority-based backoff
      const waitMs = priority === "critical" ? 50 : priority === "interactive" ? 100 : 200;
      await new Promise((r) => setTimeout(r, waitMs));
    } catch (err) {
      if (err instanceof Error && err.message.includes("timed out")) {
        throw err;
      }
      // Redis error — fall back to in-memory check
      log.warn({ error: (err as Error).message }, "Redis concurrency failed, using local fallback");
      return acquireLocalSlot(requestId, feature, priority, timeoutMs - (Date.now() - startTime));
    }
  }
}

/**
 * Release a concurrency slot.
 */
export async function releaseSlot(slotId: string): Promise<void> {
  try {
    await redis.hdel(REDIS_KEY, slotId);
    await redis.decr(REDIS_COUNTER_KEY);

    // Remove from queue if present
    const queueEntries = await redis.zrange(REDIS_QUEUE_KEY, 0, -1);
    for (const entry of queueEntries) {
      if (entry.startsWith(slotId.split(":")[0])) {
        await redis.zrem(REDIS_QUEUE_KEY, entry);
        break;
      }
    }

    log.debug({ slotId }, "slot released");
  } catch (err) {
    log.warn({ slotId, error: (err as Error).message }, "slot release failed");
  }
}

// ─── In-Memory Fallback ─────────────────────────────────────────────────────

let localActive = 0;
const localQueue: Array<{
  id: string;
  resolve: () => void;
  reject: (err: Error) => void;
}> = [];

function acquireLocalSlot(
  requestId: string,
  feature: string,
  priority: string,
  timeoutMs: number
): Promise<string> {
  if (localActive < MAX_CONCURRENT) {
    localActive++;
    return Promise.resolve(`local:${requestId}:${Date.now()}`);
  }

  const id = `${requestId}:${feature}:${priority}`;
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = localQueue.findIndex((e) => e.id === id);
      if (idx !== -1) localQueue.splice(idx, 1);
      reject(new Error(`Local concurrency slot wait timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    localQueue.push({
      id,
      resolve: () => {
        clearTimeout(timer);
        resolve(`local:${requestId}:${Date.now()}`);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    });
  });
}

// ─── Monitoring ─────────────────────────────────────────────────────────────

/**
 * Get current concurrency state for monitoring.
 */
export async function getConcurrencyState(): Promise<ConcurrencyState> {
  try {
    const active = Math.max(0, parseInt(await redis.get(REDIS_COUNTER_KEY) ?? "0", 10));
    const queued = await redis.zcard(REDIS_QUEUE_KEY);
    const queueEntries = await redis.zrange(REDIS_QUEUE_KEY, 0, 0, "WITHSCORES");
    const oldestWaitMs =
      queueEntries.length >= 2
        ? Date.now() - parseInt(queueEntries[1], 10)
        : 0;

    return {
      active,
      queued,
      maxConcurrent: MAX_CONCURRENT,
      oldestWaitMs,
    };
  } catch {
    return {
      active: localActive,
      queued: localQueue.length,
      maxConcurrent: MAX_CONCURRENT,
      oldestWaitMs: 0,
    };
  }
}
