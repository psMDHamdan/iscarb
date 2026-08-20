/**
 * iSCARB API Gateway
 * ===========================================================================
 * Centralized request handling with rate limiting, auth, versioning, and analytics.
 * ===========================================================================
 */
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

export interface GatewayConfig {
  rateLimitTier?: "ai" | "write" | "read";
  authRequired?: boolean;
  version?: string;
  analytics?: boolean;
}

export interface GatewayContext {
  userId?: string;
  apiKeyId?: string;
  universityId?: string;
  rateLimitResult?: {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetMs: number;
  };
}

/**
 * Apply rate limiting to an API request.
 */
export async function applyRateLimit(
  req: NextRequest,
  tier: "ai" | "write" | "read" = "read",
  identity?: string
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const result = await rateLimit(req, tier, identity);
  
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetMs.toString(),
  };

  if (!result.allowed) {
    return {
      allowed: false,
      headers: {
        ...headers,
        "Retry-After": Math.ceil(result.resetMs / 1000).toString(),
      },
    };
  }

  return { allowed: true, headers };
}

/**
 * Log API usage for analytics.
 */
export async function logApiUsage(params: {
  userId?: string;
  apiKeyId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  requestSize?: number;
  responseSize?: number;
  ipAddress?: string;
  userAgent?: string;
  universityId?: string;
}): Promise<void> {
  try {
    const logEntry = {
      ...params,
      createdAt: new Date().toISOString(),
    };

    // Store in Redis for fast writes, async flush to DB
    await redis.lpush("iscarb:api:logs", JSON.stringify(logEntry));
    await redis.ltrim("iscarb:api:logs", 0, 9999);

    // Track endpoint usage counts
    const today = new Date().toISOString().split("T")[0];
    await redis.hincrby(`iscarb:api:usage:${today}`, params.endpoint, 1);
    await redis.expire(`iscarb:api:usage:${today}`, 86400 * 7);
  } catch (error) {
    logger.error({ error, endpoint: params.endpoint }, "Failed to log API usage");
  }
}

/**
 * Get API usage statistics.
 */
export async function getApiUsageStats(date?: string): Promise<Record<string, number>> {
  const targetDate = date || new Date().toISOString().split("T")[0];
  const usage = await redis.hgetall(`iscarb:api:usage:${targetDate}`);
  return Object.fromEntries(
    Object.entries(usage).map(([key, value]) => [key, parseInt(value as string, 10)])
  );
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Create a gateway-wrapped route handler with rate limiting and analytics.
 */
export function withGateway(
  handler: (req: NextRequest, ctx: GatewayContext) => Promise<NextResponse>,
  config: GatewayConfig = {}
) {
  const { rateLimitTier = "read", analytics = true } = config;

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const clientIp = getClientIp(req);

    // Apply rate limiting
    const { allowed, headers: rateLimitHeaders } = await applyRateLimit(
      req,
      rateLimitTier,
      clientIp
    );

    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    // Create gateway context
    const ctx: GatewayContext = {
      ipAddress: clientIp,
    };

    // Call the handler
    const response = await handler(req, ctx);
    const latencyMs = Date.now() - startTime;

    // Add rate limit headers to response
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Log usage analytics
    if (analytics) {
      await logApiUsage({
        endpoint: req.nextUrl.pathname,
        method: req.method,
        statusCode: response.status,
        latencyMs,
        ipAddress: clientIp,
        userAgent: req.headers.get("user-agent") || undefined,
        userId: ctx.userId,
        apiKeyId: ctx.apiKeyId,
        universityId: ctx.universityId,
      });
    }

    return response;
  };
}
