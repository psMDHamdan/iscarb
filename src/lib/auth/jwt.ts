/**
 * iSCARB JWT Utilities — RS256 signing/verification with security event logging.
 * ===========================================================================
 * Implements:
 *   - signAccessToken() with exp = iat + 900 (15 min), alg: RS256
 *   - signRefreshToken() with exp = iat + 604800 (7 days)
 *   - verifyAccessToken() / verifyRefreshToken() that reject 'none' algorithm
 *   - OTel span event emission for 'jwt_none_algorithm_attempt' security events
 *
 * Requirements: 13.1, 13.4, 13.5
 * ===========================================================================
 */
import "server-only";
import * as jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

/** Custom error for JWT verification failures. */
export class JwtVerificationError extends Error {
  statusCode = 401;
  constructor(message: string = "Token invalid or expired") {
    super(message);
    this.name = "JwtVerificationError";
  }
}

/** Custom error for 'none' algorithm attempts. */
export class JwtNoneAlgorithmError extends Error {
  statusCode = 401;
  constructor(message: string = "JWT 'none' algorithm is not allowed") {
    super(message);
    this.name = "JwtNoneAlgorithmError";
  }
}

/** Read a secret either from an env var directly, or from a file path. */
function readSecret(name: string): string | undefined {
  const fileVar = process.env[`${name}_FILE`];
  if (fileVar) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs") as typeof import("fs");
      return fs.readFileSync(fileVar, "utf8").trim();
    } catch {
      return undefined;
    }
  }
  let val = process.env[name];
  if (val) {
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    return val.replace(/\\n/g, '\n');
  }
  return undefined;
}

/**
 * Read JWT keys for RS256 signing/verification.
 * JWT_PRIVATE_KEY and JWT_PUBLIC_KEY can be provided as env vars or via <NAME>_FILE.
 */
function getJwtKeys(): { privateKey: string; publicKey: string } {
  const privateKey = readSecret("JWT_PRIVATE_KEY");
  const publicKey = readSecret("JWT_PUBLIC_KEY");

  if (!privateKey || !publicKey) {
    throw new Error("JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be configured");
  }

  return { privateKey, publicKey };
}

/**
 * Emit OTel security event for 'none' algorithm attempts.
 * Uses the OpenTelemetry span API to record the security event.
 */
function emitJwtNoneSecurityEvent(token: string): void {
  try {
    const crypto = require("crypto") as typeof import("crypto");
    const span = (globalThis as unknown as { __iscarbTracer?: { startSpan: (n: string) => { end: () => void } } }).__iscarbTracer;
    if (span) {
      const securitySpan = span.startSpan("jwt_none_algorithm_attempt");
      securitySpan.end();
    }
    // Log the attempt for audit trails
    console.warn(`[security] JWT 'none' algorithm attempt detected. Header: ${token.split('.')[0]}`);
  } catch {
    // Silent fail if observability is not configured
  }
}

/**
 * Decode JWT header without verification to check the algorithm.
 */
function decodeJwtHeader(token: string): { alg: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }
    const headerB64 = parts[0];
    const headerJson = Buffer.from(headerB64, "base64").toString("utf8");
    return JSON.parse(headerJson) as { alg: string };
  } catch {
    throw new Error("Failed to decode JWT header");
  }
}

/**
 * Sign an access token with RS256 algorithm and 15-minute expiry.
 * 
 * @param payload - JWT payload (claims)
 * @returns Signed JWT string
 */
export function signAccessToken(payload: object): string {
  const { privateKey } = getJwtKeys();
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    { ...payload, iat: now, exp: now + 900 }, // 15 minutes
    privateKey,
    { algorithm: "RS256" }
  );
  return token;
}

/**
 * Sign a refresh token with RS256 algorithm and 7-day expiry.
 * 
 * @param payload - JWT payload (claims)
 * @returns Signed JWT string
 */
export function signRefreshToken(payload: object): string {
  const { privateKey } = getJwtKeys();
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    { ...payload, iat: now, exp: now + 604800 }, // 7 days
    privateKey,
    { algorithm: "RS256" }
  );
  return token;
}

/**
 * Verify an access token with RS256 algorithm.
 * Rejects tokens signed with 'none' algorithm and emits security event.
 * 
 * @param token - JWT string to verify
 * @returns Verified and decoded JWT payload
 */
export function verifyAccessToken(token: string): JwtPayload {
  return verifyJwtToken(token, "access");
}

/**
 * Verify a refresh token with RS256 algorithm.
 * Rejects tokens signed with 'none' algorithm and emits security event.
 * 
 * @param token - JWT string to verify
 * @returns Verified and decoded JWT payload
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return verifyJwtToken(token, "refresh");
}

/**
 * Internal verification logic for both access and refresh tokens.
 * Handles 'none' algorithm detection and security event emission.
 */
function verifyJwtToken(token: string, type: "access" | "refresh"): JwtPayload {
  // Step 1: Decode header to check algorithm before verification
  let header: { alg: string };
  try {
    header = decodeJwtHeader(token);
  } catch {
    throw new JwtVerificationError("Failed to decode JWT header");
  }

  // Step 2: Reject 'none' algorithm with security event
  if (header.alg.toLowerCase() === "none") {
    emitJwtNoneSecurityEvent(token);
    throw new JwtNoneAlgorithmError();
  }

  // Step 3: Verify token signature using public key
  const { publicKey } = getJwtKeys();
  
  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
    return decoded as JwtPayload;
  } catch (err) {
    // Requirement 13.4: Return HTTP 401 with structured error, don't expose underlying error
    throw new JwtVerificationError("Token invalid or expired");
  }
}
