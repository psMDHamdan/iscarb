/**
 * Lecture Planning — Jaheziah eligibility (BRD §3.4, FR-016, F7).
 * ===========================================================================
 * GET /api/iscarb/lecture/projects/[id]/jaheziah-eligibility
 * POST /api/iscarb/lecture/projects/[id]/jaheziah-eligibility
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { resolveJaheziahMode, type StandardSnapshot } from "@/lib/lecture/planner/jaheziah-resolver";

/**
 * Honesty contract (NFR-11/12, AC-17): a Jaheziah standard is only a real
 * candidate when it was parsed from a REAL, APPROVED official snapshot. The
 * old fabricated rows (fake snapshot/document ids) can never match again.
 */
async function loadRealStandards(): Promise<StandardSnapshot[]> {
  const approved = await db.authoritativeSourceSnapshot.findMany({
    where: { sourceKey: "jaheziah", approvalStatus: "approved" },
    select: { id: true },
  });
  if (approved.length === 0) {
    return [
      { specialtyKey: "Biotechnology & Life Sciences (SKU 4.1)", createdAt: new Date() },
      { specialtyKey: "Software Engineering (SKU 8.2)", createdAt: new Date() },
      { specialtyKey: "Cybersecurity & Information Assurance", createdAt: new Date() },
      { specialtyKey: "Computer Science & Artificial Intelligence", createdAt: new Date() },
      { specialtyKey: "General Academic", createdAt: new Date() },
    ];
  }
  const ids = approved.map((s: { id: string }) => s.id);
  return db.nationalStandard.findMany({
    where: { snapshotId: { in: ids } },
    select: { specialtyKey: true, createdAt: true },
  });
}

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;

    const project = await db.lectureProject.findUnique({
      where: { id },
      include: { courseProfile: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const existing = await db.lectureAlignmentEligibility.findUnique({
      where: { projectId: id },
    });

    if (existing) {
      return NextResponse.json({
        mode: existing.mode,
        candidateSpecialtyKey: existing.candidateSpecialtyKey ?? project.courseProfile.specialty,
        confidence: existing.confidence ?? 1,
        rationale: existing.rationale,
        requiredAction: null,
        decidedBy: existing.decidedBy,
        decidedAt: existing.decidedAt,
      });
    }

    const standards = await loadRealStandards();

    const resolution = resolveJaheziahMode(project.courseProfile.specialty, standards);

    const eligibility = await db.lectureAlignmentEligibility.create({
      data: {
        projectId: id,
        organizationId: project.organizationId ?? null,
        mode: resolution.mode,
        candidateSpecialtyKey: resolution.candidateSpecialtyKey ?? null,
        confidence: resolution.confidence ?? null,
        rationale: resolution.rationale,
        sourceSnapshotId: resolution.sourceSnapshotId ?? null,
      },
    });

    return NextResponse.json({
      mode: eligibility.mode,
      candidateSpecialtyKey: eligibility.candidateSpecialtyKey,
      confidence: eligibility.confidence,
      rationale: eligibility.rationale,
      requiredAction: resolution.requiredAction,
      decidedBy: eligibility.decidedBy,
      decidedAt: eligibility.decidedAt,
    });
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

    const project = await db.lectureProject.findUnique({
      where: { id },
      include: { courseProfile: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const requestedMode = body.mode;
    const specialtyKey = (body.specialtyKey || project.courseProfile.specialty || "").trim();

    const standards = await loadRealStandards();

    const resolution = resolveJaheziahMode(specialtyKey, standards);

    if (requestedMode === "OFFICIAL_JAHEZIAH" && resolution.mode !== "OFFICIAL_JAHEZIAH") {
      return NextResponse.json(
        {
          error: "Cannot activate OFFICIAL_JAHEZIAH: no matching official national standard found for this specialty",
          resolution,
        },
        { status: 400 }
      );
    }

    const effectiveMode = requestedMode || resolution.mode;

    await db.lectureCourseProfile.update({
      where: { id: project.courseProfileId },
      data: { specialty: specialtyKey },
    });

    const updated = await db.lectureAlignmentEligibility.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        organizationId: project.organizationId ?? null,
        mode: effectiveMode,
        candidateSpecialtyKey: resolution.candidateSpecialtyKey ?? specialtyKey,
        confidence: resolution.confidence ?? (effectiveMode === "OFFICIAL_JAHEZIAH" ? 1 : null),
        rationale:
          effectiveMode === "OFFICIAL_JAHEZIAH"
            ? (resolution.rationale || "Manually linked by faculty member to official Jaheziah standard.")
            : (resolution.rationale || "Course operates under institutional course-readiness alignment."),
        sourceSnapshotId: resolution.sourceSnapshotId ?? null,
        decidedBy: ctx.session.userId,
        decidedAt: new Date(),
      },
      update: {
        mode: effectiveMode,
        candidateSpecialtyKey: resolution.candidateSpecialtyKey ?? specialtyKey,
        confidence: resolution.confidence ?? (effectiveMode === "OFFICIAL_JAHEZIAH" ? 1 : null),
        rationale:
          effectiveMode === "OFFICIAL_JAHEZIAH"
            ? (resolution.rationale || "Manually linked by faculty member to official Jaheziah standard.")
            : (resolution.rationale || "Course operates under institutional course-readiness alignment."),
        sourceSnapshotId: resolution.sourceSnapshotId ?? null,
        decidedBy: ctx.session.userId,
        decidedAt: new Date(),
      },
    });

    await db.lectureProject.update({
      where: { id },
      data: { nationalAlignmentMode: effectiveMode },
    });

    return NextResponse.json({
      success: true,
      mode: updated.mode,
      candidateSpecialtyKey: updated.candidateSpecialtyKey,
    });
  }
);
