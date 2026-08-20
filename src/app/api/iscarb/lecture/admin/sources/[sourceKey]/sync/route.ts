/**
 * Sync API — sync an official source (TASK-06 §A).
 * ===========================================================================
 * POST /api/iscarb/lecture/admin/sources/:sourceKey/sync
 * Roles: admin only. Org-scoped.
 * Response 202: { snapshotId, status: "syncing" }
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { syncSource } from "@/lib/lecture/sources/source-syncer";
import { DomainBlockedError } from "@/lib/lecture/sources/domain-validator";

export const POST = guard(
  { tier: "write", roles: ["admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ sourceKey: string }> }
  ) => {
    const { sourceKey } = await params;
    // Sources are platform-level (organizationId null); admin sees them all.
    const orgId = ctx.session.universityId ?? null;

    const source = await db.authoritativeSource.findFirst({
      where: { sourceKey, ...(orgId ? { OR: [{ organizationId: orgId }, { organizationId: null }] } : {}) },
    });
    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    try {
      const outcome = await syncSource(sourceKey);

      // NFR-11 — blocked redirects must be audited immediately.
      return NextResponse.json(
        {
          sourceKey: outcome.sourceKey,
          snapshotId: outcome.snapshotId,
          status: outcome.status,
          changed: outcome.changed,
          contentHash: outcome.contentHash,
        },
        { status: 202 }
      );
    } catch (err) {
      if (err instanceof DomainBlockedError) {
        await db.auditLog.create({
          data: {
            actorId: ctx.session.userId ?? null,
            action: "source_sync_blocked",
            entityType: "AuthoritativeSource",
            entityId: sourceKey,
            category: "source_sync",
            severity: "error",
            details: { message: err.message, url: err.url },
          },
        });
        return NextResponse.json(
          { error: err.message },
          { status: 403 }
        );
      }

      // AC-20 — site unavailable must not fabricate; audit for visibility.
      await db.auditLog.create({
        data: {
          actorId: ctx.session.userId ?? null,
          action: "source_sync_failed",
          entityType: "AuthoritativeSource",
          entityId: sourceKey,
          category: "source_sync",
          severity: "error",
          details: { message: err instanceof Error ? err.message : "Sync failed" },
        },
      });
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Sync failed" },
        { status: 500 }
      );
    }
  }
);
