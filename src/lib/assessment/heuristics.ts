/**
 * iSCARB Employability Assessment — DETERMINISTIC HEURISTICS
 * ===========================================================================
 * A rubric-aware, few-shot-anchored, deterministic scorer. It is the fallback
 * that runs whenever the AI layer is unavailable (no ZAI_API_KEY, timeout, bad
 * JSON) so the platform NEVER breaks — and it is also what the standalone
 * verification harness exercises to prove the methodology works for every
 * specialization.
 *
 * It scores a free-text response against a module's own rubric + calibration
 * anchors, so it is fully DOMAIN-AGNOSTIC: it knows nothing about CS, finance,
 * health, etc. — it only reads the rubric/anchors carried by the module, which
 * is exactly why it works for curated AND AI-generated Job-Fit modules alike.
 *
 * Scoring model (no randomness — same input ⇒ same output):
 *   1. anchor score — lexical similarity of the response to each few-shot
 *      anchor, blended by the anchors' known scores (grounds the 0-100 scale).
 *   2. signal score — elaboration, reasoning markers, structure, specificity.
 *   3. per-criterion spread — each rubric criterion is modulated by how well
 *      the response covers that criterion's descriptor terms (weight-aware).
 *   4. gates — a `gate:true` criterion that the response fails to satisfy caps
 *      the whole module into the weak band (Spec: phishing/Agile/JOIN gates).
 *
 * PURITY RULE: imports ONLY ./framework. No zod / prisma / next / server-only.
 * ===========================================================================
 */

import {
  AssessmentModuleSpec,
  CriterionScore,
  RubricCriterion,
  ScoredResponse,
  bandFor,
  clamp,
  isPass,
  round1,
} from "./framework";

// ─────────────────────────────────────────────────────────────────────────────
//  Text utilities (pure, deterministic)
// ─────────────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "so", "to", "of", "in",
  "on", "for", "with", "as", "at", "by", "from", "is", "are", "was", "were",
  "be", "been", "being", "it", "its", "this", "that", "these", "those", "i",
  "you", "he", "she", "we", "they", "them", "my", "your", "our", "their",
  "would", "should", "could", "will", "shall", "can", "may", "do", "does",
  "did", "have", "has", "had", "not", "no", "yes", "about", "into", "over",
  "than", "too", "very", "just", "also", "any", "all", "more", "most", "some",
  "such", "only", "own", "same", "up", "out", "off", "down", "why", "how",
  "what", "which", "who", "when", "where", "there", "here", "because", "while",
]);

/** Reasoning / analytical markers — their presence signals depth. */
const REASONING_MARKERS = [
  "because", "therefore", "thus", "hence", "since", "however", "although",
  "whereas", "consequently", "in order to", "so that", "root cause", "trade-off",
  "tradeoff", "trade off", "for example", "for instance", "as a result",
  "first", "second", "third", "finally", "instead", "rather than", "due to",
  "this means", "which means", "in contrast", "on the other hand",
];

/** Lowercase, strip punctuation, return ordered unique content words (len ≥ 2). */
function terms(text: string): string[] {
  const raw = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of raw) {
    if (!seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

function wordCount(text: string): number {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

/** Jaccard overlap of two term sets, 0..1. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Fraction of `reference` terms that appear in `candidate` terms, 0..1. */
function coverage(reference: Set<string>, candidate: Set<string>): number {
  if (reference.size === 0) return 0;
  let hit = 0;
  for (const r of reference) if (candidate.has(r)) hit++;
  return hit / reference.size;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Signal score — intrinsic quality of the response, independent of anchors
// ─────────────────────────────────────────────────────────────────────────────

function signalScore(response: string): number {
  const wc = wordCount(response);
  const lc = (response || "").toLowerCase();
  const t = terms(response);

  // Elaboration: maps word count onto 0..1 with a plateau (≈55 words ⇒ ~full).
  const elaboration = clamp((wc / 55) * 100, 0, 100) / 100;

  // Reasoning markers present (capped at 4 distinct ⇒ full).
  let markers = 0;
  for (const m of REASONING_MARKERS) if (lc.includes(m)) markers++;
  const reasoning = Math.min(markers, 4) / 4;

  // Structure: multiple sentences / explicit steps / separators.
  const sentences = (response || "").split(/[.!?؟\n]/).filter((s) => s.trim().length > 0).length;
  const structured = /[-•\d][).]|\bstep\b|firstly|secondly|then\b/.test(lc) || sentences >= 3;
  const structure = structured ? 1 : sentences >= 2 ? 0.5 : 0.2;

  // Specificity: lexical diversity (unique content words ÷ total words).
  const specificity = wc > 0 ? clamp((t.length / wc) * 100, 0, 100) / 100 : 0;

  // Weighted blend → 0..100.
  const blended =
    elaboration * 0.40 +
    reasoning * 0.30 +
    structure * 0.20 +
    specificity * 0.10;

  return clamp(blended * 100, 0, 100);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Anchor score — similarity-weighted blend of calibration anchors' scores
// ─────────────────────────────────────────────────────────────────────────────

function anchorScore(response: string, module: AssessmentModuleSpec): number | null {
  if (!module.fewShot || module.fewShot.length === 0) return null;
  const respSet = new Set(terms(response));

  let wsum = 0;
  let acc = 0;
  for (const a of module.fewShot) {
    const sim = jaccard(respSet, new Set(terms(a.response)));
    // Emphasise stronger matches; +0.05 floor so every anchor has a small pull.
    const w = Math.pow(sim, 1.5) + 0.05;
    wsum += w;
    acc += w * a.score;
  }
  if (wsum === 0) return null;

  const blended = acc / wsum;

  // Pull toward the nearest anchor by similarity so a near-duplicate of the
  // strong anchor lands near the strong score (and likewise for the weak one).
  let best = module.fewShot[0];
  let bestSim = -1;
  for (const a of module.fewShot) {
    const sim = jaccard(respSet, new Set(terms(a.response)));
    if (sim > bestSim) {
      bestSim = sim;
      best = a;
    }
  }
  const pull = clamp(bestSim, 0, 1); // 0..1
  return clamp(blended * (1 - pull) + best.score * pull, 0, 100);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Gate detection — does the response satisfy a hard-gate criterion?
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Distinctive terms a gate requires, mined from the criterion descriptor and
 * (when present) the highest-scoring anchor, minus generic instruction verbs.
 */
const GATE_NOISE = new Set([
  "must", "select", "explain", "identify", "use", "using", "choose", "should",
  "correct", "correctly", "answer", "response", "candidate", "able", "needs",
  "need", "ensure", "make", "name", "names", "state", "give", "provide",
  "depending", "order", "table", "tables", "type", "types", "via", "etc",
]);

function gateTerms(criterion: RubricCriterion, module: AssessmentModuleSpec): Set<string> {
  const fromDescriptor = terms(criterion.descriptor).filter((w) => !GATE_NOISE.has(w));
  // The top anchor demonstrates the correct concept; borrow its distinctive terms.
  const top = (module.fewShot || []).reduce<{ score: number; response: string } | null>(
    (best, a) => (best && best.score >= a.score ? best : a),
    null,
  );
  const fromAnchor = top
    ? terms(top.response).filter((w) => !GATE_NOISE.has(w)).slice(0, 8)
    : [];
  return new Set([...fromDescriptor, ...fromAnchor]);
}

/** A gate passes if the response shares at least one distinctive gate term. */
function gateSatisfied(
  response: string,
  criterion: RubricCriterion,
  module: AssessmentModuleSpec,
): boolean {
  const need = gateTerms(criterion, module);
  if (need.size === 0) return true; // nothing concrete to gate on ⇒ don't block
  const respSet = new Set(terms(response));
  for (const w of need) if (respSet.has(w)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public: deterministic scorer
// ─────────────────────────────────────────────────────────────────────────────

const GATE_CAP = 35; // a failed gate caps the whole module into the weak band

/**
 * Score a free-text response against a module — deterministically.
 * Returns the canonical ScoredResponse (source = "fallback").
 */
export function heuristicScore(
  module: AssessmentModuleSpec,
  response: string,
): ScoredResponse {
  const respText = (response || "").trim();
  const respSet = new Set(terms(respText));

  // Empty / trivial responses score at the floor regardless of rubric.
  if (wordCount(respText) < 3) {
    const perCriterion: CriterionScore[] = module.rubric.map((c) => ({
      criterion: c.criterion,
      weight: c.weight,
      score: 0,
      max: c.weight,
    }));
    return {
      moduleCode: module.code,
      dimension: module.dimension,
      score: 0,
      band: "weak",
      passed: false,
      perCriterion,
      feedback: "No substantive response was provided, so the scenario could not be assessed.",
      strengths: ["—"],
      improvements: [
        "Provide a complete answer that engages directly with the scenario and its decision.",
      ],
      validationPassed: null,
      model: "heuristic",
      source: "fallback",
      latencyMs: 0,
    };
  }

  // 1) base score = blend of anchor grounding (if any) and intrinsic signal.
  const sig = signalScore(respText);
  const anc = anchorScore(respText, module);
  const base = anc === null ? sig : clamp(anc * 0.6 + sig * 0.4, 0, 100);

  // 2) per-criterion spread, modulated by descriptor coverage; gate handling.
  let gateFailed = false;
  const perCriterion: CriterionScore[] = module.rubric.map((c) => {
    const descSet = new Set(terms(c.descriptor));
    const cov = coverage(descSet, respSet); // 0..1 — how well the answer hits it

    // Coverage shifts the criterion ±~15% around the base.
    const multiplier = 0.85 + cov * 0.30; // 0.85..1.15
    let raw = clamp(base * multiplier, 0, 100);

    if (c.gate && !gateSatisfied(respText, c, module)) {
      gateFailed = true;
      raw = clamp(Math.min(raw, 12), 0, 100); // near-zero on the gated criterion
    }

    return {
      criterion: c.criterion,
      weight: c.weight,
      score: round1((raw / 100) * c.weight),
      max: c.weight,
    };
  });

  // 3) overall = weighted sum of criteria (weights already sum to 100).
  let overall = perCriterion.reduce((s, c) => s + c.score, 0);
  if (gateFailed) overall = Math.min(overall, GATE_CAP);
  overall = round1(clamp(overall, 0, 100));

  const band = bandFor(overall).id;
  const passed = isPass(overall, module.passThreshold);

  // 4) strengths / improvements / feedback derived from per-criterion ratios.
  const { strengths, improvements } = deriveNarrative(
    module,
    perCriterion,
    gateFailed,
  );
  const feedback = buildFeedback(module, overall, band, perCriterion, gateFailed);

  return {
    moduleCode: module.code,
    dimension: module.dimension,
    score: overall,
    band,
    passed,
    perCriterion,
    feedback,
    strengths,
    improvements,
    validationPassed: null,
    model: "heuristic",
    source: "fallback",
    latencyMs: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Narrative derivation
// ─────────────────────────────────────────────────────────────────────────────

/** Ratio of awarded points to the criterion's max, 0..1. */
function ratio(c: CriterionScore): number {
  return c.max > 0 ? c.score / c.max : 0;
}

function deriveNarrative(
  module: AssessmentModuleSpec,
  per: CriterionScore[],
  gateFailed: boolean,
): { strengths: string[]; improvements: string[] } {
  const byCriterion = new Map(module.rubric.map((c) => [c.criterion, c]));
  const sorted = [...per].sort((a, b) => ratio(b) - ratio(a));

  const strengths: string[] = [];
  for (const c of sorted) {
    if (ratio(c) >= 0.65 && strengths.length < 3) {
      strengths.push(`Solid on "${c.criterion}" — ${shorten(byCriterion.get(c.criterion)?.descriptor)}`);
    }
  }
  if (strengths.length === 0) {
    const topC = sorted[0];
    strengths.push(
      topC
        ? `Relative strength on "${topC.criterion}", though it needs more depth.`
        : "Some engagement with the scenario.",
    );
  }

  const improvements: string[] = [];
  if (gateFailed) {
    const gate = module.rubric.find((c) => c.gate);
    if (gate) {
      improvements.push(
        `Critical: the answer misses the core requirement — ${shorten(gate.descriptor)}`,
      );
    }
  }
  for (const c of [...sorted].reverse()) {
    if (ratio(c) < 0.6 && improvements.length < 3) {
      const desc = byCriterion.get(c.criterion);
      if (desc?.gate && gateFailed) continue; // already surfaced above
      improvements.push(`Strengthen "${c.criterion}" — ${shorten(desc?.descriptor)}`);
    }
  }
  if (improvements.length === 0) {
    improvements.push("Add a concrete example or next step to move from proficient to strong.");
  }

  return { strengths, improvements };
}

function buildFeedback(
  module: AssessmentModuleSpec,
  overall: number,
  band: string,
  per: CriterionScore[],
  gateFailed: boolean,
): string {
  const bandWord =
    band === "strong" ? "a strong" :
    band === "proficient" ? "a proficient" :
    band === "developing" ? "a developing" : "a weak";

  const sorted = [...per].sort((a, b) => ratio(b) - ratio(a));
  const best = sorted[0]?.criterion;
  const worst = sorted[sorted.length - 1]?.criterion;

  if (gateFailed) {
    return `This response misses a non-negotiable requirement of the ${module.framework} scenario, which caps the result in the weak band (${overall}/100). Address the core requirement before refining the rest.`;
  }

  const parts = [`The response shows ${bandWord} grasp of the ${module.framework} scenario (${overall}/100).`];
  if (best && worst && best !== worst) {
    parts.push(`It is most convincing on "${best}" and weakest on "${worst}".`);
  }
  return parts.join(" ");
}

function shorten(s?: string, max = 90): string {
  if (!s) return "see the rubric for what a strong answer requires.";
  const clean = s.trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1).trimEnd() + "…";
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public: validation heuristic (deterministic Validation-Agent fallback)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Coherence / rubric-alignment check for a graded result — the deterministic
 * stand-in for the Validation Agent (Spec §5.5). Returns true when the result
 * is internally consistent and safe to surface.
 */
export function heuristicValidate(
  scored: ScoredResponse,
  module: AssessmentModuleSpec,
): boolean {
  // score in range
  if (!(scored.score >= 0 && scored.score <= 100)) return false;
  // band consistent with the numeric score
  if (bandFor(scored.score).id !== scored.band) return false;
  // pass flag consistent with the module threshold
  if (scored.passed !== isPass(scored.score, module.passThreshold)) return false;
  // per-criterion present and aligned to the rubric
  if (!Array.isArray(scored.perCriterion) || scored.perCriterion.length !== module.rubric.length) {
    return false;
  }
  // criterion weights sum ≈ 100 and each awarded ≤ max
  const wsum = scored.perCriterion.reduce((s, c) => s + c.weight, 0);
  if (Math.abs(wsum - 100) > 1) return false;
  if (scored.perCriterion.some((c) => c.score < 0 || c.score > c.max + 0.01)) return false;
  // narrative present
  if (!scored.feedback || scored.feedback.trim().length < 10) return false;
  if (!scored.strengths?.length || !scored.improvements?.length) return false;
  return true;
}
