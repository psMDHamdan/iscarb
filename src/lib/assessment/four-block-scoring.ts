/**
 * iSCARB Assessment — Four-Block Scorer
 * ===========================================================================
 * Implements BRD §8.3 in a single AI call.
 *
 * The prompt is composed of four blocks:
 *   Block 1: Role + Context
 *   Block 2: Scenario + Task + Student Response
 *   Block 3: Rubric with weights and hard-gate annotations
 *   Block 4: Calibration Anchors (omitted when fewShot is empty)
 *
 * This scorer bypasses the anti-hallucination preamble (via chatJsonRaw) so
 * the model receives only the scoring instruction and returns clean JSON.
 * ===========================================================================
 */
import "server-only";

import { chatJsonRaw } from "@/lib/ai-engine";
import { scoringModel } from "@/lib/assessment/scoring-model";
import {
  AssessmentModuleSpec,
  ScoredResponse,
  bandFor,
  clamp,
  isPass,
  round1,
} from "./framework";
import { moduleLogger } from "@/lib/logger";
import { isMcqModule } from "./score-gates";

const log = moduleLogger("four-block-scoring");

// ─────────────────────────────────────────────────────────────────────────────
//  System prompt — does NOT go through withGuardrails
// ─────────────────────────────────────────────────────────────────────────────

const SCORING_SYSTEM_PROMPT =
  "You are a calibrated competency assessor inside iSCARB. Evaluate in a Saudi professional context.\nReturn STRICT JSON only. No prose before or after. No markdown fences.";

// ─────────────────────────────────────────────────────────────────────────────
//  User prompt builder (four blocks)
// ─────────────────────────────────────────────────────────────────────────────

function buildUserPrompt(module: AssessmentModuleSpec, response: string): string {
  const parts: string[] = [];
  const mcq = isMcqModule(module);

  // ── Block 1: Role + Context ──────────────────────────────────────────────
  let block1 =
    "ROLE: You are an expert competency assessor for iSCARB, the Saudi Higher Education Readiness platform.\n" +
    (mcq
      ? "CONTEXT: You must evaluate a student's selected multiple-choice option against a rubric for a specific Saudi professional scenario. The response is a deliberate choice, not a free-text essay."
      : "CONTEXT: You must evaluate a student's free-text response against a rubric for a specific Saudi professional scenario.");
  if (module.saudiContext) {
    block1 += `\nSaudi professional context: ${module.saudiContext}`;
  }
  parts.push(block1);

  // ── Block 2: Scenario + Task + Student Response ──────────────────────────
  let block2 =
    `SCENARIO:\n${module.scenario}\n\n` +
    `TASK THE STUDENT WAS ASKED TO COMPLETE:\n${module.instructions}\n\n` +
    `STUDENT RESPONSE:\n"""\n${response}\n"""`;
  if (mcq) {
    block2 +=
      "\n\nMCQ SCORING NOTE: The student response above is the full text of the option they selected. " +
      "Score that option's substance against the rubric (correctness of approach, fit to the scenario). " +
      "Short, well-formed option text is expected and is NOT gibberish or illegible. " +
      "Infer the implied methodology/approach from the option wording even if a label (e.g. \"Agile\") is not stated verbatim.";
  }
  parts.push(block2);

  // ── Block 3: Rubric ──────────────────────────────────────────────────────
  const rubricLines = module.rubric.map((rc) => {
    const gate = rc.gate ? " [HARD GATE]" : "";
    return `- ${rc.criterion} (${rc.weight} pts): ${rc.descriptor}${gate}`;
  });

  const hasGate = module.rubric.some((rc) => rc.gate);
  let block3 = `RUBRIC (criteria weights sum to 100):\n${rubricLines.join("\n")}`;
  if (hasGate) {
    block3 +=
      "\n\nGATE RULE: If a criterion marked [HARD GATE] scores less than [weight × 0.10] points, " +
      "the overall score MUST be capped at 39 regardless of other criteria.";
  }

  if (mcq) {
    block3 +=
      "\n\nGIBBERISH RULE: Only apply if the option text is random characters or keyboard mashing (e.g. 'asdfghj'). " +
      "Ordinary English MCQ options — even brief ones — must be scored normally against the rubric.";
  } else {
    block3 +=
      "\n\nGIBBERISH RULE: If the student response is random characters, keyboard mashing (e.g. 'asdfghj'), or complete gibberish, " +
      "you MUST score every criterion as 0, give an overall score of 0, and provide feedback stating that the answer was illegible or random.";
  }
  parts.push(block3);

  // ── Block 4: Calibration Anchors (omitted when fewShot is empty) ─────────
  if (module.fewShot && module.fewShot.length > 0) {
    const anchorLines = module.fewShot.map(
      (a) => `Score ${a.score}/100: "${a.response}" → ${a.feedback}`,
    );
    parts.push(`CALIBRATION ANCHORS (ground your scoring scale):\n${anchorLines.join("\n")}`);
  }

  // ── Required output schema ────────────────────────────────────────────────
  parts.push(
    `Return EXACTLY this JSON shape (no other keys, no prose):\n` +
    `{\n` +
    `  "score": <integer 0-100>,\n` +
    `  "perCriterion": [\n` +
    `    { "criterion": "<name>", "score": <number 0-weight>, "justification": "<one sentence>" }\n` +
    `  ],\n` +
    `  "feedback": "<2-3 sentence feedback>",\n` +
    `  "strengths": ["<strength 1>", "<strength 2>"],\n` +
    `  "improvements": ["<improvement 1>", "<improvement 2>"]\n` +
    `}`,
  );

  return parts.join("\n\n");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Response validation & alignment
// ─────────────────────────────────────────────────────────────────────────────

interface RawCriterionScore {
  criterion: string;
  score: number | string;
  justification?: string;
}

function validateAndParse(
  raw: unknown,
  module: AssessmentModuleSpec,
): {
  score: number;
  perCriterion: Array<{
    criterion: string;
    score: number;
    justification: string | null;
  }>;
  feedback: string;
  strengths: string[];
  improvements: string[];
} {
  // Must be a non-null plain object (not an array)
  if (
    raw === null ||
    typeof raw !== "object" ||
    Array.isArray(raw)
  ) {
    throw new Error("four-block: malformed AI response");
  }

  const obj = raw as Record<string, unknown>;

  // Validate required fields exist with correct types
  if (
    !("score" in obj) ||
    (typeof obj.score !== "number" && typeof obj.score !== "string")
  ) {
    throw new Error("four-block: malformed AI response");
  }
  if (!("perCriterion" in obj) || !Array.isArray(obj.perCriterion)) {
    throw new Error("four-block: malformed AI response");
  }
  if (!("feedback" in obj) || typeof obj.feedback !== "string") {
    throw new Error("four-block: malformed AI response");
  }
  if (!("strengths" in obj) || !Array.isArray(obj.strengths)) {
    throw new Error("four-block: malformed AI response");
  }
  if (!("improvements" in obj) || !Array.isArray(obj.improvements)) {
    throw new Error("four-block: malformed AI response");
  }

  // Coerce score to number and check NaN
  const scoreNum = Number(obj.score);
  if (Number.isNaN(scoreNum)) {
    throw new Error("four-block: malformed AI response");
  }

  // Build a name→score map from the AI's perCriterion array
  const aiByName = new Map<string, RawCriterionScore>();
  for (const item of obj.perCriterion as unknown[]) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const c = item as Record<string, unknown>;
      if (typeof c.criterion === "string") {
        aiByName.set(c.criterion, {
          criterion: c.criterion,
          score: typeof c.score === "number" || typeof c.score === "string" ? c.score : 0,
          justification: typeof c.justification === "string" ? c.justification : null,
        } as RawCriterionScore);
      }
    }
  }

  // Align perCriterion to module.rubric order, clamping each to [0, rc.weight]
  const perCriterion = module.rubric.map((rc) => {
    const aiEntry = aiByName.get(rc.criterion);
    const rawScore = aiEntry ? Number(aiEntry.score) : 0;
    const clampedScore = clamp(Number.isNaN(rawScore) ? 0 : rawScore, 0, rc.weight);
    return {
      criterion: rc.criterion,
      score: clampedScore,
      justification: aiEntry?.justification ?? null,
    };
  });

  return {
    score: scoreNum,
    perCriterion,
    feedback: obj.feedback as string,
    strengths: obj.strengths as string[],
    improvements: obj.improvements as string[],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main scorer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score a student response using a single BRD §8.3 four-block AI call.
 * Throws on AI failure or malformed response (caller handles fallback).
 */
export async function scoreResponseFourBlock(
  module: AssessmentModuleSpec,
  response: string,
): Promise<ScoredResponse> {
  const userPrompt = buildUserPrompt(module, response);

  const result = await chatJsonRaw({
    system: SCORING_SYSTEM_PROMPT,
    user: userPrompt,
    temperature: module.temperature,
    model: scoringModel(module.modelTag),
  });

  // Parse and validate the AI response
  const parsed = validateAndParse(result.json, module);

  // Clamp overall score to [0, 100]
  let score = clamp(parsed.score, 0, 100);

  // Build perCriterion array with weight+max filled from rubric
  const perCriterion = module.rubric.map((rc, i) => ({
    criterion: rc.criterion,
    weight: rc.weight,
    score: parsed.perCriterion[i].score,
    max: rc.weight,
    justification: parsed.perCriterion[i].justification,
  }));

  // Gate detection: hard gate triggers when score < weight * 0.10
  let gateFailed = false;
  for (let i = 0; i < module.rubric.length; i++) {
    const rc = module.rubric[i];
    if (rc.gate === true) {
      const threshold = rc.weight * 0.10;
      if (perCriterion[i].score < threshold) {
        gateFailed = true;
        break;
      }
    }
  }

  if (gateFailed) {
    score = Math.min(score, 39);
  }

  const band = bandFor(score).id;
  const passed = gateFailed ? false : isPass(score, module.passThreshold);

  const tokensInput = (result.usage as any)?.prompt_tokens || (result.usage as any)?.promptTokens || 0;
  const tokensOutput = (result.usage as any)?.completion_tokens || (result.usage as any)?.completionTokens || 0;
  const k2CostPer1kIn = 0.005;
  const k2CostPer1kOut = 0.015;
  const costUsd = (tokensInput / 1000) * k2CostPer1kIn + (tokensOutput / 1000) * k2CostPer1kOut;

  log.info(
    {
      module: module.code,
      score,
      band,
      passed,
      gateFailed,
      latencyMs: result.latencyMs,
    },
    "four-block scoring complete",
  );

  return {
    moduleCode: module.code,
    dimension: module.dimension,
    score: round1(score),
    band,
    passed,
    perCriterion,
    feedback: parsed.feedback,
    strengths: parsed.strengths,
    improvements: parsed.improvements,
    validationPassed: null,
    model: result.model,
    source: "ai",
    latencyMs: result.latencyMs,
    tokensInput,
    tokensOutput,
    costUsd,
  };
}
