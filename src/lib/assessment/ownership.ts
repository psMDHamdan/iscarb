/**
 * Assessment API — fail-closed student ownership and role checks.
 * Pure helpers (no DB) so route handlers and unit tests share one matrix.
 */
import type { Role, Session } from "@/lib/auth";

export type AssessmentEndpoint = "modules_get" | "score_post" | "profile_get" | "profile_post";

export const FORBIDDEN_MESSAGE = "Forbidden";
export const FORBIDDEN_OWN_MESSAGE = "Forbidden — you may only access your own assessment data";

const ENDPOINT_ROLES: Record<AssessmentEndpoint, Role[]> = {
  modules_get: ["student", "faculty", "dean", "admin"],
  score_post: ["student", "faculty", "admin"],
  profile_get: ["student", "faculty", "dean", "admin", "recruiter"],
  profile_post: ["student", "faculty", "admin"],
};

export type AccessOk = { ok: true };
export type AccessDenied = { ok: false; status: 403; message: string };

export function isRoleAllowedForEndpoint(session: Session, endpoint: AssessmentEndpoint): boolean {
  if (session.authMethod === "dev") return true;
  if (session.scopes.includes("*")) return true;
  return ENDPOINT_ROLES[endpoint].includes(session.role);
}

export function assertEndpointRole(session: Session, endpoint: AssessmentEndpoint): AccessOk | AccessDenied {
  if (isRoleAllowedForEndpoint(session, endpoint)) return { ok: true };
  return { ok: false, status: 403, message: FORBIDDEN_MESSAGE };
}

/**
 * Fail-closed ownership for student sessions.
 * - Students without a `studentId` claim → 403
 * - Students always act as themselves. A stale or tampered requested id is
 *   ignored (never used to read another student, never used to block own work).
 * - Other roles pass through with the requested id
 */
export function assertStudentAccess(
  session: Session,
  requestedStudentId: string,
): { ok: true; studentId: string } | AccessDenied {
  if (session.role !== "student") {
    return { ok: true, studentId: requestedStudentId };
  }
  if (!session.studentId) {
    return { ok: false, status: 403, message: FORBIDDEN_OWN_MESSAGE };
  }
  return { ok: true, studentId: session.studentId };
}

/**
 * For student callers, returns the bound studentId (ignores tampered body/query).
 * For others, returns the requested id when present.
 */
export function resolveStudentIdForCaller(
  session: Session,
  requestedStudentId: string | undefined,
): { ok: true; studentId: string } | AccessDenied | { ok: false; status: 400; message: string } {
  if (session.role === "student") {
    if (!session.studentId) {
      return { ok: false, status: 403, message: FORBIDDEN_OWN_MESSAGE };
    }
    return { ok: true, studentId: session.studentId };
  }
  if (!requestedStudentId?.trim()) {
    return { ok: false, status: 400, message: "studentId is required" };
  }
  return { ok: true, studentId: requestedStudentId.trim() };
}

export function assertRecruiterDiscoverable(discoverable: boolean): AccessOk | AccessDenied {
  if (discoverable) return { ok: true };
  return { ok: false, status: 403, message: FORBIDDEN_MESSAGE };
}
