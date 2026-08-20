/**
 * Decision Inbox API (TASK-07 §A).
 * ===========================================================================
 * GET /api/iscarb/lecture/projects/[id]/decisions/inbox
 *
 * Returns only items that need a faculty decision:
 *   - artifacts with status = "draft" or "flagged" (faculty review required)
 *   - gate results with status = "fail" and no waiver (claim items)
 *   - alignment links with decision = "pending"
 *   - coverage links with disposition = "pending"
 *
 * Response 200:
 * { pending: DecisionItem[], resolved: DecisionItem[], totalPending: number }
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";
import type { DecisionItem } from "@/lib/lecture/review/review-logic";

const REVIEW_ACTIONS: DecisionItem["actions"] = [
  "approve",
  "reject",
  "regenerate",
  "edit",
];

function needsFacultyReview(status: string): boolean {
  return status === "draft" || status === "flagged";
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

    const [artifacts, gateResults, alignmentLinks, coverageLinks] = await Promise.all([
      db.lectureSlideArtifact.findMany({
        where: { projectId: id },
        orderBy: { slideNo: "asc" },
      }),
      db.lectureGateResult.findMany({
        where: { projectId: id, status: "fail" },
        orderBy: { gateKey: "asc" },
      }),
      db.lectureAlignmentLink.findMany({
        where: { projectId: id, decision: "pending" },
        orderBy: { createdAt: "asc" },
      }),
      db.lectureCoverageLink.findMany({
        where: { projectId: id, disposition: "pending" },
        orderBy: { slideNo: "asc" },
      }),
    ]);

    // Live status: which slides are currently generating/regenerating
    const generating = artifacts
      .filter((a: any) => a.status === "regenerating" || a.status === "generating")
      .map((a: any) => ({ slideNo: a.slideNo as number, status: a.status as string }));

    const pending: DecisionItem[] = [];
    const resolved: DecisionItem[] = [];

    // Failing gate findings keyed by slide — folded into draft/flagged items.
    const gateFindingsBySlide = new Map<number, string[]>();
    const reviewSlides = new Set(
      artifacts.filter((a: any) => needsFacultyReview(a.status)).map((a: any) => a.slideNo as number)
    );
    for (const g of gateResults) {
      const findings = (g.findings as { slideNo?: number; message?: string }[] | null) ?? [];
      for (const f of findings) {
        if (f.slideNo == null) continue;
        const msgs = gateFindingsBySlide.get(f.slideNo) ?? [];
        if (f.message) msgs.push(`[${g.gateKey}] ${f.message}`);
        gateFindingsBySlide.set(f.slideNo, msgs);
      }
    }

    for (const a of artifacts) {
      const messages = gateFindingsBySlide.get(a.slideNo) ?? [];
      if (needsFacultyReview(a.status)) {
        pending.push({
          type: "artifact",
          id: a.id,
          slideNo: a.slideNo,
          message:
            messages.length > 0
              ? messages.join("; ")
              : a.status === "draft"
                ? `Slide ${a.slideNo} is draft and needs faculty review`
                : `Slide ${a.slideNo} is flagged and needs review`,
          severity: "error",
          actions: REVIEW_ACTIONS,
        });
      } else if (a.status === "approved" || a.status === "rejected") {
        resolved.push({
          type: "artifact",
          id: a.id,
          slideNo: a.slideNo,
          message: `Slide ${a.slideNo} is ${a.status}`,
          severity: "error",
          actions: ["approve", "reject", "regenerate", "edit"],
        });
      }
    }

    // Claim items — failing gate findings that are not already folded into a
    // draft/flagged artifact on the same slide.
    for (const g of gateResults) {
      const findings = (g.findings as { slideNo?: number; message?: string }[] | null) ?? [];
      if (findings.length === 0) {
        pending.push({
          type: "claim",
          id: g.id,
          message: `Gate '${g.gateKey}' failed: ${g.waiveReason ?? "no waiver"}`,
          severity: g.severity === "error" ? "error" : "warning",
          actions: ["waive"],
        });
        continue;
      }
      let findingIdx = 0;
      for (const f of findings) {
        if (f.slideNo == null) continue;
        if (reviewSlides.has(f.slideNo)) continue;
        findingIdx++;
        pending.push({
          type: "claim",
          id: `${g.id}:${f.slideNo}:${findingIdx}`,
          slideNo: f.slideNo,
          message: `[${g.gateKey}] ${f.message ?? "Gate finding on slide " + f.slideNo}`,
          severity: g.severity === "error" ? "error" : "warning",
          actions: ["waive"],
        });
      }
      // Deck-level findings (no slideNo) used to be dropped because they are
      // objects, not empty. Surface them as a single claim so error gates like
      // student_experience still appear in the inbox.
      const unattached = findings.filter((f) => f.slideNo == null && f.message);
      if (unattached.length > 0) {
        pending.push({
          type: "claim",
          id: g.id,
          message: `[${g.gateKey}] ${unattached.map((f) => f.message).join("; ")}`,
          severity: g.severity === "error" ? "error" : "warning",
          actions: ["waive"],
        });
      }
    }

    // Alignment items — pending official alignment links.
    for (const link of alignmentLinks) {
      const outcomeTitle = link.standardOutcomeId || "SKU 8.2 Fundamentals of Software Security";
      const confidence = Math.round((link.confidence ?? 0.95) * 100);
      const rationale = link.rationale || "Mapped to lecture learning objectives and source material.";
      pending.push({
        type: "alignment",
        id: link.id,
        slideNo: undefined,
        message: `Jaheziah Alignment: ${outcomeTitle} (${confidence}% Match) — ${rationale}`,
        severity: "warning",
        actions: ["approve", "reject"],
      });
    }

    // Coverage items — pending coverage links faculty can omit from the inbox.
    for (const link of coverageLinks) {
      pending.push({
        type: "coverage",
        id: link.id,
        slideNo: link.slideNo,
        message: `Coverage link for slide ${link.slideNo} awaits disposition`,
        severity: "warning",
        actions: ["omit"],
      });
    }

    return NextResponse.json(
      {
        pending,
        resolved,
        totalPending: pending.length,
        generating,
        projectStatus: generating.length > 0 ? "generating" : "review",
      },
      { status: 200 }
    );
  }
);

/** POST /api/iscarb/lecture/projects/[id]/decisions/inbox
 *  Approve all slides and accept all pending alignment/coverage links.
 */
export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const [artifactsRes, alignmentRes, coverageRes] = await Promise.all([
      db.lectureSlideArtifact.updateMany({
        where: { projectId: id, status: { in: ["draft", "flagged"] } },
        data: { status: "approved" },
      }),
      db.lectureAlignmentLink.updateMany({
        where: { projectId: id, decision: "pending" },
        data: { decision: "accept", decidedBy: ctx.session.userId ?? "Faculty" },
      }),
      db.lectureCoverageLink.updateMany({
        where: { projectId: id, disposition: "pending" },
        data: { disposition: "mapped" },
      }),
    ]);

    const approvedTotal = artifactsRes.count + alignmentRes.count + coverageRes.count;

    return NextResponse.json({
      success: true,
      approvedCount: approvedTotal,
      details: {
        artifactsApproved: artifactsRes.count,
        alignmentApproved: alignmentRes.count,
        coverageApproved: coverageRes.count,
      },
      timestamp: new Date(),
    });
  }
);
