/**
 * iSCARB Employability Assessment — PUBLIC SURFACE (browser-safe)
 * ===========================================================================
 * Import the four-dimension methodology from one place:
 *
 *   import { DIMENSIONS, computeProfile, modulesForSpecialization } from "@/lib/assessment";
 *
 * This barrel re-exports ONLY the pure modules (framework + catalog +
 * heuristics) so it is safe to import from React components, route handlers,
 * and the standalone verification harness alike.
 *
 * The AI- and DB-touching engine is `import "server-only"` and is therefore
 * imported DIRECTLY where it is needed (the API routes):
 *
 *   import { scoreResponse, generateJobFitModule, assembleProfile } from "@/lib/assessment/engine";
 *
 * Keeping it out of this barrel prevents "server-only" from leaking into the
 * client bundle.
 * ===========================================================================
 */

// ── Framework: dimensions, bands, shapes, composite math ─────────────────────
export {
  DIMENSIONS,
  DIMENSION_BY_ID,
  dimensionWeight,
  SCORE_BANDS,
  PASS_THRESHOLD,
  bandFor,
  isPass,
  computeProfile,
  clamp,
  round1,
  rubricWeightsValid,
} from "./framework";

export type {
  DimensionId,
  Dimension,
  BandId,
  ScoreBand,
  RubricCriterion,
  FewShotAnchor,
  AssessmentModuleSpec,
  CriterionScore,
  ScoredResponse,
  ScoringDiagnosticsSummary,
  DimensionScore,
  EmployabilityProfile,
} from "./framework";

// ── Catalog: universal modules + per-specialization Job-Fit resolution ───────
export {
  UNIVERSAL_MODULES,
  V1_UNIVERSAL_MODULE_CODES,
  JOBFIT_BLUEPRINTS,
  JOBFIT_TRACKS,
  resolveRegulator,
  normalizeSpec,
  generateGenericJobFit,
  resolveJobFitBlueprint,
  resolveJobFitTrackKey,
  canonicalSpecializationLabel,
  v1UniversalModules,
  jobFitModulesFor,
  modulesForSpecialization,
  resolveAssessmentModuleSet,
  findModule,
  curatedSpecializations,
  curatedSpecializationLabels,
} from "./catalog";

export { normalizeScoringSource, isAiGradedSource } from "./scoring-source";
export type { ScoringSourceConcept } from "./scoring-source";
export { liveCurrentResponseWhere } from "./live-response-where";

export type {
  RegulatorAnchor,
  JobFitModuleTemplate,
  JobFitBlueprint,
  JobFitTrack,
  CatalogJobFitTrack,
  BlueprintJobFitTrack,
} from "./catalog";

// ── Attempt selection (seeded variants) ──────────────────────────────────────
export {
  selectModulesForAttempt,
  findModuleForAttempt,
  attemptSeedKey,
  JOBFIT_PER_ATTEMPT,
} from "./attempt-selection";

export type {
  AttemptModuleSet,
  AttemptSelectionMeta,
  AttemptSeedInput,
} from "./attempt-selection";

// ── Heuristics: deterministic fallback scorer + validator ────────────────────
export {
  heuristicScore,
  heuristicValidate,
} from "./heuristics";

export {
  evaluatePreScoreGates,
  isNonAnswer,
  isMcqModule,
  isPlaceholderTemplate,
  evidencePhraseForCriterion,
  GATE1_FEEDBACK,
  GATE2_FEEDBACK,
  GATE1_SCORE_MAX,
  GATE2_SCORE_CAP,
} from "./score-gates";

export {
  buildScoringDiagnostics,
  buildGateFailureDiagnostics,
  formatDiagnosticsAudit,
  parseAiDiagnostics,
} from "./score-diagnostics";

export type { ScoringDiagnostics, CriterionAuditTrail } from "./score-diagnostics";
