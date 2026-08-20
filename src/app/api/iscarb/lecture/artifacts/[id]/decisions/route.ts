/**
 * Decision Action API (TASK-07 §B).
 * ===========================================================================
 * POST /api/iscarb/lecture/artifacts/[id]/decisions
 * Body: { action, reason?, editedContent? }
 *
 *   approve    → artifact.status = "approved", LectureDecision with beforeHash
 *   reject     → artifact.status = "rejected"
 *   regenerate → AC-09-guarded single-slide regeneration, preserves others
 *   edit       → saves editedContent, status = "approved", before+after hash
 *   omit       → coverage link disposition = "omitted" (reason required)
 *   waive      → warning-severity gate results set to "waived"
 *
 * Response 200: { artifactId, newStatus, decisionId }
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  contentHash,
  shouldRegenerate,
  type DecisionAction,
} from "@/lib/lecture/review/review-logic";
import { auditCrossTenant } from "@/lib/lecture/review/tenant-guard";
import { enqueueGeneration } from "@/lib/lecture/queue";

const bodySchema = z.object({
  action: z.enum(["approve", "reject", "omit", "waive", "regenerate", "edit"]),
  reason: z.string().optional(),
  editedContent: z.unknown().optional(),
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

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const artifact = await db.lectureSlideArtifact.findFirst({
      where: { id },
      include: { project: true },
    });
    if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    if (artifact.project.tenantId !== tenantId) {
      await auditCrossTenant({
        actorId: ctx.session.userId,
        entityType: "LectureSlideArtifact",
        entityId: artifact.id,
        tenantId,
      });
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    const action: DecisionAction = parsed.data.action;
    const beforeHash = contentHash(artifact.contentJson ?? {});

    let newStatus = artifact.status;
    let coverageUpdated = 0;
    let queueRegeneration = false;

    switch (action) {
      case "approve":
        newStatus = "approved";
        break;

      case "reject":
        // §B — reject sets status "rejected" and queues single-slide
        // regeneration so a fresh draft replaces it (never touches others).
        newStatus = "rejected";
        queueRegeneration = true;
        break;

      case "edit": {
        if (parsed.data.editedContent === undefined) {
          return NextResponse.json({ error: "editedContent is required for 'edit'" }, { status: 400 });
        }
        newStatus = "approved";
        break;
      }

      case "omit": {
        if (!parsed.data.reason) {
          return NextResponse.json({ error: "reason is required for 'omit'" }, { status: 400 });
        }
        const omitted = await db.lectureCoverageLink.updateMany({
          where: { projectId: artifact.projectId, slideNo: artifact.slideNo },
          data: {
            disposition: "omitted",
            reason: parsed.data.reason,
            approvedBy: ctx.session.userId,
            approvedAt: new Date(),
          },
        });
        if (omitted.count === 0) {
          return NextResponse.json({ error: "No coverage link for this slide" }, { status: 400 });
        }
        coverageUpdated = omitted.count;
        break;
      }

      case "waive": {
        // Only warning-severity gates can be waived (visual_support).
        await db.lectureGateResult.updateMany({
          where: { projectId: artifact.projectId, severity: "warning", status: "fail" },
          data: {
            status: "waived",
            waiveReason: parsed.data.reason ?? "Waived from artifact decision",
            waivedBy: ctx.session.userId,
            checkedAt: new Date(),
          },
        });
        break;
      }

      case "regenerate": {
        const hasEditDecision = await db.lectureDecision.findFirst({
          where: { artifactId: artifact.id, action: "edit" },
        });
        // AC-09 — never overwrite a faculty edit.
        if (!shouldRegenerate(artifact, Boolean(hasEditDecision))) {
          return NextResponse.json(
            { artifactId: id, newStatus: "approved", decisionId: null, preserved: true },
            { status: 200 }
          );
        }
        newStatus = "regenerating";
        await db.lectureSlideArtifact.update({
          where: { id },
          data: { status: "regenerating" },
        });
        await enqueueGeneration(artifact.projectId, [artifact.slideNo]);
        break;
      }
    }

    const afterHash =
      action === "edit"
        ? contentHash(parsed.data.editedContent)
        : action === "approve"
          ? beforeHash
          : null;

    // Only persist content + status for edit.
    if (action === "edit") {
      await db.lectureSlideArtifact.update({
        where: { id },
        data: {
          contentJson: parsed.data.editedContent as object,
          status: "approved",
        },
      });
    } else if (action === "approve" || action === "reject") {
      await db.lectureSlideArtifact.update({ where: { id }, data: { status: newStatus } });
    }

    // §B — reject queues regeneration only after the rejected status is
    // persisted, so the regen worker sees the fresh "rejected" state.
    if (queueRegeneration) {
      await enqueueGeneration(artifact.projectId, [artifact.slideNo]);
    }

    const decision = await db.lectureDecision.create({
      data: {
        projectId: artifact.projectId,
        artifactId: artifact.id,
        action,
        reason: parsed.data.reason,
        actorId: ctx.session.userId ?? "unknown",
        beforeHash,
        afterHash,
      },
    });

    return NextResponse.json(
      {
        artifactId: id,
        newStatus,
        decisionId: decision.id,
        ...(coverageUpdated > 0 ? { coverageUpdated } : {}),
      },
      { status: 200 }
    );
  }
);
