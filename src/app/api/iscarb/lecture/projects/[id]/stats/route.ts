import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";
import { latestReadinessBySlide } from "@/lib/lecture/review/review-logic";

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (_req: Request, ctx: GuardContext, routeParams?: { params: Promise<{ id: string }> }) => {
    const { id } = (await routeParams?.params) || { id: "" };
    if (!id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const tenantId = ctx.session.universityId || "default";
    const project = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [
      sourceDocs,
      plans,
      artifacts,
      gates,
      readinessItems,
      ncaaLinks,
      ncaaaTotal,
      alignmentLinks,
      coverageLinks,
      eligibility,
    ] = await Promise.all([
      db.lectureSourceDocument.count({ where: { projectId: id, parseStatus: "done" } }),
      db.lectureSlidePlan.findMany({ where: { projectId: id }, select: { approved: true } }),
      db.lectureSlideArtifact.findMany({ where: { projectId: id }, select: { slideNo: true, status: true } }),
      db.lectureGateResult.findMany({
        where: { projectId: id },
        select: { id: true, status: true, severity: true, gateKey: true, waiveReason: true, findings: true },
      }),
      db.lectureReadinessItem.findMany({ where: { projectId: id }, select: { approved: true, slideNo: true, createdAt: true } }),
      db.lectureNCAAAEvidenceLink.findMany({ where: { projectId: id }, select: { status: true } }),
      db.nCAAARequirement.count(),
      db.lectureAlignmentLink.findMany({ where: { projectId: id, decision: "pending" }, select: { id: true } }),
      db.lectureCoverageLink.findMany({ where: { projectId: id, disposition: "pending" }, select: { id: true } }),
      db.lectureAlignmentEligibility.findUnique({
        where: { projectId: id },
        select: { decidedAt: true, mode: true },
      }),
    ]);

    const planCount = plans.length;
    const approvedPlans = plans.filter((p) => p.approved).length;
    const artifactCount = artifacts.length;
    const approvedArtifacts = artifacts.filter((a) => a.status === "approved").length;

    // Compute pendingDecisions to match decisions/inbox totalPending definition
    const draftOrFlagged = artifacts.filter((a) => a.status === "draft" || a.status === "flagged");
    const reviewSlides = new Set(draftOrFlagged.map((a) => a.slideNo));

    let unclaimedGateClaims = 0;
    const failingGates = gates.filter((g) => g.status === "fail");
    for (const g of failingGates) {
      const findings = (g.findings as { slideNo?: number; message?: string }[] | null) ?? [];
      if (findings.length === 0) {
        unclaimedGateClaims += 1;
        continue;
      }
      for (const f of findings) {
        if (f.slideNo != null && !reviewSlides.has(f.slideNo)) {
          unclaimedGateClaims += 1;
        }
      }
      const unattached = findings.filter((f) => f.slideNo == null && f.message);
      if (unattached.length > 0) {
        unclaimedGateClaims += 1;
      }
    }

    const pendingDecisions =
      draftOrFlagged.length +
      unclaimedGateClaims +
      alignmentLinks.length +
      coverageLinks.length;

    const failedGates = gates.filter((g) => g.status === "fail" && g.severity === "error").length;
    const allGatesPassed = gates.length > 0 && failedGates === 0;
    const currentReadiness = latestReadinessBySlide(readinessItems);
    const readinessApproved = currentReadiness.filter((r) => r.approved).length;
    const readinessTotal = currentReadiness.length;
    const ncaaaMet = ncaaLinks.filter((l) => l.status === "met").length;
    const ncaaaGaps = ncaaLinks.filter((l) => l.status === "gap").length;

    return NextResponse.json(
      {
        sourceParsed: sourceDocs > 0,
        planExists: planCount > 0,
        planApproved: planCount === 20 && approvedPlans === 20,
        approvedSlides: approvedPlans,
        artifactsGenerated: artifactCount > 0,
        approvedArtifacts,
        pendingDecisions,
        allGatesPassed,
        failedGates,
        readinessApproved,
        readinessTotal,
        readinessTotalApproved: readinessTotal,
        jaheziahDecided: Boolean(eligibility?.decidedAt),
        jaheziahMode: eligibility?.mode ?? null,
        ncaaaMet,
        ncaaaTotal,
        ncaaaGaps,
      },
      { status: 200 }
    );
  }
);
