/**
 * Health Check API — lightweight readiness probe for infrastructure dependencies.
 * ===========================================================================
 * GET /api/health — Returns status of PostgreSQL, Redis, and Fuseki.
 *   200 = PostgreSQL is healthy (other services may be degraded)
 *   503 = PostgreSQL is down
 * ===========================================================================
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redisHealthCheck } from "@/config/redis";
import { rdfClient } from "@/services/rdf/rdf-client.service";

export const dynamic = "force-dynamic";

interface CheckResult {
  status: "ok" | "error";
  latencyMs: number;
  error?: string;
}

async function checkPostgres(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const ok = await redisHealthCheck();
    return { status: ok ? "ok" : "error", latencyMs: Date.now() - t0, ...(ok ? {} : { error: "ping failed" }) };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

async function checkFuseki(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const ok = await rdfClient.healthCheck();
    return { status: ok ? "ok" : "error", latencyMs: Date.now() - t0, ...(ok ? {} : { error: "unreachable" }) };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function GET() {
  const [postgres, redis, fuseki] = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkFuseki(),
  ]);

  const allHealthy = postgres.status === "ok" && redis.status === "ok" && fuseki.status === "ok";

  return NextResponse.json(
    {
      status: postgres.status === "ok" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks: { postgres, redis, fuseki },
    },
    { status: postgres.status === "ok" ? 200 : 503 },
  );
}
