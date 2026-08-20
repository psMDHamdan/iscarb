/**
 * iSCARB Employability Assessment — AI ENGINE (server-only)
 * ===========================================================================
 * The AI-backed layer on top of the pure core. Responsibilities:
 *
 *   1. scoreResponse()   — dual-call AI scorer (Call A per criterion + independent
 *                          Call B quote audit), with deterministic heuristic fallback.
 *   2. validateScore()   — optional second pass (the Validation Agent, Spec
 *                          §5.5). Falls back to the deterministic validator.
 *   3. generateJobFitModule() — when CLOs are supplied, synthesise a bespoke
 *                          Job-Fit module for the discipline; otherwise (or on
 *                          failure) use the catalog's resolved Job-Fit, which
 *                          already covers EVERY specialization.
 *   4. assembleProfile() — roll a set of graded results into the four-dimension
 *                          employability profile (pure math from framework).
 *
 * Because the curated/generated module already carries its own rubric + anchors,
 * everything here is DOMAIN-AGNOSTIC: the same code path scores accounting,
 * cybersecurity, health management, an unknown new programme — anything.
 *
 * DB persistence lives in the API routes, not here, to keep the engine testable.
 * ===========================================================================
 */

import "server-only";
import { chatJson, withTimeout } from "@/lib/ai-engine";
import { moduleLogger } from "@/lib/logger";
import {
  AssessmentModuleSpec,
  DimensionId,
  EmployabilityProfile,
  FewShotAnchor,
  ScoredResponse,
  computeProfile,
} from "./framework";
import {
  jobFitModulesFor,
  resolveRegulator,
  normalizeSpec,
} from "./catalog";
import { heuristicScore, heuristicValidate } from "./heuristics";
import { evaluatePreScoreGates } from "./score-gates";
import {
  buildScoringDiagnostics,
  buildGateFailureDiagnostics,
} from "./score-diagnostics";
import { scoreResponseDualCall } from "./dual-call-scoring";
import { scoreResponseFourBlock } from "./four-block-scoring";

const FOUR_BLOCK_TIMEOUT_MS = 240000; // one failed NVIDIA key (~100s) + one success (~100s)
const SCORE_TIMEOUT_MS = 90000; // dual-call wall clock (parallel criteria)
const VALIDATE_TIMEOUT_MS = 15000;
/** Keep generation short so list/demo paths never hang the request. */
const GENERATE_TIMEOUT_MS = 15_000;

const log = moduleLogger("assessment-engine");

// ─────────────────────────────────────────────────────────────────────────────
//  Prompt helpers shared by validation + Job-Fit generation
// ─────────────────────────────────────────────────────────────────────────────

function rubricBlock(module: AssessmentModuleSpec): string {
  return module.rubric
    .map((c) => {
      const gate = c.gate ? " [HARD GATE: failing this caps the whole score in the weak band]" : "";
      return `- ${c.criterion} (${c.weight} pts): ${c.descriptor}${gate}`;
    })
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public: score a response (AI with deterministic fallback)
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoreOptions {
  /** run the validation agent (second pass). Default: module.validationEnabled. */
  validate?: boolean;
}

/**
 * Score one response against one module via independent Call A (score/quote/
 * justification) + Call B (blind quote audit) per criterion. On any failure
 * falls back to the deterministic heuristic scorer so the platform never breaks.
 */
export async function scoreResponse(
  module: AssessmentModuleSpec,
  response: string,
  opts: ScoreOptions = {},
): Promise<ScoredResponse> {
  const wantValidate = opts.validate ?? module.validationEnabled;

  // Deterministic gates run first — never call AI / invent rubric labels for non-answers.
  const pre = evaluatePreScoreGates(module, response);
  if (!pre.ok) {
    let scored = pre.result;
    scored = {
      ...scored,
      diagnostics: buildGateFailureDiagnostics(module, pre.gate, scored),
    };
    if (wantValidate) {
      scored = { ...scored, validationPassed: await validateScore(module, response, scored) };
    }
    return scored;
  }

  let scored: ScoredResponse;

  // Path 1: Four-Block Scorer (primary — single AI call, BRD §8.3)
  // Applies to ALL answers including MCQ (selected option text vs rubric).
  // Heuristic is ONLY Path 3 after real AI failure — never the default.
  try {
    scored = await withTimeout(
      scoreResponseFourBlock(module, response),
      FOUR_BLOCK_TIMEOUT_MS,
      `assessment:score:fourblock:${module.code}`,
    );
    log.info({ module: module.code, latencyMs: scored.latencyMs }, "four-block scoring succeeded");
  } catch (err1) {
    log.warn(
      { module: module.code, err: err1 instanceof Error ? err1.message : String(err1) },
      "four-block scorer failed; trying dual-call",
    );

    // Path 2: Dual-Call Scorer (secondary — independent Call A + Call B per criterion)
    try {
      scored = await withTimeout(
        scoreResponseDualCall(module, response),
        SCORE_TIMEOUT_MS,
        `assessment:score:dualcall:${module.code}`,
      );
      log.info({ module: module.code, latencyMs: scored.latencyMs }, "dual-call scoring succeeded");
    } catch (err2) {
      log.warn(
        { module: module.code, err: err2 instanceof Error ? err2.message : String(err2) },
        "dual-call scorer also failed; using heuristic fallback",
      );

      // Path 3: Heuristic Scorer (final deterministic fallback)
      scored = heuristicScore(module, response);
      const diag = buildScoringDiagnostics(module, response, scored);
      scored.diagnostics = diag;
      if (diag.finalOutput.feedback) scored.feedback = diag.finalOutput.feedback;
    }
  }

  if (wantValidate) {
    scored.validationPassed = await validateScore(module, response, scored);
  }
  return scored;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public: validation agent (AI with deterministic fallback)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Second-pass coherence check. Asks a model whether the grade is justified by
 * the rubric and the response. Falls back to the deterministic validator.
 */
export async function validateScore(
  module: AssessmentModuleSpec,
  response: string,
  scored: ScoredResponse,
): Promise<boolean> {
  // The deterministic check first guards internal consistency cheaply.
  const structurallyOk = heuristicValidate(scored, module);
  if (!structurallyOk) return false;

  try {
    const result = await withTimeout(
      chatJson({
        system:
          "You are a strict QA validator for competency grading. Decide whether the proposed score is justified by the rubric and the candidate response. Return STRICT JSON only.",
        user: [
          `RUBRIC:\n${rubricBlock(module)}`,
          ``,
          `CANDIDATE RESPONSE:\n"""${response}"""`,
          ``,
          `PROPOSED SCORE: ${scored.score}/100 (band: ${scored.band})`,
          `FEEDBACK GIVEN: ${scored.feedback}`,
          ``,
          `Is this score defensible against the rubric (allow ±10 points of judgement)?`,
          `Return: { "valid": <true|false>, "reason": "<short>" }`,
        ].join("\n"),
        temperature: 0,
        model: module.modelTag,
      }),
      VALIDATE_TIMEOUT_MS,
      `assessment:validate:${module.code}`,
    );
    const json = result.json as Record<string, unknown> | null;
    if (json && typeof json.valid === "boolean") return json.valid;
    return true; // ambiguous AI output ⇒ trust the structural check
  } catch {
    return true; // AI unavailable ⇒ structural check already passed
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public: AI Job-Fit generation (with catalog fallback)
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratedJobFit {
  modules: AssessmentModuleSpec[];
  source: "ai" | "curated" | "generic";
  cluster: string;
}

/**
 * Resolve the Job-Fit modules for a specialization. The catalog already returns
 * a credible, rubric-anchored set for ANY discipline (curated or deterministic
 * generic). When `clos` are supplied AND the AI layer is available, we try to
 * synthesise a bespoke single module tailored to those outcomes and prepend it;
 * on any failure we simply return the catalog set. This is the only place the
 * "works for an unknown specialization" promise touches AI — and it degrades
 * cleanly to the deterministic catalog.
 */
export async function generateJobFitModule(
  specialization: string,
  clos?: string[],
): Promise<GeneratedJobFit> {
  const catalog = jobFitModulesFor(specialization);
  const base: GeneratedJobFit = {
    modules: catalog.modules,
    source: catalog.source,
    cluster: catalog.cluster,
  };

  if (!clos || clos.length === 0) return base;

  const reg = resolveRegulator(specialization);
  try {
    const result = await withTimeout(
      chatJson({
        system: [
          "You design ONE situational competency-assessment module for a specific discipline, grounded in real workplace practice.",
          "Return STRICT JSON only. The rubric weights MUST be integers that sum to exactly 100.",
        ].join("\n"),
        user: [
          `DISCIPLINE: ${specialization}`,
          `SAUDI REGULATORY ANCHOR (use only if genuinely relevant): ${reg.authorities.join(", ")}`,
          `COURSE LEARNING OUTCOMES:`,
          ...clos.map((c, i) => `  ${i + 1}. ${c}`),
          ``,
          `Design a realistic on-the-job scenario that tests the technical core of these outcomes.`,
          `Return JSON:`,
          `{`,
          `  "title": "<short module title>",`,
          `  "framework": "<named method/standard it assesses>",`,
          `  "scenario": "<realistic workplace situation>",`,
          `  "instructions": "<what the candidate must produce>",`,
          `  "rubric": [ { "criterion": "<name>", "weight": <int>, "descriptor": "<what a strong answer shows>" } ],`,
          `  "weak_example": "<a poor answer>",`,
          `  "strong_example": "<an excellent answer>"`,
          `}`,
        ].join("\n"),
        temperature: 0.3,
      }),
      GENERATE_TIMEOUT_MS,
      `assessment:jobfit:${specialization}`,
    );

    const json = result.json as Record<string, unknown> | null;
    const built = buildModuleFromAi(specialization, json);
    if (built) {
      // Prepend the bespoke module; keep the catalog modules as the stable base.
      return {
        modules: [built, ...catalog.modules],
        source: "ai",
        cluster: catalog.cluster,
      };
    }
    return base;
  } catch (err) {
    log.warn(
      { specialization, err: err instanceof Error ? err.message : String(err) },
      "Job-Fit generation failed; using catalog blueprint",
    );
    return base;
  }
}

/**
 * Dynamically generate a new, unique scenario and instructions for a given module.
 * This ensures candidates get a unique test each time, while the rubric stays fixed.
 */
export async function generateDynamicScenario(
  module: AssessmentModuleSpec,
  studentContext?: string
): Promise<{ scenario: string; instructions: string; questionType: string; choices?: string[] } | null> {
  const contextStr = studentContext ? `\nSTUDENT CONTEXT (Major/Program): ${studentContext}` : "";

  try {
    const result = await withTimeout(
      chatJson({
        system: [
          "You are a world-class assessment designer with deep expertise in competency-based evaluation.",
          "Your task: generate a brand-new, realistic MCQ scenario that tests the student's competency.",
          "STRICT RULE — DOMAIN ALIGNMENT: Every single element of your output (scenario, options, context)",
          "MUST belong 100% to the student's declared specialisation. Cross-domain contamination is forbidden.",
          "If specialisation is Finance, every word must be about finance. If Biotechnology, everything must be about biotech.",
          "You MUST perform the 10-rule QA self-check before returning JSON.",
          "If ANY rule fails, return { \"valid\": false } instead of the scenario JSON.",
          "Return STRICT JSON only. No prose outside the JSON object.",
        ].join("\n"),
        user: [
          "=== SECTION A — CONTEXT ===",
          `STUDENT SPECIALISATION: ${studentContext || "General Professional Practice"}`,
          `MODULE FOCUS: ${module.focus}`,
          `ASSESSMENT FRAMEWORK: ${module.framework}`,
          `COMPETENCY DIMENSION: ${module.dimension}`,
          "",
          "RUBRIC CRITERIA TO TEST:",
          ...module.rubric.map((r, i) => `  ${i + 1}. ${r.criterion} (${r.weight} pts) — ${r.descriptor}`),
          "",
          "=== SECTION B — MCQ OPTION QUALITY RULES ===",
          "All four answer options MUST satisfy every rule below:",
          "  □ Action-oriented: each option states a professional action, not a description or observation.",
          "  □ Plausible to a junior professional: no obviously wrong or absurd options.",
          "  □ Domain expertise required: a candidate must know the field to select the correct answer.",
          "  □ FORBIDDEN options — never include any of these patterns:",
          '      - "do nothing"',
          '      - "ignore the issue"',
          '      - "ignore the problem"',
          '      - "blame others"',
          '      - "wait and see"',
          '      - "take no action"',
          '      - passive variants of the above',
          "  □ Similar length and grammatical structure across all four options (±30% word count).",
          "  □ Correct answer NOT revealed by length, hedging language, or extra detail.",
          "  □ Exactly ONE option is the clearly best professional response for someone with domain expertise.",
          "  □ The three distractors are wrong for specific domain reasons — not surface-level or common-sense reasons.",
          "",
          "=== SECTION C — OUTPUT FORMAT ===",
          "Return exactly this JSON (include valid: true if all 10 QA rules pass):",
          "{",
          '  "valid": true,',
          '  "scenario": "<2-4 sentence realistic professional situation in the student specialisation>",',
          '  "instructions": "<1-2 sentence directive telling the candidate what to select>",',
          '  "questionType": "mcq",',
          '  "choices": [',
          '    "<Option A — action-oriented, plausible, domain-specific>",',
          '    "<Option B — action-oriented, plausible, domain-specific>",',
          '    "<Option C — action-oriented, plausible, domain-specific>",',
          '    "<Option D — action-oriented, plausible, domain-specific>"',
          "  ]",
          "}",
          "",
          "Exactly one of the four choices should be the correct professional response.",
          "The other three should be plausible wrong answers that require domain knowledge to reject.",
        ].join("\n"),
        temperature: 0.95,
      }),
      GENERATE_TIMEOUT_MS,
      `assessment:dynamic_scenario:${module.code}`,
    );

    const json = result.json as Record<string, unknown> | null;
    if (json && typeof json.scenario === "string" && typeof json.instructions === "string") {
      return {
        scenario: json.scenario.trim(),
        instructions: json.instructions.trim(),
        questionType: json.questionType === "mcq" ? "mcq" : "open_ended",
        choices: Array.isArray(json.choices) ? json.choices.map(c => String(c)) : undefined,
      };
    }
    return null;
  } catch (err) {
    log.warn(
      { module: module.code, err: err instanceof Error ? err.message : String(err) },
      "Dynamic scenario generation failed; will fallback to static catalog scenario"
    );
    return null;
  }
}

/** Validate + assemble an AI-described module; returns null if unusable. */
function buildModuleFromAi(
  specialization: string,
  json: Record<string, unknown> | null,
): AssessmentModuleSpec | null {
  if (!json) return null;
  const title = typeof json.title === "string" ? json.title.trim() : "";
  const framework = typeof json.framework === "string" ? json.framework.trim() : "";
  const scenario = typeof json.scenario === "string" ? json.scenario.trim() : "";
  const instructions = typeof json.instructions === "string" ? json.instructions.trim() : "";
  const rawRubric = Array.isArray(json.rubric) ? (json.rubric as Array<Record<string, unknown>>) : [];

  if (!title || !scenario || !instructions || rawRubric.length === 0) return null;

  const rubric = rawRubric
    .map((c) => ({
      criterion: typeof c.criterion === "string" ? c.criterion.trim() : "",
      weight: typeof c.weight === "number" ? Math.round(c.weight) : 0,
      descriptor: typeof c.descriptor === "string" ? c.descriptor.trim() : "",
    }))
    .filter((c) => c.criterion && c.weight > 0);
  if (rubric.length === 0) return null;

  // Normalise weights to sum to exactly 100 (defends against model drift).
  const sum = rubric.reduce((s, c) => s + c.weight, 0);
  if (sum !== 100) {
    let acc = 0;
    rubric.forEach((c, i) => {
      if (i === rubric.length - 1) c.weight = 100 - acc;
      else {
        c.weight = Math.round((c.weight / sum) * 100);
        acc += c.weight;
      }
    });
  }

  const fewShot: FewShotAnchor[] = [];
  if (typeof json.weak_example === "string" && json.weak_example.trim()) {
    fewShot.push({ response: json.weak_example.trim(), score: 32, feedback: "Weak calibration anchor (AI-generated)." });
  }
  if (typeof json.strong_example === "string" && json.strong_example.trim()) {
    fewShot.push({ response: json.strong_example.trim(), score: 90, feedback: "Strong calibration anchor (AI-generated)." });
  }

  const specKey = normalizeSpec(specialization).toUpperCase();
  return {
    code: `JOBFIT-${specKey}-AI`,
    title,
    dimension: "job_fit" as DimensionId,
    level: "L3-AI",
    framework: framework || "Discipline-specific technical core",
    focus: "AI-tailored to the course learning outcomes.",
    saudiContext: "Generated module; review before high-stakes use.",
    scenario,
    instructions,
    rubric,
    fewShot,
    passThreshold: 60,
    validationEnabled: true,
    modelTag: process.env.OPENAI_CHAT_MODEL || "openai/gpt-oss-20b",
    temperature: 0.3,
    specialization,
    generated: true,
    estimateMinutes: 15,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public: profile assembly
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Roll graded results into the four-dimension employability profile + weighted
 * composite (pure math). Re-normalises weights over covered dimensions so a
 * partial profile is reported fairly.
 */
export function assembleProfile(
  scored: ScoredResponse[],
  specialization: string | null,
): EmployabilityProfile {
  return computeProfile(
    scored.map((s) => ({ dimension: s.dimension, score: s.score })),
    specialization,
  );
}
