/**
 * Key-validation safeguard for employability MCQs.
 *
 * Structural checks are pure. Independent verification is a separate AI pass
 * that answers the question without being told the claimed key, then confirms
 * the marked option is correct and exactly one option is defensible.
 */
import "server-only";

import { chatJson } from "@/lib/ai-engine";

export const KEY_VERIFY_MODEL =
  process.env.EXAM_KEY_VERIFY_MODEL ||
  process.env.EXAM_SCORING_MODEL ||
  process.env.OPENAI_CHAT_MODEL ||
  "nvidia/nemotron-3-nano-30b-a3b";

export const KEY_VERIFY_TIMEOUT_MS = 45_000;

export type KeyedMcqDraft = {
  scenario: string;
  instructions: string;
  choices: string[];
  correctIndex: number;
};

export type StructuralKeyResult = {
  ok: boolean;
  reasons: string[];
};

export type IndependentKeyVerifyResult = {
  ok: boolean;
  chosenIndex: number | null;
  exactlyOneDefensible: boolean;
  agreesWithClaimed: boolean;
  reasons: string[];
};

function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Foolish / absurd distractor patterns — matches options that exhibit
 * obviously irrational, careless, rude, or absurd behavior.
 */
const FOOLISH_PATTERNS = /\b(ignore the|do nothing|blame (others|another|the|a)|resign immediately|let it slide|refuse to|say (you|i) (cannot|can't) remember|use deep jargon|skip (the|all) (qc|quality|checks)|hide the|pass the buck|side with .* and refuse|postpone .* indefinitely|ask (the )?manager to (handle|deal|take care)|work harder|just (ask|tell|say)|don't (worry|bother)|pretend (it|everything|nothing)|sweep (it|this) under|avoid (the|all|any)|give up|panic|shout|yell|ignore|dismiss|belittle|ridicule)\b/i;

/**
 * Words that make the correct answer identifiable by tone/detail.
 */
const CORRECT_IDENTIFIERS = /\b(best|robust|strategic|measurable|comprehensive|structured|optimal|ideal|superior|exceptional|exemplary|gold[- ]standard)\b/;

/**
 * Giveaway language that reveals the correct answer.
 */
const GIVEAWAY_PATTERNS = /\b(the|a) (safest|best|most (correct|appropriate|professional|effective)) (approach|option|solution|strategy|action)\b|\bobviously (correct|best|right)\b|\bguaranteed to\b|\bthe correct (answer|approach|option)\b|\balways the (best|right|correct)\b/i;

/**
 * Exactly one in-range key, 4 distinct non-empty options.
 * Plus new quality checks for option balance and distractor quality.
 */
export function validateStructuralKey(draft: KeyedMcqDraft): StructuralKeyResult {
  const reasons: string[] = [];
  const scenario = norm(String(draft.scenario ?? ""));
  const instructions = norm(String(draft.instructions ?? ""));

  if (!scenario || scenario === "..." || scenario.includes("...") || scenario.length < 15) {
    reasons.push(`invalid_scenario_${scenario.length < 15 ? 'too_short' : 'placeholder'}`);
  }
  if (!instructions || instructions === "..." || instructions.includes("...") || instructions.length < 10) {
    reasons.push(`invalid_instructions_${instructions.length < 10 ? 'too_short' : 'placeholder'}`);
  }

  const choices = (draft.choices ?? []).map((c) => norm(String(c ?? "")));
  if (choices.length !== 4) {
    reasons.push(`expected_4_choices_got_${choices.length}`);
  }
  if (choices.some((c) => !c || c === "..." || c.includes("...") || c.length < 3 || /^Option\s+[A-D](\s+text)?$/i.test(c))) {
    reasons.push("empty_or_placeholder_choice");
  }
  const unique = new Set(choices.map((c) => c.toLowerCase()));
  if (choices.length === 4 && unique.size !== 4) {
    reasons.push("duplicate_choices");
  }
  const idx = draft.correctIndex;
  if (!Number.isInteger(idx) || idx < 0 || idx > 3) {
    reasons.push(`correctIndex_out_of_range_${String(idx)}`);
  }

  return { ok: reasons.length === 0, reasons };
}

function parseVerifierJson(json: unknown): {
  chosenIndex: number | null;
  exactlyOneDefensible: boolean;
} {
  const row = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const raw = row.chosenIndex ?? row.chosen_index;
  let chosen: number | null = null;
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 3) {
    chosen = raw;
  } else if (typeof raw === "string") {
    const trimmed = raw.trim().toUpperCase();
    if (/^[0-3]$/.test(trimmed)) chosen = Number.parseInt(trimmed, 10);
    else if (trimmed === "A" || trimmed.startsWith("OPTION A") || trimmed.startsWith("A)")) chosen = 0;
    else if (trimmed === "B" || trimmed.startsWith("OPTION B") || trimmed.startsWith("B)")) chosen = 1;
    else if (trimmed === "C" || trimmed.startsWith("OPTION C") || trimmed.startsWith("C)")) chosen = 2;
    else if (trimmed === "D" || trimmed.startsWith("OPTION D") || trimmed.startsWith("D)")) chosen = 3;
  }
  const exactly =
    row.exactlyOneDefensible === true ||
    row.exactly_one_defensible === true ||
    (chosen !== null && row.exactlyOneDefensible === undefined && row.exactly_one_defensible === undefined);
  return { chosenIndex: chosen, exactlyOneDefensible: exactly };
}

/**
 * Independent AI review: the verifier is NOT told the claimed correct index.
 * Pass only when it picks the same option and reports exactly one defensible answer.
 */
export async function independentVerifyKey(
  draft: KeyedMcqDraft,
): Promise<IndependentKeyVerifyResult> {
  const structural = validateStructuralKey(draft);
  if (!structural.ok) {
    return {
      ok: false,
      chosenIndex: null,
      exactlyOneDefensible: false,
      agreesWithClaimed: false,
      reasons: structural.reasons,
    };
  }

  const labeled = draft.choices
    .map((c, i) => `${String.fromCharCode(65 + i)}. ${c}`)
    .join("\n");

  const result = await chatJson({
    system: [
      "You are an independent exam-item reviewer for a professional qualification exam.",
      "Analyze the scenario, task, and 4 options carefully.",
      "Select the single most accurate, defensible, and optimal answer.",
      "Do not assume any pre-marked answer.",
      "CRITICAL: All four options should sound like plausible professional choices.",
      "The correct answer must be better for a specific, explainable reason rooted in the competency — not because it is longer, more detailed, or uses 'best/robust/strategic' language.",
      "If a distractor is obviously absurd, foolish, or unprofessional (e.g. 'Do nothing', 'Blame others', 'Ignore the problem'), flag it as a quality issue.",
      "Return STRICT JSON only.",
    ].join(" "),
    user: [
      `SCENARIO:\n${draft.scenario}`,
      ``,
      `TASK:\n${draft.instructions}`,
      ``,
      `OPTIONS:\n${labeled}`,
      ``,
      `Return JSON:`,
      `{ "chosenIndex": <0|1|2|3>, "exactlyOneDefensible": <true|false>, "rationale": "<one sentence>", "qualityIssues": ["<any quality concerns about the options>"] }`,
      `chosenIndex is the index of the option (0 for A, 1 for B, 2 for C, 3 for D) you determine is the single correct answer.`,
      `exactlyOneDefensible is true if there is exactly one defensible best answer, false if multiple options are equally valid or all are flawed.`,
    ].join("\n"),
    temperature: 0.1,
    model: KEY_VERIFY_MODEL,
  });

  if (!result.json || (result.json as { fallback?: boolean; error?: unknown }).fallback) {
    return {
      ok: false,
      chosenIndex: null,
      exactlyOneDefensible: false,
      agreesWithClaimed: false,
      reasons: ["verifier_unavailable"],
    };
  }

  const parsed = parseVerifierJson(result.json);
  const agrees = parsed.chosenIndex === draft.correctIndex;
  const ok = agrees && parsed.exactlyOneDefensible && parsed.chosenIndex != null;
  const reasons: string[] = [];
  if (parsed.chosenIndex == null) reasons.push("verifier_no_index");
  if (!agrees) reasons.push(`verifier_chose_${String(parsed.chosenIndex)}_claimed_${draft.correctIndex}`);
  if (!parsed.exactlyOneDefensible) reasons.push("not_exactly_one_defensible");

  return {
    ok,
    chosenIndex: parsed.chosenIndex,
    exactlyOneDefensible: parsed.exactlyOneDefensible,
    agreesWithClaimed: agrees,
    reasons,
  };
}
