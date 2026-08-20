/**
 * Phase 4 — Resolve the live exam's 47-module set from the published Question Bank.
 *
 * Skeleton (codes, specialty Job-Fit swap, exactly-47) still comes from
 * resolveAssessmentModuleSet. Content (scenario / instructions / choices / rubric)
 * prefers published EmployabilityBankQuestion rows. Gaps fall back to curated
 * catalog (+ default-choices) — NEVER live AI generation.
 */
import "server-only";

import {
  resolveAssessmentModuleSet,
} from "@/lib/assessment/catalog";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";
import { getChoicesForModule, getTaskForModule } from "@/lib/assessment/default-choices";
import { ensureFourChoices } from "@/lib/assessment/exam-mcq";
import {
  BankQuestionStatus,
  listBankQuestions,
  type BankQuestionRecord,
} from "@/lib/assessment/question-bank-repository";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("exam-bank-modules");

export type ExamContentSource = "bank" | "catalog_fallback";

export type ResolvedExamModule = AssessmentModuleSpec & {
  contentSource: ExamContentSource;
  bankQuestionId?: string;
};

export type ExamBankFallback = {
  code: string;
  specialization: string | null;
  reason: string;
};

export type ExamBankResolution = {
  modules: ResolvedExamModule[];
  jobFitSource: "curated" | "generic";
  cluster: string;
  mode: "universal-plus-jobfit";
  bankHits: number;
  fallbacks: ExamBankFallback[];
};

function parseChoices(choicesJson: string): string[] {
  try {
    const parsed = JSON.parse(choicesJson) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c) => String(c ?? "").trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseRubric(
  rubricJson: string,
): AssessmentModuleSpec["rubric"] {
  try {
    const parsed = JSON.parse(rubricJson) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => {
      const row = (r ?? {}) as Record<string, unknown>;
      return {
        criterion: String(row.criterion ?? ""),
        weight: Number(row.weight ?? 0),
        descriptor: String(row.descriptor ?? ""),
        ...(row.gate === true ? { gate: true as const } : {}),
      };
    });
  } catch {
    return [];
  }
}

function specKey(specialization: string | null | undefined): string {
  if (specialization == null || specialization === "") return "";
  return specialization.trim();
}

function indexKey(code: string, specialization: string | null | undefined): string {
  return `${code.trim()}::${specKey(specialization)}`;
}

type BankIndex = {
  byCodeSpec: Map<string, BankQuestionRecord>;
  byCode: Map<string, BankQuestionRecord[]>;
};

export function buildBankIndex(rows: BankQuestionRecord[]): BankIndex {
  const byCodeSpec = new Map<string, BankQuestionRecord>();
  const byCode = new Map<string, BankQuestionRecord[]>();

  for (const row of rows) {
    byCodeSpec.set(indexKey(row.moduleCode, row.specialization), row);
    const list = byCode.get(row.moduleCode) ?? [];
    list.push(row);
    byCode.set(row.moduleCode, list);
  }

  // Prefer highest version when multiple rows share a code
  for (const [code, list] of byCode) {
    list.sort((a, b) => b.version - a.version);
    byCode.set(code, list);
  }

  return { byCodeSpec, byCode };
}

/**
 * Match a catalog slot to a published bank row.
 * 1) exact code + specialization
 * 2) code + universal (null)
 * 3) any published row for that code (catalog-track remaps e.g. CS/IT → M30)
 */
export function findPublishedBankMatch(
  module: AssessmentModuleSpec,
  index: BankIndex,
): { row: BankQuestionRecord; match: string } | null {
  const exact = index.byCodeSpec.get(
    indexKey(module.code, module.specialization),
  );
  if (exact) return { row: exact, match: "code+specialization" };

  const universal = index.byCodeSpec.get(indexKey(module.code, null));
  if (universal) return { row: universal, match: "code+universal" };

  const any = index.byCode.get(module.code)?.[0];
  if (any) return { row: any, match: "code-only" };

  return null;
}

function overlayFromBank(
  catalog: AssessmentModuleSpec,
  bank: BankQuestionRecord,
): AssessmentModuleSpec {
  const choices = ensureFourChoices(
    {
      code: catalog.code,
      title: bank.title ?? catalog.title,
      scenario: bank.scenario,
      instructions: bank.instructions,
    },
    parseChoices(bank.choicesJson),
  );
  const rubric = parseRubric(bank.rubricJson);
  return {
    ...catalog,
    title: bank.title ?? catalog.title,
    titleAr: bank.titleAr ?? catalog.titleAr,
    level: bank.level ?? catalog.level,
    framework: bank.framework ?? catalog.framework,
    focus: bank.focus ?? catalog.focus,
    scenario: bank.scenario,
    instructions: bank.instructions,
    choices,
    questionType: "mcq",
    rubric: rubric.length > 0 ? rubric : catalog.rubric.map((r) => ({ ...r })),
    passThreshold: bank.passThreshold ?? catalog.passThreshold,
    estimateMinutes: bank.estimateMinutes ?? catalog.estimateMinutes,
    generated: false,
    fewShot: (catalog.fewShot ?? []).map((a) => ({ ...a })),
  };
}

function catalogFallbackModule(catalog: AssessmentModuleSpec): AssessmentModuleSpec {
  const choices = ensureFourChoices(
    {
      code: catalog.code,
      title: catalog.title,
      scenario: catalog.scenario,
      instructions: catalog.instructions,
      choices: catalog.choices,
    },
    catalog.choices?.length
      ? catalog.choices
      : getChoicesForModule({
          code: catalog.code,
          title: catalog.title,
          scenario: catalog.scenario,
          instructions: catalog.instructions,
        }),
  );
  return {
    ...catalog,
    // MCQ exam task — a decision question matching the options, never the
    // essay-era "Write an email…" instruction text.
    instructions: getTaskForModule({
      code: catalog.code,
      title: catalog.title,
      scenario: catalog.scenario,
      instructions: catalog.instructions,
    }),
    rubric: catalog.rubric.map((r) => ({ ...r })),
    fewShot: (catalog.fewShot ?? []).map((a) => ({ ...a })),
    choices,
    questionType: "mcq",
    generated: false,
  };
}

/**
 * Assemble the exam set: exactly 47 modules, specialty Job-Fit intact,
 * published bank content preferred, catalog fallback for gaps (no AI).
 */
export async function resolveExamModulesFromPublishedBank(
  specialization: string,
): Promise<ExamBankResolution> {
  const resolved = resolveAssessmentModuleSet(specialization);
  const published = await listBankQuestions({
    status: BankQuestionStatus.published,
    take: 500,
  });
  const index = buildBankIndex(published);

  const fallbacks: ExamBankFallback[] = [];
  let bankHits = 0;

  const modules: ResolvedExamModule[] = resolved.modules.map((catalog) => {
    const hit = findPublishedBankMatch(catalog, index);
    if (hit) {
      bankHits += 1;
      const overlaid = overlayFromBank(catalog, hit.row);
      return {
        ...overlaid,
        contentSource: "bank" as const,
        bankQuestionId: hit.row.id,
      };
    }

    const reason = "no_published_bank_row";
    fallbacks.push({
      code: catalog.code,
      specialization: catalog.specialization,
      reason,
    });
    log.warn(
      {
        specialization,
        code: catalog.code,
        moduleSpecialization: catalog.specialization,
        reason,
      },
      "exam bank gap — catalog fallback (no live AI)",
    );

    return {
      ...catalogFallbackModule(catalog),
      contentSource: "catalog_fallback" as const,
    };
  });

  if (modules.length !== 47) {
    log.error(
      { specialization, count: modules.length },
      "exam bank resolution did not yield exactly 47 modules",
    );
  }

  return {
    modules,
    jobFitSource: resolved.jobFitSource,
    cluster: resolved.cluster,
    mode: resolved.mode,
    bankHits,
    fallbacks,
  };
}

/** Lookup published bank content for a single scoring module (trusted path). */
export async function getPublishedBankOverlayForModule(
  moduleCode: string,
  specialization: string,
): Promise<{
  scenario: string;
  instructions: string;
  choices: string[];
  rubric?: AssessmentModuleSpec["rubric"];
  bankQuestionId: string;
} | null> {
  const published = await listBankQuestions({
    status: BankQuestionStatus.published,
    moduleCode,
    take: 20,
  });
  if (published.length === 0) return null;

  const index = buildBankIndex(published);
  const probe: AssessmentModuleSpec = {
    code: moduleCode,
    title: moduleCode,
    dimension: "job_fit",
    level: "",
    framework: "",
    focus: "",
    scenario: "",
    instructions: "",
    rubric: [],
    fewShot: [],
    passThreshold: 60,
    validationEnabled: false,
    modelTag: "",
    temperature: 0,
    specialization: specialization || null,
    generated: false,
  };
  const hit = findPublishedBankMatch(probe, index);
  if (!hit) return null;

  return {
    scenario: hit.row.scenario,
    instructions: hit.row.instructions,
    choices: parseChoices(hit.row.choicesJson),
    rubric: parseRubric(hit.row.rubricJson),
    bankQuestionId: hit.row.id,
  };
}

/** Published bank row with the server-side correctIndex for attempt fallback. */
export async function getPublishedBankKeyedQuestion(
  moduleCode: string,
  specialization: string,
): Promise<{
  scenario: string;
  instructions: string;
  choices: string[];
  correctIndex: number;
  bankQuestionId: string;
} | null> {
  const overlay = await getPublishedBankOverlayForModule(moduleCode, specialization);
  if (!overlay) return null;
  const published = await listBankQuestions({
    status: BankQuestionStatus.published,
    moduleCode,
    take: 20,
  });
  const row = published.find((r) => r.id === overlay.bankQuestionId) ?? published[0];
  if (!row) return null;
  return {
    scenario: overlay.scenario,
    instructions: overlay.instructions,
    choices: overlay.choices,
    correctIndex: row.correctIndex,
    bankQuestionId: row.id,
  };
}
