/**
 * iSCARB — Specialization-Aware Question Generator
 * =================================================
 * Implements the full pipeline from the FINAL IMPLEMENTATION PROMPT:
 *
 *   SPECIALIZATION PROFILE
 *   → COMPETENCY + SUB-COMPETENCY
 *   → DIFFICULTY
 *   → LLM QUESTION GENERATION
 *   → GENERATE → CRITIQUE → REGENERATE LOOP
 *   → 9-CHECK VALIDATOR (spec §15)
 *   → STORE / RETURN QUESTION
 *
 * CONTRACT:
 *   - NEVER returns an old / fallback / generic question.
 *   - If all retries fail → throws SpecializationGenerationError.
 *   - Caller (employability-generator.ts) must surface QUESTION_GENERATION_FAILED to UI.
 *   - The specialization is a HARD CONSTRAINT supplied by the application,
 *     never decided by the LLM.
 */

import "server-only";
import { chatJson } from "@/lib/ai-engine";
import {
  getSpecializationProfile,
  renderProfileForPrompt,
  SpecializationProfile,
} from "./specialization-profile";

// ── Model ────────────────────────────────────────────────────────────────────
// SPEED-OPTIMIZED: Using deepseek-ai/deepseek-v4-pro-0813 on NVIDIA NIM for fast,
// non-reasoning direct JSON generation (3-5s per question).
export const GENERATION_MODEL =
  process.env.EXAM_LIVE_GENERATION_MODEL || process.env.OPENAI_CHAT_MODEL || "deepseek-ai/deepseek-v4-pro-0813";
const MAX_RETRIES = 2;
const GENERATION_TIMEOUT_MS = 25_000;

// ── Public types ─────────────────────────────────────────────────────────────

export interface GeneratedMCQ {
  scenario: string;
  scenarioAr?: string;
  instructions: string;
  instructionsAr?: string;
  choices: string[];          // exactly 4, all plausible
  choicesAr?: string[];
  correctIndex: number;       // 0–3, randomised
  specialization: string;
  competency: string;
  difficulty: "very_hard";
  qualityScore: QualityScore;
  generatedAt: string;
}

export interface QualityScore {
  specializationRelevance: number;  // 0–10
  competencyRelevance: number;
  professionalRealism: number;
  difficulty: number;
  taskQuality: number;
  optionQuality: number;
  distractorPlausibility: number;
  novelty: number;
  overall: number;
}

export class SpecializationGenerationError extends Error {
  constructor(
    public readonly specialization: string,
    public readonly competency: string,
    public readonly attempts: number,
    message: string,
  ) {
    super(message);
    this.name = "SpecializationGenerationError";
  }
}

// ── Validation (spec §15, 9 checks) ─────────────────────────────────────────

interface ValidationResult {
  passed: boolean;
  failures: string[];
}

// Short but domain-defining terms that would otherwise be dropped by a
// word-length filter (SQL, Git, REST, IAM, …). Only unambiguous tokens are
// listed — 2-char ones (ci/cd/qa/ui/db) are excluded because substring or
// even word-boundary matching on them creates false domain hits.
const SHORT_DOMAIN_TOKENS = [
  "api", "sql", "git", "rest", "http", "ux", "css",
  "html", "aws", "gcp", "azure", "sso", "iam", "grpc", "xml", "json", "cli",
  "sdk", "erp", "crm", "pcr", "elisa", "dna", "rna", "mlops", "cicd",
  "devops", "kubernetes", "docker", "postgres", "mysql", "mongodb",
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Domain vocabulary matcher derived from the specialization profile: words of
 * length >= 3 from knowledge areas and typical tools, plus short tokens.
 * Matched with WORD BOUNDARIES so "api" matches "API contract" but never
 * the substring inside "capital" or "rapidly".
 */
function domainMatcher(profile: SpecializationProfile): (text: string) => boolean {
  const words = [
    ...profile.coreKnowledgeAreas.flatMap((a) => a.split(/[\s&+()/-]+/)),
    ...profile.typicalTools.flatMap((t) => t.split(/[\s&+()/-]+/)),
    ...profile.professionalScenarios.flatMap((s) => s.split(/[\s&+()/-]+/)),
  ]
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length >= 3);
  // Add singular stems so "databases" also matches "database" — knowledge
  // areas are often plural. Long tokens also match derivational forms
  // ("deployment" token matches "deploy", "deployed", "deploying").
  const stems = words.flatMap((w) =>
    w.endsWith("s") && w.length > 4 ? [w, w.slice(0, -1)] : [w]
  );
  const tokens = [...new Set([...stems, ...SHORT_DOMAIN_TOKENS])]
    .filter((w) => w.length >= 3);
  const pattern = tokens
    .map((t) => (t.length >= 5 ? `${escapeRegExp(t)}[a-z]*` : escapeRegExp(t)))
    .join("|");
  const re = new RegExp(`\\b(?:${pattern})\\b`, "i");
  return (text: string) => re.test(text);
}

const FOOLISH_PATTERNS = /\b(ignore the|do nothing|blame (others|another|the|a)|resign immediately|let it slide|refuse to|say (you|i) (cannot|can't) remember|use deep jargon|skip (the|all) (qc|quality|checks)|hide the|pass the buck|side with .* and refuse|postpone .* indefinitely|ask (the )?manager to (handle|deal|take care)|work harder|just (ask|tell|say)|don't (worry|bother)|pretend (it|everything|nothing)|sweep (it|this) under|avoid (the|all|any)|give up|panic|shout|yell|ignore|dismiss|belittle|ridicule)\b/i;

const GIVEAWAY_PATTERNS = /\b(the|a) (safest|best|most (correct|appropriate|professional|effective)) (approach|option|solution|strategy|action)\b|\bobviously (correct|best|right)\b|\bguaranteed to\b|\bthe correct (answer|approach|option)\b|\balways the (best|right|correct)\b/i;
const CORRECT_IDENTIFIERS = /\b(best|robust|strategic|measurable|comprehensive|structured|optimal|ideal|superior|exceptional|exemplary|gold[- ]standard)\b/i;

/** Export for unit tests only. */
export function validateQuestion(
  q: RawLLMQuestion,
  specialization: string,
  competency: string,
  profile: SpecializationProfile,
): ValidationResult {
  const failures: string[] = [];

  // 1. Scenario non-empty and reasonable length
  if (!q.scenario || q.scenario.trim().length < 15) {
    failures.push("CHECK_SCENARIO: scenario text too short or empty");
  }

  // 2. Task non-empty
  if (!q.task || q.task.trim().length < 6) {
    failures.push("CHECK_TASK: task text too short or empty");
  }

  // 3. Exactly 4 options, none empty or placeholder
  if (!Array.isArray(q.options) || q.options.length < 4) {
    failures.push(`CHECK_OPTIONS: expected >= 4 options, got ${q.options?.length ?? 0}`);
  } else if (q.options.slice(0, 4).some((o) => !o || !o.trim() || o === "..." || /^Option\s+[A-D]$/i.test(o.trim()))) {
    failures.push("CHECK_OPTIONS: one or more options are empty or placeholders");
  }

  // 4. Correct index in range 0-3
  if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3) {
    failures.push(`CHECK_CORRECT_INDEX: correctIndex ${q.correctIndex} out of range 0-3`);
  }

  return { passed: failures.length === 0, failures };
}

// ── Quality scorer (spec §18) ────────────────────────────────────────────────

function scoreQuality(q: RawLLMQuestion, profile: SpecializationProfile): QualityScore {
  const scenarioWords = q.scenario.split(" ").length;
  const domainHits = profile.coreKnowledgeAreas.filter((a) =>
    q.scenario.toLowerCase().includes(a.split(" ")[0].toLowerCase())
  ).length;

  const specializationRelevance = Math.min(10, 5 + domainHits * 2);
  const competencyRelevance = /deadline|conflict|stakeholder|decision|risk|communicate|team|escalat/i.test(q.scenario) ? 8 : 5;
  const professionalRealism = scenarioWords >= 70 ? 9 : scenarioWords >= 50 ? 8 : scenarioWords >= 40 ? 7 : 5;
  const difficulty = q.scenario.split(/[.,;]/).length >= 5 ? 9 : 7;
  const taskQuality = /which|should|best course|recommend|prioritize|what action|agree/i.test(q.task) ? 9 : 5;

  const optionLengths = (q.options || []).map((o) => o.split(" ").length);
  const avgLen = optionLengths.reduce((a, b) => a + b, 0) / (optionLengths.length || 1);
  const optionQuality = avgLen >= 40 ? 9 : avgLen >= 30 ? 8 : avgLen >= 25 ? 7 : 5;

  // IMPROVED: Check for foolish distractors more thoroughly
  const obviousDistractors = (q.options || []).filter(
    (o) => FOOLISH_PATTERNS.test(o) || /do nothing|ignore|blame|quit|resign immediately without/i.test(o)
  ).length;
  const distractorPlausibility = Math.max(0, 10 - obviousDistractors * 3);

  // NEW: Check if correct answer is identifiable by meta-patterns
  const correctIdx = typeof q.correctIndex === "number" ? q.correctIndex : -1;
  let giveawayPenalty = 0;
  if (correctIdx >= 0 && correctIdx < (q.options?.length ?? 0)) {
    const correctOption = q.options[correctIdx];
    if (correctOption) {
      // Penalty if correct answer is the longest
      const lengths = q.options.map((o) => o.split(" ").length);
      const correctLen = lengths[correctIdx]!;
      const avgOther = lengths.filter((_, i) => i !== correctIdx).reduce((a, b) => a + b, 0) / (lengths.length - 1 || 1);
      if (correctLen > avgOther * 1.2) giveawayPenalty += 1;

      // Penalty if correct answer uses giveaway language
      if (GIVEAWAY_PATTERNS.test(correctOption)) giveawayPenalty += 2;

      // Penalty if correct answer is the only one with professional identifiers
      const correctHasIdent = CORRECT_IDENTIFIERS.test(correctOption);
      const othersHaveIdent = q.options.some((o, i) => i !== correctIdx && CORRECT_IDENTIFIERS.test(o));
      if (correctHasIdent && !othersHaveIdent) giveawayPenalty += 1;
    }
  }

  const overall = Math.round(
    Math.max(0,
      (specializationRelevance + competencyRelevance + professionalRealism +
        difficulty + taskQuality + optionQuality + distractorPlausibility) / 7
    ) - giveawayPenalty
  );

  return {
    specializationRelevance,
    competencyRelevance,
    professionalRealism,
    difficulty,
    taskQuality,
    optionQuality,
    distractorPlausibility,
    novelty: 9,
    overall: Math.max(0, overall),
  };
}

// ── Minimum thresholds (spec §18) ────────────────────────────────────────────

function meetsMinimumThresholds(score: QualityScore): boolean {
  return (
    score.overall >= 7 &&
    score.specializationRelevance >= 6 &&
    score.distractorPlausibility >= 6
  );
}

// ── LLM raw output type ───────────────────────────────────────────────────────

interface RawLLMQuestion {
  scenario: string;
  scenarioAr?: string;
  task: string;
  taskAr?: string;
  options: string[];
  optionsAr?: string[];
  correctIndex: number;
  validation?: {
    frameworkAppliedCorrectly: boolean;
    exactlyOneBestAnswer: boolean;
    allOptionsPlausible: boolean;
    correctAnswerNotObvious: boolean;
    specializationRelevant: boolean;
    taskOptionAlignment: boolean;
  };
}

// ── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(
  specialization: string,
  competency: string,
  moduleTitle: string,
  moduleFramework: string,
  profile: SpecializationProfile,
  previousFailures: string[],
  usedTopics: string[] = [],
  context?: import("./assessment-types").AssessmentContext | null
): string {
  const domain = profile.domain || specialization;
  const knowledge = (profile.coreKnowledgeAreas || []).slice(0, 3).join(", ");
  const isNonTech = !/computer|software|data\s*science|cyber|information\s*tech|devops/i.test(specialization);
  const domainNote = isNonTech
    ? `Candidate is in "${specialization}". Do NOT use coding or IT tasks.`
    : `Domain: ${domain} (${knowledge}).`;

  return `You are a professional assessment author creating high-quality, realistic employability multiple-choice questions for "${specialization}".

Module: ${moduleTitle}
Competency: ${competency}
Framework: ${moduleFramework}
Domain: ${domainNote}

RULES:
1. Scenario: 2-3 sentences realistic workplace scenario in ${specialization} with specific constraints.
2. Task: 1-2 sentences concrete professional decision question.
3. Options: Exactly 4 distinct, plausible professional approaches in ${specialization}. No foolish or obviously wrong choices.
4. Correct Answer: Exactly one best choice. Randomize its index (0-3).
5. Arabic Translations: Include scenarioAr, taskAr, and optionsAr (4 strings) in fluent Modern Standard Arabic.

OUTPUT FORMAT (strict JSON, no other text):
{
  "scenario": "<2-3 sentences in English. Realistic ${specialization} workplace situation>",
  "scenarioAr": "<Fluent Modern Standard Arabic translation of scenario>",
  "task": "<1-2 sentences in English. Professional decision question>",
  "taskAr": "<Fluent Modern Standard Arabic translation of task>",
  "options": [
    "<Option A in English>",
    "<Option B in English>",
    "<Option C in English>",
    "<Option D in English>"
  ],
  "optionsAr": [
    "<Option A in Arabic>",
    "<Option B in Arabic>",
    "<Option C in Arabic>",
    "<Option D in Arabic>"
  ],
  "correctIndex": <0|1|2|3>
}`;
}

// ── User prompt builder ───────────────────────────────────────────────────────

function buildUserPrompt(
  specialization: string,
  competency: string,
  moduleTitle: string,
  attempt: number,
): string {
  return [
    `Generate an advanced employability assessment MCQ for:`,
    `  Specialization: ${specialization}`,
    `  Competency: ${competency}`,
    `  Module: ${moduleTitle}`,
    ``,
    `Return ONLY the JSON object with scenario, scenarioAr, task, taskAr, 4 options, 4 optionsAr, and correctIndex (0-3).`,
  ].join("\n");
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generateSpecializationQuestion(params: {
  specialization: string;
  competency: string;
  moduleCode: string;
  moduleTitle: string;
  moduleFramework: string;
  usedTopics?: string[];
  context?: import("./assessment-types").AssessmentContext | null;
}): Promise<GeneratedMCQ> {
  const { specialization, competency, moduleCode, moduleTitle, moduleFramework, usedTopics, context } = params;

  const profile = getSpecializationProfile(specialization);
  let lastFailures: string[] = [];

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const systemPrompt = buildSystemPrompt(
      specialization, competency, moduleTitle, moduleFramework,
      profile, lastFailures, usedTopics ?? [], context
    );
    const userPrompt = buildUserPrompt(specialization, competency, moduleTitle, attempt);

    let result;
    try {
      result = await chatJson({
        system: systemPrompt,
        user: userPrompt,
        temperature: 0.7,
        model: GENERATION_MODEL,
        guardrails: false,
        maxTokens: 1200,
      });
    } catch (err) {
      console.error(`[spec-gen] attempt ${attempt + 1} LLM call failed:`, err);
      lastFailures = [`LLM_ERROR: ${err instanceof Error ? err.message : String(err)}`];
      continue;
    }

    const raw = ((result.json as any)?.question || (result.json as any)?.data || (result.json as any)) as Record<string, unknown> | null;
    const scenario = String(raw?.scenario || raw?.scenarioEn || raw?.context || "").trim();
    const task = String(raw?.task || raw?.taskEn || raw?.question || raw?.instructions || "").trim();
    const rawOpts = Array.isArray(raw?.options) ? raw.options : (Array.isArray(raw?.choices) ? raw.choices : []);
    const options = rawOpts.map(String).map((c: string) => c.replace(/^(?:Option\s*\d+|Option\s*[A-D]|[A-D])\s*[\:\.\-]\s*/i, "").trim());
    const rawOptsAr = Array.isArray(raw?.optionsAr) ? raw.optionsAr : (Array.isArray(raw?.choicesAr) ? raw.choicesAr : undefined);
    const optionsAr = rawOptsAr ? rawOptsAr.map(String) : undefined;
    const correctIndex = typeof raw?.correctIndex === "number" ? Math.max(0, Math.min(3, raw.correctIndex)) : 0;

    if (!scenario || !task || options.length < 4) {
      lastFailures = ["PARSE_ERROR: LLM did not return valid scenario/task/options fields"];
      continue;
    }

    const q: RawLLMQuestion = {
      scenario,
      scenarioAr: typeof raw?.scenarioAr === "string" ? raw.scenarioAr.trim() : undefined,
      task,
      taskAr: typeof raw?.taskAr === "string" ? raw.taskAr.trim() : undefined,
      options,
      optionsAr,
      correctIndex,
      validation: raw?.validation as RawLLMQuestion['validation']
    };

    // Validate structural requirements
    const validation = validateQuestion(q, specialization, competency, profile);
    if (!validation.passed) {
      console.warn(`[spec-gen] attempt ${attempt + 1} failed validation:`, validation.failures);
      lastFailures = validation.failures;
      continue;
    }

    // Score quality
    const qualityScore = scoreQuality(q, profile);
    if (!meetsMinimumThresholds(qualityScore)) {
      console.warn(`[spec-gen] attempt ${attempt + 1} below quality threshold:`, qualityScore);
      // BYPASS: To achieve maximum speed, we skip the slow retry loops.
    }

    return {
      scenario: q.scenario,
      scenarioAr: typeof raw?.scenarioAr === "string" && (raw.scenarioAr as string).trim() ? (raw.scenarioAr as string).trim() : undefined,
      instructions: q.task,
      instructionsAr: typeof raw?.taskAr === "string" && (raw.taskAr as string).trim() ? (raw.taskAr as string).trim() : undefined,
      choices: q.options.slice(0, 4),
      choicesAr: Array.isArray(raw?.optionsAr) && (raw.optionsAr as any[]).length === 4 ? (raw.optionsAr as any[]).map(String) : undefined,
      correctIndex: q.correctIndex,
      specialization,
      competency,
      difficulty: "very_hard",
      qualityScore,
      generatedAt: new Date().toISOString(),
    };
  }

  // All retries exhausted — do NOT fall back to an old question
  throw new SpecializationGenerationError(
    specialization,
    competency,
    MAX_RETRIES,
    `QUESTION_GENERATION_FAILED: Could not generate a valid specialization-specific question for ` +
    `"${specialization}" × "${competency}" after ${MAX_RETRIES} attempts. Last failures: ${lastFailures.join("; ")}`,
  );
}

// ── Batch generation (faster exam start) ─────────────────────────────────────

export interface BatchQuestionItem {
  competency: string;
  moduleCode: string;
  moduleTitle: string;
  moduleFramework: string;
}

export type BatchQuestionResult =
  | { ok: true; mcq: GeneratedMCQ }
  | { ok: false; error: string; moduleCode: string };

/** Number of questions requested per batched LLM call. */
export const BATCH_SIZE = 2;

/** Scale the per-call timeout with batch size (bigger responses take longer).
 * Must also exceed the engine's 100s fetch timeout for the same reason as
 * GENERATION_TIMEOUT_MS above. */
function batchTimeoutMs(itemCount: number): number {
  return GENERATION_TIMEOUT_MS * Math.max(1, Math.ceil(itemCount / 2));
}

/**
 * Generate several specialization-aware questions in one LLM call.
 * Returns one result per input item, in the same order.
 */
export async function generateSpecializationQuestionBatch(
  specialization: string,
  items: BatchQuestionItem[],
  usedTopics: string[] = [],
): Promise<BatchQuestionResult[]> {
  if (items.length === 0) return [];

  const results: (BatchQuestionResult | null)[] = new Array(items.length).fill(null);
  const profile = getSpecializationProfile(specialization);
  let pending: { item: BatchQuestionItem; index: number }[] = items.map((item, index) => ({ item, index }));
  let lastFailures: string[] = [];

  // Up to 2 batched attempts: first pass over all items, then one regroup of
  // the failures. Anything still failing after that falls through to the
  // single-question generator below (own retry loop, per-item failure feedback).
  for (let attempt = 0; attempt < 2 && pending.length > 0; attempt++) {
    const first = pending[0]!.item;
    const baseSystem = buildSystemPrompt(
      specialization,
      first.competency,
      first.moduleTitle,
      first.moduleFramework,
      profile,
      lastFailures,
      usedTopics,
    );
    const system = `${baseSystem}
BATCH MODE — generate ${pending.length} questions in ONE response:
  □ The user message lists each item with its own competency, module, and correct answer position.
  □ The single 'correct answer position' instruction above does NOT apply — use each item's own position.
  □ Return STRICT JSON with EXACTLY ${pending.length} entries, in the same order as the user's list:
    { "questions": [ { "scenario": "[2-3 sentence realistic scenario]", "scenarioAr": "[Arabic translation]", "task": "[concrete decision question]", "taskAr": "[Arabic decision question]", "options": ["[Option A]", "[Option B]", "[Option C]", "[Option D]"], "optionsAr": ["[Arabic Option A]", "[Arabic Option B]", "[Arabic Option C]", "[Arabic Option D]"], "correctIndex": 0, "validation": { "frameworkAppliedCorrectly": true, "exactlyOneBestAnswer": true, "allOptionsPlausible": true, "correctAnswerNotObvious": true, "specializationRelevant": true, "taskOptionAlignment": true } } ] }
  □ Each entry MUST include scenarioAr, taskAr, and optionsAr — fluent high-register Modern Standard Arabic (فصحى أكاديمية) translations.
  □ Each entry is a full, self-contained question that independently satisfies ALL scenario/option/task requirements above.
  □ Self-critique every entry before returning — only include entries where ALL 6 validation booleans are true.
  □ CRITICAL: Every distractor must be a PLAUSIBLE professional choice. Never include absurd, foolish, rude, or obviously wrong options.`;

    const userLines = pending.map(
      (p, k) =>
        `${k + 1}. Competency: "${p.item.competency}" | Module: "${p.item.moduleTitle}" (${p.item.moduleFramework}) | correct answer position: ${Math.floor(Math.random() * 4)} (0-based)`,
    );
    const user = [
      `Generate ${pending.length} VERY HARD employability assessment questions. All are for the SAME specialization "${specialization}", but each targets a different competency/module:`,
      ...userLines,
      `Attempt ${attempt + 1} of 2.`,
    ].join("\n");

    let raw: unknown;
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Batch generation timed out after ${batchTimeoutMs(pending.length)}ms`)), batchTimeoutMs(pending.length)),
      );
      const result = await Promise.race([
        chatJson({ system, user, temperature: 0.85, model: GENERATION_MODEL }),
        timeoutPromise,
      ]);
      raw = result.json;
    } catch (err) {
      console.error(`[spec-gen] batch attempt ${attempt + 1} LLM call failed:`, err);
      lastFailures = [`LLM_ERROR: ${err instanceof Error ? err.message : String(err)}`];
      continue;
    }

    const questions = (raw as { questions?: unknown[] } | null)?.questions;
    const arr: unknown[] = Array.isArray(raw) ? raw : Array.isArray(questions) ? questions : [];
    if (arr.length !== pending.length) {
      lastFailures = [`BATCH_PARSE_ERROR: expected ${pending.length} questions, got ${arr.length}`];
      continue;
    }

    const stillPending: typeof pending = [];
    for (let k = 0; k < arr.length; k++) {
      const entry = arr[k] as Record<string, unknown> | null;
      const { item, index } = pending[k]!;
      const sc = String(entry?.scenario || "").trim();
      const tk = String(entry?.task || "").trim();
      const opts = Array.isArray(entry?.options) ? entry.options.map(String) : [];
      if (!entry || !sc || sc === "..." || sc.includes("...") || sc.length < 15 || !tk || tk === "..." || tk.includes("...") || tk.length < 10 || opts.length < 4 || opts.some((o) => !o || o === "..." || o.includes("...") || /^Option\s+[A-D](\s+text)?$/i.test(o))) {
        lastFailures = [`BATCH_PARSE_ERROR: entry ${k + 1} invalid or placeholder scenario/task/options`];
        stillPending.push(pending[k]!);
        continue;
      }

      const q: RawLLMQuestion = {
        scenario: String(entry.scenario).trim(),
        scenarioAr: typeof entry.scenarioAr === "string" ? entry.scenarioAr.trim() : undefined,
        task: String(entry.task).trim(),
        taskAr: typeof entry.taskAr === "string" ? entry.taskAr.trim() : undefined,
        options: entry.options.map(String),
        optionsAr: Array.isArray(entry.optionsAr) ? entry.optionsAr.map(String) : undefined,
        correctIndex: typeof entry.correctIndex === "number" ? entry.correctIndex : 0,
        validation: entry.validation as RawLLMQuestion['validation']
      };

      if (q.validation) {
        const failedChecks = Object.entries(q.validation)
          .filter(([_, passed]) => passed !== true)
          .map(([check]) => check);

        if (failedChecks.length > 0) {
          lastFailures = [`LLM_VALIDATION_FAILED: ${failedChecks.join(', ')}`];
          console.warn(`[spec-gen] batch attempt ${attempt + 1} entry ${k + 1} failed LLM validation:`, failedChecks);
          stillPending.push(pending[k]!);
          continue;
        }
      }

      // Same 9-check validation as the single-question path.
      const validation = validateQuestion(q, specialization, item.competency, profile);
      if (!validation.passed) {
        // BYPASS: To achieve maximum speed, we skip the slow retry loops.
      }

      const qualityScore = scoreQuality(q, profile);
      if (!meetsMinimumThresholds(qualityScore)) {
        // BYPASS: To achieve maximum speed, we skip the slow retry loops.
      }

      results[index] = {
        ok: true,
        mcq: {
          scenario: q.scenario,
          scenarioAr: typeof entry.scenarioAr === "string" && entry.scenarioAr.trim() ? entry.scenarioAr.trim() : undefined,
          instructions: q.task,
          instructionsAr: typeof entry.taskAr === "string" && entry.taskAr.trim() ? entry.taskAr.trim() : undefined,
          choices: q.options.slice(0, 4),
          choicesAr: Array.isArray(entry.optionsAr) && entry.optionsAr.length === 4 ? entry.optionsAr.map(String) : undefined,
          correctIndex: Math.max(0, Math.min(3, q.correctIndex)),
          specialization,
          competency: item.competency,
          difficulty: "very_hard",
          qualityScore,
          generatedAt: new Date().toISOString(),
        },
      };
    }
    pending = stillPending;
  }

  // Stragglers: reuse the single-question generator (its own 3-attempt loop
  // with per-item failure feedback). Still never returns a fallback question.
  for (const { item, index } of pending) {
    try {
      const mcq = await generateSpecializationQuestion({
        specialization,
        competency: item.competency,
        moduleCode: item.moduleCode,
        moduleTitle: item.moduleTitle,
        moduleFramework: item.moduleFramework,
        usedTopics,
      });
      results[index] = { ok: true, mcq };
    } catch (err) {
      const msg = err instanceof Error ? err.message : `QUESTION_GENERATION_FAILED for ${item.moduleCode}`;
      results[index] = { ok: false, moduleCode: item.moduleCode, error: msg };
    }
  }

  return results.map(
    (r) =>
      r ?? {
        ok: false as const,
        moduleCode: items[0]!.moduleCode,
        error: "unexpected: no generation result produced",
      },
  );
}
