/**
 * Ownership verification helpers for API endpoints.
 * Prevents IDOR (Insecure Direct Object Reference) vulnerabilities.
 */
import type { Session } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Verify a student ID matches the caller or the caller is an admin.
 * Students can only access their own data; admins can access any student.
 */
export async function verifyStudentAccess(
  studentId: string,
  session: Session
): Promise<boolean> {
  // Admin bypass
  if (["admin", "faculty", "dean", "university_admin"].includes(session.role)) {
    return true;
  }

  // Student can access their own record via session.studentId
  if (session.role === "student") {
    return session.studentId === studentId;
  }

  return false;
}

/**
 * Verify portfolio ownership or admin access.
 */
export async function verifyPortfolioAccess(
  portfolioId: string,
  session: Session
): Promise<boolean> {
  if (["admin", "faculty", "dean", "university_admin"].includes(session.role)) {
    return true;
  }

  if (session.role === "student" && session.studentId) {
    const portfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
      select: { studentId: true },
    });
    return portfolio?.studentId === session.studentId;
  }

  return false;
}

/**
 * Verify enrollment access - student can access their own, faculty/admin can access any.
 */
export async function verifyEnrollmentAccess(
  enrollmentId: string,
  session: Session
): Promise<boolean> {
  if (["admin", "faculty", "dean", "university_admin"].includes(session.role)) {
    return true;
  }

  if (session.role === "student" && session.studentId) {
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { studentId: true },
    });
    return enrollment?.studentId === session.studentId;
  }

  return false;
}
