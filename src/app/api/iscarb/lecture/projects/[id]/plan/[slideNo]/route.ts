/**
 * Lecture Planning — single-slide edit + gate re-evaluation (FR-007).
 * ===========================================================================
 * PATCH /api/iscarb/lecture/projects/[id]/plan/[slideNo]
 *
 * Faculty edits one slide. Fixed-slot functions (S1/S2/S3/S18/S19/S20) cannot
 * be reassigned. After the edit the full plan is re-validated against the
 * §7.1 slot contract and the gate status is returned.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { z } from "zod";
import { validatePlanStructure, FIXED_SLOTS, FIXED_SLOT_FUNCTION } from "@/lib/lecture/planner/plan-validator";

const patchSchema = z.object({
  function: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  cloIds: z.array(z.string().min(1)).optional(),
  sourceBlockIds: z.array(z.string().min(1)).optional(),
  interactionType: z.enum(["poll", "pause_discuss", "collaboration", "practice", "worked_example", "none"]).nullable().optional(),
  visualIntent: z.string().max(500).optional(),
  approved: z.boolean().optional(),
});

export const PATCH = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string; slideNo: string }> }
  ) => {
    const { id, slideNo } = await params;
    const tenantId = ctx.session.universityId || "default";
    const num = Number(slideNo);
    if (!Number.isInteger(num) || num < 1 || num > 20) {
      return NextResponse.json({ error: "Slide number must be 1–20" }, { status: 400 });
    }

    const project = await db.lectureProject.findFirst({ where: { id, tenantId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const slide = await db.lectureSlidePlan.findFirst({ where: { projectId: id, slideNo: num } });
    if (!slide) return NextResponse.json({ error: "Slide not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    // Fixed-slot functions are contract-bound (FR-007).
    if (parsed.data.function && FIXED_SLOTS.has(num) && parsed.data.function !== FIXED_SLOT_FUNCTION[num]) {
      return NextResponse.json(
        { error: "FIXED_SLOT_IMMUTABLE", message: `S${num} must remain "${FIXED_SLOT_FUNCTION[num]}"` },
        { status: 409 }
      );
    }

    const updated = await db.lectureSlidePlan.update({
      where: { id: slide.id },
      data: {
        function: parsed.data.function,
        title: parsed.data.title,
        cloIds: parsed.data.cloIds,
        sourceBlockIds: parsed.data.sourceBlockIds,
        interactionType: parsed.data.interactionType === "none" ? null : parsed.data.interactionType,
        visualIntent: parsed.data.visualIntent,
        ...(typeof parsed.data.approved === "boolean" ? { approved: parsed.data.approved, approvedAt: parsed.data.approved ? new Date() : null } : {}),
      },
    });

    // Re-run the §7.1 gate over the full plan.
    const allSlides = await db.lectureSlidePlan.findMany({
      where: { projectId: id },
      select: { slideNo: true, function: true, interactionType: true },
    });
    const errors = validatePlanStructure(allSlides);

    return NextResponse.json({
      slide: updated,
      gate: { valid: errors.length === 0, errors },
    });
  }
);
