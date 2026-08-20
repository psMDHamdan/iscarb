/**
 * Lecture Planning — project detail.
 * ===========================================================================
 * GET    /api/iscarb/lecture/projects/[id]  — project + course profile
 * PATCH  /api/iscarb/lecture/projects/[id]  — update title / status / version
 * DELETE /api/iscarb/lecture/projects/[id]  — delete project (cascades)
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { z } from "zod";
import { resolveJaheziahMode } from "@/lib/lecture/planner/jaheziah-resolver";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z
    .enum(["draft", "parsing", "planning", "generating", "review", "approved_plan", "approved", "exported", "archived"])
    .optional(),
  currentVersion: z.number().int().min(1).optional(),
  specialty: z.string().min(1).max(100).optional(),
});

async function getProject(ctx: GuardContext, id: string) {
  const tenantId = ctx.session.universityId || "default";
  const project = await db.lectureProject.findFirst({
    where: { id },
    include: { courseProfile: true, sourceDocuments: true },
  });
  if (!project) return null;
  if (project.tenantId && project.tenantId !== tenantId && tenantId !== "default" && project.tenantId !== "default") {
    return null;
  }
  return project;
}

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const project = await getProject(ctx, id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ project });
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
    const existing = await getProject(ctx, id);
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const project = await db.lectureProject.update({
      where: { id },
      data: parsed.data,
    });

    // AC-29: a specialty change re-runs Jaheziah eligibility and clears any
    // official alignment links that are no longer compatible.
    if (parsed.data.specialty && parsed.data.specialty !== existing.courseProfile?.specialty) {
      await db.lectureCourseProfile.update({
        where: { id: existing.courseProfileId },
        data: { specialty: parsed.data.specialty },
      });

      const standards = await db.nationalStandard.findMany({
        select: { specialtyKey: true, createdAt: true },
      });
      const resolution = resolveJaheziahMode(parsed.data.specialty, standards);

      await db.lectureAlignmentEligibility.upsert({
        where: { projectId: id },
        create: {
          projectId: id,
          organizationId: project.organizationId ?? null,
          mode: resolution.mode,
          candidateSpecialtyKey: resolution.candidateSpecialtyKey ?? null,
          confidence: resolution.confidence ?? null,
          rationale: resolution.rationale,
          sourceSnapshotId: resolution.sourceSnapshotId ?? null,
        },
        update: {
          mode: resolution.mode,
          candidateSpecialtyKey: resolution.candidateSpecialtyKey ?? null,
          confidence: resolution.confidence ?? null,
          rationale: resolution.rationale,
          sourceSnapshotId: resolution.sourceSnapshotId ?? null,
          // AC-29: a changed specialty invalidates any prior decision — it must
          // never be silently carried across specialties.
          decidedBy: null,
          decidedAt: null,
        },
      });

      if (resolution.mode !== "OFFICIAL_JAHEZIAH") {
        await db.lectureAlignmentLink.deleteMany({
          where: { projectId: id, mode: "OFFICIAL_JAHEZIAH" },
        });
      }
    }

    const updated = await getProject(ctx, id);
    return NextResponse.json({ project: updated });
  }
);

export const DELETE = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const existing = await getProject(ctx, id);
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    await db.lectureProject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }
);
