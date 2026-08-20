/**
 * Publish Readiness — GET
 * =========================================================================
 * GET /api/iscarb/lecture/projects/:id/publish-readiness
 *
 * Returns the pre-publish checklist status: gate results, artifact approval,
 * readiness item approval, slide count, and published version history.
 * Faculty can see exactly what's blocking publication.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";
import {
  evaluatePublishChecks,
  latestCurrentArtifacts,
  publishInventoryFromRows,
} from "@/lib/lecture/review/review-logic";

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (_req: Request, ctx: GuardContext, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const scopedProject = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!scopedProject) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Fetch full project for status
    const project = await db.lectureProject.findUnique({ where: { id }, select: { status: true } });
    const projectStatus = project?.status ?? "draft";

    const [failedErrorGates, allGates, artifacts, readinessItems, versions] = await Promise.all([
      // Count error gates that are failing
      db.lectureGateResult.count({
        where: { projectId: id, status: "fail", severity: "error" },
      }),
      // Get all gate results for summary
      db.lectureGateResult.findMany({
        where: { projectId: id },
        orderBy: { checkedAt: "desc" },
        select: {
          gateKey: true,
          status: true,
          severity: true,
        },
      }),
      // Get all artifacts
      db.lectureSlideArtifact.findMany({
        where: { projectId: id },
        select: {
          id: true,
          slideNo: true,
          status: true,
          version: true,
        },
      }),
      // Get all readiness items
      db.lectureReadinessItem.findMany({
        where: { projectId: id },
        select: { slideNo: true, approved: true, createdAt: true },
      }),
      // Get published versions
      db.lecturePackageVersion.findMany({
        where: { projectId: id },
        orderBy: { version: "desc" },
        take: 10,
        select: {
          id: true,
          version: true,
          status: true,
          manifestHash: true,
          approvedAt: true,
          approvedBy: true,
        },
      }),
    ]);

    // Compute publish checks
    const inventory = publishInventoryFromRows({ artifacts: artifacts as any[], readiness: readinessItems as any[] });
    const { blockers, counts } = evaluatePublishChecks({
      failedErrorGates,
      unapprovedSlides: inventory.unapprovedSlides,
      unapprovedReadinessItems: inventory.unapprovedReadinessItems,
      currentSlideCount: inventory.currentSlideCount,
      requiredSlideCount: inventory.requiredSlideCount,
    });

    // Gate summary
    const gateSummary = {
      total: allGates.length,
      pass: allGates.filter((g: { status: string }) => g.status === "pass").length,
      fail: allGates.filter((g: { status: string }) => g.status === "fail").length,
      warn: allGates.filter((g: { severity: string }) => g.severity === "warning").length,
      waive: allGates.filter((g: { status: string }) => g.status === "waived").length,
    };

    // Artifact summary
    const currentArtifacts = latestCurrentArtifacts(artifacts as any[]);
    const artifactSummary = {
      total: currentArtifacts.length,
      approved: currentArtifacts.filter((a: { status: string }) => a.status === "approved").length,
      pending: currentArtifacts.filter((a: { status: string }) => a.status !== "approved").length,
    };

    // Readiness summary
    const readinessSummary = {
      total: readinessItems.length,
      approved: readinessItems.filter((r: { approved: boolean }) => r.approved).length,
      pending: readinessItems.filter((r: { approved: boolean }) => !r.approved).length,
    };

    return NextResponse.json({
      projectId: id,
      projectStatus,
      canPublish: blockers.length === 0,
      blockers,
      counts,
      gateSummary,
      artifactSummary,
      readinessSummary,
      versions: versions.map((v: { id: string; version: number; status: string; manifestHash: string | null; approvedAt: Date | null; approvedBy: string | null }) => ({
        id: v.id,
        version: v.version,
        status: v.status,
        manifestHash: v.manifestHash?.slice(0, 12) ?? "",
        approvedAt: v.approvedAt?.toISOString() ?? null,
        approvedBy: v.approvedBy,
      })),
    });
  },
);
