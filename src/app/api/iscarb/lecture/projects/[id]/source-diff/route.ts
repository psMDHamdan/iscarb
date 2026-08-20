/**
 * Source Version Diff API (TASK-07 §D, AC-12).
 * ===========================================================================
 * POST /api/iscarb/lecture/projects/[id]/source-diff
 * Body: { newDocumentId: string }
 *
 * Diffs the newly-parsed document's blocks against the project's existing
 * blocks (by locator + content). Faculty reviews changes before regeneration
 * is approved. Only blocks tied to changed source content need regenerating.
 *
 * Response 200: { changed, added, removed, orphaned }
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";
import { diffSourceBlocks } from "@/lib/lecture/review/review-logic";

const bodySchema = z.object({
  newDocumentId: z.string().min(1, "newDocumentId is required"),
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

    const newDoc = await db.lectureSourceDocument.findFirst({
      where: { id: parsed.data.newDocumentId, projectId: id },
    });
    if (!newDoc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const newBlocks = await db.lectureSourceBlock.findMany({
      where: { documentId: newDoc.id },
      select: { id: true, locator: true, text: true },
      orderBy: { locator: "asc" },
    });

    // Existing blocks are the project's blocks from other documents.
    const existingBlocks = await db.lectureSourceBlock.findMany({
      where: { projectId: id, NOT: { documentId: newDoc.id } },
      select: { id: true, locator: true, text: true },
      orderBy: { locator: "asc" },
    });

    const coverageLinks = await db.lectureCoverageLink.findMany({
      where: { projectId: id },
      select: { id: true, blockId: true, disposition: true },
    });

    const diff = diffSourceBlocks(existingBlocks, newBlocks, coverageLinks);

    return NextResponse.json(diff, { status: 200 });
  }
);
