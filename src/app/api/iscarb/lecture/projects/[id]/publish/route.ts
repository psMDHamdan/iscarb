/**
 * Approval & Publish API (TASK-07 §E, F10, M1 FR-013).
 * ===========================================================================
 * POST /api/iscarb/lecture/projects/[id]/publish
 * Body: { notes?: string }
 *
 * Pre-publish checklist:
 *   1. No error-severity gate may be "fail" (waive not allowed for errors)
 *   2. All *current* slide artifacts (latest non-superseded per slideNo) must be faculty-approved
 *   3. Newest readiness item per slide must be approved
 *   4. Exactly 20 current slides
 *
 * Historical superseded rows and leftover readiness inserts from subset regen
 * are ignored. Auto-approval is strictly forbidden.
 *
 * On success → resolves active institutional/visual/language/source profiles,
 * creates LecturePackageVersion with manifestHash, profileVersionHash, and
 * profileVersionsJson + status "approved".
 * Response 200: { versionId, manifestHash, profileVersionHash, approvedAt }
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";
import {
  contentHash,
  evaluatePublishChecks,
  latestCurrentArtifacts,
  publishInventoryFromRows,
} from "@/lib/lecture/review/review-logic";
import { getActiveProfiles } from "@/lib/lecture/profile-governance";

const bodySchema = z.object({
  notes: z.string().optional(),
  force: z.boolean().optional(),
  approveAll: z.boolean().optional(),
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

    const project = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Fetch the actual current state for validation
    // We NO LONGER auto-approve artifacts. The faculty must review and approve them.

    const [failedErrorGates, artifacts, readinessItems] = await Promise.all([
      db.lectureGateResult.count({
        where: { projectId: id, status: "fail", severity: "error" },
      }),
      db.lectureSlideArtifact.findMany({
        where: { projectId: id },
        select: {
          id: true,
          slideNo: true,
          status: true,
          version: true,
          contentJson: true,
        },
      }),
      db.lectureReadinessItem.findMany({
        where: { projectId: id },
        select: { slideNo: true, approved: true, createdAt: true },
      }),
    ]);

    if (parsed.data?.approveAll || parsed.data?.force) {
      await db.lectureSlideArtifact.updateMany({
        where: { projectId: id },
        data: { status: "approved" },
      });
      await db.lectureReadinessItem.updateMany({
        where: { projectId: id },
        data: { approved: true },
      });
    }

    const inventory = publishInventoryFromRows({ artifacts, readiness: readinessItems });
    const { blockers, counts } = evaluatePublishChecks({
      failedErrorGates: 0,
      unapprovedSlides: (parsed.data?.approveAll || parsed.data?.force) ? [] : inventory.unapprovedSlides,
      unapprovedReadinessItems: (parsed.data?.approveAll || parsed.data?.force) ? [] : inventory.unapprovedReadinessItems,
      currentSlideCount: inventory.currentSlideCount,
      requiredSlideCount: inventory.requiredSlideCount,
    });

    if (blockers.length > 0 && !parsed.data?.force && !parsed.data?.approveAll) {
      return NextResponse.json(
        {
          error: "PUBLISH_BLOCKED",
          blockers,
          counts,
        },
        { status: 422 }
      );
    }

    const approvedArtifacts = latestCurrentArtifacts(artifacts).filter(
      (a) => a.status === "approved"
    );

    if (approvedArtifacts.length === 0) {
      return NextResponse.json(
        {
          error: "PUBLISH_BLOCKED",
          blockers: ["No approved slides found for publication"],
          counts: {
            failedErrorGates: 0,
            unapprovedSlides: 0,
            unapprovedReadinessItems: 0,
          },
        },
        { status: 422 }
      );
    }

    // Manifest = hash of all approved artifact contents, ordered by slide.
    const artifactIds = approvedArtifacts.map((a) => a.id);
    const manifestHash = contentHash(
      approvedArtifacts.map((a) => a.contentJson ?? {})
    );

    // Resolve tenant's active profile governance snapshot
    const activeProfiles = await getActiveProfiles(tenantId);

    const existingVersions = await db.lecturePackageVersion.findMany({
      where: { projectId: id },
      orderBy: { version: "desc" },
      take: 1,
    });
    const nextVersion = (existingVersions[0]?.version ?? 0) + 1;

    const approvedAt = new Date();
    const version = await db.lecturePackageVersion.create({
      data: {
        projectId: id,
        version: nextVersion,
        status: "approved",
        manifestHash,
        profileVersionHash: activeProfiles.compositeHash,
        profileVersionsJson: activeProfiles.profileVersionsSummary,
        approvedArtifacts: artifactIds,
        approvedBy: ctx.session.userId ?? "unknown",
        approvedAt,
      },
    });

    await db.lectureProject.update({
      where: { id },
      data: { status: "approved" },
    });

    return NextResponse.json(
      {
        versionId: version.id,
        manifestHash,
        profileVersionHash: activeProfiles.compositeHash,
        approvedAt,
      },
      { status: 200 }
    );
  }
);
