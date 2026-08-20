import "server-only";
import { db } from "@/lib/db";
import type { Session } from "@/lib/auth";
import { resolveStudentIdForCaller } from "@/lib/assessment/ownership";

export type OwnedStudentResolution =
  | { ok: true; studentId: string }
  | { ok: false; status: 400 | 403 | 404; error: string };

/**
 * Read-only lookup of the Student row that genuinely belongs to this session:
 * the `studentId` claim, then the User→Student link by userId, then by email.
 * Never falls back to an unfiltered `findFirst` and never creates a row.
 */
async function findOwnStudent(session: Session): Promise<{ id: string } | null> {
  // Prefer the User→Student link over a stale JWT studentId claim.
  if (session.userId) {
    const byUser = await db.student.findFirst({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (byUser) return byUser;

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    });
    if (user?.email) {
      const byEmail = await db.student.findFirst({
        where: { email: user.email },
        select: { id: true },
      });
      if (byEmail) return byEmail;
    }
  }

  if (session.studentId) {
    const claimed = await db.student.findUnique({
      where: { id: session.studentId },
      select: { id: true },
    });
    if (claimed) return claimed;
  }

  return null;
}

/**
 * Ownership-safe resolution for endpoints that emit score-bearing artifacts.
 *
 * Unlike `resolveStudentIdFromSession`, an unresolved caller is an error rather
 * than a reason to borrow an arbitrary Student row or invent a new one — a
 * retarget there silently attributes one candidate's results to another.
 */
export async function resolveOwnedStudentId(
  session: Session,
  requestedStudentId?: string,
): Promise<OwnedStudentResolution> {
  const requested = requestedStudentId?.trim() || undefined;

  if (session.role === "student") {
    const own = await findOwnStudent(session);
    if (!own) return { ok: false, status: 404, error: "Student not found" };
    // Ignore stale/tampered body.studentId — students can only ever bind to self.
    return { ok: true, studentId: own.id };
  }

  if (!requested) return { ok: false, status: 400, error: "studentId is required" };

  const exists = await db.student.findUnique({
    where: { id: requested },
    select: { id: true },
  });
  if (!exists) return { ok: false, status: 404, error: "Student not found" };

  return { ok: true, studentId: exists.id };
}

/**
 * Older session cookies may lack the `studentId` claim. Resolve it from the
 * User → Student link (by userId, then email) so assessment write paths work.
 * Auto-creates the Student row if it does not exist yet.
 */
export async function enrichSessionStudentId(session: Session): Promise<Session> {
  if (session.role !== "student") return session;
  if (session.studentId) {
    const exists = await db.student.findUnique({ where: { id: session.studentId }, select: { id: true } });
    if (exists) return session;
  }

  let linked: { id: string } | null = null;

  if (session.userId) {
    linked = await db.student.findFirst({
      where: { userId: session.userId },
      select: { id: true },
    });
  }

  if (!linked) {
    let emailToUse = session.email;
    if (!emailToUse && session.userId) {
      const user = await db.user.findUnique({
        where: { id: session.userId },
        select: { email: true },
      });
      emailToUse = user?.email;
    }

    if (emailToUse) {
      linked = await db.student.findFirst({
        where: { email: emailToUse },
        select: { id: true },
      });

      if (linked && session.userId) {
        await db.student.update({
          where: { id: linked.id },
          data: { userId: session.userId },
        });
      }

      if (!linked) {
        try {
          linked = await db.student.create({
            data: {
              userId: session.userId || undefined,
              email: emailToUse,
              name: emailToUse.split("@")[0],
              specialization: "General Studies",
            },
            select: { id: true },
          });
        } catch {
          linked = await db.student.findFirst({
            where: { email: emailToUse },
            select: { id: true },
          });
        }
      }
    }
  }

  if (!linked) {
    // Fail closed — never bind the session to an arbitrary student row.
    return session;
  }

  return { ...session, studentId: linked.id };
}

export async function resolveStudentIdFromSession(
  session: Session,
  requestedStudentId?: string
) {
  const enriched = await enrichSessionStudentId(session);

  // If caller is a student, always use their own resolved studentId
  if (enriched.role === "student") {
    if (enriched.studentId) {
      const exists = await db.student.findUnique({
        where: { id: enriched.studentId },
        select: { id: true },
      });
      if (exists) {
        return { ok: true as const, studentId: exists.id };
      }
    }
    return {
      ok: false as const,
      status: 404 as const,
      message: "Student not found for session",
    };
  }

  // Faculty/admin: require an explicit studentId (no arbitrary findFirst).
  if (requestedStudentId) {
    const exists = await db.student.findUnique({
      where: { id: requestedStudentId },
      select: { id: true },
    });
    if (exists) {
      const access = resolveStudentIdForCaller(enriched, requestedStudentId);
      if (access.ok) return access;
      return access;
    }
    return { ok: false as const, status: 404 as const, message: "Student not found" };
  }

  return resolveStudentIdForCaller(enriched, requestedStudentId);
}
