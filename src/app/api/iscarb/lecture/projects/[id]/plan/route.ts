/**
 * Lecture Planning — S1–S20 plan generation (BRD §7.1).
 * ===========================================================================
 * POST /api/iscarb/lecture/projects/[id]/plan
 *
 * Body: { regenerate?: boolean }
 *
 * Gates (in order):
 *   404 — project not found in tenant
 *   400 — CLO_APPROVAL_REQUIRED (AC-15): CLOs must be approved first
 *   409 — ALREADY_GENERATING: generation is already running
 *   202 — job accepted; progress published to `lecture:plan:{projectId}`
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { z } from "zod";
import { assertClosApproved } from "@/lib/lecture/planner/clo-validator";
import { enqueuePlan } from "@/lib/lecture/queue";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";

const bodySchema = z.object({
  regenerate: z.boolean().optional(),
});

/** GET /projects/[id]/plan — list the S1–S20 slide plans for the plan UI. */
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

    const project = await db.lectureProject.findUnique({
      where: { id: scoped.id },
      include: { courseProfile: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const slides = await db.lectureSlidePlan.findMany({
      where: { projectId: id },
      orderBy: { slideNo: "asc" },
    });

    const summary = {
      total: slides.length,
      approved: slides.filter((s) => s.approved).length,
      interactions: slides.reduce<Record<string, number>>((acc, s) => {
        if (s.interactionType) acc[s.interactionType] = (acc[s.interactionType] ?? 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({ slides, summary, project: { status: project.status, courseProfile: project.courseProfile } });
  }
);

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const scoped = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!scoped) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const project = await db.lectureProject.findUnique({
      where: { id: scoped.id },
      include: { courseProfile: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const approval = assertClosApproved(project.courseProfile.cloApprovedAt);
    if (!approval.valid) {
      return NextResponse.json({ error: approval.error, message: "Approve the lecture CLOs before generating the plan." }, { status: 400 });
    }

    // We removed the NO_PARSED_SOURCE block here to allow Topic-Only generation.
    // If no source document exists, Pass01Ingestion will autonomously trigger TopicResearchService
    // to build the source document from Wikipedia / open academic sites based on the project title.
    const existingSlidesCount = await db.lectureSlidePlan.count({ where: { projectId: id } });
    if (project.status === "generating" && existingSlidesCount > 0 && !parsed.data.regenerate) {
      return NextResponse.json({ error: "ALREADY_GENERATING", message: "Plan generation is already in progress. Pass regenerate: true to force reset." }, { status: 409 });
    }

    await db.lectureProject.update({ where: { id }, data: { status: "generating" } });

    // Queue plan generation (in-process on the long-lived Node/Docker process).
    await enqueuePlan(id, parsed.data.regenerate ?? false);

    return NextResponse.json(
      { jobId: id, slideCount: 20 },
      { status: 202 }
    );
  }
);
