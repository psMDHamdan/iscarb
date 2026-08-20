/**
 * API Helpers — pure functions for HMAC, rate-limit math, key hashing, versioning.
 * No side effects. No DB. No imports beyond Node built-ins.
 */

import crypto from 'crypto';

// ================================================================
// HMAC Signature Generation & Validation
// ================================================================

/** Generate an HMAC-SHA256 signature of a payload using the given secret. */
export function hmacSign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

/** Validate an HMAC-SHA256 signature using constant-time comparison. */
export function hmacVerify(payload: string, signature: string, secret: string): boolean {
  const expected = hmacSign(payload, secret);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

// ================================================================
// API Key Hash Generation & Validation
// ================================================================

/** Generate a random API key (prefix + random bytes). */
export function generateApiKey(prefix = 'iscarb'): string {
  const random = crypto.randomBytes(24).toString('base64url');
  return `${prefix}_${random}`;
}

/** Hash an API key using SHA-256 for secure storage (not reversible). */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key, 'utf8').digest('hex');
}

// ================================================================
// Rate Limit Calculation Helpers
// ================================================================

export interface RateLimitConfig {
  /** Max requests in the hourly window. */
  hourlyLimit: number;
  /** Max requests in the burst (per-minute) window. */
  burstLimit: number;
  /** Duration of hourly window in ms. */
  hourlyWindowMs: number;
  /** Duration of burst window in ms. */
  burstWindowMs: number;
}

/** Default config: 1000 req/hr, 50 req/min burst. */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  hourlyLimit: 1000,
  burstLimit: 50,
  hourlyWindowMs: 60 * 60 * 1000,
  burstWindowMs: 60 * 1000,
};

export interface RateCheckResult {
  allowed: boolean;
  hourlyRemaining: number;
  burstRemaining: number;
  /** Time in ms until the hourly limit resets. */
  hourlyResetMs: number;
  /** Time in ms until the burst limit resets. */
  burstResetMs: number;
  /** Which limit was exceeded, or null. */
  exceeded: 'hourly' | 'burst' | null;
}

/** Check both hourly and burst windows. Returns which limit was exceeded (if any). */
export function checkRateLimit(
  hourlyHits: number[],
  burstHits: number[],
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
  now = Date.now()
): RateCheckResult {
  const hourlyWindowStart = now - config.hourlyWindowMs;
  const burstWindowStart = now - config.burstWindowMs;

  const activeHourly = hourlyHits.filter(ts => ts > hourlyWindowStart);
  const activeBurst = burstHits.filter(ts => ts > burstWindowStart);

  const hourlyRemaining = Math.max(0, config.hourlyLimit - activeHourly.length);
  const burstRemaining = Math.max(0, config.burstLimit - activeBurst.length);

  const hourlyResetMs = activeHourly.length > 0
    ? activeHourly[0] + config.hourlyWindowMs - now
    : config.hourlyWindowMs;
  const burstResetMs = activeBurst.length > 0
    ? activeBurst[0] + config.burstWindowMs - now
    : config.burstWindowMs;

  let exceeded: 'hourly' | 'burst' | null = null;
  if (activeHourly.length >= config.hourlyLimit) exceeded = 'hourly';
  else if (activeBurst.length >= config.burstLimit) exceeded = 'burst';

  return {
    allowed: exceeded === null,
    hourlyRemaining,
    burstRemaining,
    hourlyResetMs,
    burstResetMs,
    exceeded,
  };
}

// ================================================================
// API Version Negotiation
// ================================================================

export type ApiVersion = 'v1' | 'v2';

/** Determine the API version from a request's URL or Accept header. */
export function negotiateVersion(
  urlPath: string,
  acceptHeader: string | null
): ApiVersion {
  // Check URL path first
  if (urlPath.includes('/api/v2/')) return 'v2';
  if (urlPath.includes('/api/v1/')) return 'v1';

  // Fall back to Accept header: application/vnd.iscarb.v2+json
  if (acceptHeader?.includes('v2')) return 'v2';
  if (acceptHeader?.includes('v1')) return 'v1';

  return 'v1'; // default
}

/** Check if a date is within the v1/v2 overlap window (12 months from v2 launch). */
export function isWithinOverlapWindow(v2LaunchDate: Date, now = new Date()): boolean {
  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
  return now.getTime() - v2LaunchDate.getTime() < twelveMonthsMs;
}

// ─── Response envelope (masterplan §12 API conventions) ─────────────────────
// The standard success/error JSON envelope used across v1 route handlers.
import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown): NextResponse {
  return NextResponse.json(
    { success: false, error: message, ...(details !== undefined ? { details } : {}) },
    { status },
  );
}
