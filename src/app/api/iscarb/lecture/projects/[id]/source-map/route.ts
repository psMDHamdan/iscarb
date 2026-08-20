/**
 * Lecture Planning — source map.
 * ===========================================================================
 * GET /api/iscarb/lecture/projects/[id]/source-map
 *
 * Returns the project's documents with their parse status and the extracted
 * source blocks grouped by type. This powers the "source-map" view that maps
 * course content to CLOs before slide planning begins.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { summarizeBlocks } from "@/lib/lecture/ingestion/source-block-builder";
import { clearOmittedCoverage, persistOmittedCoverage } from "@/lib/lecture/generation/persist-handoffs";
import { z } from "zod";

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id: projectId } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await db.lectureProject.findFirst({
      where: { id: projectId, tenantId },
      include: {
        courseProfile: true,
        sourceDocuments: {
          orderBy: { createdAt: "asc" },
          include: { sourceBlocks: true },
        },
      },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const allBlocks = project.sourceDocuments.flatMap((doc) => doc.sourceBlocks);
    const summary = {
      total: allBlocks.length,
      critical: allBlocks.filter((b) => b.criticality === "critical").length,
      mapped: allBlocks.filter((b) => b.status === "mapped").length,
      omitted: allBlocks.filter((b) => b.status === "omitted").length,
      unresolved: allBlocks.filter((b) => b.status === "unresolved").length,
    };

    const documents = project.sourceDocuments.map((doc) => ({
      id: doc.id,
      originalName: doc.originalName,
      type: doc.type,
      parseStatus: doc.parseStatus,
      version: doc.version,
      blocks: summarizeBlocks(doc.sourceBlocks),
      blockList: doc.sourceBlocks.map((b) => ({
        id: b.id,
        locator: b.locator,
        type: b.type,
        text: b.text,
        criticality: b.criticality,
        status: b.status,
      })),
    }));

    const parseStatus =
      project.sourceDocuments.length === 0
        ? "parsing"
        : project.sourceDocuments.every((d) => d.parseStatus === "done")
          ? "done"
          : project.sourceDocuments.some((d) => d.parseStatus === "failed")
            ? "failed"
            : "parsing";

    return NextResponse.json({
      projectId: project.id,
      parseStatus,
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        courseProfile: {
          courseCode: project.courseProfile.courseCode,
          title: project.courseProfile.title,
          cloCount: Array.isArray(project.courseProfile.teacherEnteredClos)
            ? project.courseProfile.teacherEnteredClos.length
            : 0,
        },
      },
      documents,
      summary,
    });
  }
);

const patchSchema = z.object({
  blockIds: z.array(z.string()).min(1),
  status: z.enum(["mapped", "omitted"]),
  omissionReason: z.string().optional(),
});

export const PATCH = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id: projectId } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await db.lectureProject.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { blockIds, status, omissionReason } = parsed.data;

    // Verify all blocks exist in this project
    const blocks = await db.lectureSourceBlock.findMany({
      where: { 
        id: { in: blockIds },
        document: { projectId }
      },
      select: { id: true, criticality: true },
    });

    if (blocks.length !== blockIds.length) {
      return NextResponse.json({ error: "One or more blocks not found in this project" }, { status: 400 });
    }

    // BRD Rule: Critical blocks require an omission reason
    if (status === "omitted") {
      const hasCritical = blocks.some((b) => b.criticality === "critical");
      if (hasCritical && (!omissionReason || omissionReason.trim() === "")) {
        return NextResponse.json({ error: "omissionReason is required when omitting critical blocks" }, { status: 400 });
      }
    }

    try {
      // Update the blocks
      await db.lectureSourceBlock.updateMany({
        where: { id: { in: blockIds } },
        data: { status },
      });

      if (status === "omitted") {
        await persistOmittedCoverage({
          projectId,
          blockIds,
          reason: omissionReason ?? null,
          approvedBy: ctx.session.userId ?? "faculty",
          organizationId: project.organizationId,
        });
      } else if (status === "mapped") {
        await clearOmittedCoverage(projectId, blockIds);
      }

      return NextResponse.json({ success: true, updatedCount: blocks.length });
    } catch (err: any) {
      console.error("[SOURCE-MAP PATCH DB ERROR]", err);
      return NextResponse.json({ error: `Failed to update source blocks: ${err?.message || String(err)}` }, { status: 500 });
    }
  }
);
