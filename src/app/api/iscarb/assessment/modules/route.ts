import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import {
  DIMENSIONS,
  SCORE_BANDS,
  PASS_THRESHOLD,
  curatedSpecializations,
  resolveRegulator,
} from "@/lib/assessment";
import { assertStudentAccess } from "@/lib/assessment/ownership";
import { resolveAssessmentModuleSet } from "@/lib/assessment/catalog";
import { sanitizeExamModuleForClient } from "@/lib/assessment/public-question-payload";
import { resolveExamModulesFromPublishedBank } from "@/lib/assessment/exam-bank-modules";
import { resolveStudentIdFromSession } from "@/lib/assessment/resolve-student";
import { ensureAttemptExamGeneration } from "@/lib/assessment/attempt-exam-generator";
import {
  liveGenerationEnabled,
  resolveExamModulesFromLiveGeneration,
} from "@/lib/assessment/live-exam-generation";
import {
  isAttemptExamSetReady,
  parseAttemptExamSet,
  publicModulesFromAttemptSet,
} from "@/lib/assessment/attempt-exam-set";
import { moduleLogger } from "@/lib/logger";

/**
 * GET /api/iscarb/assessment/modules
 *
 * Students: serve the pre-generated, key-validated attempt set (instant).
 * If generation is still running, 202 + preparing payload — never generate mid-exam.
 * Faculty/admin: published bank preview (no candidate keys).
 */
export const dynamic = "force-dynamic";

const log = moduleLogger("assessment-modules");

function metaPayload(specialization: string) {
  const skeleton = resolveAssessmentModuleSet(specialization);
  const regulator = resolveRegulator(specialization);
  return {
    specialization,
    jobFitSource: skeleton.jobFitSource,
    cluster: skeleton.cluster,
    regulator: { authorities: regulator.authorities, alignment: regulator.alignment },
    counts: {
      total: skeleton.modules.length,
      universal: skeleton.modules.filter((m) => m.specialization === null).length,
      jobFit: skeleton.modules.filter((m) => m.specialization !== null).length,
    },
    dimensions: DIMENSIONS.map((d) => ({
      id: d.id,
      label: d.label,
      labelAr: d.labelAr,
      weight: d.weight,
      specializationScoped: d.specializationScoped,
      blurb: d.blurb,
    })),
    bands: SCORE_BANDS,
    passThreshold: PASS_THRESHOLD,
    curated: curatedSpecializations(),
  };
}

export const GET = guard({ tier: "read", roles: ["student", "faculty", "dean", "admin"] }, async (req, ctx) => {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode")?.trim() || "full";
  let specialization = url.searchParams.get("specialization")?.trim() || "";
  let studentId = url.searchParams.get("studentId")?.trim() || "";

  if (ctx.session.role === "student") {
    const resolved = await resolveStudentIdFromSession(ctx.session);
    if (resolved.ok) studentId = resolved.studentId;
  }

  if (studentId) {
    const access = assertStudentAccess(ctx.session, studentId);
    if (!access.ok) return apiError(access.message, access.status);
  }

  const isGenericProgram = (v: string) => {
    const t = v.trim().toLowerCase();
    return (
      !t ||
      t === "undeclared" ||
      t === "general" ||
      t === "general studies" ||
      t === "n/a" ||
      t === "none" ||
      t === "other"
    );
  };

  if (ctx.session.role === "student" && studentId) {
    const student = await db.student.findFirst({
      where: { id: studentId },
      select: { program: true },
    });
    const stored = (student?.program || "").trim();
    if (isGenericProgram(stored)) {
      return apiError(
        "Specialty required. Set your major/specialty on your profile before starting the exam.",
        400,
        { code: "NEED_SPECIALTY", specialization: stored },
      );
    }
    specialization = stored;
  } else if (!specialization && studentId) {
    const student = await db.student.findFirst({
      where: { id: studentId },
      select: { program: true, college: true },
    });
    specialization = student?.program || student?.college || "";
  }

  if (!specialization || isGenericProgram(specialization)) {
    return apiError(
      "Specialty required. Set your major/specialty on your profile before starting the exam.",
      400,
      { code: "NEED_SPECIALTY" },
    );
  }

  const meta = metaPayload(specialization);

  if (mode === "preview") {
    if (ctx.session.role === "student" && studentId) {
      await ensureAttemptExamGeneration({ studentId, specialization }).catch((err) => {
        log.warn({ err: err instanceof Error ? err.message : String(err) }, "preview enqueue failed");
      });
    }
    return NextResponse.json({
      ...meta,
      contentSources: { liveGenerated: 0, generationFailed: 0, bankHits: 0, catalogFallbacks: 0, fallbackCodes: [] },
      modules: [],
      preview: true,
      preparing: false,
    });
  }

  if (ctx.session.role === "student" && studentId) {
    const { attemptId, set } = await ensureAttemptExamGeneration({ studentId, specialization });
    const row = await db.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: { blueprintJson: true },
    });
    const fresh = parseAttemptExamSet(row?.blueprintJson) ?? set ?? null;
    if (!fresh || !isAttemptExamSetReady(fresh)) {
      return NextResponse.json(
        {
          ...meta,
          attemptId,
          preparing: true,
          progress: fresh?.progress ?? { done: 0, total: meta.counts.total },
          contentSources: { liveGenerated: 0, generationFailed: 0, bankHits: 0, catalogFallbacks: 0, fallbackCodes: [] },
          modules: fresh ? publicModulesFromAttemptSet(fresh, { studentId, attemptId }) : [],
        },
        { status: 202 },
      );
    }

    return NextResponse.json({
      ...meta,
      attemptId,
      preparing: false,
      contentSources: {
        liveGenerated: fresh.questions.filter((q) => q.contentSource === "live_ai").length,
        generationFailed: 0,
        bankHits: fresh.questions.filter((q) => q.contentSource === "bank_fallback").length,
        catalogFallbacks: 0,
        fallbackCodes: [],
      },
      modules: publicModulesFromAttemptSet(fresh, { studentId, attemptId }),
    });
  }

  // Non-student (faculty/admin/dean) preview: generate LIVE specialization-aware
  // questions the same way students get them — never silently serve catalog
  // defaults. Falls back to the published bank only when live generation is
  // disabled (EXAM_LIVE_GENERATION=false).
  if (liveGenerationEnabled()) {
    const live = await resolveExamModulesFromLiveGeneration(specialization, studentId || "preview");
    
    const isReady = live.modules.every((m) => m.contentSource !== "generating_in_background");
    
    const publicModules = live.modules.map((m) =>
      sanitizeExamModuleForClient(
        {
          code: m.code,
          title: m.title,
          titleAr: m.titleAr ?? null,
          dimension: m.dimension,
          level: m.level,
          framework: m.framework,
          focus: m.focus,
          scenario: m.scenario,
          instructions: m.instructions,
          rubric: m.rubric,
          passThreshold: m.passThreshold,
          specialization: m.specialization,
          generated: m.contentSource === "live_ai",
          estimateMinutes: m.estimateMinutes ?? null,
          questionType: "mcq" as const,
          choices: m.choices ?? [],
          contentSource: m.contentSource,
        },
        { studentId: studentId || null },
      ),
    );
    
    if (!isReady) {
      return NextResponse.json(
        {
          ...meta,
          preparing: true,
          progress: { done: live.modules.filter((m) => m.contentSource !== "generating_in_background").length, total: meta.counts.total },
          contentSources: {
            liveGenerated: live.liveGenerated,
            generationFailed: live.generationFailed,
            bankHits: 0,
            catalogFallbacks: 0,
            fallbackCodes: live.failures.map((f) => f.code),
          },
          modules: publicModules,
        },
        { status: 202 },
      );
    }

    return NextResponse.json({
      ...meta,
      preparing: false,
      contentSources: {
        liveGenerated: live.liveGenerated,
        generationFailed: live.generationFailed,
        bankHits: 0,
        catalogFallbacks: 0,
        fallbackCodes: live.failures.map((f) => f.code),
      },
      modules: publicModules,
    });
  }

  const bankResolution = await resolveExamModulesFromPublishedBank(specialization);
  const publicModules = bankResolution.modules.map((m) =>
    sanitizeExamModuleForClient(
      {
        code: m.code,
        title: m.title,
        titleAr: m.titleAr ?? null,
        dimension: m.dimension,
        level: m.level,
        framework: m.framework,
        focus: m.focus,
        scenario: m.scenario,
        instructions: m.instructions,
        rubric: m.rubric,
        passThreshold: m.passThreshold,
        specialization: m.specialization,
        generated: false,
        estimateMinutes: m.estimateMinutes ?? null,
        questionType: "mcq" as const,
        choices: m.choices ?? [],
        contentSource: m.contentSource,
      },
      { studentId: studentId || null },
    ),
  );

  return NextResponse.json({
    ...meta,
    preparing: false,
    contentSources: {
      liveGenerated: 0,
      generationFailed: 0,
      bankHits: bankResolution.bankHits,
      catalogFallbacks: bankResolution.fallbacks.length,
      fallbackCodes: bankResolution.fallbacks.map((f) => f.code),
    },
    modules: publicModules,
  });
});
