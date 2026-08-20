/**
 * Alignment Links — item-level PATCH (AC-19 / FR-017).
 * ===========================================================================
 * PATCH /api/iscarb/lecture/alignment-links/:id
 *
 * Body (all optional):
 *   { decision?: "accepted" | "rejected" | "edited",
 *     rationale?: string,
 *     confidence?: number,
 *     sourceLocator?: string }
 *
 * In OFFICIAL_JAHEZIAH mode, every proposed CLO → Jaheziah outcome link
 * carries confidence, rationale, sourceLocator, and a faculty accept/reject
 * decision. This endpoint is the single mutation surface for that decision.
 *
 * Tenant-scoped through the owning project (AC-11).
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";

const patchSchema = z.object({
  decision: z.enum(["accepted", "rejected", "edited"]).optional(),
  rationale: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  sourceLocator: z.string().nullable().optional(),
});

async function findLink(id: string, tenantId: string) {
  return db.lectureAlignmentLink.findFirst({
    where: { id, project: { tenantId } },
    include: { project: { select: { id: true, tenantId: true } } },
  });
}

export const PATCH = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const link = await findLink(id, tenantId);
    if (!link) {
      return NextResponse.json({ error: "Alignment link not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const rawData = body?.body && typeof body.body === "object" ? { ...body, ...body.body } : body;
    const parsed = patchSchema.safeParse(rawData ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const data: Record<string, unknown> = {};
    let hasChange = false;

    if (d.decision !== undefined) {
      data.decision = d.decision;
      data.decidedBy = ctx.session.userId;
      hasChange = true;
    }
    if (d.rationale !== undefined) {
      data.rationale = d.rationale;
      hasChange = true;
    }
    if (d.confidence !== undefined) {
      data.confidence = d.confidence;
      hasChange = true;
    }
    if (d.sourceLocator !== undefined) {
      data.sourceLocator = d.sourceLocator;
      hasChange = true;
    }

    if (!hasChange) {
      return NextResponse.json(
        { error: "NOTHING_TO_UPDATE", message: "No updatable fields provided" },
        { status: 400 }
      );
    }

    const updated = await db.lectureAlignmentLink.update({
      where: { id },
      data,
    });

    // Audit the decision (AC-19 — every alignment decision is audited).
    if (d.decision) {
      await db.auditLog.create({
        data: {
          actorId: ctx.session.userId ?? null,
          action: `alignment_${d.decision}`,
          entityType: "LectureAlignmentLink",
          entityId: id,
          category: "alignment",
          severity: "info",
          details: {
            projectId: link.projectId,
            cloId: link.cloId,
            standardOutcomeId: link.standardOutcomeId,
            decision: d.decision,
          },
        },
      });
    }

    return NextResponse.json({ link: updated }, { status: 200 });
  }
);
