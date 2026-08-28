/**
 * Phase 5 — Generate specialty Job-Fit MCQs at SIGNUP time (70B), never at exam.
 *
 * Pipeline: generate → automated safeguards → auto-publish (needsHumanReview)
 * or park in_review on failure. Idempotent via coverage check + identity upsert.
 */
import "server-only";

import { chatJson } from "@/lib/ai-engine";
import {
  generateGenericJobFit,
  normalizeSpec,
} from "@/lib/assessment/catalog";
import {
  expectedGenericJobFitCodes,
  hasPublishedJobFitCoverage,
  specialtyNeedsSignupJobFitGeneration,
} from "@/lib/assessment/jobfit-signup-coverage";
import {
  runSignupJobFitSafeguards,
  type GeneratedJobFitDraft,
  type GeneratedMcqOption,
} from "@/lib/assessment/jobfit-signup-safeguards";
import {
  BankQuestionProvenance,
  BankQuestionStatus,
  upsertBankQuestionByIdentity,
  updateBankQuestion,
  type BankQuestionRecord,
  type BankQuestionRubricCriterion,
} from "@/lib/assessment/question-bank-repository";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("jobfit-signup-generator");

/** Strong model — Phase 5 explicitly forbids the 8B exam-era rewriter. */
export const SIGNUP_JOBFIT_MODEL =
  process.env.SIGNUP_JOBFIT_MODEL?.trim() || "nvidia/nemotron-3-nano-30b-a3b";

export type SignupJobFitSlotResult = {
  moduleCode: string;
  autoPublished: boolean;
  status: BankQuestionStatus;
  needsHumanReview: boolean;
  safeguardOk: boolean;
  safeguardReasons: string[];
  bankQuestionId?: string;
  skipped?: boolean;
  error?: string;
};

export type SignupJobFitGenerationResult = {
  specialization: string;
  skipped: boolean;
  reason?: string;
  slots: SignupJobFitSlotResult[];
};

type ChatJsonFn = typeof chatJson;

let chatJsonImpl: ChatJsonFn = chatJson;

/** Test hook — inject mock chatJson. */
export function setSignupJobFitChatJson(fn: ChatJsonFn | null): void {
  chatJsonImpl = fn ?? chatJson;
}

function parseOptions(raw: unknown): GeneratedMcqOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((o) => {
    const row = (o ?? {}) as Record<string, unknown>;
    const labelRaw = String(row.label ?? row.isCorrect ?? "").toLowerCase();
    const label: "correct" | "incorrect" =
      labelRaw === "correct" || labelRaw === "true" || row.isCorrect === true
        ? "correct"
        : "incorrect";
    return {
      text: String(row.text ?? row.choice ?? "").trim(),
      label,
      rationale: String(row.rationale ?? row.reason ?? "").trim(),
    };
  });
}

function parseRubric(raw: unknown): BankQuestionRubricCriterion[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => {
    const row = (r ?? {}) as Record<string, unknown>;
    return {
      criterion: String(row.criterion ?? "").trim(),
      weight: Number(row.weight ?? 0),
      descriptor: String(row.descriptor ?? "").trim(),
      ...(row.gate === true ? { gate: true as const } : {}),
    };
  });
}

function coerceDraft(
  specialization: string,
  moduleCode: string,
  slotIndex: number,
  data: Record<string, unknown>,
  fallbackTitle: string,
  fallbackFocus: string,
  fallbackFramework: string,
  fallbackRubric: BankQuestionRubricCriterion[],
): GeneratedJobFitDraft {
  const choices = parseOptions(data.choices ?? data.options);
  let correctIndex = Number(data.correctIndex);
  if (!Number.isInteger(correctIndex)) {
    const labeled = choices.findIndex((c) => c.label === "correct");
    correctIndex = labeled >= 0 ? labeled : -1;
  }
  // Do NOT rewrite multi-correct labels here — the one-correct safeguard must
  // reject those drafts (auto-publish only when gates pass).

  const rubric = parseRubric(data.rubric);
  return {
    moduleCode,
    title: String(data.title ?? fallbackTitle).trim() || fallbackTitle,
    focus: String(data.focus ?? fallbackFocus).trim() || fallbackFocus,
    framework:
      String(data.framework ?? fallbackFramework).trim() || fallbackFramework,
    scenario: String(data.scenario ?? "").trim(),
    instructions: String(data.instructions ?? "").trim(),
    choices,
    correctIndex,
    rubric: rubric.length >= 2 ? rubric : fallbackRubric,
  };
}

async function generateOneDraft(
  specialization: string,
  moduleCode: string,
  slotIndex: number,
  template: {
    title: string;
    focus: string;
    framework: string;
    scenario: string;
    instructions: string;
    rubric: BankQuestionRubricCriterion[];
  },
): Promise<GeneratedJobFitDraft> {
  const system = [
    "You are a senior assessment designer for employability Job-Fit MCQs.",
    `Create ONE high-quality MCQ grounded 100% in the specialty: "${specialization}".`,
    "Return STRICT JSON only. No markdown fences.",
    "Rules:",
    "- Exactly 4 action-oriented options.",
    "- Exactly ONE option must be defensibly correct; label it \"correct\".",
    "- Label the other three \"incorrect\" and give a concrete flaw rationale for each.",
    "- Correct option rationale must explain why it is right.",
    "- Scenario and instructions must explicitly involve the specialty (not generic filler).",
    "- Rubric: 2–4 criteria, weights sum to 100.",
    "- Saudi / Vision 2030 context is welcome when natural; never invent fake regulators.",
  ].join("\n");

  const user = [
    `SPECIALTY: ${specialization}`,
    `MODULE_CODE: ${moduleCode}`,
    `SLOT: ${slotIndex + 1} of 3 (diagnosis / method / quality-compliance style)`,
    `TEMPLATE_TITLE: ${template.title}`,
    `TEMPLATE_FOCUS: ${template.focus}`,
    `TEMPLATE_FRAMEWORK: ${template.framework}`,
    `TEMPLATE_SCENARIO_HINT: ${template.scenario}`,
    `TEMPLATE_INSTRUCTIONS_HINT: ${template.instructions}`,
    "",
    "Return JSON shape:",
    JSON.stringify({
      title: "string",
      focus: "string",
      framework: "string",
      scenario: "string",
      instructions: "string",
      choices: [
        {
          text: "string",
          label: "correct|incorrect",
          rationale: "string",
        },
      ],
      correctIndex: 0,
      rubric: [{ criterion: "string", weight: 50, descriptor: "string" }],
    }),
  ].join("\n");

  const result = await chatJsonImpl({
    system,
    user,
    temperature: 0.35,
    model: SIGNUP_JOBFIT_MODEL,
  });

  // chatJson returns ChatResult { content, json, ... } — not { data }.
  let data: Record<string, unknown> = {};
  if (result.json && typeof result.json === "object" && !Array.isArray(result.json)) {
    data = result.json as Record<string, unknown>;
  } else if (typeof result.content === "string" && result.content.trim()) {
    try {
      const parsed = JSON.parse(result.content) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>;
      }
    } catch {
      /* leave empty — safeguards will reject */
    }
  }
  if (data.error || data.fallback === true) {
    throw new Error(
      `signup Job-Fit AI unavailable: ${String(data.error ?? "fallback")}`,
    );
  }
  return coerceDraft(
    specialization,
    moduleCode,
    slotIndex,
    data,
    template.title,
    template.focus,
    template.framework,
    template.rubric,
  );
}

async function persistDraft(
  specialization: string,
  draft: GeneratedJobFitDraft,
  gate: ReturnType<typeof runSignupJobFitSafeguards>,
): Promise<{ record: BankQuestionRecord; autoPublished: boolean }> {
  const choices = draft.choices.map((c) => c.text) as [
    string,
    string,
    string,
    string,
  ];
  const autoPublish = gate.ok;
  const status = autoPublish
    ? BankQuestionStatus.published
    : BankQuestionStatus.in_review;

  const gateNotes = gate.ok
    ? "Phase5 auto-publish: all safeguards passed (awaiting human review)."
    : `Phase5 safeguard failure — not auto-published: ${gate.reasons.join(", ")}`;

  const { record } = await upsertBankQuestionByIdentity({
    moduleCode: draft.moduleCode,
    dimension: "job_fit",
    specialization,
    title: draft.title,
    level: "L3-GEN",
    framework: draft.framework,
    focus: draft.focus,
    estimateMinutes: 12,
    passThreshold: 70,
    scenario: draft.scenario,
    instructions: draft.instructions,
    choices,
    correctIndex: draft.correctIndex,
    rubric: draft.rubric,
    provenance: BankQuestionProvenance.ai_generated,
    status,
    needsHumanReview: true,
    aiModelUsed: SIGNUP_JOBFIT_MODEL,
    reviewNotes: `@@lifecycle@@${JSON.stringify({
      at: new Date().toISOString(),
      by: "system:signup-jobfit",
      action: autoPublish ? "auto_publish" : "submit",
      from: "draft",
      to: status,
      notes: gateNotes,
    })}\n${gateNotes}`,
  });

  // Force lifecycle fields even when contentHash was unchanged (idempotent re-run).
  const forced = await updateBankQuestion(record.id, {
    status,
    needsHumanReview: true,
    provenance: BankQuestionProvenance.ai_generated,
    aiModelUsed: SIGNUP_JOBFIT_MODEL,
    reviewNotes: record.reviewNotes,
  });

  return { record: forced, autoPublished: autoPublish };
}

/**
 * Generate + safeguard + persist 3 Job-Fit questions for an uncurated specialty.
 * Safe to call repeatedly (idempotent when coverage already exists).
 */
export async function generateSignupJobFitForSpecialty(
  specializationRaw: string,
): Promise<SignupJobFitGenerationResult> {
  const specialization = specializationRaw.trim();
  if (!specialization) {
    return { specialization: "", skipped: true, reason: "empty_specialty", slots: [] };
  }

  if (!specialtyNeedsSignupJobFitGeneration(specialization)) {
    return {
      specialization,
      skipped: true,
      reason: "curated_track",
      slots: [],
    };
  }

  if (await hasPublishedJobFitCoverage(specialization)) {
    log.info(
      { specialization },
      "signup Job-Fit skipped — published coverage already exists",
    );
    return {
      specialization,
      skipped: true,
      reason: "already_covered",
      slots: [],
    };
  }

  const blueprint = generateGenericJobFit(specialization);
  const codes = expectedGenericJobFitCodes(specialization);
  const slots: SignupJobFitSlotResult[] = [];

  for (let i = 0; i < 3; i++) {
    const moduleCode = codes[i];
    const template = blueprint.modules[i];
    try {
      const draft = await generateOneDraft(
        specialization,
        moduleCode,
        i,
        {
          title: template.title,
          focus: template.focus,
          framework: template.framework,
          scenario: template.scenario,
          instructions: template.instructions,
          rubric: template.rubric,
        },
      );
      const gate = runSignupJobFitSafeguards(specialization, draft);
      const { record, autoPublished } = await persistDraft(
        specialization,
        draft,
        gate,
      );
      slots.push({
        moduleCode,
        autoPublished,
        status: record.status,
        needsHumanReview: record.needsHumanReview,
        safeguardOk: gate.ok,
        safeguardReasons: gate.reasons,
        bankQuestionId: record.id,
      });
      log.info(
        {
          specialization,
          moduleCode,
          autoPublished,
          status: record.status,
          reasons: gate.reasons,
        },
        "signup Job-Fit slot persisted",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error(
        { specialization, moduleCode, err: message },
        "signup Job-Fit slot failed",
      );
      slots.push({
        moduleCode,
        autoPublished: false,
        status: BankQuestionStatus.draft,
        needsHumanReview: true,
        safeguardOk: false,
        safeguardReasons: ["generation_error"],
        error: message,
      });
    }
  }

  return { specialization, skipped: false, slots };
}
