import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from './ApiError';
import { ApiResponse } from './ApiResponse';

export type RateLimitTier = 'Public' | 'Standard' | 'Admin' | 'AI' | 'Login';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const TIER_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  Public:   { limit: 10,   windowMs: 60 * 1000 },       // 10 req/min
  Standard: { limit: 1000, windowMs: 60 * 60 * 1000 },  // 1000 req/hour
  Admin:    { limit: 5000, windowMs: 60 * 60 * 1000 },  // 5000 req/hour
  AI:       { limit: 100,  windowMs: 60 * 1000 },       // 100 req/min
  Login:    { limit: 5,    windowMs: 60 * 1000 },       // 5 req/min
};

// In-memory store for V1. In production, this should be backed by Redis.
const store = new Map<string, { count: number, resetAt: number }>();

export class RateLimiter {
  /**
   * Checks the rate limit for a given identifier (IP or User ID) and tier.
   * Throws ApiError.RateLimited if exceeded.
   */
  static async check(identifier: string, tier: RateLimitTier) {
    const config = TIER_CONFIGS[tier];
    const key = `ratelimit:${tier}:${identifier}`;
    const now = Date.now();

    let record = store.get(key);

    // Clean up expired record
    if (record && now > record.resetAt) {
      store.delete(key);
      record = undefined;
    }

    if (!record) {
      record = { count: 1, resetAt: now + config.windowMs };
      store.set(key, record);
    } else {
      record.count++;
      if (record.count > config.limit) {
        throw ApiError.RateLimited(`Rate limit exceeded for tier: ${tier}`);
      }
    }

    return {
      limit: config.limit,
      remaining: Math.max(0, config.limit - record.count),
      reset: Math.floor(record.resetAt / 1000) // Unix seconds
    };
  }

  /**
   * Middleware wrapper to apply rate limiting to a Next.js route handler.
   */
  static withRateLimit(tier: RateLimitTier, handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      try {
        // Fallback to generic IP if user is not authenticated yet
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        
        // For authenticated routes, we would ideally extract the userId from the session here,
        // but for a generic middleware wrapping, IP is the safest fallback.
        
        const rateLimitInfo = await this.check(ip, tier);

        const response: NextResponse = await handler(req, ...args);

        // Append standard rate limit headers
        response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString());

        return response;
      } catch (error: any) {
        if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
          return ApiResponse.error(error);
        }
        throw error;
      }
    };
  }
}
