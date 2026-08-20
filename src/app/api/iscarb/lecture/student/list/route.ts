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
      const approvedVersions = await db.lecturePackageVersion.findMany({
        where: {
          status: "approved",
          ...tenantFilter,
        },
        select: { projectId: true },
      });
      const count = new Set(approvedVersions.map((v) => v.projectId)).size;
      const started = await db.lectureStudentProgress.count({
        where: { studentId, completedSlides: { gt: 0 } },
      });
      return NextResponse.json(
        { count, unstarted: Math.max(0, count - started) },
        { status: 200 }
      );
    }

    const allVersions = await db.lecturePackageVersion.findMany({
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
      },
      orderBy: { createdAt: "desc" },
    });

    // Only show the latest approved version per project
    const uniqueProjects = new Set<string>();
    const versions = [];
    for (const v of allVersions) {
      if (uniqueProjects.has(v.projectId)) continue;
      uniqueProjects.add(v.projectId);
      versions.push(v);
    }

    const versionIds = versions.map((v) => v.id);

    const progressRecords = await db.lectureStudentProgress.findMany({
      where: {
        versionId: { in: versionIds },
        studentId,
      },
    });

    const progressMap = new Map(progressRecords.map((p) => [p.versionId, p]));

    const items = versions.map((version) => {
      const p = version.project;
      const cp = p.courseProfile;
      const prog = progressMap.get(version.id);

      return {
        id: version.id,
        projectId: p.id,
        courseCode: cp?.courseCode ?? "COURSE",
        courseTitle: cp?.title ?? "Untitled Lecture",
        specialty: cp?.specialty ?? null,
        publishedAt: version.createdAt ? new Date(version.createdAt).toISOString() : new Date().toISOString(),
        slideCount: 20,
        completedSlides: prog?.completedSlides ?? 0,
        score: prog?.score ?? null,
      };
    });

    return NextResponse.json({ versions: items }, { status: 200 });
  }
);
