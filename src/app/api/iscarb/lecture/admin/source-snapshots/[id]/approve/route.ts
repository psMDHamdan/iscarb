/**
 * Snapshot Approval API (TASK-06 §B).
 * ===========================================================================
 * POST /api/iscarb/lecture/admin/source-snapshots/:id/approve
 * Body: { notes?: string }
 * Roles: admin only. Org-scoped.
 * Sets approvedBy + approvalStatus="approved", updates
 * AuthoritativeSource.activeSnapshotId, flags LectureAlignmentLink rows
 * governed by the previous snapshot as status="stale".
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseNcaaaStandard, NcaaaParseError } from "@/lib/lecture/sources/ncaaa-parser";
import { parseJaheziahStandard, JaheziahParseError } from "@/lib/lecture/sources/jaheziah-parser";

/**
 * Derive a specialty key from a Jaheziah snapshot URL when possible
 * (e.g. ".../computer-science/..." → "Computer Science"). Returns null when
 * it cannot be derived — the caller then skips parsing rather than fabricating.
 */
function specialtyFromUrl(url: string): string | null {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    for (const seg of [...segments].reverse()) {
      const decoded = decodeURIComponent(seg).replace(/[-_]+/g, " ").trim();
      if (decoded && decoded.length > 2 && !/^(ar|en|pdf|html?)$/i.test(decoded)) {
        return decoded.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
  } catch {
    /* fall through */
  }
  return null;
}

const bodySchema = z.object({
  notes: z.string().optional(),
});

export const POST = guard(
  { tier: "write", roles: ["admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    // Snapshots are platform-level (organizationId null); admin sees them all.
    const orgId = ctx.session.universityId ?? null;

    const snapshot = await db.authoritativeSourceSnapshot.findFirst({
      where: { id, ...(orgId ? { OR: [{ organizationId: orgId }, { organizationId: null }] } : {}) },
    });
    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }
    if (snapshot.approvalStatus === "approved") {
      return NextResponse.json(
        { snapshotId: id, approvalStatus: "approved" },
        { status: 200 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const previous = await db.authoritativeSource.findUnique({
      where: { sourceKey: snapshot.sourceKey },
      select: { activeSnapshotId: true },
    });

    // Transaction: approve, switch active snapshot, flag stale links.
    await db.$transaction([
      db.authoritativeSourceSnapshot.update({
        where: { id },
        data: {
          approvalStatus: "approved",
          approvedBy: ctx.session.userId ?? "unknown",
        },
      }),
      db.authoritativeSource.update({
        where: { sourceKey: snapshot.sourceKey },
        data: { activeSnapshotId: id },
      }),
      // §B — links aligned against the previous snapshot are now stale.
      ...(previous?.activeSnapshotId
        ? [
            db.lectureAlignmentLink.updateMany({
              where: { sourceSnapshotId: previous.activeSnapshotId },
              data: { status: "stale" },
            }),
          ]
        : []),
    ]);

    await db.auditLog.create({
      data: {
        actorId: ctx.session.userId ?? null,
        action: "source_snapshot_approved",
        entityType: "AuthoritativeSourceSnapshot",
        entityId: id,
        category: "source_sync",
        severity: "info",
        details: { notes: parsed.data.notes },
      },
    });

    // AC-17 — the approved snapshot is now authoritative: parse it into real
    // requirements / standards so product surfaces only ever show official
    // content derived from this snapshot (never hardcoded or seeded rows).
    const parseOutcome = await parseSnapshotIntoRows(id, snapshot.sourceKey, ctx.session.userId ?? null);

    return NextResponse.json(
      {
        snapshotId: id,
        approvalStatus: "approved",
        parse: parseOutcome,
      },
      { status: 200 }
    );
  }
);

/**
 * Turn an approved snapshot into database rows (idempotent):
 *  - ncaaa     → NCAAARequirement rows (replaces prior rows for the snapshot)
 *  - jaheziah  → NationalStandard rows with parsed KLOs/GKUs/SKUs/SLOs
 * Any parse failure is audited and reported — approval itself still succeeds so
 * the snapshot is not lost, but the surfaces show "no official data" until a
 * parse succeeds.
 */
async function parseSnapshotIntoRows(
  snapshotId: string,
  sourceKey: string,
  actorId: string | null
): Promise<{ sourceKey: string; status: string; count: number; error?: string }> {
  try {
    if (sourceKey === "ncaaa") {
      const result = await parseNcaaaStandard(snapshotId);
      await db.$transaction([
        db.nCAAARequirement.deleteMany({ where: { sourceSnapshotId: snapshotId } }),
        ...result.requirements.map((r) =>
          db.nCAAARequirement.create({
            data: {
              sourceSnapshotId: snapshotId,
              clause: r.clause,
              evidenceType: r.evidenceType,
            },
          })
        ),
      ]);
      await db.auditLog.create({
        data: {
          actorId,
          action: "source_snapshot_parsed",
          entityType: "AuthoritativeSourceSnapshot",
          entityId: snapshotId,
          category: "source_sync",
          severity: "info",
          details: { sourceKey, rows: result.requirements.length },
        },
      });
      return { sourceKey, status: "parsed", count: result.requirements.length };
    }

    if (sourceKey === "jaheziah") {
      const snapshot = await db.authoritativeSourceSnapshot.findUnique({ where: { id: snapshotId } });
      const specialty = snapshot ? specialtyFromUrl(snapshot.url) : null;
      if (!specialty) {
        await db.auditLog.create({
          data: {
            actorId,
            action: "source_snapshot_parse_skipped",
            entityType: "AuthoritativeSourceSnapshot",
            entityId: snapshotId,
            category: "source_sync",
            severity: "warning",
            details: { reason: "Could not derive specialty key from snapshot URL; nothing fabricated." },
          },
        });
        return { sourceKey, status: "skipped", count: 0, error: "Could not derive specialty key from snapshot URL" };
      }

      const standard = await parseJaheziahStandard(snapshotId, specialty);
      await db.$transaction([
        db.nationalStandard.deleteMany({ where: { snapshotId } }),
        db.nationalStandard.create({
          data: {
            specialtyKey: specialty,
            documentId: snapshot?.url ?? "",
            snapshotId,
            klos: standard.klos as unknown as object,
            gkus: standard.gkus as unknown as object,
            skus: standard.skus as unknown as object,
            slos: standard.slos as unknown as object,
            topics: standard.topics as unknown as object,
            weights: standard.weights as unknown as object,
          },
        }),
      ]);
      await db.auditLog.create({
        data: {
          actorId,
          action: "source_snapshot_parsed",
          entityType: "AuthoritativeSourceSnapshot",
          entityId: snapshotId,
          category: "source_sync",
          severity: "info",
          details: { sourceKey, specialty, rows: 1 },
        },
      });
      return { sourceKey, status: "parsed", count: 1 };
    }

    return { sourceKey, status: "skipped", count: 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse failed";
    await db.auditLog.create({
      data: {
        actorId,
        action: "source_snapshot_parse_failed",
        entityType: "AuthoritativeSourceSnapshot",
        entityId: snapshotId,
        category: "source_sync",
        severity: "error",
        details: { sourceKey, error: message },
      },
    });
    return { sourceKey, status: "failed", count: 0, error: message };
  }
}
