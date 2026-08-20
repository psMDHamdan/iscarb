/**
 * iSCARB Employability Assessment — FRAMEWORK CORE
 * ===========================================================================
 * This module encodes the four-dimension employability profile adapted from the
 * Skills Assessment Platform (Technical Spec V1.2 + Module Catalog V1.0) and
 * merged into iSCARB. It is the single source of truth for:
 *
 *   - the four dimensions and their composite weights,
 *   - the 0-100 score bands and the pass threshold,
 *   - the canonical output shape ({ score, feedback, strengths, improvements }),
 *   - the pure composite math (employability_score_4d).
 *
 * DESIGN RULE — DOMAIN-AGNOSTIC: three of the four dimensions (Core
 * Professionalism, Business & Digital Literacy, Growth Potential = 60% of the
 * composite) are UNIVERSAL and apply to every specialization unchanged. Only
 * Job-Fit (40%) is specialization-scoped and is resolved per discipline in
 * catalog.ts. Nothing in this file is CS/IT specific.
 *
 * PURITY RULE: this module has NO external imports (no zod / prisma / next /
 * server-only). It is safe to import from the browser, the server, and the
 * standalone verification harness. All AI- and DB-touching logic lives in
 * engine.ts.
 * ===========================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
//  Dimensions & weights  (Module Catalog §2.2 / Table 4)
// ─────────────────────────────────────────────────────────────────────────────

export type DimensionId =
  | "core_professionalism"
  | "business_digital"
  | "job_fit"
  | "growth_potential";

export interface Dimension {
  id: DimensionId;
  label: string;
  labelAr: string;
  /** composite weight in [0,1]; the four weights sum to 1.0 */
  weight: number;
  /** true when the dimension is specialization-specific (resolved per discipline) */
  specializationScoped: boolean;
  blurb: string;
}

/**
 * The four employability dimensions. Weights follow the catalog:
 *   Core Professionalism 25% · Business & Digital 20% · Job-Fit 40% · Growth 15%
 * employability_score_4d = 0.25·Core + 0.20·Business + 0.40·JobFit + 0.15·Growth
 */
export const DIMENSIONS: readonly Dimension[] = [
  {
    id: "core_professionalism",
    label: "Core Professionalism",
    labelAr: "الاحتراف المهني",
    weight: 0.25,
    specializationScoped: false,
    blurb:
      "Communication, critical thinking, teamwork, adaptability, ethics — behavioural maturity that every graduate needs.",
  },
  {
    id: "business_digital",
    label: "Business & Digital Literacy",
    labelAr: "الثقافة الرقمية والأعمال",
    weight: 0.2,
    specializationScoped: false,
    blurb:
      "Project management, AI literacy, cybersecurity awareness, data and business fundamentals — cross-functional across all fields.",
  },
  {
    id: "job_fit",
    label: "Job-Fit (Technical)",
    labelAr: "الملاءمة الوظيفية (التقنية)",
    weight: 0.4,
    specializationScoped: true,
    blurb:
      "The discipline-specific technical core. Resolved per specialization — curated when known, AI-generated for any new field.",
  },
  {
    id: "growth_potential",
    label: "Growth Potential",
    labelAr: "إمكانات النمو",
    weight: 0.15,
    specializationScoped: false,
    blurb:
      "Career adaptability, vision and intercultural capability — future-readiness that is independent of the chosen field.",
  },
] as const;

export const DIMENSION_BY_ID: Record<DimensionId, Dimension> = DIMENSIONS.reduce(
  (acc, d) => {
    acc[d.id] = d;
    return acc;
  },
  {} as Record<DimensionId, Dimension>,
);

export function dimensionWeight(id: DimensionId): number {
  return DIMENSION_BY_ID[id]?.weight ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Score bands & pass threshold  (Module Catalog §5 / Table 71)
// ─────────────────────────────────────────────────────────────────────────────

export type BandId = "weak" | "developing" | "proficient" | "strong";

export interface ScoreBand {
  id: BandId;
  min: number;
  max: number;
  label: string;
  labelAr: string;
  /** band at or above the pass line */
  pass: boolean;
}

export const SCORE_BANDS: readonly ScoreBand[] = [
  { id: "weak", min: 0, max: 39, label: "Weak", labelAr: "ضعيف", pass: false },
  { id: "developing", min: 40, max: 59, label: "Developing", labelAr: "قيد التطور", pass: false },
  { id: "proficient", min: 60, max: 79, label: "Proficient", labelAr: "كفؤ", pass: true },
  { id: "strong", min: 80, max: 100, label: "Strong", labelAr: "متميّز", pass: true },
] as const;

/** Platform pass threshold (Spec §5.4). A module/profile passes at >= 60. */
export const PASS_THRESHOLD = 60;

export function bandFor(score: number): ScoreBand {
  const s = clamp(score, 0, 100);
  // Bands are contiguous and ordered ascending, but their integer `max` values
  // (39/59/79) leave gaps for fractional scores (e.g. 59.8). Classify by the
  // lower bound only: the band is the highest one whose `min` the score meets.
  for (let i = SCORE_BANDS.length - 1; i >= 0; i--) {
    if (s >= SCORE_BANDS[i].min) return SCORE_BANDS[i];
  }
  return SCORE_BANDS[0];
}

export function isPass(score: number, threshold = PASS_THRESHOLD): boolean {
  return clamp(score, 0, 100) >= threshold;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Module & scoring shapes
// ─────────────────────────────────────────────────────────────────────────────

/** One rubric line. The weights across a module's criteria MUST sum to 100. */
export interface RubricCriterion {
  /** stable key, e.g. "structure" */
  criterion: string;
  /** weight 0-100; the criteria of one module sum to 100 */
  weight: number;
  /** what the criterion assesses (shown to faculty + fed to the model) */
  descriptor: string;
  /**
   * Optional hard gate: if true, a near-zero score on this criterion caps the
   * whole module (e.g. M19 "must identify the message as phishing"; M16
   * "Agile = 40 pts, Waterfall = 0"). Gate logic lives in heuristics/engine.
   */
  gate?: boolean;
}

/** A calibration anchor — fills BLOCK 4 of the prompt and MODULES.few_shot_examples. */
export interface FewShotAnchor {
  response: string;
  score: number;
  feedback: string;
}

/**
 * A complete assessment module. Universal modules are authored once (catalog.ts);
 * Job-Fit modules are resolved per specialization (curated or AI-generated).
 */
export interface AssessmentModuleSpec {
  /** e.g. "M01" for universal; "JOBFIT-CYBERSECURITY-1" for resolved Job-Fit */
  code: string;
  title: string;
  titleAr?: string;
  dimension: DimensionId;
  /** L1-A | L1-B | L2 | L3-* | L4 (diagnostic level, catalog §2.1) */
  level: string;
  /** named theoretical framework, e.g. "STAR method" */
  framework: string;
  focus: string;
  /** light-touch Saudi-context calibration guidance (not rewritten into prompt) */
  saudiContext?: string;
  scenario: string;
  scenarioAr?: string;
  instructions: string;
  instructionsAr?: string;
  rubric: RubricCriterion[];
  fewShot: FewShotAnchor[];
  passThreshold: number;
  /** second-pass coherence check (Spec §5.5) — off by default */
  validationEnabled: boolean;
  modelTag: string;
  temperature: number;
  /** null = universal (all specializations); else the discipline this serves */
  specialization: string | null;
  /** true when produced by the AI generator rather than the curated catalog */
  generated: boolean;
  /** indicative minutes, for the candidate journey */
  estimateMinutes?: number;
  questionType?: string;
  choices?: string[];
  choicesAr?: string[];
}

/**
 * Per-criterion score in a graded response.
 *
 * Shared keys (both scorers): `criterion`, `weight`, `score`, `max`, and usually
 * `justification`.
 *
 * Optional dual-call-only diagnostics — present when the dual-call fallback
 * produced the score; absent (or unused) on the four-block primary path:
 * `status`, `quote`, `auditVerdict`, `auditReasoning`. Downstream consumers
 * (report parsing, RDF mapping) MUST treat these as optional and must not
 * assume a fixed key set without checking for presence first.
 */
export interface CriterionScore {
  criterion: string;
  weight: number;
  /** awarded points on this criterion, 0..weight */
  score: number;
  max: number;
  /**
   * Dual-call only: scored normally, or evidence failed independent audit.
   * Four-block omits this field.
   */
  status?: "scored" | "insufficient_evidence";
  /** Dual-call only: verbatim evidence substring; four-block omits. */
  quote?: string | null;
  justification?: string | null;
  /** Dual-call only: independent Call B verdict; four-block omits. */
  auditVerdict?: "YES" | "NO" | null;
  /** Dual-call only: Call B reasoning; four-block omits. */
  auditReasoning?: string | null;
}

/** The canonical graded result (Spec §5.2 output JSON + calibration detail). */
export interface ScoredResponse {
  moduleCode: string;
  dimension: DimensionId;
  /** overall 0-100 */
  score: number;
  band: BandId;
  passed: boolean;
  perCriterion: CriterionScore[];
  feedback: string;
  strengths: string[];
  improvements: string[];
  /** null when the validation agent is disabled */
  validationPassed: boolean | null;
  model: string;
  source: "ai" | "fallback" | "keyed_mcq";
  latencyMs: number;
  tokensInput?: number;
  tokensOutput?: number;
  costUsd?: number;
  /**
   * Auditable Sections 1–6 when present (see score-diagnostics.ts).
   * Optional so older callers / persisted rows stay compatible.
   */
  diagnostics?: ScoringDiagnosticsSummary;
}

/** Compact audit payload attached to live scores (full shape in score-diagnostics). */
export interface ScoringDiagnosticsSummary {
  rubricSource: {
    criteria: string[];
    origin: "predefined" | "generated";
    originNote: string;
  };
  perCriterion: Array<{
    criterion: string;
    score0to10: number;
    explanation: string;
    status?: "scored" | "insufficient_evidence";
  }>;
  evidence: Array<{
    criterion: string;
    role: "highest" | "lowest";
    quote: string | null;
    note: string;
  }>;
  selfVerification: Array<{
    criterion: string;
    quote: string | null;
    matchesCriterion: "YES" | "NO";
    resolution: string;
  }>;
  finalOutput: {
    score: number;
    mostConvincing: string | null;
    weakest: string | null;
    feedback: string;
  };
  frameworkCheck: {
    framework: string;
    justification: string;
  };
  /** Full Call A + Call B trail per criterion (persisted). */
  criterionAudits?: Array<{
    criterion: string;
    attempts: Array<{
      callA: {
        score: number;
        quote: string | null;
        justification: string;
      };
      callB: { verdict: "YES" | "NO"; reasoning: string };
    }>;
    final: {
      status: "scored" | "insufficient_evidence";
      score0to10: number | null;
      quote: string | null;
      justification: string | null;
      verdict: "YES" | "NO" | null;
      verdictReasoning: string | null;
    };
  }>;
  /** First-pass Call A↔B agreement for this submission. */
  agreementRate?: { agreed: number; total: number; rate: number };
  auditText: string;
}

/** One dimension's rolled-up score inside a profile. */
export interface DimensionScore {
  dimension: DimensionId;
  label: string;
  labelAr: string;
  weight: number;
  /** mean of the dimension's module scores, 0-100 */
  score: number;
  /** how many modules contributed */
  moduleCount: number;
  band: BandId;
}

/** The four-dimension employability profile + weighted composite. */
export interface EmployabilityProfile {
  dimensions: DimensionScore[];
  /** RESULTS_SUMMARY.employability_score_4d — weighted composite 0-100 */
  composite: number;
  band: BandId;
  passed: boolean;
  /** the specialization the Job-Fit dimension was resolved for */
  specialization: string | null;
  /** dimensions with at least one scored module (coverage) */
  covered: DimensionId[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composite math  (Module Catalog §2.3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Roll a list of per-module scores into a four-dimension profile.
 * - A dimension score is the MEAN of its module scores.
 * - The composite re-normalises weights over the COVERED dimensions so a
 *   partial profile (e.g. Job-Fit not yet taken) is still reported fairly,
 *   rather than silently treating a missing dimension as zero.
 */
export function computeProfile(
  moduleScores: { dimension: DimensionId; score: number }[],
  specialization: string | null = null,
  threshold = PASS_THRESHOLD,
): EmployabilityProfile {
  const byDim = new Map<DimensionId, number[]>();
  for (const m of moduleScores) {
    if (!byDim.has(m.dimension)) byDim.set(m.dimension, []);
    byDim.get(m.dimension)!.push(clamp(m.score, 0, 100));
  }

  const dimensions: DimensionScore[] = DIMENSIONS.map((d) => {
    const scores = byDim.get(d.id) ?? [];
    const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      dimension: d.id,
      label: d.label,
      labelAr: d.labelAr,
      weight: d.weight,
      score: round1(mean),
      moduleCount: scores.length,
      band: bandFor(mean).id,
    };
  });

  const covered = dimensions.filter((d) => d.moduleCount > 0).map((d) => d.dimension);
  const totalWeight = covered.reduce((sum, id) => sum + dimensionWeight(id), 0);

  const composite =
    totalWeight > 0
      ? dimensions
          .filter((d) => d.moduleCount > 0)
          .reduce((sum, d) => sum + d.score * (d.weight / totalWeight), 0)
      : 0;

  const compositeRounded = round1(composite);
  return {
    dimensions,
    composite: compositeRounded,
    band: bandFor(compositeRounded).id,
    passed: isPass(compositeRounded, threshold),
    specialization,
    covered,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Small pure utilities (duplicated from iscarb-api on purpose to keep purity)
// ─────────────────────────────────────────────────────────────────────────────

export function clamp(n: number, min = 0, max = 100): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** True iff a rubric's weights sum to 100 (±1 for rounding). */
export function rubricWeightsValid(rubric: RubricCriterion[]): boolean {
  const sum = rubric.reduce((s, c) => s + (c.weight || 0), 0);
  return Math.abs(sum - 100) <= 1;
}
