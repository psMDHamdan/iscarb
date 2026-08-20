/**
 * Lecture Planning — Jaheziah decision (BRD §3.4, FR-016 AC-29/30).
 * ===========================================================================
 * POST /api/iscarb/lecture/projects/[id]/jaheziah-eligibility/decision
 *
 *   action: "confirm" — faculty confirms the candidate specialty → project
 *           nationalAlignmentMode = OFFICIAL_JAHEZIAH, specialty updated
 *   action: "reject"  — faculty rejects → mode = COURSE_READINESS
 *
 * Records the decision (decidedBy/decidedAt) for audit.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { z } from "zod";

const decisionSchema = z.object({
  action: z.enum(["confirm", "reject"]),
  specialtyKey: z.string().min(1).optional(),
});

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await db.lectureProject.findFirst({
      where: { id, tenantId },
      include: { courseProfile: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const eligibility = await db.lectureAlignmentEligibility.findUnique({ where: { projectId: id } });
    if (!eligibility || eligibility.mode !== "CONFIRM_REQUIRED") {
      return NextResponse.json(
        { error: "NO_PENDING_CONFIRMATION", message: "No specialty confirmation is pending for this project." },
        { status: 409 }
      );
    }

    const decide = (mode: string, extra: object) =>
      db.$transaction([
        db.lectureAlignmentEligibility.update({
          where: { projectId: id },
          data: { mode, decidedBy: ctx.session.userId, decidedAt: new Date(), ...extra },
        }),
        db.lectureProject.update({
          where: { id },
          data: { nationalAlignmentMode: mode },
        }),
      ]);

    if (parsed.data.action === "reject") {
      await decide("COURSE_READINESS", {});
    } else {
      // AC-28: faculty may confirm the detected candidate or override with
      // their own specialtyKey from the body.
      const confirmedKey = parsed.data.specialtyKey ?? eligibility.candidateSpecialtyKey;
      if (!confirmedKey) {
        return NextResponse.json({ error: "NO_CANDIDATE_SPECIALTY" }, { status: 400 });
      }
      await decide("OFFICIAL_JAHEZIAH", {});
      // Specialty confirmed on the course profile so it stays Jaheziah-mappable.
      await db.lectureCourseProfile.update({
        where: { id: project.courseProfileId },
        data: { specialty: confirmedKey },
      });
    }

    return NextResponse.json({ projectId: id, mode: parsed.data.action === "confirm" ? "OFFICIAL_JAHEZIAH" : "COURSE_READINESS" });
  }
);
