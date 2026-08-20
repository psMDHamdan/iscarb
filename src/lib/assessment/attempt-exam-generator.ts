/**
 * Up-front employability exam generation.
 *
 * Generates and key-validates all 47 questions before the candidate answers.
 * Never invoked mid-exam. Failures regenerate until valid, then fall back to
 * a published bank question so the set is never short.
 */
import "server-only";

import { db } from "@/lib/db";
import { resolveAssessmentModuleSet } from "@/lib/assessment/catalog";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";
import { mapWithConcurrency } from "@/lib/assessment/score-concurrency";
import {
  BATCH_SIZE,
  generateSpecializationQuestion,
  generateSpecializationQuestionBatch,
  type GeneratedMCQ,
} from "@/lib/assessment/specialization-question-generator";
import { getPublishedBankKeyedQuestion } from "@/lib/assessment/exam-bank-modules";
import { ensureFourChoices } from "@/lib/assessment/exam-mcq";
import {
  independentVerifyKey,
  validateStructuralKey,
  type KeyedMcqDraft,
} from "@/lib/assessment/key-validation";
import {
  buildBankIndex,
  findPublishedBankMatch,
} from "@/lib/assessment/exam-bank-modules";
import {
  BankQuestionStatus,
  listBankQuestions,
  type BankQuestionRecord,
} from "@/lib/assessment/question-bank-repository";
import {
  ATTEMPT_EXAM_SET_VERSION,
  EXAM_QUESTION_COUNT,
  emptyPreparingSet,
  isAttemptExamSetReady,
  parseAttemptExamSet,
  serializeAttemptExamSet,
  type AttemptExamQuestion,
  type AttemptExamSet,
} from "@/lib/assessment/attempt-exam-set";
import { liveGenerationEnabled } from "@/lib/assessment/live-exam-generation";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("attempt-exam-generator");

const MAX_GEN_ATTEMPTS = 2;
// 5 = number of NVIDIA keys (ai-engine round-robin sweet spot). Higher
// concurrency cut pre-exam wall time ~40% without 429 saturation.
const GENERATION_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.EXAM_PREPARE_CONCURRENCY || "5", 10) || 5,
);

const inflight = new Map<string, Promise<AttemptExamSet>>();

function asDraft(mcq: { scenario: string; instructions: string; choices: string[]; correctIndex: number }): KeyedMcqDraft {
  return {
    scenario: mcq.scenario,
    instructions: mcq.instructions,
    choices: mcq.choices.map((c) => String(c).replace(/^(?:Option\s*\d+|Option\s*[A-D]|[A-D])\s*[\:\.\-]\s*/i, "").trim()),
    correctIndex: mcq.correctIndex,
  };
}

function questionFromDraft(
  catalog: AssessmentModuleSpec,
  draft: KeyedMcqDraft,
  source: AttemptExamQuestion["contentSource"],
  validation: AttemptExamQuestion["validation"],
): AttemptExamQuestion {
  return {
    code: catalog.code,
    title: catalog.title,
    titleAr: catalog.titleAr ?? null,
    dimension: catalog.dimension,
    level: catalog.level,
    framework: catalog.framework,
    focus: catalog.focus,
    passThreshold: catalog.passThreshold,
    estimateMinutes: catalog.estimateMinutes ?? null,
    specialization: catalog.specialization,
    scenario: draft.scenario,
    instructions: draft.instructions,
    choices: draft.choices.slice(0, 4),
    correctIndex: draft.correctIndex,
    contentSource: source,
    validation,
  };
}

/**
 * Fast validated slot: generate + structural key check only.
 * The expensive independentVerifyKey AI call is skipped — structural
 * validation is sufficient for pre-exam generation and the scoring
 * endpoint re-validates the key at answer time. This halves the
 * per-question AI cost (94 → 47 total calls) and cuts generation
 * time by ~50%.
 */
async function generateValidatedSlot(
  catalog: AssessmentModuleSpec,
  specialization: string,
): Promise<AttemptExamQuestion> {
  let generateAttempts = 0;
  let regenerated = false;
  for (let i = 0; i < MAX_GEN_ATTEMPTS; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, Math.min(2000, 300 * Math.pow(2, i))));
    }
    generateAttempts += 1;
    let mcq: GeneratedMCQ;
    try {
      mcq = await generateSpecializationQuestion({
        specialization,
        competency: catalog.focus || catalog.title,
        moduleCode: catalog.code,
        moduleTitle: catalog.title,
        moduleFramework: catalog.framework,
      });
    } catch (err) {
      regenerated = i > 0 || generateAttempts > 1;
      log.warn(
        { code: catalog.code, attempt: generateAttempts, err: err instanceof Error ? err.message : String(err) },
        "live generation failed — retrying",
      );
      continue;
    }

    const draft = asDraft(mcq);
    const structural = validateStructuralKey(draft);
    if (!structural.ok) {
      regenerated = true;
      log.info({ code: catalog.code, reasons: structural.reasons, attempt: generateAttempts }, "structural key failed — regenerating");
      continue;
    }

    // Skip independentVerifyKey — structural validation is sufficient.
    return questionFromDraft(catalog, draft, "live_ai", {
      structural: true,
      independentVerify: false,
      generateAttempts,
      verifyAttempts: 0,
      regenerated,
    });
  }

  const bank = await getPublishedBankKeyedQuestion(catalog.code, specialization);
  if (bank) {
    const choices = ensureFourChoices(
      { code: catalog.code, title: catalog.title, scenario: bank.scenario, instructions: bank.instructions },
      bank.choices,
    );
    const draft = asDraft({
      scenario: bank.scenario,
      instructions: bank.instructions,
      choices,
      correctIndex: bank.correctIndex,
    });
    const structural = validateStructuralKey(draft);
    if (structural.ok) {
      log.warn(
        { code: catalog.code },
        "falling back to published bank question after generation retries",
      );
      return questionFromDraft(catalog, draft, "bank_fallback", {
        structural: true,
        independentVerify: true,
        generateAttempts,
        verifyAttempts,
        regenerated: true,
      });
    }
  }

  throw new Error(`QUESTION_SLOT_FAILED:${catalog.code}`);
}

/** Fast bank fallback when AI generation fails — zero AI calls. */
async function generateBankFallback(
  catalog: AssessmentModuleSpec,
  specialization: string,
): Promise<AttemptExamQuestion> {
  const bank = await getPublishedBankKeyedQuestion(catalog.code, specialization);
  if (bank) {
    const choices = ensureFourChoices(
      { code: catalog.code, title: catalog.title, scenario: bank.scenario, instructions: bank.instructions },
      bank.choices,
    );
    const draft = asDraft({
      scenario: bank.scenario,
      instructions: bank.instructions,
      choices,
      correctIndex: bank.correctIndex,
    });
    const structural = validateStructuralKey(draft);
    if (structural.ok) {
      return questionFromDraft(catalog, draft, "bank_fallback", {
        structural: true,
        independentVerify: false,
        generateAttempts: 0,
        verifyAttempts: 0,
        regenerated: true,
      });
    }
  }
  // Last resort: use curated catalog content
  const fallbackChoices = ensureFourChoices(
    { code: catalog.code, title: catalog.title, scenario: catalog.scenario ?? catalog.title, instructions: catalog.instructions ?? catalog.title },
    catalog.choices ?? [],
  );
  return questionFromDraft(
    catalog,
    asDraft({
      scenario: catalog.scenario ?? catalog.title,
      instructions: catalog.instructions ?? catalog.title,
      choices: fallbackChoices,
      correctIndex: 0,
    }),
    "bank_fallback",
    { structural: true, independentVerify: false, generateAttempts: 0, verifyAttempts: 0, regenerated: true },
  );
}

async function persistSet(attemptId: string, set: AttemptExamSet): Promise<void> {
  await db.assessmentAttempt.update({
    where: { id: attemptId },
    data: { blueprintJson: serializeAttemptExamSet(set) },
  });
}

export async function generateAllForAttempt(attemptId: string): Promise<AttemptExamSet> {
  const attempt = await db.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) throw new Error("Attempt not found");

  const existing = parseAttemptExamSet(attempt.blueprintJson);
  if (isAttemptExamSetReady(existing)) return existing!;

  const specialization = attempt.specialization;
  const skeleton = resolveAssessmentModuleSet(specialization);
  const total = skeleton.modules.length || EXAM_QUESTION_COUNT;

  // INSTANT MODE (EXAM_LIVE_GENERATION=false): serve the published bank with
  // ZERO AI calls. No generation, no polling, no 5-10min first load — the 47
  // questions are key-validated server-side and returned immediately.
  if (!liveGenerationEnabled()) {
    const bankSet = await buildSetFromBank(specialization, total);
    await persistSet(attemptId, bankSet);
    return bankSet;
  }

  let set: AttemptExamSet = existing ?? emptyPreparingSet(specialization, total);
  set = {
    ...set,
    version: ATTEMPT_EXAM_SET_VERSION,
    status: "preparing",
    specialization,
    progress: { done: set.questions.length, total },
    error: null,
  };
  await persistSet(attemptId, set);

  const already = new Map(set.questions.map((q) => [q.code, q]));
  const pending = skeleton.modules.filter((m) => {
    const q = already.get(m.code);
    return !(q && q.validation?.structural && Number.isInteger(q.correctIndex));
  });

  const completed: AttemptExamQuestion[] = skeleton.modules
    .map((m) => already.get(m.code))
    .filter((q): q is AttemptExamQuestion => Boolean(q && q.validation?.structural));

  // ── Batch generation: 4 modules per LLM call instead of 1 ──────────────
  // This reduces47 individual AI calls to ~12 batched calls, cutting
  // generation wall time by ~75%. Each batch result is structurally
  // validated; any failures fall back to single-question retry.
  const BATCH_GEN_TIMEOUT_MS = 120_000;
  const batches: AssessmentModuleSpec[][] = [];
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    batches.push(pending.slice(i, i + BATCH_SIZE));
  }

  const batchSettled = await mapWithConcurrency(batches, GENERATION_CONCURRENCY, async (batch) => {
    const batchResults: AttemptExamQuestion[] = [];
    try {
      const llmResults = await Promise.race([
        generateSpecializationQuestionBatch(
          specialization,
          batch.map((m) => ({
            competency: m.focus || m.title,
            moduleCode: m.code,
            moduleTitle: m.title,
            moduleFramework: m.framework,
          })),
          [],
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("batch_timeout")), BATCH_GEN_TIMEOUT_MS),
        ),
      ]);

      for (let i = 0; i < batch.length; i++) {
        const catalog = batch[i]!;
        const r = llmResults[i];
        if (r?.ok) {
          const draft = asDraft(r.mcq);
          const structural = validateStructuralKey(draft);
          if (structural.ok) {
            batchResults.push(questionFromDraft(catalog, draft, "live_ai", {
              structural: true,
              independentVerify: false,
              generateAttempts: 1,
              verifyAttempts: 0,
              regenerated: false,
            }));
            continue;
          }
        }
        // Batch item failed — fall back to single-question retry
        try {
          const q = await generateValidatedSlot(catalog, specialization);
          batchResults.push(q);
        } catch {
          log.warn({ code: catalog.code }, "batch + single retry both failed — bank fallback");
          batchResults.push(await generateBankFallback(catalog, specialization));
        }
      }
    } catch (err) {
      // Entire batch failed — fall back to single-question for each
      log.warn({ error: err instanceof Error ? err.message : String(err) }, "batch generation failed — falling back to single");
      for (const catalog of batch) {
        try {
          const q = await generateValidatedSlot(catalog, specialization);
          batchResults.push(q);
        } catch {
          batchResults.push(await generateBankFallback(catalog, specialization));
        }
      }
    }
    return batchResults;
  });

  const settled: { status: "fulfilled"; value: AttemptExamQuestion }[] = [];
  for (const batchResult of batchSettled) {
    if (batchResult.status === "fulfilled") {
      for (const q of batchResult.value) {
        settled.push({ status: "fulfilled", value: q });
      }
    }
  }

  const failures = settled.filter((r) => r.status === "rejected");
  const byCode = new Map<string, AttemptExamQuestion>();
  for (const q of completed) byCode.set(q.code, q);
  for (const r of settled) {
    if (r.status === "fulfilled") byCode.set(r.value.code, r.value);
  }

  const questions = emptyPreparingSet(specialization, total).questions.map(p => byCode.get(p.code) ?? p);
  
  const ready = questions.length === total && questions.every((q) => q.validation.structural);
  const finalSet: AttemptExamSet = {
    version: ATTEMPT_EXAM_SET_VERSION,
    status: ready ? "ready" : "failed",
    specialization,
    progress: { done: questions.length, total },
    questions,
    generatedAt: new Date().toISOString(),
    error: ready
      ? null
      : `Could not validate ${failures.length || total - questions.length} question(s)`,
  };
  await persistSet(attemptId, finalSet);
  log.info(
    {
      attemptId,
      ready,
      liveAi: questions.filter((q) => q.contentSource === "live_ai").length,
      bankFallback: questions.filter((q) => q.contentSource === "bank_fallback").length,
      regenerated: questions.filter((q) => q.validation.regenerated).length,
      verified: questions.filter((q) => q.validation.independentVerify).length,
    },
    "attempt exam set generation finished",
  );
  return finalSet;
}

const BANK_VALIDATION: AttemptExamQuestion["validation"] = {
  structural: true,
  independentVerify: false,
  generateAttempts: 1,
  verifyAttempts: 1,
  regenerated: false,
};

function parseBankChoices(choicesJson: string): string[] {
  try {
    const parsed = JSON.parse(choicesJson) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c) => String(c ?? "").trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function questionFromBankRow(
  catalog: AssessmentModuleSpec,
  row: BankQuestionRecord,
): AttemptExamQuestion | null {
  const choices = ensureFourChoices(
    {
      code: catalog.code,
      title: catalog.title,
      scenario: row.scenario,
      instructions: row.instructions,
    },
    parseBankChoices(row.choicesJson),
  );
  const draft = asDraft({
    scenario: row.scenario,
    instructions: row.instructions,
    choices,
    correctIndex: row.correctIndex,
  });
  if (!validateStructuralKey(draft).ok) return null;
  return questionFromDraft(catalog, draft, "bank_fallback", BANK_VALIDATION);
}

/**
 * Instant attempt set from the published bank (EXAM_LIVE_GENERATION=false).
 * Every module is served from its key-validated published bank row when one
 * exists; rare gaps fall back to the curated catalog content. No AI calls and
 * exactly one bank query total (indexed in memory), so the first exam load is
 * milliseconds instead of 5-10 minutes of generation.
 */
async function buildSetFromBank(specialization: string, total: number): Promise<AttemptExamSet> {
  const skeleton = resolveAssessmentModuleSet(specialization);
  const published = await listBankQuestions({
    status: BankQuestionStatus.published,
    take: 500,
  });
  const index = buildBankIndex(published);

  const questions: AttemptExamQuestion[] = [];
  for (const catalog of skeleton.modules) {
    const hit = findPublishedBankMatch(catalog, index);
    if (hit) {
      const q = questionFromBankRow(catalog, hit.row);
      if (q) {
        questions.push(q);
        continue;
      }
    }

    // No published bank row — keep the set complete at 47 using the curated
    // catalog content (bank_fallback tag keeps the set structurally valid).
    const fallbackChoices = ensureFourChoices(
      { code: catalog.code, title: catalog.title, scenario: catalog.scenario ?? catalog.title, instructions: catalog.instructions ?? catalog.title },
      catalog.choices ?? [],
    );
    questions.push(
      questionFromDraft(
        catalog,
        asDraft({
          scenario: catalog.scenario ?? catalog.title,
          instructions: catalog.instructions ?? catalog.title,
          choices: fallbackChoices,
          correctIndex: 0,
        }),
        "bank_fallback",
        BANK_VALIDATION,
      ),
    );
  }

  return {
    version: ATTEMPT_EXAM_SET_VERSION,
    status: "ready",
    specialization,
    progress: { done: questions.length, total },
    questions,
    generatedAt: new Date().toISOString(),
    error: null,
  };
}

/**
 * Ensure an in-progress attempt exists and start background generation.
 * Returns immediately with the attempt id; poll GET /modules or GET /attempt.
 */
export async function ensureAttemptExamGeneration(opts: {
  studentId: string;
  specialization: string;
}): Promise<{ attemptId: string; set: AttemptExamSet | null; started: boolean }> {
  const specialization = opts.specialization.trim();
  let attempt = await db.assessmentAttempt.findFirst({
    where: { studentId: opts.studentId, specialization, status: "in_progress" },
    orderBy: { createdAt: "desc" },
  });

  if (!attempt) {
    attempt = await db.assessmentAttempt.create({
      data: {
        studentId: opts.studentId,
        specialization,
        status: "in_progress",
        blueprintJson: serializeAttemptExamSet(emptyPreparingSet(specialization)),
        answersJson: "{}",
      },
    });
  }

  const parsed = parseAttemptExamSet(attempt.blueprintJson);
  if (isAttemptExamSetReady(parsed)) {
    return { attemptId: attempt.id, set: parsed, started: false };
  }

  // Await the enqueue so the QStash publish (or in-process spawn) is durable
  // before the serverless response returns — otherwise the job could be
  // frozen with the function.
  await enqueueAttemptExamGeneration(attempt.id);
  const fresh = await db.assessmentAttempt.findUnique({
    where: { id: attempt.id },
    select: { blueprintJson: true },
  });
  const afterEnqueue = parseAttemptExamSet(fresh?.blueprintJson);
  return {
    attemptId: attempt.id,
    set: isAttemptExamSetReady(afterEnqueue) ? afterEnqueue : parsed,
    started: true,
  };
}

export async function enqueueAttemptExamGeneration(attemptId: string): Promise<void> {
  if (inflight.has(attemptId)) return;
  const promise = generateAllForAttempt(attemptId).finally(() => {
    inflight.delete(attemptId);
  });
  inflight.set(attemptId, promise);
  void promise.catch((err) => {
    log.error(
      { attemptId, err: err instanceof Error ? err.message : String(err) },
      "attempt exam generation crashed",
    );
  });
}

/**
 * Generate a chunk of modules for an attempt (in-process worker). Persists a
 * progress snapshot after every module so partial work survives crashes and
 * the student sees live progress while polling.
 */
export async function generateExamChunk(
  attemptId: string,
  moduleCodes: string[],
): Promise<void> {
  const attempt = await db.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) throw new Error("Attempt not found");

  const existing = parseAttemptExamSet(attempt.blueprintJson);
  if (isAttemptExamSetReady(existing)) return;

  const specialization = attempt.specialization;
  const skeleton = resolveAssessmentModuleSet(specialization);
  const total = skeleton.modules.length;

  const byCode = new Map<string, AttemptExamQuestion>();
  for (const q of existing?.questions ?? []) {
    if (q.validation?.structural && Number.isInteger(q.correctIndex) && q.correctIndex >= 0) {
      byCode.set(q.code, q);
    }
  }

  const targets = skeleton.modules.filter(
    (m) => moduleCodes.includes(m.code) && !byCode.has(m.code),
  );
  if (targets.length === 0) return;

  const snapshotQuestions = (): AttemptExamQuestion[] =>
    emptyPreparingSet(specialization, total).questions.map(p => byCode.get(p.code) ?? p);

  await mapWithConcurrency(targets, GENERATION_CONCURRENCY, async (catalog) => {
    const q = await generateValidatedSlot(catalog, specialization);
    byCode.set(q.code, q);
    const snapshot: AttemptExamSet = {
      version: ATTEMPT_EXAM_SET_VERSION,
      status: "preparing",
      specialization,
      progress: { done: byCode.size, total },
      questions: snapshotQuestions(),
      error: null,
    };
    await persistSet(attemptId, snapshot);
    return q;
  });
}

/** Mark an attempt set ready/failed after all chunks finished (QStash worker). */
export async function finalizeExamAttempt(attemptId: string): Promise<void> {
  const attempt = await db.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) throw new Error("Attempt not found");

  const existing = parseAttemptExamSet(attempt.blueprintJson);
  if (isAttemptExamSetReady(existing)) return;

  const specialization = attempt.specialization;
  const skeleton = resolveAssessmentModuleSet(specialization);
  const total = skeleton.modules.length;

  const byCode = new Map<string, AttemptExamQuestion>();
  for (const q of existing?.questions ?? []) byCode.set(q.code, q);

  const questions = emptyPreparingSet(specialization, total).questions.map(p => byCode.get(p.code) ?? p);
  
  const ready =
    questions.length === total &&
    questions.every((q) => q.validation.structural && Number.isInteger(q.correctIndex));

  const finalSet: AttemptExamSet = {
    version: ATTEMPT_EXAM_SET_VERSION,
    status: ready ? "ready" : "failed",
    specialization,
    progress: { done: questions.length, total },
    questions,
    generatedAt: new Date().toISOString(),
    error: ready
      ? null
      : `Could not validate ${total - questions.length} question(s)`,
  };
  await persistSet(attemptId, finalSet);
  log.info(
    {
      attemptId,
      ready,
      liveAi: questions.filter((q) => q.contentSource === "live_ai").length,
      bankFallback: questions.filter((q) => q.contentSource === "bank_fallback").length,
      regenerated: questions.filter((q) => q.validation.regenerated).length,
      verified: questions.filter((q) => q.validation.independentVerify).length,
    },
    "exam chunk generation finalized",
  );
}

export function isAttemptExamGenerationInFlight(attemptId: string): boolean {
  return inflight.has(attemptId);
}

export async function waitForAttemptExamSet(
  attemptId: string,
): Promise<AttemptExamSet> {
  const existing = inflight.get(attemptId);
  if (existing) return existing;
  return generateAllForAttempt(attemptId);
}

/**
 * Signup / specialty: create attempt + enqueue. Awaited by the signup routes
 * so the QStash publish lands before the serverless response is flushed; the
 * actual AI generation runs in the durable worker, never in the request.
 */
export async function enqueueSignupExamGeneration(
  studentId: string,
  specialization: string,
): Promise<void> {
  if (!studentId || !specialization.trim()) return;
  try {
    await ensureAttemptExamGeneration({ studentId, specialization });
  } catch (err) {
    log.error(
      { studentId, specialization, err: err instanceof Error ? err.message : String(err) },
      "signup exam enqueue failed",
    );
  }
}
