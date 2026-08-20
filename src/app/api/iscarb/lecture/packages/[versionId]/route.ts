import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { auditCrossTenant } from "@/lib/lecture/review/tenant-guard";
import { snapshotReadinessItems } from "@/lib/lecture/review/review-logic";

export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ versionId: string }> }
  ) => {
    const { versionId } = await params;
    // Sessions without a university are not tenant-scoped: they may open any
    // approved lecture. University members stay strictly scoped to their tenant.
    const tenantId = ctx.session.universityId ?? null;

    if (versionId.startsWith("PREVIEW_")) {
      // PREVIEW is faculty/admin-only — students must not see draft artifacts
      if (ctx.session.role === "student") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
      const projectId = versionId.replace("PREVIEW_", "");
      const project = await db.lectureProject.findUnique({
        where: { id: projectId },
        include: {
          courseProfile: true,
          slideArtifacts: { orderBy: { slideNo: "asc" } },
          readinessItems: { orderBy: { slideNo: "asc" } },
          plans: { orderBy: { slideNo: "asc" } },
        },
      });

      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
      if (tenantId && project.tenantId !== tenantId) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      const interactions: Record<string, { type: string | null; function: string | null }> = {};
      for (const p of project.plans) {
        interactions[String(p.slideNo)] = { type: p.interactionType ?? null, function: p.function ?? null };
      }

      return NextResponse.json({
        version: {
          id: versionId,
          version: 0,
          status: "approved",
          title: project.courseProfile?.title || project.title || "Lecture Preview",
          projectId: project.id,
          project: {
            id: project.id,
            courseProfile: project.courseProfile,
          },
        },
        artifacts: project.slideArtifacts,
        readinessItems: project.readinessItems,
        interactions,
      });
    }

    const version = await db.lecturePackageVersion.findUnique({
      where: { id: versionId },
      include: { project: { include: { courseProfile: true } } },
    });
    
    if (!version) return NextResponse.json({ error: "Package version not found" }, { status: 404 });
    
    if (tenantId && version.project.tenantId !== tenantId) {
      await auditCrossTenant({
        actorId: ctx.session.userId,
        entityType: "LecturePackageVersion",
        entityId: versionId,
        tenantId,
      });
      return NextResponse.json({ error: "Package version not found" }, { status: 404 });
    }

    if (version.status !== "approved") {
      return NextResponse.json(
        { error: "Package version is not approved" },
        { status: 400 }
      );
    }

    const artifactIds = (version.approvedArtifacts as string[] | null) ?? [];
    const artifacts = await db.lectureSlideArtifact.findMany({
      where: { id: { in: artifactIds } },
      orderBy: { slideNo: "asc" },
    });

    // Readiness items accumulate across regeneration runs; only the newest item
    // per slide (the latest generation) is shown to the student.
    const allItems = await db.lectureReadinessItem.findMany({
      where: { projectId: version.projectId },
    });
    const readinessItems = snapshotReadinessItems(
      allItems,
      artifacts.map((a) => a.slideNo),
      version.approvedAt,
    );

    // Per-slide interaction type (poll | pause_discuss | collaboration | practice |
    // worked_example) so the player can render the right active-learning widget.
    const slidePlans = await db.lectureSlidePlan.findMany({
      where: { projectId: version.projectId },
      select: { slideNo: true, interactionType: true, function: true },
    });
    const interactions = Object.fromEntries(
      slidePlans.map((p) => [p.slideNo, { type: p.interactionType, function: p.function }]),
    );

    const courseConcepts = await db.courseConcept.findMany({
      where: { courseId: version.project.courseId },
      include: { concept: true }
    });
    
    // Deduplicate concepts by ID
    const uniqueConceptIds = new Set<string>();
    const concepts: { id: string; name: string }[] = [];
    for (const cc of courseConcepts) {
       if (!cc.concept || uniqueConceptIds.has(cc.concept.id)) continue;
       uniqueConceptIds.add(cc.concept.id);
       concepts.push({
          id: cc.concept.id,
          name: cc.concept.name
       });
    }

    const clos = (version.project?.courseProfile?.teacherEnteredClos as any) ?? [];

    // FR-019 / FR-021 / AC-21: strip correctIndex from readiness items for students
    const isStudent = ctx.session.role === "student";
    const safeReadinessItems = isStudent
      ? readinessItems.map(({ correctIndex, rationale, ...rest }: any) => rest)
      : readinessItems;

    return NextResponse.json({
      version,
      artifacts,
      readinessItems: safeReadinessItems,
      interactions,
      concepts,
      clos,
    }, { status: 200 });
  }
);
