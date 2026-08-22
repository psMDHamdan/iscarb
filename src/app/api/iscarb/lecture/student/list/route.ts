import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";

export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (req: Request, ctx: GuardContext) => {
    const url = new URL(req.url);
    const countOnly = url.searchParams.get("countOnly") === "true";
    const tenantId = ctx.session.universityId ?? null;
    const tenantFilter = tenantId ? { project: { tenantId } } : {};
    const studentId = ctx.session.studentId ?? ctx.session.userId ?? "demo-student-id";

    if (countOnly) {
      const approvedExperiences = await db.learningExperience.findMany({
        where: {
          status: "approved",
          ...tenantFilter,
        },
        select: { projectId: true },
      });
      const count = new Set(approvedExperiences.map((e: { projectId: string }) => e.projectId)).size;
      const started = await db.lectureStudentProgress.count({
        where: { studentId, completedSlides: { gt: 0 } }, // Keep using completedSlides for legacy progress or adapt later
      });
      return NextResponse.json(
        { count, unstarted: Math.max(0, count - started) },
        { status: 200 }
      );
    }

    const allExperiences = await db.learningExperience.findMany({
      where: {
        status: "approved",
        ...tenantFilter,
      },
      include: {
        project: {
          include: {
            courseProfile: true,
          },
        },
        conceptBlocks: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Only show the latest approved experience per project
    const uniqueProjects = new Set<string>();
    const experiences = [];
    for (const exp of allExperiences) {
      if (uniqueProjects.has(exp.projectId)) continue;
      uniqueProjects.add(exp.projectId);
      experiences.push(exp);
    }

    // Fallback: also include approved LecturePackageVersions that don't have
    // a canonical LearningExperience yet (published via legacy path).
    const fallbackVersions = await db.lecturePackageVersion.findMany({
      where: {
        status: "approved",
        projectId: { notIn: [...uniqueProjects] },
      },
      include: {
        project: {
          include: {
            courseProfile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const uniqueFallbackProjects = new Set<string>();
    for (const v of fallbackVersions) {
      if (uniqueFallbackProjects.has(v.projectId)) continue;
      uniqueFallbackProjects.add(v.projectId);
      // Create a compatible shape
      experiences.push({
        id: v.projectId, // use projectId as the experience ID for legacy routing
        projectId: v.projectId,
        project: v.project,
        publishedAt: v.approvedAt,
        conceptBlocks: [] as { id: string }[],
      } as any);
    }

    const experienceIds = experiences.map((exp) => exp.id);

    // The old progress tracked by versionId.
    const progressRecords = await db.lectureStudentProgress.findMany({
      where: {
        versionId: { in: experienceIds },
        studentId,
      },
    });

    const progressMap = new Map<string, any>(progressRecords.map((p: any) => [p.versionId, p]));

    const items = experiences.map((exp: any) => {
      const p = exp.project;
      const cp = p?.courseProfile;
      const prog = progressMap.get(exp.id);

      return {
        id: exp.id,
        projectId: p?.id ?? exp.projectId,
        courseCode: cp?.courseCode ?? "COURSE",
        courseTitle: cp?.title ?? "Untitled Lecture",
        specialty: cp?.specialty ?? null,
        publishedAt: exp.publishedAt ? new Date(exp.publishedAt).toISOString() : new Date().toISOString(),
        slideCount: exp.conceptBlocks?.length || 20,
        completedSlides: (prog as any)?.completedSlides ?? 0,
        score: (prog as any)?.score ?? null,
      };
    });

    return NextResponse.json({ versions: items }, { status: 200 });
  }
);
