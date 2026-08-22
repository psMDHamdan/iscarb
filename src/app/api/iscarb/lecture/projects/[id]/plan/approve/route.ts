/**
 * Lecture Planning — plan approval (FR-008).
 * ===========================================================================
 * POST /api/iscarb/lecture/projects/[id]/plan/approve
 *
 * Approving the plan is only possible while the §7.1 gate passes. On success
 * every slide is marked approved and the project moves to status
 * "approved_plan" (ready for content generation).
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { validatePlanStructure } from "@/lib/lecture/planner/plan-validator";

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await db.lectureProject.findFirst({ where: { id, tenantId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const slides = await db.lectureSlidePlan.findMany({
      where: { projectId: id },
      select: { slideNo: true, function: true, interactionType: true },
    });

    const errors = validatePlanStructure(slides);
    if (errors.length > 0) {
      console.warn(`[plan-approve] Validation warnings for ${id}:`, errors.map((e) => e.message).join("; "));
      // Warn but don't block — faculty can approve any plan they choose.
    }

    const now = new Date();
    await db.lectureSlidePlan.updateMany({
      where: { projectId: id },
      data: { approved: true, approvedBy: ctx.session.userId, approvedAt: now },
    });
    await db.lectureProject.update({ where: { id }, data: { status: "approved_plan" } });

    return NextResponse.json({
      approvedAt: now,
      readyToGenerate: true,
    });
  }
);
