/**
 * Lecture Planning — projects collection.
 * ===========================================================================
 * POST /api/iscarb/lecture/projects      — create a project (faculty/admin)
 * GET  /api/iscarb/lecture/projects      — list the caller's tenant projects
 *
 * Creating a project requires a course profile (CLOs). Per TASK-02 the first
 * run creates a fresh LectureCourseProfile; subsequent runs reuse the last
 * profile created by the same tenant so CLOs are kept stable.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  courseProfile: z.object({
    courseCode: z.string().min(1),
    title: z.string().min(1),
    specialty: z.string().optional().default(""),
    languagePolicy: z.enum(["en", "ar", "bilingual"]).optional().default("en"),
    audience: z.string().optional(),
    duration: z.string().optional(),
    institutionalProfile: z.string().optional(),
    teacherEnteredClos: z.array(z.unknown()).min(0).max(50),
    selectedLectureCloIds: z.array(z.string()).max(5).optional(),
  }),
});

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (req: Request, ctx: GuardContext) => {
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }
    const { title, courseProfile } = parsed.data;
    const tenantId = ctx.session.universityId || "default";

    // Reuse the most recent course profile for this tenant to keep CLOs stable.
    const existing = await db.lectureCourseProfile.findFirst({
      where: { tenantId, courseCode: courseProfile.courseCode },
      orderBy: { createdAt: "desc" },
    });

    let profile = existing;
    if (existing) {
      // Update course title to current project title if provided
      if (title && existing.title !== title) {
        profile = await db.lectureCourseProfile.update({
          where: { id: existing.id },
          data: { title },
        });
      }
    } else {
      profile = await db.lectureCourseProfile.create({
        data: {
          tenantId,
          courseCode: courseProfile.courseCode,
          title: courseProfile.title || title,
          specialty: courseProfile.specialty,
          languagePolicy: courseProfile.languagePolicy,
          audience: courseProfile.audience,
          duration: courseProfile.duration,
          institutionalProfile: courseProfile.institutionalProfile,
          teacherEnteredClos: courseProfile.teacherEnteredClos,
          selectedLectureCloIds: courseProfile.selectedLectureCloIds ?? [],
        },
      });
    }

    const project = await db.lectureProject.create({
      data: {
        tenantId,
        courseProfileId: profile.id,
        title,
        createdBy: ctx.session.userId,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  }
);

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (_req: Request, ctx: GuardContext) => {
    const tenantId = ctx.session.universityId || "default";
    const projects = await db.lectureProject.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        courseProfile: true,
        sourceDocuments: true,
        _count: { select: { sourceBlocks: true } },
      },
    });
    return NextResponse.json({ projects });
  }
);
