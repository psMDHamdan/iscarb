/**
 * Rolling Call A ↔ Call B agreement monitoring.
 *
 * If the rolling agreement rate exceeds ~85%, Call B may no longer be acting
 * independently (context leakage / overly permissive prompt) and needs review.
 */

import "server-only";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("audit-agreement");

const REDIS_KEY = "iscarb:scoring:audit-agreement:v1";
const WINDOW = 500;
/** Flag when rolling YES rate exceeds this fraction. */
export const AGREEMENT_FLAG_THRESHOLD = 0.85;

export interface AuditAgreementEvent {
  moduleCode: string;
  agreed: number;
  total: number;
  firstPassRejects: string[];
}

export interface AuditAgreementSnapshot {
  windowSize: number;
  agreed: number;
  total: number;
  rate: number;
  flagged: boolean;
  threshold: number;
}

/** In-memory ring when Redis is unavailable. */
const memoryRing: number[] = [];

function pushMemory(bits: number[]) {
  for (const b of bits) {
    memoryRing.push(b);
    if (memoryRing.length > WINDOW) memoryRing.shift();
  }
}

function snapshotFromBits(bits: number[]): AuditAgreementSnapshot {
  const total = bits.length;
  const agreed = bits.reduce((s, b) => s + b, 0);
  const rate = total > 0 ? agreed / total : 0;
  return {
    windowSize: WINDOW,
    agreed,
    total,
    rate,
    flagged: total >= 20 && rate > AGREEMENT_FLAG_THRESHOLD,
    threshold: AGREEMENT_FLAG_THRESHOLD,
  };
}

async function tryRedis(): Promise<typeof import("@/lib/redis").redis | null> {
  try {
    const { redis } = await import("@/lib/redis");
    // Prefer memory if Redis is not already ready — avoid blocking score path on connect.
    if (redis.status !== "ready") return null;
    return redis;
  } catch {
    return null;
  }
}

/**
 * Record first-pass Call B YES/NO outcomes for a graded submission.
 * Logs a WARNING when the rolling agreement rate exceeds the flag threshold.
 */
export async function recordAuditAgreement(
  event: AuditAgreementEvent,
): Promise<AuditAgreementSnapshot> {
  const bits: number[] = [];
  for (let i = 0; i < event.agreed; i++) bits.push(1);
  for (let i = 0; i < Math.max(0, event.total - event.agreed); i++) bits.push(0);

  let snap: AuditAgreementSnapshot;

  const redis = await tryRedis();
  if (redis) {
    try {
      if (bits.length) {
        await redis.lpush(REDIS_KEY, ...bits.map(String));
        await redis.ltrim(REDIS_KEY, 0, WINDOW - 1);
      }
      const stored = await redis.lrange(REDIS_KEY, 0, WINDOW - 1);
      snap = snapshotFromBits(stored.map((x) => (x === "1" ? 1 : 0)));
    } catch {
      pushMemory(bits);
      snap = snapshotFromBits([...memoryRing]);
    }
  } else {
    pushMemory(bits);
    snap = snapshotFromBits([...memoryRing]);
  }

  const payload = {
    moduleCode: event.moduleCode,
    submissionAgreed: event.agreed,
    submissionTotal: event.total,
    firstPassRejects: event.firstPassRejects,
    rolling: snap,
  };

  if (snap.flagged) {
    log.warn(
      payload,
      `AUDIT AGREEMENT FLAG: rolling Call A↔B agreement ${(snap.rate * 100).toFixed(1)}% exceeds ${(AGREEMENT_FLAG_THRESHOLD * 100).toFixed(0)}% — Call B may not be acting independently; review prompts/context leakage`,
    );
  } else {
    log.info(payload, "audit agreement recorded");
  }

  return snap;
}

/** Read current rolling snapshot (for dashboards / eval scripts). */
export async function getAuditAgreementSnapshot(): Promise<AuditAgreementSnapshot> {
  const redis = await tryRedis();
  if (redis) {
    try {
      const stored = await redis.lrange(REDIS_KEY, 0, WINDOW - 1);
      if (stored.length) return snapshotFromBits(stored.map((x) => (x === "1" ? 1 : 0)));
    } catch {
      /* fall through */
    }
  }
  return snapshotFromBits([...memoryRing]);
}
