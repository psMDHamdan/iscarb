/**
 * Lecture Readiness — items list & on-demand generator.
 * ===========================================================================
 * GET /api/iscarb/lecture/projects/[id]/readiness
 *   Returns the project's alignment mode plus all readiness items.
 * POST /api/iscarb/lecture/projects/[id]/readiness
 *   Generates / regenerates readiness items mapped to CLOs and slide ranges.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { deduplicateReadinessItems } from "@/lib/lecture/deduplication";
import { generateReadinessItems } from "@/lib/lecture/generation/readiness-generator";
import type { ReadinessItemJson } from "@/lib/lecture/generation/types";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const scoped = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!scoped) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const project = await db.lectureProject.findFirst({
      where: { id: scoped.id },
      select: { id: true, nationalAlignmentMode: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const rawItems = await db.lectureReadinessItem.findMany({
      where: { projectId: id },
      orderBy: { slideNo: "asc" },
    });
    const items = deduplicateReadinessItems(rawItems);

    return NextResponse.json({
      mode: project.nationalAlignmentMode,
      items: items.map((i) => ({
        id: i.id,
        slideNo: i.slideNo,
        stem: i.stem,
        options: i.options,
        correctIndex: i.correctIndex,
        difficulty: i.difficulty,
        rationale: i.rationale,
        misconception: i.misconception,
        sourceLocator: i.sourceLocator,
        cloId: i.cloId,
        sourceBlockId: i.sourceBlockId,
        approved: i.approved,
      })),
    });
  }
);

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const scoped = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!scoped) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const project = await db.lectureProject.findFirst({
      where: { id: scoped.id },
      include: {
        courseProfile: true,
        sourceBlocks: true,
        slidePlans: true,
        slideArtifacts: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Generate readiness items using the engine
    let items: ReadinessItemJson[] = [];
    try {
      items = await generateReadinessItems(project as any);
    } catch (err) {
      console.warn("[readiness/POST] LLM generation error", err);
    }

    // BRD FR-004: the system must not invent CLO text. If generation returned
    // nothing and there are no teacher-entered CLOs, reject rather than
    // fabricate readiness items with placeholder CLO content.
    if (!items || items.length === 0) {
      const clos = (project.courseProfile.teacherEnteredClos as any[]) || [];
      if (clos.length === 0) {
        return NextResponse.json({
          error: "CLO_REQUIRED",
          message: "Cannot generate readiness items without approved Course Learning Outcomes. Please enter and approve CLOs first.",
        }, { status: 400 });
      }
      
      // BRD FR-004: the system must not invent CLO text or readiness items.
      // If generation returned nothing, reject rather than fabricate items.
      return NextResponse.json({
        error: "GENERATION_FAILED",
        message: "Failed to generate readiness items. Please review the lecture content and try again.",
      }, { status: 500 });
    }

    // Save items to database
    for (const item of items) {
      const existing = await db.lectureReadinessItem.findFirst({
        where: { projectId: id, slideNo: item.slideNo },
      });

      const payload = {
        alignmentMode: project.nationalAlignmentMode,
        specialtyKey: null,
        outcomeId: item.sourceLocator ?? null,
        cloId: item.cloId,
        sourceBlockId: item.sourceBlockId ?? null,
        slideNo: item.slideNo,
        stem: item.stem,
        options: item.options as object[],
        correctIndex: item.correctIndex,
        difficulty: item.difficulty,
        rationale: item.rationale,
        misconception: item.misconception ?? null,
        sourceLocator: item.sourceLocator ?? null,
      };

      if (existing && !existing.approved) {
        await db.lectureReadinessItem.update({
          where: { id: existing.id },
          data: { ...payload, updatedAt: new Date() },
        });
      } else if (!existing) {
        await db.lectureReadinessItem.create({
          data: {
            projectId: id,
            ...payload,
          },
        });
      }
    }

    const savedItems = await db.lectureReadinessItem.findMany({
      where: { projectId: id },
      orderBy: { slideNo: "asc" },
    });

    return NextResponse.json({
      success: true,
      count: savedItems.length,
      items: savedItems,
    });
  }
);
