/**
 * Vision Contexts — item-level PATCH (FR-018, AC-18).
 * ===========================================================================
 * PATCH /api/iscarb/lecture/projects/:id/vision-contexts/:contextId
 *
 * Body: { approved: boolean }
 *
 * Faculty approves or rejects individual Vision 2030 contexts proposed by the
 * system. Only approved contexts appear in the student deck and evidence pack.
 * All opportunities derived from official pages carry derivedOpportunityLabel:
 * "system-suggested" (AC-18) and this approval gate makes that explicit.
 *
 * Tenant-scoped through the owning project (AC-11).
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";

const patchSchema = z.object({
  approved: z.boolean(),
});

export const PATCH = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string; contextId: string }> }
  ) => {
    const { id, contextId } = await params;
    const tenantId = ctx.session.universityId || "default";

    // Verify project exists and is tenant-scoped
    const project = await db.lectureProject.findFirst({ where: { id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.tenantId && project.tenantId !== tenantId && tenantId !== "default" && project.tenantId !== "default") {
      return NextResponse.json({ error: "Unauthorized tenant access" }, { status: 403 });
    }

    const context = await db.lectureVisionContext.findFirst({
      where: { id: contextId, projectId: id },
    });
    if (!context) {
      return NextResponse.json({ error: "Vision context not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updated = await db.lectureVisionContext.update({
      where: { id: contextId },
      data: { approved: parsed.data.approved },
    });

    // Audit the approval decision (AC-18 — every context decision is recorded).
    await db.auditLog.create({
      data: {
        actorId: ctx.session.userId ?? null,
        action: parsed.data.approved ? "vision_context_approved" : "vision_context_rejected",
        entityType: "LectureVisionContext",
        entityId: contextId,
        category: "alignment",
        severity: "info",
        details: {
          projectId: id,
          title: context.title,
          kind: context.kind,
          officialUrl: context.officialUrl,
          derivedOpportunityLabel: context.derivedOpportunityLabel,
        },
      },
    });

    return NextResponse.json({ context: updated }, { status: 200 });
  }
);
