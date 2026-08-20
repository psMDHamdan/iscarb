/**
 * Alignment Link Decision API (TASK-07, AC-19 support).
 * ===========================================================================
 * POST /api/iscarb/lecture/alignment-links/[id]/decision
 * Body: { action: "accept" | "reject", reason?: string }
 *
 *   accept → LectureAlignmentLink.decision = "accepted"  (readiness-generator
 *           consumes these to bind official Jaheziah outcomes)
 *   reject → LectureAlignmentLink.decision = "rejected"
 *
 * Records decidedBy/decidedAt for audit. Cross-tenant access is blocked and
 * audited (AC-11), same as the artifact decision route.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditCrossTenant } from "@/lib/lecture/review/tenant-guard";

const bodySchema = z.object({
  action: z.enum(["accept", "reject"]),
  reason: z.string().optional(),
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

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const link = await db.lectureAlignmentLink.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!link) return NextResponse.json({ error: "Alignment link not found" }, { status: 404 });
    if (link.project.tenantId !== tenantId) {
      await auditCrossTenant({
        actorId: ctx.session.userId,
        entityType: "LectureAlignmentLink",
        entityId: link.id,
        tenantId,
      });
      return NextResponse.json({ error: "Alignment link not found" }, { status: 404 });
    }

    const decision = parsed.data.action === "accept" ? "accepted" : "rejected";

    await db.lectureAlignmentLink.update({
      where: { id },
      data: {
        decision,
        decidedBy: ctx.session.userId ?? "unknown",
      },
    });

    await db.auditLog.create({
      data: {
        actorId: ctx.session.userId ?? null,
        action: `alignment_link_${parsed.data.action}`,
        entityType: "LectureAlignmentLink",
        entityId: id,
        category: "review",
        severity: "info",
        details: { reason: parsed.data.reason },
      },
    });

    return NextResponse.json(
      {
        linkId: id,
        decision,
        decidedBy: ctx.session.userId ?? "unknown",
      },
      { status: 200 }
    );
  }
);
