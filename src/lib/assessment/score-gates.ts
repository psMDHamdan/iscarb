/**
 * Pre-score gates for the 4D employability free-text path.
 * Run BEFORE rubric scoring. If a gate fails, return the gate-failure result
 * instead of a normal score.
 *
 * PURITY: framework-only imports (safe for heuristic + engine).
 */

import type {
  AssessmentModuleSpec,
  CriterionScore,
  RubricCriterion,
  ScoredResponse,
} from "./framework";
import { bandFor, clamp, isPass, round1 } from "./framework";

export const GATE1_FEEDBACK =
  "No substantive answer was provided — the response does not address the task.";

export const GATE2_FEEDBACK =
  "This is a template with unfilled placeholders / not a completed first-person answer, so it cannot be scored as genuine work.";

export const GATE1_SCORE_MAX = 10;
export const GATE2_SCORE_CAP = 40;

const META_DISCLAIMERS = [
  /i don'?t have (any )?personal experience/i,
  /i have no (personal )?experience/i,
  /here'?s a (sample|template|example) (you can|to) adapt/i,
  /feel free to (adapt|customize|modify)/i,
  /replace (the )?(placeholders?|brackets?)/i,
  /this is (just )?(a )?(sample|template|example)/i,
  /as an ai (language )?model/i,
  /i cannot (speak|write) (from|in) (the )?first[- ]person/i,
];

/** Bracketed placeholders like [field], [X], [Your Name], [role/title]. */
const PLACEHOLDER_RE = /\[[^\]\n]{1,40}\]/g;

function wordCount(text: string): number {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

function terms(text: string): string[] {
  const STOP = new Set([
    "the", "a", "an", "and", "or", "but", "if", "then", "so", "to", "of", "in",
    "on", "for", "with", "as", "at", "by", "from", "is", "are", "was", "were",
    "be", "been", "being", "it", "its", "this", "that", "these", "those", "i",
    "you", "he", "she", "we", "they", "them", "my", "your", "our", "their",
    "would", "should", "could", "will", "shall", "can", "may", "do", "does",
    "did", "have", "has", "had", "not", "no", "yes", "about", "into", "over",
    "than", "too", "very", "just", "also", "any", "all", "more", "most", "some",
  ]);
  const raw = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP.has(w));
  return [...new Set(raw)];
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Collapse whitespace / decorative separators for paste / containment checks. */
function normalizeForCompare(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[\u2500-\u257F═─━┄┅┈┉]+/g, " ") // box-drawing / rule lines
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokens that look like "no vowels" but are normal in professional answers
 * (years, %, section markers, short acronyms) — must NOT trip gibberish gate.
 */
function isIgnorableNoVowelToken(raw: string): boolean {
  const w = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  if (!w || w.length <= 3) return true;
  // Pure numbers / years: 2030, 100, 92
  if (/^\d{2,}$/.test(w)) return true;
  // Percentages / ratios glued to punctuation: 100%, >5%), 0.01
  if (/^\d+(\.\d+)?%?$/.test(w)) return true;
  // Week ranges / section labels: 1-2:, 5-8, 9-12
  if (/^\d{1,2}[-–]\d{1,2}:?$/.test(w)) return true;
  // Possessive years: 2030's
  if (/^\d{4}'?s$/i.test(w)) return true;
  // Decorative-only tokens
  if (/^[\u2500-\u257F═─━┄┅┈┉]+$/.test(raw)) return true;
  // Short ALL-CAPS acronyms common in answers: FPR, KPI, ESG, DMAIC (has vowels)
  if (/^[A-Z]{2,6}$/.test(w) && w === w.toUpperCase()) return true;
  return false;
}

/** Keyboard-mash / nonsense tokens only (not formatting noise). */
function gibberishNoVowelTokens(text: string): string[] {
  return text.split(/\s+/).filter((raw) => {
    if (isIgnorableNoVowelToken(raw)) return false;
    const w = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (w.length <= 3) return false;
    // Must be letter-heavy mash (asdfghjkl), not numbers/symbols
    if (!/^[\p{L}]+$/u.test(w)) return false;
    if (/[aeiouy]/i.test(w) || /[\u0600-\u06FF]/.test(w)) return false;
    return true;
  });
}

function zeroCriteria(module: AssessmentModuleSpec): CriterionScore[] {
  return module.rubric.map((c) => ({
    criterion: c.criterion,
    weight: c.weight,
    score: 0,
    max: c.weight,
  }));
}

function flatCriteria(module: AssessmentModuleSpec, overall: number): CriterionScore[] {
  return module.rubric.map((c) => ({
    criterion: c.criterion,
    weight: c.weight,
    score: round1((overall / 100) * c.weight),
    max: c.weight,
  }));
}

export type PreScoreGatePass = { ok: true };
export type PreScoreGateFail = {
  ok: false;
  gate: 1 | 2;
  result: ScoredResponse;
};

export type PreScoreGateOutcome = PreScoreGatePass | PreScoreGateFail;

/**
 * MCQ selections are deliberate option text to be rubric-scored — not free-text
 * essays. Detect via questionType or a provided choices list (same heuristic as AssessmentView).
 */
export function isMcqModule(module: AssessmentModuleSpec): boolean {
  const qt = (module.questionType || "").toLowerCase().trim();
  if (qt === "mcq" || qt === "multiple_choice" || qt === "multiple-choice") return true;
  return Array.isArray(module.choices) && module.choices.length >= 2;
}

/**
 * GATE 1 — Non-answer: empty, prompt copy-back, or no original task engagement.
 * Skipped for MCQ (except empty): option text is short, jargon-heavy, and often
 * shares no scenario vocabulary — the zero-overlap clause would falsely zero it.
 */
export function isNonAnswer(module: AssessmentModuleSpec, response: string): boolean {
  const text = (response || "").trim();
  if (!text) return true;
  // MCQ: only empty fails Gate 1; content proceeds to AI rubric scoring.
  if (isMcqModule(module)) return false;
  if (wordCount(text) < 8) return true;

  const respNorm = normalizeForCompare(text);
  const scenarioNorm = normalizeForCompare(module.scenario || "");
  const instructionsNorm = normalizeForCompare(module.instructions || "");
  const taskNorm = normalizeForCompare(`${module.scenario}\n${module.instructions}`);

  // Pasted scenario and/or instructions only (or answer is almost entirely the prompt).
  if (scenarioNorm.length >= 40 && respNorm === scenarioNorm) return true;
  if (instructionsNorm.length >= 40 && respNorm === instructionsNorm) return true;
  if (taskNorm.length >= 40 && respNorm === taskNorm) return true;
  if (scenarioNorm.length >= 80 && respNorm.includes(scenarioNorm) && respNorm.length <= scenarioNorm.length * 1.35) {
    return true;
  }
  if (
    instructionsNorm.length >= 80 &&
    respNorm.includes(instructionsNorm) &&
    respNorm.length <= instructionsNorm.length * 1.35
  ) {
    return true;
  }
  // Scenario + short "Task" / instructions stub (common paste pattern).
  if (
    scenarioNorm.length >= 80 &&
    respNorm.startsWith(scenarioNorm) &&
    respNorm.length <= scenarioNorm.length + 40
  ) {
    return true;
  }

  const respTerms = new Set(terms(text));
  if (respTerms.size === 0) return true;

  const taskText = `${module.scenario}\n${module.instructions}`;
  const taskTerms = new Set(terms(taskText));
  const scenarioTerms = new Set(terms(module.scenario || ""));
  const overlap = jaccard(respTerms, taskTerms);
  const scenarioOverlap = jaccard(respTerms, scenarioTerms);

  // Near-copy of the task prompt with little extra content.
  // Only treat high overlap as paste when the answer is NOT much longer than the task
  // (legit answers naturally reuse scenario vocabulary).
  const respWc = wordCount(text);
  const taskWc = wordCount(taskText);
  if (overlap >= 0.72 && respWc <= taskWc * 1.25) return true;
  if (overlap >= 0.9 && respWc <= taskWc * 1.5) return true;
  // Scenario-only paste often has lower full-task overlap but very high scenario overlap.
  if (scenarioOverlap >= 0.78 && respWc <= Math.max(wordCount(module.scenario), 1) * 1.4) {
    return true;
  }

  // Almost entirely task vocabulary — no original decision language.
  const original = [...respTerms].filter((t) => !taskTerms.has(t));
  if (respWc >= 8 && respWc <= taskWc * 1.5 && original.length <= 2 && overlap >= 0.55) {
    return true;
  }

  // Gibberish — ignore years, %, rule lines, week ranges, short acronyms.
  const mash = gibberishNoVowelTokens(text);
  if (mash.length >= 2 || (respWc < 15 && mash.length >= 1)) return true;

  // Minimum task relevance: if response has 8–30 words but shares NO vocabulary
  // with the module scenario or instructions, treat it as non-answer (random typing).
  if (respWc >= 8 && respWc <= 30) {
    const taskTerms = new Set(terms(`${module.scenario} ${module.instructions}`));
    const respTermSet = new Set(terms(text));
    const shared = [...respTermSet].filter(t => taskTerms.has(t)).length;
    // Allow some shared terms (context words), but if ZERO overlap it's random
    if (shared === 0 && respTerms.size >= 3) return true;
  }

  // Keyboard mash / runaway repeats — only on letters/digits (not ═══════ rules).
  const alnumOnly = text.replace(/[^\p{L}\p{N}]+/gu, "");
  if (/(.)\1{4,}/u.test(alnumOnly)) return true;

  // Extremely long single word without spaces
  if (text.length > 30 && respWc === 1 && !/^https?:\/\//.test(text)) return true;

  return false;
}

/**
 * GATE 2 — Placeholder / template / meta-disclaimer (not genuine completed work).
 */
export function isPlaceholderTemplate(response: string): boolean {
  const text = (response || "").trim();
  if (!text) return false;

  const placeholders = text.match(PLACEHOLDER_RE) || [];
  if (placeholders.length >= 2) return true;
  // Single obvious unfilled slot plus template tone.
  const firstPlaceholder = placeholders[0];
  if (firstPlaceholder) {
    const inner = firstPlaceholder.slice(1, -1).toLowerCase();
    if (
      /^(x|y|z|n|name|field|role|title|company|date|your .+|insert .+|todo|tbd)$/i.test(
        inner,
      ) ||
      inner.includes("/") ||
      inner.includes("…") ||
      inner.includes("...")
    ) {
      return true;
    }
  }

  for (const re of META_DISCLAIMERS) {
    if (re.test(text)) return true;
  }

  // Unfilled markdown-style blanks: ______ or {{var}}
  if (/_{3,}/.test(text) || /\{\{[^{}]+\}\}/.test(text)) return true;

  return false;
}

function gateFailureResult(
  module: AssessmentModuleSpec,
  gate: 1 | 2,
  score: number,
  feedback: string,
): ScoredResponse {
  const overall = round1(clamp(score, 0, gate === 1 ? GATE1_SCORE_MAX : GATE2_SCORE_CAP));
  return {
    moduleCode: module.code,
    dimension: module.dimension,
    score: overall,
    band: bandFor(overall).id,
    passed: isPass(overall, module.passThreshold),
    perCriterion: gate === 1 ? zeroCriteria(module) : flatCriteria(module, overall),
    feedback,
    // Do not invent rubric strengths/weaknesses for absent/template content.
    strengths: ["—"],
    improvements:
      gate === 1
        ? ["Write an original answer that directly addresses the scenario and task."]
        : [
          "Replace placeholders with concrete decisions and write a completed first-person answer.",
        ],
    validationPassed: null,
    model: "heuristic",
    source: "fallback",
    latencyMs: 0,
  };
}

/**
 * Run Gate 1 then Gate 2. On failure, returns a complete ScoredResponse to emit
 * instead of normal scoring.
 */
export function evaluatePreScoreGates(
  module: AssessmentModuleSpec,
  response: string,
): PreScoreGateOutcome {
  if (isNonAnswer(module, response)) {
    return {
      ok: false,
      gate: 1,
      result: gateFailureResult(module, 1, 0, GATE1_FEEDBACK),
    };
  }
  if (isPlaceholderTemplate(response)) {
    // Structural fluency does not matter — cap and stop.
    return {
      ok: false,
      gate: 2,
      result: gateFailureResult(module, 2, 28, GATE2_FEEDBACK),
    };
  }
  return { ok: true };
}

/**
 * Find a sentence/phrase in the student answer that supports a rubric criterion.
 * Returns null when no evidencing phrase can be located.
 */
export function evidencePhraseForCriterion(
  response: string,
  criterion: RubricCriterion,
): string | null {
  const text = (response || "").trim();
  if (!text) return null;

  const sentences = text
    .split(/[.!?؟\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);

  const need = new Set(terms(`${criterion.criterion} ${criterion.descriptor}`));
  if (need.size === 0 || sentences.length === 0) return null;

  let best: string | null = null;
  let bestHits = 0;
  for (const s of sentences) {
    const hits = terms(s).filter((t) => need.has(t)).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = s;
    }
  }
  if (bestHits === 0 || !best) return null;

  const clean = best.replace(/\s+/g, " ").trim();
  return clean.length <= 140 ? clean : `${clean.slice(0, 137).trimEnd()}…`;
}

/** Prompt block injected into the AI scorer so LLM path honours the same gates. */
export function preScoreGatesPromptBlock(): string {
  return [
    `BEFORE SCORING — run these gates. If either fails, STOP and return the gate-failure JSON (do not invent rubric strengths).`,
    `GATE 1 — Non-answer: empty, copies/restates the task prompt, or no original content addressing the task → score exactly 0, feedback exactly: "${GATE1_FEEDBACK}", strengths: ["—"], improvements: ["Write an original answer that directly addresses the scenario and task."], criteria all exactly 0.`,
    `GATE 2 — Placeholder/template: bracketed placeholders like [field/role]/[X], meta-disclaimers ("I don't have personal experience", "here's a sample you can adapt"), or unfilled templates → score ≤ ${GATE2_SCORE_CAP}, feedback exactly: "${GATE2_FEEDBACK}", strengths: ["—"]. Structural fluency does NOT offset this.`,
    `If both gates pass: score normally. In feedback, for "most convincing on X" and "weakest on Y", quote or closely paraphrase the exact student sentence that justifies each claim. If you cannot locate a supporting phrase, say "no clear signal on this criterion" instead of forcing a label.`,
  ].join("\n");
}
