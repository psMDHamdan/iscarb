/**
 * Lecture Planning — CLO entry & approval (BRD §6.1, FR-004, AC-15).
 * ===========================================================================
 * PUT /api/iscarb/lecture/projects/[id]/clos
 *
 * Faculty enters 1–5 CLOs, selects which apply to this lecture, and the
 * submission approves them (cloApprovedBy = session user, cloApprovedAt = now).
 * Approved CLO text is immutable (post-approval edits are rejected). Approval
 * is the prerequisite gate for plan generation.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  assertApprovedCloTextImmutable,
  validateCloSelection,
} from "@/lib/lecture/planner/clo-validator";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";

const cloSchema = z.object({
  id: z.string().min(1),
  number: z.string().min(1),
  text: z.string().min(1),
  bloomLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]),
  weight: z.number().min(0).max(100),
});

const bodySchema = z.object({
  teacherEnteredClos: z.array(cloSchema).min(1),
  selectedLectureCloIds: z.array(z.string().min(1)).min(1).max(5),
});

export const PUT = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const scoped = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!scoped) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const project = await db.lectureProject.findFirst({
      where: { id: scoped.id },
      include: { courseProfile: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    let body = await req.json().catch(() => null);
    if (body && Array.isArray(body.teacherEnteredClos)) {
      const validClos = body.teacherEnteredClos.filter(
        (c: any) => c && typeof c.text === "string" && c.text.trim().length > 0
      );
      const validIds = new Set(validClos.map((c: any) => c.id));
      body.teacherEnteredClos = validClos;
      if (Array.isArray(body.selectedLectureCloIds)) {
        body.selectedLectureCloIds = body.selectedLectureCloIds.filter((id: string) => validIds.has(id)).slice(0, 5);
        if (body.selectedLectureCloIds.length === 0 && validClos.length > 0) {
          body.selectedLectureCloIds = validClos.slice(0, 5).map((c: any) => c.id);
        }
      }
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const errMsgs = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json({ error: `Validation error: ${errMsgs}`, details: parsed.error.flatten() }, { status: 400 });
    }

    // Validation check for CLO selection shape
    const validation = validateCloSelection(parsed.data.teacherEnteredClos, parsed.data.selectedLectureCloIds);
    if (!validation.valid) {
      return NextResponse.json({ error: `CLO Validation Failed: ${validation.errors.join("; ")}`, details: validation.errors }, { status: 400 });
    }

    // BRD FR-004 / AC-15: approved CLO text is immutable. Once approved,
    // faculty cannot overwrite the text. But a second project reuses this
    // tenant's course profile (same courseCode), so re-submitting the SAME
    // approved CLOs is legitimate — treat it as idempotent success instead of
    // dead-ending the wizard with 409. Different text still gets rejected.
    const immutability = assertApprovedCloTextImmutable(
      project.courseProfile.cloApprovedAt,
      project.courseProfile.teacherEnteredClos,
      parsed.data.teacherEnteredClos
    );
    if (!immutability.allowed) {
      return NextResponse.json(
        {
          error: "Approved CLO text is immutable and cannot be changed",
          code: immutability.error ?? "CLO_TEXT_IMMUTABLE",
        },
        { status: 409 }
      );
    }
    if (immutability.idempotent) {
      const existingClos = Array.isArray(project.courseProfile.teacherEnteredClos)
        ? project.courseProfile.teacherEnteredClos
        : [];
      return NextResponse.json({
        courseProfileId: project.courseProfile.id,
        cloCount: existingClos.length,
        approvedAt: project.courseProfile.cloApprovedAt,
        idempotent: true,
      });
    }

    try {
      const now = new Date();
      const courseProfile = await db.lectureCourseProfile.update({
        where: { id: project.courseProfileId },
        data: {
          teacherEnteredClos: parsed.data.teacherEnteredClos as any,
          selectedLectureCloIds: parsed.data.selectedLectureCloIds,
          cloApprovedAt: now,
          cloApprovedBy: ctx.session.userId,
        },
      });

      return NextResponse.json({
        courseProfileId: courseProfile.id,
        cloCount: parsed.data.teacherEnteredClos.length,
        approvedAt: courseProfile.cloApprovedAt,
      });
    } catch (err: any) {
      console.error("[CLOS ROUTE DB ERROR]", err);
      return NextResponse.json(
        { error: `Database update failed: ${err?.message || String(err)}` },
        { status: 500 }
      );
    }
  }
);

export const POST = PUT;
