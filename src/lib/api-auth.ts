/**
 * Compatibility auth helper for legacy `/api/v1/faculty/*` routes.
 * Prefer `guard()` for new routes — this only provides session extraction.
 */
import "server-only";
import type { NextRequest } from "next/server";
import { getSession, AuthError } from "@/lib/auth";
import type { GuardContext } from "@/lib/api-guard";

/**
 * Authenticate the request and return a GuardContext-shaped object.
 * Throws AuthError (catch and map to 401/403 in route handlers).
 */
export async function verifyAuth(req: NextRequest): Promise<GuardContext> {
  const session = await getSession(req);
  return {
    session,
    tenant: session.universityId ? { universityId: session.universityId } : {},
  };
}

export { AuthError };
