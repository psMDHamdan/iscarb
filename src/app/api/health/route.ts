/**
 * Health Check API — lightweight readiness probe for infrastructure dependencies.
 * ===========================================================================
 * GET /api/health — Returns status of PostgreSQL, Redis, and Fuseki.
 *   200 = PostgreSQL and Redis are healthy (Fuseki optional)
 *   503 = PostgreSQL or Redis is down
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

  const coreHealthy = postgres.status === "ok" && redis.status === "ok";
  const commitSha = process.env.GIT_COMMIT_SHA?.trim() || "unknown";

  return NextResponse.json(
    {
      status: coreHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      commitSha,
      checks: { postgres, redis, fuseki },
    },
    {
      status: coreHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
