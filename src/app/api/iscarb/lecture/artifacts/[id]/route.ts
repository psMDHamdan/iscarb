/**
 * Artifact Edit API (TASK-07 §C).
 * ===========================================================================
 * PATCH /api/iscarb/lecture/artifacts/[id]
 * Body: Partial<SlideContentJson>
 *
 * - Increments artifact.version
 * - Stores beforeHash of previous content
 * - Re-runs density and claim_policy gates only (NOT all gates)
 *
 * Response 200: { artifactId, version, updatedAt }
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { contentHash } from "@/lib/lecture/review/review-logic";
import { auditCrossTenant } from "@/lib/lecture/review/tenant-guard";
import { runSingleGate } from "@/lib/lecture/quality/gate-runner";

const AFFECTED_GATES = ["density", "claim_policy"] as const;

export const PATCH = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
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

    const beforeHash = contentHash(artifact.contentJson ?? {});

    // Merge the partial edit into the existing content.
    const nextContent = { ...(artifact.contentJson as object), ...body };

    const updated = await db.lectureSlideArtifact.update({
      where: { id },
      data: {
        contentJson: nextContent,
        status: "approved",
        version: { increment: 1 },
      },
    });

    // §C — re-run only the gates affected by content edits.
    for (const gateKey of AFFECTED_GATES) {
      await runSingleGate(artifact.projectId, gateKey);
    }

    await db.lectureDecision.create({
      data: {
        projectId: artifact.projectId,
        artifactId: artifact.id,
        action: "edit",
        actorId: ctx.session.userId ?? "unknown",
        beforeHash,
        afterHash: contentHash(nextContent),
      },
    });

    return NextResponse.json(
      {
        artifactId: id,
        version: updated.version,
        updatedAt: updated.updatedAt,
      },
      { status: 200 }
    );
  }
);
