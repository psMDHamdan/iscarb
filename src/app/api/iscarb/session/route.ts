import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { db } from "@/lib/db";

/**
 * GET /api/iscarb/session — the current caller's identity essentials, so the
 * client can apply role-based navigation (which views to show). Any authenticated
 * role may read its own session. No secrets are exposed — just the role and the
 * tenant/student anchors the UI already needs.
 *
 * Self-healing: if a student user has no linked Student record (e.g. old JWT
 * cookie from before Student auto-creation was added), this endpoint creates one
 * on the fly so the UI never sees a null studentId for a student-role session.
 *
 * Security note: this only drives UX (which buttons to render). The actual
 * authorization boundary is enforced server-side on each sensitive route via
 * `guard({ roles: [...] })`.
 */
export const GET = guard({ tier: "read" }, async (_req, ctx) => {
  let { role, universityCode, studentId } = ctx.session;

  // Self-heal: if the user has role "student" but no studentId, look up or
  // create the Student record right now.
  if (role === "student" && !studentId) {
    try {
      let student = await db.student.findFirst({
        where: { userId: ctx.session.userId },
        select: { id: true },
      });
      if (!student) {
        const user = await db.user.findUnique({
          where: { id: ctx.session.userId },
          select: { email: true, name: true, universityId: true },
        });
        if (user?.email) {
          const email = user.email;
          const emailStudent = await db.student.findFirst({
            where: { email },
            select: { id: true, userId: true },
          });
          if (emailStudent) {
            // Found by email — link it if not already linked
            student = emailStudent;
            if (!emailStudent.userId) {
              await db.student.update({
                where: { id: emailStudent.id },
                data: { userId: ctx.session.userId },
              });
            }
          } else {
            student = await db.student.create({
              data: {
                email,
                name: user.name || email.split("@")[0],
                userId: ctx.session.userId,
                universityId: user.universityId || ctx.session.universityId,
                college: "Undeclared",
                program: "Undeclared",
                cohort: new Date().getFullYear().toString(),
              },
              select: { id: true, userId: true },
            });
          }
        }
      }
      if (student) {
        studentId = student.id;
      }
    } catch (err) {
      console.error("Session self-heal: failed to resolve Student record", err);
      // non-fatal — studentId stays null, downstream will show a login prompt
    }
  }

  return NextResponse.json(
    { role, universityCode, studentId },
    { headers: { "Vary": "Authorization", "Cache-Control": "private, no-store" } },
  );
});
