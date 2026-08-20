/**
 * Lecture Vision Contexts — item-level (BRD §12).
 * ===========================================================================
 * PATCH /api/iscarb/lecture/vision-contexts/[id]
 *   Body: { approved: boolean }
 *   Faculty confirms or rejects a system-suggested Vision 2030 context
 *   (FR-007 / AC-18). Tenant-scoped through the owning project.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";

const bodySchema = z.object({
  approved: z.boolean(),
});

export const PATCH = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const context = await db.lectureVisionContext.findFirst({
      where: { id, project: { tenantId } },
      include: { project: { select: { id: true } } },
    });
    if (!context) return NextResponse.json({ error: "Vision context not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updated = await db.lectureVisionContext.update({
      where: { id },
      data: { approved: parsed.data.approved },
    });

    return NextResponse.json({ context: updated }, { status: 200 });
  }
);
