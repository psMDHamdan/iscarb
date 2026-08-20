/**
 * Lecture Generation — artifacts list (additive, used by the Studio UI).
 * ===========================================================================
 * GET /api/iscarb/lecture/projects/[id]/artifacts
 *
 * Returns the per-slide generated artifacts for a project, plus the slide
 * plans they belong to. Read-only; never mutates generation state.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { deduplicateSlideArtifacts } from "@/lib/lecture/deduplication";

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await db.lectureProject.findFirst({
      where: { OR: [{ id, tenantId }, { id }] },
      select: { id: true, status: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const [plans, allArtifacts] = await Promise.all([
      db.lectureSlidePlan.findMany({
        where: { projectId: id },
        orderBy: { slideNo: "asc" },
      }),
      db.lectureSlideArtifact.findMany({
        where: { projectId: id },
        orderBy: [{ slideNo: "asc" }, { version: "desc" }],
      }),
    ]);

    const artifacts = deduplicateSlideArtifacts(allArtifacts);

    return NextResponse.json({ project, plans, artifacts });
  }
);

export const PATCH = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const body = await req.json();
    const { artifactId, slideNo, visualSpec, contentJson } = body;

    let artifact = null;
    if (artifactId) {
      artifact = await db.lectureSlideArtifact.findUnique({
        where: { id: artifactId },
      });
    } else if (slideNo !== undefined) {
      artifact = await db.lectureSlideArtifact.findFirst({
        where: { projectId: id, slideNo: Number(slideNo) },
        orderBy: { version: "desc" },
      });
    }

    if (!artifact) {
      return NextResponse.json({ error: "Slide artifact not found" }, { status: 404 });
    }

    const currentContent = (artifact.contentJson as any) || {};
    const updatedContent = contentJson || {
      ...currentContent,
      visualSpec: {
        ...(currentContent.visualSpec || {}),
        ...(visualSpec || {}),
      },
    };

    const updated = await db.lectureSlideArtifact.update({
      where: { id: artifact.id },
      data: {
        contentJson: updatedContent,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, artifact: updated });
  }
);

