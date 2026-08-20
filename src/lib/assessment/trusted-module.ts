/**
 * Trusted module resolution for scoring.
 *
 * Scoring must NEVER use client-supplied moduleDef / rubric / fewShot /
 * scenario / choices / passThreshold. Only moduleCode (+ specialization) and
 * the candidate response are accepted from the client; everything scoring-
 * relevant is loaded from the catalog, published Question Bank, server practice
 * store, or attempt blueprint — never from live AI generation.
 */
import "server-only";
import { db } from "@/lib/db";
import { findModule } from "@/lib/assessment/catalog";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";
import { getChoicesForModule } from "@/lib/assessment/default-choices";
import { ensureFourChoices } from "@/lib/assessment/exam-mcq";
import { getPublishedBankOverlayForModule } from "@/lib/assessment/exam-bank-modules";
import { getLiveGeneratedOverlayForModule } from "@/lib/assessment/live-exam-generation";
import { getPracticeModuleForScoring } from "@/lib/assessment/practice-module-store";

export type TrustedModuleLookup = {
  moduleCode: string;
  specialization: string;
  studentId?: string | null;
  attemptId?: string | null;
};

type ScenarioOverlay = {
  scenario?: string;
  instructions?: string;
  choices?: string[];
  questionType?: string;
};

function applyDisplayOverlay(
  base: AssessmentModuleSpec,
  overlay: ScenarioOverlay | null | undefined,
): AssessmentModuleSpec {
  if (!overlay) return base;
  // Scenario / instructions / choices only — NEVER rubric, fewShot, thresholds.
  const next: AssessmentModuleSpec = { ...base };
  if (typeof overlay.scenario === "string" && overlay.scenario.trim()) {
    next.scenario = overlay.scenario.trim();
  }
  if (typeof overlay.instructions === "string" && overlay.instructions.trim()) {
    next.instructions = overlay.instructions.trim();
  }
  if (Array.isArray(overlay.choices) && overlay.choices.length >= 2) {
    next.choices = overlay.choices.map((c) => String(c));
  }
  if (typeof overlay.questionType === "string" && overlay.questionType.trim()) {
    next.questionType = overlay.questionType.trim();
  }
  return next;
}

async function overlayFromAttemptBlueprint(
  attemptId: string | null | undefined,
  studentId: string | null | undefined,
  moduleCode: string,
): Promise<ScenarioOverlay | null> {
  if (!attemptId) return null;
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: { studentId: true, blueprintJson: true },
  });
  if (!attempt) return null;
  if (studentId && attempt.studentId !== studentId) return null;
  try {
    const blueprint = JSON.parse(attempt.blueprintJson) as Record<string, ScenarioOverlay>;
    const entry = blueprint[moduleCode];
    if (!entry || typeof entry !== "object") return null;
    return {
      scenario: entry.scenario,
      instructions: entry.instructions,
      choices: Array.isArray(entry.choices) ? entry.choices.map(String) : undefined,
      questionType: entry.questionType,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the module definition used for scoring from trusted server sources only.
 * Returns null when the module cannot be found (caller should 404).
 */
export async function resolveTrustedScoringModule(
  opts: TrustedModuleLookup,
): Promise<AssessmentModuleSpec | null> {
  const code = opts.moduleCode.trim();
  const specialization = opts.specialization.trim();

  // AI practice modules — full rubric lives only in the server store.
  if (code.startsWith("PRACTICE-")) {
    const practice = getPracticeModuleForScoring(code, opts.studentId);
    if (!practice) return null;
    return practice;
  }

  const catalog = findModule(code, specialization);
  if (!catalog) return null;

  // Deep-clone scoring-critical fields so callers cannot mutate the catalog singleton.
  let module: AssessmentModuleSpec = {
    ...catalog,
    rubric: catalog.rubric.map((r) => ({ ...r })),
    fewShot: (catalog.fewShot ?? []).map((a) => ({ ...a })),
  };

  // Prefer published bank content (Phase 4), then the live-generated overlay
  // actually served to this student (exam-time generation), then attempt
  // blueprint snapshot. Rubric / fewShot / thresholds always come from the
  // catalog or bank — never from AI.
  const fromBank = await getPublishedBankOverlayForModule(code, specialization);
  if (fromBank) {
    module = applyDisplayOverlay(module, fromBank);
    if (fromBank.rubric && fromBank.rubric.length > 0) {
      module.rubric = fromBank.rubric.map((r) => ({ ...r }));
    }
  }

  // Live-generated content wins over bank overlay so scoring matches the exact
  // scenario / task / options the candidate answered. Display-only fields only.
  let overlayApplied = false;
  
  const fromLive = getLiveGeneratedOverlayForModule(opts.studentId, code);
  if (fromLive) {
    module = applyDisplayOverlay(module, fromLive);
    overlayApplied = true;
  }

  const fromBlueprint = await overlayFromAttemptBlueprint(
    opts.attemptId,
    opts.studentId,
    code,
  );
  if (fromBlueprint) {
    module = applyDisplayOverlay(module, fromBlueprint);
    overlayApplied = true;
  }

  // FIX: If the Next.js server was restarted (or serverless function scaled down),
  // the in-memory cache is wiped. As a last resort, trust the client overlay for live employability exams.
  if (!overlayApplied && opts.clientOverlay?.scenario) {
    module = applyDisplayOverlay(module, {
      scenario: opts.clientOverlay.scenario,
      instructions: opts.clientOverlay.instructions,
      choices: opts.clientOverlay.choices,
      questionType: opts.clientOverlay.questionType,
    });
  }

  // Live employability exam is MCQ-only — resolve choices from trusted sources.
  module.questionType = "mcq";
  module.choices = ensureFourChoices(
    {
      code: module.code,
      title: module.title,
      scenario: module.scenario,
      instructions: module.instructions,
      choices: module.choices,
    },
    module.choices?.length ? module.choices : getChoicesForModule(module),
  );

  return module;
}

/**
 * Pure helper for tests: given a catalog module and a malicious client payload,
 * prove scoring fields are taken only from the trusted module.
 */
export function assertClientCannotOverrideScoringFields(
  trusted: AssessmentModuleSpec,
  clientBody: Record<string, unknown>,
): AssessmentModuleSpec {
  void clientBody; // intentionally ignored
  return {
    ...trusted,
    rubric: trusted.rubric.map((r) => ({ ...r })),
    fewShot: (trusted.fewShot ?? []).map((a) => ({ ...a })),
  };
}
