/**
 * AI Metrics API — Production observability for AI operations.
 * ===========================================================================
 * GET /api/health/ai-metrics — Returns comprehensive AI metrics:
 *   - Requests per minute
 *   - Cache hit rate
 *   - P50/P95/P99 latency
 *   - 429 error rate
 *   - Provider breakdown
 *   - Feature breakdown
 *   - Concurrency state
 *
 * GET /api/health/ai-metrics/recent — Returns recent AI requests for debugging.
 *
 * GET /api/health/ai-metrics/quota?userId=xxx — Returns user quota status.
 */
import { NextResponse } from "next/server";
import { getMetrics, getRecentRequests } from "@/services/ai/metrics";
import { getConcurrencyState } from "@/services/ai/concurrency";
import { getCacheStats } from "@/services/ai/cache";
import { checkQuota, QUOTA_CONFIG } from "@/services/ai/quotas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Quota check
  if (path.endsWith("/quota")) {
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const quota = await checkQuota(userId);
    return NextResponse.json({
      ...quota,
      config: QUOTA_CONFIG,
    });
  }

  // Recent requests
  if (path.endsWith("/recent")) {
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
    const requests = await getRecentRequests(limit);
    return NextResponse.json({ requests });
  }

  // Full metrics
  const date = url.searchParams.get("date") ?? undefined;
  const [metrics, concurrency, cacheStats] = await Promise.all([
    getMetrics(date),
    getConcurrencyState(),
    getCacheStats(),
  ]);

  return NextResponse.json({
    ...metrics,
    concurrency,
    cache: cacheStats,
    timestamp: new Date().toISOString(),
  });
}
