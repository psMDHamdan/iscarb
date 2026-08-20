import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { auditCrossTenant } from "@/lib/lecture/review/tenant-guard";

function formatProgress(p: any) {
  if (!p) return null;
  const ans = (typeof p.answers === "object" && p.answers !== null ? p.answers : {}) as Record<string, any>;
  const ref = (typeof p.reflections === "object" && p.reflections !== null ? p.reflections : {}) as Record<string, any>;

  const completedSlides = Array.isArray(ans.completedSlides)
    ? ans.completedSlides
    : typeof p.completedSlides === "number"
      ? Array.from({ length: p.completedSlides }, (_, i) => i)
      : [];

  return {
    ...p,
    completedSlides,
    selectedAnswers: ans.selectedAnswers ?? ans,
    reflectionInput: ref.reflectionInput ?? ref,
    pollVotes: ans.pollVotes ?? {},
    confidence: ans.confidence ?? {},
    selfRating: ans.selfRating ?? {},
    conceptMastery: ans.conceptMastery ?? {},
    misconceptionLog: ans.misconceptionLog ?? [],
  };
}

async function loadPackageForTenant(
  versionId: string,
  tenantId: string | null,
  actorId?: string | null,
): Promise<{ error: NextResponse } | { version: { id: string; status: string } }> {
  const version = await db.lecturePackageVersion.findUnique({
    where: { id: versionId },
    include: { project: { select: { tenantId: true } } },
  });
  if (!version) {
    return { error: NextResponse.json({ error: "Package version not found" }, { status: 404 }) };
  }
  // Sessions without a university are not tenant-scoped (dev/test fallback).
  if (tenantId && version.project.tenantId !== tenantId) {
    await auditCrossTenant({
      actorId,
      entityType: "LecturePackageVersion",
      entityId: versionId,
      tenantId,
    });
    return { error: NextResponse.json({ error: "Package version not found" }, { status: 404 }) };
  }
  if (version.status !== "approved") {
    return { error: NextResponse.json({ error: "Package version is not approved" }, { status: 403 }) };
  }
  return { version };
}

export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (_req: Request, ctx: GuardContext, routeParams?: { params: Promise<{ versionId: string }> }) => {
    const { versionId } = (await routeParams?.params) || { versionId: "" };
    if (!versionId) {
      return NextResponse.json({ error: "Version ID required" }, { status: 400 });
    }

    const tenantId = ctx.session.universityId ?? null;
    const scoped = await loadPackageForTenant(versionId, tenantId, ctx.session.userId);
    if ("error" in scoped) return scoped.error;

    const studentId = ctx.session.studentId ?? ctx.session.userId ?? "demo-student-id";

    const progress = await db.lectureStudentProgress.findUnique({
      where: {
        versionId_studentId: {
          versionId,
          studentId,
        },
      },
    });

    return NextResponse.json({ progress: formatProgress(progress) }, { status: 200 });
  }
);

export const PATCH = guard(
  { tier: "write", roles: ["student", "faculty", "admin"] },
  async (req: Request, ctx: GuardContext, routeParams?: { params: Promise<{ versionId: string }> }) => {
    const { versionId } = (await routeParams?.params) || { versionId: "" };
    if (!versionId) {
      return NextResponse.json({ error: "Version ID required" }, { status: 400 });
    }

    const tenantId = ctx.session.universityId ?? null;
    const scoped = await loadPackageForTenant(versionId, tenantId, ctx.session.userId);
    if ("error" in scoped) return scoped.error;

    const studentId = ctx.session.studentId ?? ctx.session.userId ?? "demo-student-id";
    const body = (await req.json().catch(() => ({}))) || {};

    const {
      completedSlides,
      score,
      correctAnswers,
      totalQuestions,
      reflections,
      answers,
      lastSlideNo,
      completedAt,
      selectedAnswers,
      reflectionInput,
      pollVotes,
      confidence,
      selfRating,
      conceptMastery,
      misconceptionLog,
    } = body;

    // Handle completedSlides: support both number[] array and number
    let completedSlidesCount: number | undefined;
    let completedSlidesArray: number[] | undefined;

    if (Array.isArray(completedSlides)) {
      completedSlidesArray = completedSlides.map(Number).filter((n) => !isNaN(n));
      completedSlidesCount = new Set(completedSlidesArray).size;
    } else if (typeof completedSlides === "number") {
      completedSlidesCount = completedSlides;
      completedSlidesArray = Array.from({ length: completedSlides }, (_, i) => i);
    }

    // Merge incoming maps into answers JSON
    const answersObj: Record<string, unknown> = {
      ...(typeof answers === "object" && answers !== null ? answers : {}),
      ...(selectedAnswers !== undefined ? { selectedAnswers } : {}),
      ...(pollVotes !== undefined ? { pollVotes } : {}),
      ...(confidence !== undefined ? { confidence } : {}),
      ...(selfRating !== undefined ? { selfRating } : {}),
      ...(conceptMastery !== undefined ? { conceptMastery } : {}),
      ...(misconceptionLog !== undefined ? { misconceptionLog } : {}),
      ...(completedSlidesArray !== undefined ? { completedSlides: completedSlidesArray } : {}),
    };

    // Merge incoming reflection maps into reflections JSON
    const reflectionsObj: Record<string, unknown> = {
      ...(typeof reflections === "object" && reflections !== null ? reflections : {}),
      ...(reflectionInput !== undefined ? { reflectionInput } : {}),
    };

    const progress = await db.lectureStudentProgress.upsert({
      where: {
        versionId_studentId: {
          versionId,
          studentId,
        },
      },
      create: {
        versionId,
        studentId,
        completedSlides: completedSlidesCount ?? 0,
        score: typeof score === "number" ? score : 0,
        correctAnswers: typeof correctAnswers === "number" ? correctAnswers : 0,
        totalQuestions: typeof totalQuestions === "number" ? totalQuestions : 0,
        reflections: reflectionsObj,
        answers: answersObj,
        lastSlideNo: typeof lastSlideNo === "number" ? lastSlideNo : 1,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
      update: {
        ...(completedSlidesCount !== undefined ? { completedSlides: completedSlidesCount } : {}),
        ...(typeof score === "number" ? { score } : {}),
        ...(typeof correctAnswers === "number" ? { correctAnswers } : {}),
        ...(typeof totalQuestions === "number" ? { totalQuestions } : {}),
        reflections: reflectionsObj,
        answers: answersObj,
        ...(typeof lastSlideNo === "number" ? { lastSlideNo } : {}),
        ...(completedAt !== undefined ? { completedAt: completedAt ? new Date(completedAt) : null } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ progress: formatProgress(progress) }, { status: 200 });
  }
);
