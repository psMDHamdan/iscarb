/**
 * next-auth compatibility layer.
 * ===========================================================================
 * next-auth is not installed (see prisma/schema.prisma note); the platform's
 * canonical auth is the HS256 JWT session in src/lib/auth.ts. Routes written
 * against `getServerSession(authOptions)` get the same shape ({ user: { id,
 * role } } | null) sourced from the real session cookie / dev bypass, so they
 * work unchanged under the one auth system.
 */
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export interface CompatSession {
  user: { id: string; role: string; studentId: string | null };
}

export async function getServerSession(_options?: unknown): Promise<CompatSession | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    // Rebuild a minimal NextRequest so the canonical getSession() does the
    // verification (including the fail-closed dev-bypass rules).
    const req = new NextRequest("http://internal/session", {
      headers: token ? { cookie: `${SESSION_COOKIE}=${token}` } : {},
    });
    const session = await getSession(req);
    return { user: { id: session.userId, role: session.role, studentId: session.studentId } };
  } catch {
    return null;
  }
}

/** Placeholder for legacy `import { authOptions } from '@/lib/auth'` call sites. */
export const authOptions = {};
