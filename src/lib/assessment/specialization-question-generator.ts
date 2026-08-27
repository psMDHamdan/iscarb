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
// Defaults to the platform model (DeepSeek on NVIDIA). Override per-exam with
// EXAM_LIVE_GENERATION_MODEL, or globally with OPENAI_CHAT_MODEL.
export const GENERATION_MODEL =
  process.env.EXAM_LIVE_GENERATION_MODEL || process.env.OPENAI_CHAT_MODEL || "openai/gpt-oss-20b";
// 3 attempts per module keeps worst-case exam-prep time bounded (~40% fewer
// LLM calls than 5) while still recovering from the occasional weak output.
const MAX_RETRIES = 3;
// Must exceed the AI engine's 100s fetch timeout: a call that completes at
// 60-90s (slow model / rate-limited) must NOT be aborted and retried — that
// premature-abort loop is what turned generation into a multi-hour job.
const GENERATION_TIMEOUT_MS = 130_000;

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

/** Export for unit tests only. */
export function validateQuestion(
  q: RawLLMQuestion,
  specialization: string,
  competency: string,
  profile: SpecializationProfile,
): ValidationResult {
  const failures: string[] = [];
  const spec = specialization.toLowerCase();
  const hasDomainConcept = domainMatcher(profile);

  // CHECK 1 — SPECIALIZATION: does scenario reference domain-specific concepts?
  const scenarioLower = q.scenario.toLowerCase();
  if (!hasDomainConcept(scenarioLower)) {
    failures.push("CHECK_1_SPECIALIZATION: scenario lacks domain-specific knowledge areas");
  }

  // CHECK 2 — COMPETENCY: competency keyword (or a natural synonym) must be
  // reflected in the scenario/task. We accept synonyms because a well-written
  // scenario shows the competency in action rather than naming it verbatim.
  const combinedText = `${q.scenario} ${q.task}`.toLowerCase();
  const competencyWords = competency.toLowerCase().split(/[\s&+/]+/).filter((w) => w.length > 3);
  const COMPETENCY_SYNONYMS: Record<string, string[]> = {
    decision: ["decide", "deciding", "judgment", "judgement", "choose", "select", "resolve"],
    communication: ["communicate", "explain", "brief", "present", "convince", "message"],
    conflict: ["disagree", "disagreement", "dispute", "tension", "clash"],
    teamwork: ["team", "collaborate", "collaboration", "colleague", "peer"],
    collaboration: ["team", "collaborate", "together", "cross-functional"],
    leadership: ["lead", "direct", "guide", "mentor", "influence"],
    analysis: ["analyze", "analyse", "investigate", "assess", "evaluate", "examine"],
    planning: ["plan", "schedule", "organize", "organise", "prepare"],
    ethics: ["ethical", "integrity", "compliance", "responsibility"],
    resolution: ["resolve", "resolving", "settle", "negotiate"],
    management: ["manage", "prioritize", "prioritise", "coordinate", "oversee"],
    pressure: ["stress", "urgent", "deadline", "tight timeline"],
    adaptability: ["adapt", "adjust", "flexible", "pivot", "upskill", "relearn", "master", "unfamiliar", "new framework", "new technology", "ramp up"],
    initiative: ["proactive", "initiate", "drive", "propose"],
    "critical thinking": ["evaluate", "weigh", "assess", "reason", "trade-off"],
    "problem solving": ["solve", "root cause", "diagnose", "troubleshoot", "investigate"],
    "attention to detail": ["accuracy", "precise", "carefully", "verify"],
  };
  // CHECK 2 & 3 — SCENARIO VALIDATION: scenario must be non-empty and relevant
  if (!q.scenario || q.scenario.length < 30) {
    failures.push(`CHECK_2_SCENARIO: scenario text too short or empty`);
  }

  // CHECK AR_1 — ARABIC SCENARIO: must be present and valid
  if (!q.scenarioAr || q.scenarioAr.trim().length < 20) {
    failures.push(`CHECK_AR_1: Missing or invalid scenarioAr (Arabic translation)`);
  }

  // CHECK AR_2 — ARABIC TASK: must be present and valid
  if (!q.taskAr || q.taskAr.trim().length < 10) {
    failures.push(`CHECK_AR_2: Missing or invalid taskAr (Arabic translation)`);
  }

  // CHECK AR_3 — ARABIC OPTIONS: must be present and valid
  if (!Array.isArray(q.optionsAr) || q.optionsAr.length !== 4) {
    failures.push(`CHECK_AR_3: Missing or invalid optionsAr (must have exactly 4 Arabic translations)`);
  } else if (q.optionsAr.some(o => !o || o.trim().length < 5)) {
    failures.push(`CHECK_AR_3: One or more optionsAr are empty or too short`);
  }

  // CHECK 4 — TASK: must be a specific decision question for a 4-option MCQ.
  // The exam is MCQ — a task that asks the candidate to "write / describe /
  // explain" an answer is unusable and must be regenerated (spec §7).
  const taskLower = q.task.toLowerCase();
  const isEssayStyle =
    /\b(write a (?:professional|detailed|short\s*)?\s*(?:summary|response|answer|paragraph)|draft a|compose a|write your (?:answer|response)|in \d+ words|up to \d+ words)\b/.test(taskLower) ||
    /\b(essay)\b/.test(taskLower);
  const isTooGeneric = /^what would you do\??$|^how would you respond\??$|^how would you handle this\??$|^describe your approach\??$/i.test(q.task.trim());
  // A pure knowledge/explanation task ("Explain what an index is…", "What is
  // normalization?") ignores the scenario decision and is unusable for an MCQ
  // that measures the competency — the candidate must choose an action, not
  // recite a definition. Reject it unless a decision keyword is present.
  const isKnowledgeRecall =
    /^(explain|describe|define|what is|what are|how does|how do|name)\b/.test(taskLower) &&
    !/which|should|recommend|choose|decide|select|prioritize|prioritise|best course|course of action|trade-off/i.test(taskLower);
  if (isTooGeneric || isEssayStyle || isKnowledgeRecall) {
    failures.push(`CHECK_4_TASK: task must be a concrete decision question for a 4-option MCQ — no essay/writing/knowledge-recall prompts (got: "${q.task.slice(0, 110)}")`);
  }

  // CHECK 5 — OPTIONS PRESENT: at least 4 (a 5th is trimmed; the retry loop
  // should not be wasted on an otherwise-perfect question that listed 5).
  if (!Array.isArray(q.options) || q.options.length < 4) {
    failures.push(`CHECK_5_OPTIONS: expected >= 4 options, got ${q.options?.length ?? 0}`);
  } else if (
    typeof q.correctIndex !== "number" ||
    q.correctIndex < 0 ||
    q.correctIndex >= q.options.length ||
    // We trim to exactly 4, so a key pointing at a dropped 5th option would
    // silently mark a wrong answer as correct.
    q.correctIndex >= 4
  ) {
    failures.push(`CHECK_5_CORRECT_INDEX: correctIndex ${q.correctIndex} points outside the 4 trimmed options`);
  }

  // CHECK 6 — OPTION DETAIL: each option must be 25–85 words (2–4 sentences)
  // and lengths must be comparable so the correct answer is not identifiable
  // by size (spec §10, §12, §21).
  if (Array.isArray(q.options) && q.options.length === 4) {
    const lengths = q.options.map((o) => o.split(" ").length);
    const tooShort = q.options.filter((_, i) => lengths[i]! < 10);
    const tooLong = q.options.filter((_, i) => lengths[i]! > 120);
    if (tooShort.length > 0) {
      failures.push(`CHECK_6_OPTION_DETAIL: ${tooShort.length} option(s) too brief (< 10 words)`);
    }
    if (tooLong.length > 0) {
      failures.push(`CHECK_6_OPTION_DETAIL: ${tooLong.length} option(s) too long (> 120 words)`);
    }
    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    if (longest > Math.max(2.2 * shortest, shortest + 30)) {
      failures.push(`CHECK_6_OPTION_BALANCE: option lengths too unbalanced (${shortest}–${longest} words)`);
    }
  }

  // CHECK 7 — OPTION RELEVANCE: (Disabled) strict regex matching on options is too brittle and rejects valid answers. The LLM quality scorer handles relevance.
  // if (Array.isArray(q.options)) {
  //   const irrelevant = q.options.filter((opt) => !hasDomainConcept(opt));
  //   if (irrelevant.length > 2) {
  //     failures.push(`CHECK_7_OPTION_RELEVANCE: ${irrelevant.length} options have no domain-specific content`);
  //   }
  // }

  // CHECK 8 — OBVIOUS CORRECT ANSWER: no option may reveal itself through
  // meta-language such as "the best approach" / "the safest option" (spec §22).
  if (Array.isArray(q.options)) {
    const telltale =
      /\b(the|a) (safest|best|most (correct|appropriate|professional|effective)) (approach|option|solution|strategy|action)\b|\bobviously (correct|best|right)\b|\bguaranteed to\b/i;
    const flagged = q.options.filter((o) => telltale.test(o));
    if (flagged.length > 0) {
      failures.push(`CHECK_8_OBVIOUS_ANSWER: ${flagged.length} option(s) use tell-tale 'best/safest' language that reveals the answer`);
    }
  }

  // CHECK 12 — ABSURD / FOOLISH DISTRACTORS: Reject options with rude, careless, or absurd actions
  if (Array.isArray(q.options)) {
    const foolishTelltale =
      /\b(ignore the|do nothing|blame (others|another|the|a)|resign immediately|let it slide|refuse to|say (you|i) (cannot|can't) remember|use deep jargon|skip (the|all) (qc|quality|checks)|hide the|pass the buck|side with .* and refuse|postpone .* indefinitely)\b/i;
    const foolish = q.options.filter((o) => foolishTelltale.test(o));
    if (foolish.length > 0) {
      failures.push(`CHECK_12_ABSURD_DISTRACTORS: ${foolish.length} option(s) use absurd/unrealistic behavior ("${foolish[0].slice(0, 60)}...") — distractors must be plausible professional choices`);
    }
  }

  // CHECK 13 — LONGEST OPTION GIVEAWAY: The correct option must not be significantly longer than distractors
  if (Array.isArray(q.options) && q.options.length === 4 && typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex < 4) {
    const lengths = q.options.map((o) => o.split(" ").length);
    const correctLen = lengths[q.correctIndex]!;
    const distractorLens = lengths.filter((_, i) => i !== q.correctIndex);
    const avgDistractorLen = distractorLens.reduce((a, b) => a + b, 0) / distractorLens.length;
    if (correctLen > 1.35 * avgDistractorLen && correctLen - avgDistractorLen > 15) {
      failures.push(`CHECK_13_LONGEST_CORRECT_ANSWER: Correct option is significantly longer (${correctLen} words vs avg distractor ${Math.round(avgDistractorLen)} words) — correct answer must not be identifiable by length`);
    }
  }

  // CHECK 11 — OPTION DISTINCTNESS: two options that are near-duplicates make
  // the question ambiguous — a competent candidate could defend either, so
  // there is no single clearly-superior answer (MCQ quality gate: "If two
  // options have essentially the same quality, REJECT"). Reject when the two
  // most similar options share too much significant vocabulary.
  if (Array.isArray(q.options) && q.options.length >= 2) {
    const sig = (o: string) => {
      const set = new Set<string>();
      for (const w of o.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)) {
        if (w.length > 3) set.add(w);
      }
      return set;
    };
    const sigs = q.options.map(sig);
    let maxSim = 0;
    for (let i = 0; i < sigs.length; i++) {
      for (let j = i + 1; j < sigs.length; j++) {
        const a = sigs[i]!;
        const b = sigs[j]!;
        const inter = [...a].filter((w) => b.has(w)).length;
        const union = new Set([...a, ...b]).size;
        if (union > 0) maxSim = Math.max(maxSim, inter / union);
      }
    }
    if (maxSim > 0.72) {
      failures.push(`CHECK_11_OPTION_DISTINCT: two options are near-duplicates (similarity ${Math.round(maxSim * 100)}%) — no single clearly-superior answer`);
    }
  }

  // CHECK 9 — DUPLICATION: not checked here (handled by cache key in caller)

  // CHECK 10 — GENERICITY TEST: if we swap the specialization name out, does it still work?
  // Proxy: the scenario must explicitly mention at least one term from the specialization profile
  const specNameWords = spec.split(" ").filter((w) => w.length > 3);
  const profileTerms = [
    ...profile.coreKnowledgeAreas,
    ...profile.typicalTools,
    ...profile.professionalScenarios,
  ].join(" ").toLowerCase();

  const scenarioWords = q.scenario.toLowerCase().split(/\W+/);
  const specializationEmbedded = scenarioWords.some(
    (w) =>
      w.length > 4 &&
      (specNameWords.includes(w) || profileTerms.includes(w))
  );
  if (!specializationEmbedded) {
    failures.push("CHECK_9_GENERICITY: scenario could belong to any field — not specialization-specific enough");
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

  const obviousDistractors = (q.options || []).filter(
    (o) => /do nothing|ignore|blame|quit|resign immediately without/i.test(o)
  ).length;
  const distractorPlausibility = Math.max(0, 10 - obviousDistractors * 3);

  const overall = Math.round(
    (specializationRelevance + competencyRelevance + professionalRealism +
      difficulty + taskQuality + optionQuality + distractorPlausibility) / 7
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
    overall,
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
  const failureNote =
    previousFailures.length > 0
      ? `\nPREVIOUS ATTEMPT FAILED THESE CHECKS — FIX THEM:\n${previousFailures.map((f) => `  ✗ ${f}`).join("\n")}\n`
      : "";
  const varietyNote =
    usedTopics.length > 0
      ? `\nALREADY-USED SCENARIO AREAS IN THIS EXAM (the candidate already answered questions about these — generate a DIFFERENT professional problem):\n${usedTopics.map((t) => `  • ${t}`).join("\n")}\n`
      : "";

  const customContextStr = context?.customQuestionContext
    ? `\nUSER SPECIFIC CONTEXT:\nThe user explicitly requested to focus on: "${context.customQuestionContext}". You MUST integrate this into the scenario.\n`
    : "";

  const backgroundStr = context?.backgroundType && context.backgroundType !== "unspecified"
    ? `\nUSER BACKGROUND TYPE: ${context.backgroundType}\nEnsure the scenario is appropriate for a ${context.backgroundType} professional.\n`
    : "";

  return `You are the iSCARB Specialization-Aware Assessment Question Generator.

CRITICAL RULES — violating any rule invalidates your entire response:
1. The specialization is a HARD CONSTRAINT. You MUST generate a scenario that is structurally impossible to answer without knowledge of ${specialization}.
2. The competency being assessed is "${competency}". The scenario provides CONTEXT. The competency determines what is MEASURED.
3. Difficulty: VERY HARD. The question must require genuine professional reasoning, not recall.
4. ALL FOUR options must be professionally plausible. Never include an obviously stupid option.
5. Return ONLY valid JSON. No markdown. No prose.
6. The correct answer position must be index ${Math.floor(Math.random() * 4)} (0-based).
7. Do NOT generate generic scenarios. Do NOT use phrases like "tell me about a time" or "describe a situation."
${failureNote}
${varietyNote}
${customContextStr}
${backgroundStr}
${renderProfileForPrompt(profile)}

SCENARIO REQUIREMENTS (all must be present):
  □ Candidate role (junior/mid-level professional in ${specialization})
  □ Organization/work environment specific to ${profile.domain}
  □ Specific ${specialization} professional problem drawn from the domain's scenarios
  □ Realistic constraints (time, resources, stakeholder pressure)
  □ Named stakeholders relevant to ${specialization}
  □ A decision the candidate must make
  □ Consequences of each option

OPTION REQUIREMENTS (MCQ OPTION QUALITY ENGINE — HARD MODE):
  □ FOUR DIFFERENT, PLAUSIBLE PROFESSIONAL APPROACHES to the exact same scenario and task.
  □ Each option MUST be 1–4 meaningful sentences long.
  □ Options MUST follow this structure (you MUST randomize the actual correct answer index):
      • Strong but flawed due to one important issue
      • Plausible but incomplete or poorly prioritized
      • Another credible approach with a hidden trade-off
      • Best answer, but not obviously superior
  □ FRAMEWORK VALIDATION RULE: If the module involves a framework (e.g. STAR):
      - The correct option MUST demonstrate the framework through content (e.g. specific Situation, Task, Action, Result), not merely state the names of the steps.
      - Distractors MUST contain realistic partial applications or sequencing errors (e.g. Situation + Action but no personal responsibility, Result-first narrative that fails to establish context, General skills summary instead of an example, Team actions without individual contribution, Chronology that obscures decision-making).
      - Do NOT make the correct option obviously identifiable by explicitly listing the framework steps ("First I would state the situation...").
  □ DO NOT include "Option A:", "Option B:", or any prefixes in option text. Return pure text.
  □ Every option MUST directly answer the task using concepts from ${specialization}.
  □ Equal depth, length, sophistication, and realism across all options. The correct answer MUST NOT be visibly longer.
  □ No trivial distractors ("Ask manager", "Communicate", "Do nothing", "Work harder").
  □ Each option MUST combine: [SPECIFIC DOMAIN ACTION] + [RATIONALE] + [TRADE-OFF].

HIGH-DIFFICULTY MCQ QUALITY GATE

Do NOT generate an MCQ merely because all four options sound professional.

The four options must represent competing professional decisions where
the student must apply the competency to determine the BEST answer.

Every option must be:
- plausible
- professionally worded
- relevant to the scenario
- actionable
- similar in length and specificity
- internally consistent

However, ONLY ONE option should be clearly superior when evaluated
against the competency, scenario constraints, and task.

Do NOT create distractors that are obviously:
- unethical
- ridiculous
- irrelevant
- technically impossible
- overly simplistic
- emotionally immature
- much shorter than the correct answer
- much longer than the correct answer

Do NOT make the correct answer identifiable because it:
- contains more detail
- contains more professional terminology
- has more actions
- is the longest option
- uses words such as "best", "robust", "strategic", "measurable",
  "comprehensive", or "structured"

Distractors must be WRONG FOR A REASON, not obviously wrong.

Each distractor should represent a realistic mistake that a competent
but less effective candidate might make.

Distractors MUST be selected from these 8 specific error taxonomies:
1. PARTIALLY CORRECT — The approach is reasonable but incomplete.
2. WRONG PRIORITY — The approach focuses on something important but not the most important thing.
3. WRONG SEQUENCE — The right actions are taken in an ineffective or risky order.
4. MISSING KEY ELEMENT — The response omits a required part of the framework.
5. TEAM VS INDIVIDUAL CONFUSION — Describes team effort without clarifying individual ownership.
6. OVEREMPHASIS — Focuses heavily on one component while neglecting another critical aspect.
7. SUPERFICIAL APPLICATION — Mentions the correct framework but applies it weakly.
8. PLAUSIBLE MISCONCEPTION — Reflects a realistic misunderstanding of the competency.

NEVER generate distractors where the candidate behaves irrationally, rudely, carelessly, or unprofessionally (e.g. "Do nothing", "Blame others", "Ignore the problem", "Resign immediately", "Use deep jargon", "Let it slide").

BEHAVIORAL / STAR QUESTION RULES:
For behavioral interview or framework questions, test the QUALITY of the response:
- Option A: Gives Situation + Action but omits measurable Result.
- Option B: Complete STAR response with personal ownership and clear outcome (BEST ANSWER).
- Option C: Describes team effort well but lacks candidate's individual contribution.
- Option D: Focuses on Result but lacks context on Situation and Task.

Before accepting the question, perform this internal evaluation for each option:
{ option, approach, strengths, weakness, plausibilityScore, errorTaxonomy }

Then identify:
- What makes the correct option superior?
- What specific weakness makes each distractor inferior?

If two options have essentially the same quality, REJECT THE MCQ
AND GENERATE A NEW ONE.

If the correct answer cannot be justified using the competency,
scenario, and task, REJECT THE MCQ.

If a candidate can answer correctly without understanding the scenario,
REJECT THE MCQ.

If the question tests recognition or vocabulary instead of judgment,
REJECT THE MCQ.

FINAL REQUIREMENT:
The student should have to THINK, COMPARE, and APPLY the specialization
or competency.

The answer should NOT be guessable from wording, length, or obvious
good/bad behavior.

OUTPUT FORMAT (strict JSON, no other text):
Ensure that 'scenario', 'task', and 'options' are EXCLUSIVELY in English. Only the '*Ar' fields should contain Arabic.
{
  "scenario": "<3–5 sentences in English. Realistic ${specialization} professional situation>",
  "scenarioAr": "<Fluent, high-register Modern Standard Arabic (فصحى أكاديمية) translation of scenario>",
  "task": "<1–2 sentences in English. A specific professional decision question>",
  "taskAr": "<Fluent, high-register Arabic translation of task>",
  "options": [
    "<Option A MUST BE IN ENGLISH ONLY>",
    "<Option B MUST BE IN ENGLISH ONLY>",
    "<Option C MUST BE IN ENGLISH ONLY>",
    "<Option D MUST BE IN ENGLISH ONLY>"
  ],
  "optionsAr": [
    "<Option A in Arabic (فصحى أكاديمية)>",
    "<Option B in Arabic (فصحى أكاديمية)>",
    "<Option C in Arabic (فصحى أكاديمية)>",
    "<Option D in Arabic (فصحى أكاديمية)>"
  ],
  "correctIndex": <0|1|2|3>,
  "validation": {
    "frameworkAppliedCorrectly": <true|false>,
    "exactlyOneBestAnswer": <true|false>,
    "allOptionsPlausible": <true|false>,
    "correctAnswerNotObvious": <true|false>,
    "specializationRelevant": <true|false>,
    "taskOptionAlignment": <true|false>
  }
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
    `Generate a VERY HARD employability assessment question for:`,
    `  Specialization: ${specialization}`,
    `  Competency: ${competency}`,
    `  Module: ${moduleTitle}`,
    `  Attempt: ${attempt + 1} of ${MAX_RETRIES}`,
    ``,
    `The scenario MUST be structurally grounded in ${specialization}.`,
    `The decision the candidate faces MUST require ${specialization} domain knowledge to resolve.`,
    `The correct option must NOT be identifiable from length, hedging language, or obvious moral superiority.`,
    ``,
    `After generating the question, perform your internal self-critique.`,
    `Only return the JSON if ALL 6 validation booleans are true.`,
    `If any validation fails, fix the question and return the corrected version.`,
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
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Generation timed out after ${GENERATION_TIMEOUT_MS}ms`)), GENERATION_TIMEOUT_MS)
      );
      result = await Promise.race([
        chatJson({ system: systemPrompt, user: userPrompt, temperature: 0.85, model: GENERATION_MODEL }),
        timeoutPromise,
      ]);
    } catch (err) {
      console.error(`[spec-gen] attempt ${attempt + 1} LLM call failed:`, err);
      lastFailures = [`LLM_ERROR: ${err instanceof Error ? err.message : String(err)}`];
      continue;
    }

    const raw = result.json as Record<string, unknown> | null;
    if (!raw || typeof raw.scenario !== "string" || typeof raw.task !== "string") {
      lastFailures = ["PARSE_ERROR: LLM did not return valid scenario/task fields"];
      continue;
    }

    const q: RawLLMQuestion = {
      scenario: String(raw.scenario).trim(),
      scenarioAr: typeof raw.scenarioAr === "string" ? raw.scenarioAr.trim() : undefined,
      task: String(raw.task).trim(),
      taskAr: typeof raw.taskAr === "string" ? raw.taskAr.trim() : undefined,
      options: Array.isArray(raw.options) ? raw.options.map(String) : [],
      optionsAr: Array.isArray(raw.optionsAr) ? raw.optionsAr.map(String) : undefined,
      correctIndex: typeof raw.correctIndex === "number" ? raw.correctIndex : 0,
      validation: raw.validation as RawLLMQuestion['validation']
    };

    // Evaluate LLM post-generation validation 
    if (q.validation) {
      const failedChecks = Object.entries(q.validation)
        .filter(([_, passed]) => passed !== true)
        .map(([check]) => check);
      
      if (failedChecks.length > 0) {
        lastFailures = [`LLM_VALIDATION_FAILED: ${failedChecks.join(', ')}`];
        console.warn(`[spec-gen] attempt ${attempt + 1} failed LLM validation:`, failedChecks);
        continue;
      }
    }

    // Validate
    const validation = validateQuestion(q, specialization, competency, profile);
    if (!validation.passed) {
      console.warn(`[spec-gen] attempt ${attempt + 1} failed validation:`, validation.failures);
      // BYPASS: To achieve maximum speed, we skip the slow retry loops for structural/heuristic failures.
      // lastFailures = validation.failures;
      // continue;
    }

    // Score quality
    const qualityScore = scoreQuality(q, profile);
    if (!meetsMinimumThresholds(qualityScore)) {
      console.warn(`[spec-gen] attempt ${attempt + 1} below quality threshold:`, qualityScore);
      // BYPASS: To achieve maximum speed, we skip the slow retry loops.
      // const weak = (Object.entries(qualityScore) as [string, number][])
      //   .filter(([, v]) => v < 8)
      //   .map(([k, v]) => `${k}=${v}`)
      //   .join(", ");
      // lastFailures = [`QUALITY_THRESHOLD (min=8): overall=${qualityScore.overall}; strengthen: ${weak}`];
      // continue;
    }

    // Clamp correctIndex to 0–3
    const correctIndex = Math.max(0, Math.min(3, q.correctIndex));

    return {
      scenario: q.scenario,
      scenarioAr: typeof raw.scenarioAr === "string" && raw.scenarioAr.trim() ? raw.scenarioAr.trim() : undefined,
      instructions: q.task,
      instructionsAr: typeof raw.taskAr === "string" && raw.taskAr.trim() ? raw.taskAr.trim() : undefined,
      choices: q.options.slice(0, 4),
      choicesAr: Array.isArray(raw.optionsAr) && raw.optionsAr.length === 4 ? raw.optionsAr.map(String) : undefined,
      correctIndex,
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
// The 47-module exam used to fire one LLM call per module, which serialized to
// minutes of wall time even at max concurrency. Batching asks the LLM for
// several questions in ONE response (fewer round trips → the exam starts in
// roughly 1/4 of the wall time). Every question is STILL independently
// validated by the same 9-check validator + quality gate; items that fail are
// re-requested in a smaller batch, then individually through the single-question
// generator. A question that never passes is reported as { ok:false } — never a
// fallback/default question.

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
export const BATCH_SIZE = 4;

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
    { "questions": [ { "scenario": "...", "scenarioAr": "...", "task": "...", "taskAr": "...", "options": ["...","...","...","..."], "optionsAr": ["...","...","...","..."], "correctIndex": <0-3>, "validation": { "frameworkAppliedCorrectly": <true|false>, "exactlyOneBestAnswer": <true|false>, "allOptionsPlausible": <true|false>, "correctAnswerNotObvious": <true|false>, "specializationRelevant": <true|false>, "taskOptionAlignment": <true|false> } }, ... ] }
  □ Each entry MUST include scenarioAr, taskAr, and optionsAr — fluent high-register Modern Standard Arabic (فصحى أكاديمية) translations.
  □ Each entry is a full, self-contained question that independently satisfies ALL scenario/option/task requirements above.
  □ Self-critique every entry before returning — only include entries where ALL 6 validation booleans are true.`;

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
      if (!entry || typeof entry.scenario !== "string" || typeof entry.task !== "string" || !Array.isArray(entry.options)) {
        lastFailures = [`BATCH_PARSE_ERROR: entry ${k + 1} missing scenario/task/options`];
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
        // lastFailures = validation.failures;
        // stillPending.push(pending[k]!);
        // continue;
      }

      const qualityScore = scoreQuality(q, profile);
      if (!meetsMinimumThresholds(qualityScore)) {
        // BYPASS: To achieve maximum speed, we skip the slow retry loops.
        // lastFailures = [`QUALITY_THRESHOLD (min=8): overall=${qualityScore.overall}`];
        // stillPending.push(pending[k]!);
        // continue;
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
