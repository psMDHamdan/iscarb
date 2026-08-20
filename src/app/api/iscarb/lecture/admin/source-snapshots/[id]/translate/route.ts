/**
 * Translation API (TASK-06 §C).
 * ===========================================================================
 * POST /api/iscarb/lecture/admin/source-snapshots/:id/translate
 * Body: { translatorId: string }
 * Roles: admin only. Org-scoped.
 * Creates a linked snapshot with translationStatus="pending" and
 * translationOfSnapshotId set. No translation engine — an admin must approve
 * the translation before any implementation depends on it (AC-25).
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";

const bodySchema = z.object({
  translatorId: z.string().min(1, "translatorId is required"),
});

export const POST = guard(
  { tier: "write", roles: ["admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const orgId = ctx.session.universityId ?? null;

    const snapshot = await db.authoritativeSourceSnapshot.findFirst({
      where: { id, ...(orgId ? { organizationId: orgId } : {}) },
    });
    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const translation = await db.authoritativeSourceSnapshot.create({
      data: {
        sourceKey: snapshot.sourceKey,
        url: snapshot.url,
        language: "en",
        contentText: "",
        contentHash: `translation-pending-${id}`,
        translationOfSnapshotId: id,
        translationStatus: "pending",
        approvalStatus: "pending",
      },
    });

    await db.auditLog.create({
      data: {
        actorId: ctx.session.userId ?? null,
        action: "source_translation_pending",
        entityType: "AuthoritativeSourceSnapshot",
        entityId: translation.id,
        category: "source_sync",
        severity: "info",
        details: { ofSnapshotId: id, translatorId: parsed.data.translatorId },
      },
    });

    return NextResponse.json(
      { translationSnapshotId: translation.id, status: "pending" },
      { status: 202 }
    );
  }
);
