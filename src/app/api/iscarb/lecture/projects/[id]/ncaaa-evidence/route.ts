/**
 * NCAAA Evidence Workspace — GET (TASK-06 §E, F8).
 * ===========================================================================
 * GET /api/iscarb/lecture/projects/:id/ncaaa-evidence
 * Reads existing NCAAARequirement rows for the project's source snapshot and
 * aggregates their evidence links into a requirements-with-links view.
 * Status and counts are derived strictly from per-project LectureNCAAAEvidenceLink rows.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";

export interface NCAAARequirementWithLinks {
  id: string;
  requirementId: string;
  clause: string;
  evidenceType: string;
  status: string;
  evidenceLocator?: string;
  evidenceLinks: {
    id: string;
    artifactId: string | null;
    locator: string | null;
    status: string;
    ownerId: string | null;
    qualityAction: string | null;
  }[];
}

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Honesty contract (NFR-11/12, AC-17): requirements are shown ONLY when
    // they were parsed from a REAL, approved official snapshot. Seeded or
    // fabricated rows (no approved snapshot behind them) never appear.
    const approvedSnapshots = await db.authoritativeSourceSnapshot.findMany({
      where: { sourceKey: "ncaaa", approvalStatus: "approved" },
      select: { id: true, url: true, retrievedAt: true },
      orderBy: { retrievedAt: "desc" },
    });
    const approvedSnapshotIds = approvedSnapshots.map((s: { id: string }) => s.id);

    const requirements = approvedSnapshotIds.length
      ? await db.nCAAARequirement.findMany({
          where: { sourceSnapshotId: { in: approvedSnapshotIds } },
          orderBy: { clause: "asc" },
        })
      : [];

    const links = await db.lectureNCAAAEvidenceLink.findMany({
      where: { projectId: id },
    });

    const byRequirement = new Map<string, NCAAARequirementWithLinks["evidenceLinks"]>();
    for (const link of links) {
      const arr = byRequirement.get(link.requirementId) ?? [];
      arr.push({
        id: link.id,
        artifactId: link.artifactId,
        locator: link.locator,
        status: link.status,
        ownerId: link.ownerId,
        qualityAction: link.qualityAction,
      });
      byRequirement.set(link.requirementId, arr);
    }

    const requirementRows: NCAAARequirementWithLinks[] = requirements.map((r: { id: string; clause: string; evidenceType: string }) => {
      const projLinks = byRequirement.get(r.id) ?? [];
      const hasMet = projLinks.some((l) => l.status === "met");
      const hasGap = projLinks.some((l) => l.status === "gap");
      const derivedStatus = hasMet ? "met" : hasGap ? "gap" : "open";

      return {
        id: r.id,
        requirementId: r.id,
        clause: r.clause,
        evidenceType: r.evidenceType,
        status: derivedStatus,
        evidenceLinks: projLinks,
      };
    });

    const gapCount = requirementRows.filter((r) => r.status === "gap").length;
    const metCount = requirementRows.filter((r) => r.status === "met").length;
    const pendingCount = requirementRows.filter((r) => r.status === "open").length;

    return NextResponse.json(
      {
        requirements: requirementRows,
        gapCount,
        metCount,
        pendingCount,
        // True only when real, approved official NCAAA content is loaded.
        synced: approvedSnapshotIds.length > 0,
        sourceUrl: approvedSnapshots[0]?.url ?? null,
        sourceRetrievedAt: approvedSnapshots[0]?.retrievedAt ?? null,
      },
      { status: 200 }
    );
  }
);
