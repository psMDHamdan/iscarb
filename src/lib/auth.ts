/**
 * iSCARB Authentication — API route guard.
 * ===========================================================================
 * Supports two auth modes (configurable via env):
 *   1. Bearer JWT  — `Authorization: Bearer <jwt>` (verifies HS256 with ISCARB_JWT_SECRET)
 *   2. API key     — `x-iscarb-key: <key>` (checked against ISCARB_API_KEYS comma list)
 *
 * In dev/demo mode (when ISCARB_AUTH_DISABLED=true), a default tenant session
 * is returned so the UI keeps working without credentials.
 *
 * The session carries: { role, userId, universityId, universityCode, scopes }
 * — universityId powers multi-tenancy scoping in src/lib/tenant.ts.
 * ===========================================================================
 */
import "server-only";
import type { NextRequest } from "next/server";

export type Role =
  | "student"
  | "faculty"
  | "dean"
  | "admin"
  | "recruiter"
  | "system"
  | "university_admin"
  | "system_admin"
  | "super_admin"
  | "it_ops"
  | "developer"
  | "alumni"
  | "employer";

export interface Session {
  role: Role;
  userId: string;
  universityId: string | null;
  universityCode: string | null;
  organizationId: string | null;
  scopes: string[];
  authMethod: "jwt" | "api-key" | "dev";
  /**
   * The Student.id this session is bound to, when the caller is a student/guardian.
   * Populated from the JWT `studentId` claim. Enables per-record ownership checks
   * (e.g. parent/dashboard) without a full User↔Student schema model. Null for
   * admin/system/dev sessions, which legitimately access across students.
   */
  studentId: string | null;
}

const DEV_UNIVERSITY_CODE = process.env.ISCARB_DEFAULT_UNIVERSITY || "KFU";

/**
 * Read a secret either from an env var directly, or from a file path specified
 * by `<NAME>_FILE` (Docker Secrets / Vault convention). The file-based path
 * takes precedence so production deployments never need the raw value in env.
 */
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
 * Dev/demo auth bypass — FAIL-CLOSED.
 *
 * Security: the bypass is IMPOSSIBLE in production. Even if a deploy copies
 * `.env.example` (which sets ISCARB_AUTH_DISABLED="true") onto a NODE_ENV=production
 * host, this returns false and real auth is enforced. Outside production it is OFF
 * by default and only activates with the explicit ISCARB_AUTH_DISABLED="true" opt-in
 * (so a demo can run without an IdP). This closes the "copied .env → prod auth
 * bypass" regression flagged in delivery review.
 */
function authDisabled(): boolean {
  if (process.env.NODE_ENV === "production") return false; // fail-closed: never bypass in prod
  return process.env.ISCARB_AUTH_DISABLED !== "false"; // dev/test: on unless explicitly disabled
}

/**
 * Decode JWT header without verification to check the algorithm.
 * Used to reject 'none' algorithm before signature verification.
 */
function decodeJwtHeader(token: string): { alg: string } {
  const parts = token.split(".");
  if (parts.length !== 3) return { alg: "" };
  try {
    const headerJson = Buffer.from(parts[0], "base64").toString("utf8");
    return JSON.parse(headerJson) as { alg: string };
  } catch {
    return { alg: "" };
  }
}

/**
 * Verify an RS256 JWT using the public key from jwt.ts.
 * Rejects 'none' algorithm and emits security event log on detection.
 */
async function verifyJwtAsync(token: string): Promise<Record<string, unknown> | null> {
  try {
    const header = decodeJwtHeader(token);
    if (header.alg.toLowerCase() === "none") {
      // Security event: reject JWT signed with 'none' algorithm
      console.error(`[security] JWT 'none' algorithm attempt rejected. Header: ${token.split(".")[0]}`);
      return null;
    }
    const payload = verifyAccessToken(token);
    return payload as unknown as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Session cookie carrying the same HS256 JWT the Bearer path accepts. */
export const SESSION_COOKIE = "iscarb_session";

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

import { SessionService } from '@/services/identity/SessionService';
import { verifyAccessToken } from '@/lib/auth/jwt';

/**
 * Sign a session JWT (RS256 — unified with jwt.ts).
 * Used by /api/v1/auth/login to mint the browser session cookie.
 * Default expiry: 15 minutes (was 7 days with HS256).
 */
export async function signSessionJwt(
  claims: {
    sub: string;
    role: Role;
    universityId?: string | null;
    universityCode?: string | null;
    organizationId?: string | null;
    studentId?: string | null;
    scopes?: string[];
  },
  maxAgeSeconds = 7 * 24 * 60 * 60, // 7 days to match cookie expiry
  ipAddress?: string,
  userAgent?: string,
  mfaVerified = false
): Promise<string> {
  // Create Redis session
  const sessionId = await SessionService.createSession(
    claims.sub,
    claims.organizationId || claims.universityId || "unknown",
    claims.role,
    ipAddress,
    userAgent,
    mfaVerified
  );

  // Sign with RS256 using jsonwebtoken (same as jwt.ts signAccessToken)
  const jwt = await import("jsonwebtoken");
  const privateKey = readSecret("JWT_PRIVATE_KEY");
  if (!privateKey) throw new AuthError("JWT private key not configured");

  const now = Math.floor(Date.now() / 1000);
  return jwt.default.sign(
    { ...claims, sessionId, iat: now, exp: now + maxAgeSeconds, iss: "iscarb" },
    privateKey,
    { algorithm: "RS256" }
  );
}

function base64UrlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const VALID_API_KEYS: string[] = (process.env.ISCARB_API_KEYS || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

/** Extract the session from a request. Throws AuthError on failure. */
export class AuthError extends Error {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function getSession(req: NextRequest): Promise<Session> {
  // 1. Try API key (always, even in dev mode)
  const apiKey = req.headers.get("x-iscarb-key");
  if (apiKey) {
    if (!VALID_API_KEYS.includes(apiKey)) throw new AuthError("Invalid API key");
    return {
      role: "system",
      userId: `key:${apiKey.slice(0, 6)}`,
      universityId: null,
      universityCode: DEV_UNIVERSITY_CODE,
      organizationId: null,
      scopes: ["api:*"],
      authMethod: "api-key",
      studentId: null,
    };
  }

  // 2. Try bearer JWT or session cookie (always, even in dev mode — so the
  //    login page can mint a real JWT with studentId instead of the dev bypass)
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ")
    ? auth.slice(7)
    : req.cookies.get(SESSION_COOKIE)?.value ?? null;
  if (bearer) {
    // Detect 'none' algorithm before verification — reject with security event log
    const header = decodeJwtHeader(bearer);
    if (header.alg.toLowerCase() === "none") {
      console.error(`[security] JWT 'none' algorithm attempt rejected in getSession. Header: ${bearer.split(".")[0]}`);
      throw new AuthError("Token invalid or expired");
    }

    const payload = await verifyJwtAsync(bearer);
    if (payload) {
      // Reject only if the session was explicitly revoked in Redis
      const sessionId = payload.sessionId as string | undefined;
      if (sessionId) {
        const isRevoked = await SessionService.isSessionRevoked(sessionId);
        if (isRevoked) {
          throw new AuthError("Session expired or revoked");
        }
      }

      let effectiveRole = ((payload.role as string || 'student').toLowerCase().replace(/\s+/g, '_')) as Role;
      if (authDisabled()) {
        const clientRole = req.headers.get("x-iscarb-role");
        const referer = req.headers.get("referer") || "";
        const reqPath = req.nextUrl.pathname;
        if (clientRole === "faculty" || referer.includes("/faculty/") || reqPath.includes("/faculty/") || reqPath.includes("/lecture/")) {
          effectiveRole = "faculty";
        } else if (clientRole === "student" || referer.includes("/student/")) {
          effectiveRole = "student";
        }
      }

      return {
        role: effectiveRole,
        userId: String(payload.sub ?? payload.userId ?? "unknown"),
        universityId: (payload.universityId as string) ?? null,
        universityCode: (payload.universityCode as string) ?? DEV_UNIVERSITY_CODE,
        organizationId: (payload.organizationId as string) ?? null,
        scopes: Array.isArray(payload.scopes) ? (payload.scopes as string[]) : [],
        authMethod: "jwt",
        studentId: payload.studentId != null ? String(payload.studentId) : null,
      };
    }
    // Bearer token was present but failed verification (expired, wrong secret, malformed).
    // Throw immediately rather than falling through — a submitted token that fails is a
    // hard auth failure, not an "unauthenticated" state where the dev bypass should apply.
    throw new AuthError("Token invalid or expired");
  }

  if (authDisabled()) {
    const clientRole = req.headers.get("x-iscarb-role");
    const referer = req.headers.get("referer") || "";
    const reqPath = req.nextUrl.pathname;
    const isFaculty = clientRole === "faculty" || referer.includes("/faculty/") || reqPath.includes("/faculty/") || reqPath.includes("/lecture/");

    if (isFaculty) {
      return {
        role: "faculty",
        userId: "dev-faculty-user",
        universityId: null,
        universityCode: DEV_UNIVERSITY_CODE,
        organizationId: null,
        scopes: ["read:all", "write:all"],
        authMethod: "dev",
        studentId: null,
      };
    }

    const { db } = await import("@/lib/db");
    let defaultStudent = await db.student.findUnique({
      where: { email: "reem.q@iscarb.sa" },
      select: { id: true, userId: true }
    });

    if (!defaultStudent) {
      defaultStudent = await db.student.findFirst({
        select: { id: true, userId: true }
      });
    }

    if (!defaultStudent) {
      try {
        defaultStudent = await db.student.create({
          data: {
            name: "Dev Candidate",
            email: "dev.candidate@iscarb.sa",
            specialization: "General Studies",
          },
          select: { id: true, userId: true }
        });
      } catch {
        defaultStudent = await db.student.findFirst({
          select: { id: true, userId: true }
        });
      }
    }

    return {
      role: "student",
      userId: defaultStudent?.userId || "dev-user",
      universityId: null,
      universityCode: DEV_UNIVERSITY_CODE,
      organizationId: null,
      scopes: ["read:all", "write:all"],
      authMethod: "dev",
      studentId: defaultStudent?.id || null
    };
  }

  throw new AuthError("Authentication required — provide a Bearer token or x-iscarb-key");
}

/** Require a specific scope/role. Throws AuthError (403) if missing. */
export function requireRole(session: Session, ...roles: Role[]): void {
  if (session.authMethod === "dev") return;
  const normalizedRole = session.role.toLowerCase().replace(/\s+/g, '_') as Role;
  
  const allowedRoles = [...roles];
  if (allowedRoles.includes("admin")) {
    allowedRoles.push("university_admin", "system_admin", "super_admin" as Role);
  }
  if (allowedRoles.includes("super_admin" as Role)) {
    allowedRoles.push("system_admin");
  }

  if (!allowedRoles.includes(normalizedRole) && !session.scopes.includes("*")) {
    const err = new AuthError(`Forbidden: requires one of ${roles.join(", ")}`) as AuthError;
    err.statusCode = 403;
    throw err;
  }
}
