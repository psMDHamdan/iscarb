/**
 * NCAAA Evidence Links — item-level PATCH (FR-020, AC-22).
 * ===========================================================================
 * PATCH /api/iscarb/lecture/ncaaa-evidence-links/:id
 *
 * Body (all optional):
 *   { artifactId?: string | null,
 *     locator?: string | null,
 *     status?: "open" | "met" | "gap",
 *     ownerId?: string | null,
 *     qualityAction?: string | null,
 *     action?: "approve" }
 *
 * Maps course/lecture evidence to an NCAAA requirement, assigns a responsible
 * owner, sets gap status, or records a quality improvement action. Faculty
 * approval is required before export (AC-22).
 *
 * Tenant-scoped through the owning project (AC-11).
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";

const patchSchema = z.object({
  artifactId: z.string().nullable().optional(),
  locator: z.string().nullable().optional(),
  status: z.enum(["open", "met", "gap"]).optional(),
  ownerId: z.string().nullable().optional(),
  qualityAction: z.string().nullable().optional(),
  action: z.enum(["approve"]).optional(),
});

async function findLink(id: string, tenantId: string) {
  return db.lectureNCAAAEvidenceLink.findFirst({
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
      return NextResponse.json({ error: "NCAAA evidence link not found" }, { status: 404 });
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

    if (d.artifactId !== undefined) { data.artifactId = d.artifactId; hasChange = true; }
    if (d.locator !== undefined) { data.locator = d.locator; hasChange = true; }
    if (d.status !== undefined) { data.status = d.status; hasChange = true; }
    if (d.ownerId !== undefined) { data.ownerId = d.ownerId; hasChange = true; }
    if (d.qualityAction !== undefined) { data.qualityAction = d.qualityAction; hasChange = true; }

    if (d.action === "approve") {
      data.approvedBy = ctx.session.userId;
      data.approvedAt = new Date();
      hasChange = true;
    }

    if (!hasChange) {
      return NextResponse.json(
        { error: "NOTHING_TO_UPDATE", message: "No updatable fields provided" },
        { status: 400 }
      );
    }

    const updated = await db.lectureNCAAAEvidenceLink.update({
      where: { id },
      data,
    });

    return NextResponse.json({ link: updated }, { status: 200 });
  }
);
