/**
 * iSCARB API Guard — wraps a route handler with auth + rate-limit + observability.
 * ===========================================================================
 * Usage in any /api/iscarb route:
 *
 *   export const GET = guard({ tier: "read", roles: ["admin","dean","faculty"] }, async (req, ctx) => {
 *     const students = await db.student.findMany({ where: tenantScope(ctx.session) });
 *     return NextResponse.json({ students });
 *   });
 *
 * The guard:
 *   1. Authenticates the request (Bearer JWT or x-iscarb-key; dev bypass in non-prod)
 *   2. Enforces sliding-window rate limits per tier
 *   3. Opens an OpenTelemetry span + captures exceptions to Sentry
 *   4. Returns standard JSON errors (401/403/429/500) with rate-limit headers
 * ===========================================================================
 */
import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { getSession, AuthError, requireRole, type Session } from "@/lib/auth";
import { rateLimit, rateLimitHeaders, type RateLimitResult } from "@/lib/rate-limit";
import { captureError, startSpan } from "@/lib/observability";
import { moduleLogger } from "@/lib/logger";
import { setTenantContext } from "@/lib/db-rls";
import { Prisma } from "@prisma/client";
import { NextResponse as NR } from "next/server";
// Re-export tenantWhere from its canonical location so existing imports keep working
export { tenantWhere } from "@/config/tenant";

type Tier = "ai" | "write" | "read";

const log = moduleLogger("api-guard");

export interface GuardContext {
  session: Session;
  /** tenantScope where-clause for Prisma queries (multi-tenancy). */
  tenant: { universityId?: string | null };
}

function jsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
  return NR.json({ error: message, ...extra }, { status });
}

export function guard(
  opts: {
    tier: Tier;
    roles?: Parameters<typeof requireRole>[1][];
    /** Alias used by older v1 routes — treated the same as `roles`. */
    allowedRoles?: Parameters<typeof requireRole>[1][];
    requireTenant?: boolean;
    auditLog?: boolean;
  },
  handler: (req: NextRequest, ctx: GuardContext, ...args: any[]) => Promise<Response | NextResponse>
): (req: NextRequest, ...args: any[]) => Promise<Response> {
  const roles = opts.roles?.length ? opts.roles : opts.allowedRoles;
  return async (req: NextRequest, ...args: any[]) => {
    const route = new URL(req.url).pathname;
    const method = req.method;
    const t0 = Date.now();
    let span: { end: () => void } | null = null;
    try {
      span = startSpan(`api ${method} ${route}`);
      // 1. Auth
      let session: Session;
      try {
        session = await getSession(req);
      } catch (e) {
        if (e instanceof AuthError) {
          log.warn({ route, method, status: e.statusCode, reason: e.message }, "auth rejected");
          return jsonError(e.message, e.statusCode);
        }
        throw e;
      }
      // 2. Role check (optional)
      if (roles && roles.length) {
        const normalizedRoles = roles.map(r => r.toLowerCase().replace(/\s+/g, '_')) as typeof roles;
        try {
          requireRole(session, ...normalizedRoles);
        } catch (e) {
          if (e instanceof AuthError) {
            log.warn({ route, method, role: session.role, required: roles }, "forbidden");
            return jsonError(e.message, e.statusCode);
          }
          throw e;
        }
      }
      // 2.5. Pre-validate session fields required by student routes
      // Bypassed: We now rely on enrichSessionStudentId to lazily auto-create and bind student rows
      // so new student sign-ups don't crash before their JWT gets updated.
      // 2.6. Set tenant context for RLS policies (Section 11.1.1)
      await setTenantContext(session.universityId);
      // 3. Rate limit
      const identity = session.userId || session.authMethod;
      const rl: RateLimitResult = await rateLimit(req, opts.tier, identity);
      if (!rl.allowed) {
        log.warn({ route, method, tier: opts.tier, identity, limit: rl.limit }, "rate limit exceeded");
        const res = jsonError("Rate limit exceeded", 429, { retryAfterMs: rl.resetMs });
        rateLimitHeaders(res, rl);
        return res;
      }
      // 4. Run handler with tenant scope context
      const ctx: GuardContext = {
        session,
        tenant: session.universityId ? { universityId: session.universityId } : {},
      };
      const result = await handler(req, ctx, ...args);
      // Attach rate-limit headers if it's a Response
      if (result instanceof Response) rateLimitHeaders(result, rl);
      const status = result instanceof Response ? result.status : 200;
      log.info(
        { route, method, status, tier: opts.tier, tenant: session.universityCode, ms: Date.now() - t0, remaining: rl.remaining },
        "request ok"
      );
      return result as Response;
    } catch (err) {
      captureError(err as Error, { route, method });
      log.error({ route, method, err: (err as Error).message, stack: (err as Error).stack, ms: Date.now() - t0 }, "request failed");

      // Auth errors that escaped the handler
      if (err instanceof AuthError) {
        return jsonError(err.message, err.statusCode);
      }

      // Prisma database errors
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
          case "P2025":
            return jsonError("Record not found", 404);
          case "P2002":
            return jsonError("Duplicate record", 409);
          case "P2003":
            return jsonError("Foreign key constraint failed", 400);
          default:
            return jsonError("Database error", 500);
        }
      }
      if (err instanceof Prisma.PrismaClientInitializationError) {
        return jsonError("Database connection failed", 503);
      }

      // Known application errors with status codes
      if (err instanceof Error && "statusCode" in err && typeof (err as any).statusCode === "number") {
        return jsonError(err.message, (err as any).statusCode);
      }

      return jsonError("Internal server error", 500);
    } finally {
      if (span) span.end();
    }
  };
}
