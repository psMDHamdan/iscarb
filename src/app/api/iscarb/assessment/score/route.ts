import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import { canonicalSpecializationLabel } from "@/lib/assessment";
import { scoreResponse } from "@/lib/assessment/engine";
import { explainAssessment } from "@/lib/explainability";
import { buildXpAward, type XpAward } from "@/lib/xp";
import { recomputeLedger } from "@/lib/equity-ledger";
import { enrichSessionStudentId } from "@/lib/assessment/resolve-student";
import { scoreRequestSchema } from "@/lib/assessment/score-schema";
import { computePercentile } from "@/lib/assessment/percentile";
import { resolveTrustedScoringModule } from "@/lib/assessment/trusted-module";
import { findAttemptQuestion, parseAttemptExamSet } from "@/lib/assessment/attempt-exam-set";
import { getLiveGeneratedKeyedQuestion } from "@/lib/assessment/live-exam-generation";
import type { AttemptExamQuestion } from "@/lib/assessment/attempt-exam-set";
import { resolveSelectedCanonicalIndex, scoreKeyedMcq } from "@/lib/assessment/keyed-mcq-scoring";
import type { ScoredResponse } from "@/lib/assessment/framework";

/** Minimal AssessmentAttempt shape the exam scoring path touches. */
type ScoreableAttempt = {
  id: string;
  studentId: string;
  specialization: string;
  blueprintJson: string | null;
};

/**
 * Find the student's in-progress attempt that actually holds a
 * structurally-validated copy of `moduleCode`. Preference order: exact-spec
 * attempts first, then other specialties, newest first. Used to self-heal
 * stale, synthetic, or cross-tenant attempt ids so scoring never hard-404s
 * while a scoreable attempt exists.
 */
async function findScoreableAttempt(
  studentId: string | null,
  specialization: string,
  moduleCode: string,
): Promise<ScoreableAttempt | null> {
  if (!studentId) return null;
  const attempts = await db.assessmentAttempt.findMany({
    where: { studentId, status: "in_progress" },
    orderBy: { createdAt: "desc" },
    select: { id: true, studentId: true, specialization: true, blueprintJson: true },
  });
  const exact = attempts.find((a) => a.specialization === specialization);
  const ordered = exact ? [exact, ...attempts.filter((a) => a.id !== exact.id)] : attempts;
  const match = ordered.find((a) => {
    const q = findAttemptQuestion(parseAttemptExamSet(a.blueprintJson), moduleCode);
    return Boolean(q && q.validation?.structural);
  });
  return match ?? null;
}

/**
 * POST /api/iscarb/assessment/score
 * Exam path: keyed MCQ against the attempt's validated correctIndex. No AI.
 * Practice modules (PRACTICE-*) keep the AI scorer.
 */
export const POST = guard({ tier: "write", roles: ["student", "faculty", "admin"] }, async (req, ctx) => {
  const __parsed = await parseJSON(req);
  if (!__parsed) return jsonErrorResponse("Invalid request body");
  const parsed = scoreRequestSchema.safeParse(__parsed);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid request body";
    return apiError(first, 400);
  }
  const body = parsed.data;

  const specialization = body.specialization;
  const moduleCode = body.moduleCode;
  const response = body.response;

  // Resolve acting student early so practice-module ownership + Job-Fit cache work.
  let studentRowId: string | null = null;
  try {
    if (body.studentId || ctx.session.role === "student") {
      const enrichedSession = await enrichSessionStudentId(ctx.session);
      let studentIdToFind = enrichedSession.studentId ?? body.studentId;

      let student = studentIdToFind
        ? await db.student.findFirst({ where: { id: studentIdToFind }, select: { id: true } })
        : null;

      if (!student && ctx.session.userId) {
        student = await db.student.findFirst({
          where: { userId: ctx.session.userId },
          select: { id: true },
        });
      }

      if (!student) {
        let email = ctx.session.email;
        if (!email && ctx.session.userId) {
          const user = await db.user.findUnique({
            where: { id: ctx.session.userId },
            select: { email: true, name: true },
          });
          email = user?.email;
        }
        if (email) {
          student = await db.student.findFirst({ where: { email }, select: { id: true } });
          if (!student) {
            try {
              student = await db.student.create({
                data: {
                  userId: ctx.session.userId ?? undefined,
                  email,
                  name: email.split("@")[0],
                  program: body.specialization || "General Studies",
                },
                select: { id: true },
              });
            } catch {
              student = await db.student.findFirst({ where: { email }, select: { id: true } });
            }
          }
        }
      }

      // Students may only score as themselves (ignore tampered body.studentId).
      if (ctx.session.role === "student" && enrichedSession.studentId) {
        studentRowId = enrichedSession.studentId;
      } else if (student) {
        studentRowId = student.id;
      }
    }
  } catch {
    studentRowId = null;
  }

  const isPractice = moduleCode.startsWith("PRACTICE-");
  let scored: ScoredResponse;
  let moduleTitle = moduleCode;
  let framework = "";
  let explanation: ReturnType<typeof explainAssessment> | { summary: string };
  let attempt: ScoreableAttempt | null = null;

  if (!isPractice) {
    // ── Resolve the scoring target ──────────────────────────────────────────
    // Order: the supplied attempt id → the student's real in-progress attempt
    // for this specialty → the live generation cache. A stale or synthetic id
    // (client fallback when POST /attempt fails) must never hard-404 while a
    // scoreable target exists.
    attempt = body.attemptId
      ? await db.assessmentAttempt.findUnique({ where: { id: body.attemptId } })
      : null;

    if (attempt && ctx.session.role === "student" && studentRowId && attempt.studentId !== studentRowId) {
      return apiError("Forbidden — you may only score your own attempt", 403);
    }

    if (!attempt) {
      attempt = await findScoreableAttempt(studentRowId, body.specialization, moduleCode);
    }

    let question: AttemptExamQuestion | null = null;
    if (attempt) {
      let set = parseAttemptExamSet(attempt.blueprintJson);
      question = findAttemptQuestion(set, moduleCode);
      if (!question || !question.validation.structural) {
        // Self-heal: the referenced attempt may be stale / mid-regeneration. Look
        // for another of the student's in-progress attempts (same specialty) that
        // already holds this module validated and score against that one.
        const alt = await db.assessmentAttempt.findFirst({
          where: {
            studentId: attempt.studentId,
            status: "in_progress",
            specialization: attempt.specialization,
            NOT: { id: attempt.id },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, blueprintJson: true },
        });
        if (alt) {
          const altSet = parseAttemptExamSet(alt.blueprintJson);
          const altQ = findAttemptQuestion(altSet, moduleCode);
          if (altQ?.validation.structural) {
            attempt = { ...attempt, id: alt.id, blueprintJson: alt.blueprintJson };
            question = altQ;
          }
        }
      }
    }

    if (question) {
      const selectedCanonical = resolveSelectedCanonicalIndex({
        question,
        selectedIndex: body.selectedIndex,
        responseText: response,
        studentId: attempt?.studentId ?? studentRowId ?? "",
        attemptId: attempt?.id ?? body.attemptId ?? "",
      });
      scored = scoreKeyedMcq({ question, selectedCanonicalIndex: selectedCanonical });
      moduleTitle = question.title;
      framework = question.framework;
      explanation = { summary: scored.feedback };
    } else {
      const live = getLiveGeneratedKeyedQuestion(studentRowId, body.specialization, moduleCode);
      if (live) {
        const liveQuestion: AttemptExamQuestion = {
          code: live.code,
          title: live.title,
          titleAr: live.titleAr,
          dimension: live.dimension,
          level: "L3",
          framework: live.framework,
          focus: "",
          passThreshold: 60,
          estimateMinutes: null,
          specialization: body.specialization,
          scenario: live.scenario,
          instructions: live.instructions,
          choices: live.choices,
          correctIndex: live.correctIndex,
          contentSource: "live_ai",
          validation: {
            structural: true,
            independentVerify: true,
            generateAttempts: 1,
            verifyAttempts: 1,
            regenerated: false,
          },
        };
        const selectedCanonical = resolveSelectedCanonicalIndex({
          question: liveQuestion,
          selectedIndex: body.selectedIndex,
          responseText: response,
          studentId: null,
          attemptId: null,
        });
        scored = scoreKeyedMcq({ question: liveQuestion, selectedCanonicalIndex: selectedCanonical });
        moduleTitle = live.title;
        framework = live.framework;
        explanation = { summary: scored.feedback };
      } else {
        const fallbackModule = await resolveTrustedScoringModule({
          moduleCode,
          specialization,
          studentId: studentRowId,
          attemptId: body.attemptId,
        });
        if (fallbackModule) {
          scored = await scoreResponse(fallbackModule, response, { validate: body.validate });
          moduleTitle = fallbackModule.title;
          framework = fallbackModule.framework;
          explanation = explainAssessment(response, fallbackModule, scored);
        } else {
          return apiError(`Module ${moduleCode} not found for "${specialization}"`, 404);
        }
      }
    }
  } else {
    const module = await resolveTrustedScoringModule({
      moduleCode,
      specialization,
      studentId: studentRowId,
      attemptId: body.attemptId,
    });
    if (!module) {
      return apiError(`Module ${moduleCode} not found for "${specialization}"`, 404);
    }
    scored = await scoreResponse(module, response, { validate: body.validate });
    moduleTitle = module.title;
    framework = module.framework;
    explanation = explainAssessment(response, module, scored);
  }

  let persistedId: string | null = null;
  let xpAward: XpAward | null = null;
  if (studentRowId) {
    const rawResponse = response.slice(0, 50000);
    // Persist canonical JOBFIT_TRACKS label, not raw alias/free-text from the caller.
    const persistedSpecialization = canonicalSpecializationLabel(specialization);

    // Capture current rows BEFORE flipping isCurrent so we have their IDs for RDF retirement
    const previousCurrentRows = await db.assessmentResponse.findMany({
      where: { studentId: studentRowId, moduleCode: scored.moduleCode, isCurrent: true },
      select: { id: true },
    });

    // Flip isCurrent for previous retakes of this module
    await db.assessmentResponse.updateMany({
      where: {
        studentId: studentRowId,
        moduleCode: scored.moduleCode,
        isCurrent: true,
      },
      data: { isCurrent: false },
    });

    // RDF: retire old current triples (fire-and-forget — must not block keyed scoring)
    try {
      if (previousCurrentRows.length > 0) {
        const { rdfSyncService } = await import("@/services/rdf/rdf-sync.service");
        const tenantCode = ctx.session.universityCode ?? "KFU";
        void Promise.all(
          previousCurrentRows.map(r =>
            rdfSyncService.deleteEntity("AssessmentResponse", r.id, tenantCode)
          )
        ).catch(() => {});
      }
    } catch {
      /* best-effort — RDF retirement must not block scoring */
    }

    const row = await db.assessmentResponse.create({
      data: {
        studentId: studentRowId,
        moduleCode: scored.moduleCode,
        dimension: scored.dimension,
        specialization: persistedSpecialization,
        score: scored.score,
        band: scored.band,
        passed: scored.passed,
        perCriterionJson: JSON.stringify(scored.perCriterion),
        feedback: scored.feedback,
        strengthsJson: JSON.stringify(scored.strengths),
        improvementsJson: JSON.stringify(scored.improvements),
        validationPassed: scored.validationPassed,
        model: scored.model,
        source: scored.source,
        rawResponse,
        // DR-07 fields: written after schema migration + client regeneration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        processingStatus: scored.source as any,
        latencyMs: Math.round(scored.latencyMs),
        tokensInput: scored.tokensInput,
        tokensOutput: scored.tokensOutput,
        costUsd: scored.costUsd,
      } as Parameters<typeof db.assessmentResponse.create>[0]["data"],
      select: { id: true },
    });
    persistedId = row.id;

    // Keep attempt.answersJson in sync so batch-score / finalize can complete.
    if (attempt?.id && !isPractice) {
      try {
        const latest = await db.assessmentAttempt.findUnique({
          where: { id: attempt.id },
          select: { answersJson: true },
        });
        let map: Record<string, string> = {};
        try {
          map = JSON.parse(latest?.answersJson || "{}") as Record<string, string>;
          if (!map || typeof map !== "object") map = {};
        } catch {
          map = {};
        }
        map[scored.moduleCode] = rawResponse;
        await db.assessmentAttempt.update({
          where: { id: attempt.id },
          data: { answersJson: JSON.stringify(map) },
        });
      } catch {
        /* best-effort — finalize also hydrates from AssessmentResponse */
      }
    }
    if (isPractice) {
      try {
        const recompute = await recomputeLedger(studentRowId, {
          source: "assessment",
          label: `Assessment: ${scored.dimension} (${Math.round(scored.score)}/100)`.slice(0, 160),
          meta: { responseId: persistedId, dimension: scored.dimension, band: scored.band },
        });
        const newScore = recompute.equity.equityScore;
        xpAward = buildXpAward("assessment", newScore - recompute.scoreDelta, newScore);
      } catch {
        /* best-effort */
      }
    } else {
      // Fire-and-forget for live exam scoring so HTTP wall time stays under 50ms
      void recomputeLedger(studentRowId, {
        source: "assessment",
        label: `Assessment: ${scored.dimension} (${Math.round(scored.score)}/100)`.slice(0, 160),
        meta: { responseId: persistedId, dimension: scored.dimension, band: scored.band },
      }).catch(() => {});
    }

    // Sync assessment response to RDF triple store (fire-and-forget — exam keyed scoring is milliseconds)
    try {
      const { rdfSyncService } = await import("@/services/rdf/rdf-sync.service");
      const tenantCode = ctx.session.universityCode ?? "KFU";
      void rdfSyncService.insertEntity("AssessmentResponse", persistedId!, tenantCode, {
        id: persistedId,
        studentId: studentRowId,
        moduleCode: scored.moduleCode,
        dimension: scored.dimension,
        specialization: persistedSpecialization,
        score: scored.score,
        band: scored.band,
        passed: scored.passed,
        perCriterionJson: JSON.stringify(scored.perCriterion),
        feedback: scored.feedback,
        strengthsJson: JSON.stringify(scored.strengths),
        improvementsJson: JSON.stringify(scored.improvements),
        validationPassed: scored.validationPassed,
        model: scored.model,
        source: scored.source,
        rawResponse: response,
        latencyMs: Math.round(scored.latencyMs),
        createdAt: new Date(),
      }).catch(() => {});
    } catch {
      /* best-effort — batch sync will pick up if real-time fails */
    }

    // FR-VAL-02: Create pending review if validation agent failed
    if (scored.validationPassed === false) {
      await db.assessmentValidationReview.create({
        data: {
          responseId: persistedId!,
          status: "pending",
          originalScore: scored.score,
          originalBand: scored.band,
        },
      });
    }
  }

  let percentile: number | null = null;
  if (persistedId && studentRowId) {
    try {
      percentile = await computePercentile(scored.moduleCode, scored.score);
    } catch {
      /* best-effort — percentile failure must never block the score response */
    }
  }

  let promptQuality: PromptQualityResult | null = null;
  if (isPractice && typeof body.prompt === "string" && body.prompt.trim()) {
    const practiceModule = await resolveTrustedScoringModule({
      moduleCode,
      specialization,
      studentId: studentRowId,
      attemptId: body.attemptId,
    });
    if (practiceModule) {
      const clos = practiceModule.rubric.map((c, i) => ({
        id: `CLO-${i + 1}`,
        statement: `${c.criterion}: ${c.descriptor}`,
        bloom: "apply",
      }));
      promptQuality = await evaluatePromptQuality({
        prompt: body.prompt,
        artifact: response,
        clos,
        context: `${practiceModule.title} — ${practiceModule.framework} (${specialization})`,
      });

      if (studentRowId && body.courseId) {
        await db.activeParticipation.create({
          data: {
            studentId: studentRowId,
            courseId: body.courseId,
            unitId: body.unitId ?? null,
            interactionsCount: 1,
            avgInputQuality: Math.round((promptQuality.score / 100) * 100) / 100,
            aiConfidence: promptQuality.confidence,
            promptsAccepted: promptQuality.score >= practiceModule.passThreshold ? 1 : 0,
            peerEndorsements: 0,
            promptQualityScore: promptQuality.score,
          },
        });
      }
    }
  }

  return NextResponse.json({
    ...scored,
    moduleTitle,
    framework,
    explanation,
    xpAward,
    persistedId,
    promptQuality,
    percentile,
  });
});
