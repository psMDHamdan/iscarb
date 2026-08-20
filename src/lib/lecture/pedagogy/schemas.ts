/**
 * Zod Validation Schemas for 10-Element Pedagogical Framework & 5-Layer Depth Model.
 * =================================================================================
 * Enforces runtime schema correctness across all pedagogical entities.
 */

import { z } from "zod";

// ─── Enums & Primitives ──────────────────────────────────────────────────────

export const PedagogicalStageEnum = z.enum([
  "DISCOVER",
  "UNDERSTAND",
  "EXPLORE",
  "PRACTICE",
  "APPLY",
  "CHALLENGE",
  "MASTER",
]);

export const BloomLevelEnum = z.enum([
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
]);

export const DistractorMisconceptionTypeEnum = z.enum([
  "OVER_GENERALIZATION",
  "REVERSE_CAUSALITY",
  "EDGE_CASE_NEGLECT",
  "CONFUSION_OF_TERMS",
]);

export const ObservableActivityTypeEnum = z.enum([
  "PREDICT",
  "CALCULATE",
  "ANALYZE",
  "CLASSIFY",
  "SEQUENCE",
  "DIAGNOSE",
  "MATCH",
  "GRAPH_INTERPRETATION",
  "ERROR_DETECTION",
  "WORKED_EXAMPLE",
  "TEACH_IT_BACK",
  "GUIDED_DISCUSSION",
  "CALCULATION_LAB",
  "PEER_POLL",
]);

// ─── 10-Element Pedagogical Framework Schemas ────────────────────────────────

// 1. Hook Schema
export const HookElementSchema = z.object({
  id: z.string().min(1),
  elementType: z.literal("HOOK"),
  headline: z.string().min(5),
  tensionContext: z.string().min(10),
  provocation: z.string().min(10),
  targetCuriosity: z.string().min(10),
  estimatedDurationSec: z.number().int().positive().default(60),
});

// 2. Concept Schema
export const ConceptElementSchema = z.object({
  id: z.string().min(1),
  elementType: z.literal("CONCEPT"),
  title: z.string().min(3),
  canonicalDefinition: z.string().min(15),
  governingInvariants: z.array(z.string().min(5)).min(1),
  bloomLevel: BloomLevelEnum,
  prerequisites: z.array(z.string()).default([]),
  cloIds: z.array(z.string()).default([]),
});

// 3. Mechanism Schema
export const MechanismStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  phase: z.string().min(2),
  trigger: z.string().min(5),
  action: z.string().min(5),
  outcome: z.string().min(5),
  stateChange: z.string().optional(),
});

export const MechanismElementSchema = z.object({
  id: z.string().min(1),
  elementType: z.literal("MECHANISM"),
  overview: z.string().min(10),
  causalChain: z.array(MechanismStepSchema).min(2),
  invariantsEnforced: z.array(z.string()).default([]),
  bottlenecks: z.array(z.string()).default([]),
});

// 4. Mental Model Schema
export const PrimitiveMappingSchema = z.object({
  sourcePrimitive: z.string().min(2),
  targetPrimitive: z.string().min(2),
  rationale: z.string().min(5),
});

export const MentalModelElementSchema = z.object({
  id: z.string().min(1),
  elementType: z.literal("MENTAL_MODEL"),
  analogyDomain: z.string().min(3),
  metaphor: z.string().min(10),
  primitiveMappings: z.array(PrimitiveMappingSchema).min(1),
  breakdownLimits: z.string().min(10),
});

// 5. Worked Example Schema
export const WorkedExampleStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  subGoal: z.string().min(5),
  mathematicalExpression: z.string().optional(),
  calculation: z.string().optional(),
  explanatoryNote: z.string().min(10),
  expertTip: z.string().optional(),
});

export const WorkedExampleElementSchema = z.object({
  id: z.string().min(1),
  elementType: z.literal("WORKED_EXAMPLE"),
  problemStatement: z.string().min(10),
  initialConditions: z.record(z.union([z.string(), z.number()])),
  steps: z.array(WorkedExampleStepSchema).min(2),
  finalSolution: z.string().min(5),
  verificationCheck: z.string().min(10),
});

// 6. Misconception Schema
export const MisconceptionItemSchema = z.object({
  commonBelief: z.string().min(5),
  distractorType: DistractorMisconceptionTypeEnum,
  whyIncorrect: z.string().min(10),
  refutationEvidence: z.string().min(10),
  correction: z.string().min(10),
  repairStrategy: z.string().min(10),
});

export const MisconceptionElementSchema = z.object({
  id: z.string().min(1),
  elementType: z.literal("MISCONCEPTION"),
  alertSummary: z.string().min(10),
  misconceptions: z.array(MisconceptionItemSchema).min(1),
});

// 7. Practice Schema
export const RubricCriterionSchema = z.object({
  criterion: z.string().min(5),
  weight: z.number().min(0).max(1),
  descriptor: z.string().min(5),
});

export const PracticeElementSchema = z.object({
  id: z.string().min(1),
  elementType: z.literal("PRACTICE"),
  activityType: ObservableActivityTypeEnum,
  title: z.string().min(3),
  prompt: z.string().min(10),
  actionVerb: z.string().min(2),
  scaffoldingLevel: z.enum(["guided", "fading", "independent"]),
  progressiveHints: z.tuple([
    z.string().min(5),
    z.string().min(5),
    z.string().min(5),
    z.string().min(5),
  ]),
  rubricCriteria: z.array(RubricCriterionSchema).min(1),
  modelAnswer: z.string().min(10),
});

// 8. Application Schema
export const TradeOffImpactSchema = z.object({
  dimensionA: z.string().min(2),
  dimensionB: z.string().min(2),
  resolution: z.string().min(5),
});

export const ApplicationElementSchema = z.object({
  id: z.string().min(1),
  elementType: z.literal("APPLICATION"),
  industryDomain: z.string().min(3),
  realWorldScenario: z.string().min(15),
  constraints: z.array(z.string().min(5)).min(1),
  tradeoffs: z.array(TradeOffImpactSchema).default([]),
  appliedSolution: z.string().min(15),
  keyLessons: z.array(z.string().min(5)).min(1),
});

// 9. Transfer Schema
export const StructuralMappingSchema = z.object({
  sourceInvariant: z.string().min(5),
  targetDomainFeature: z.string().min(5),
  transferRule: z.string().min(5),
});

export const TransferElementSchema = z.object({
  id: z.string().min(1),
  elementType: z.literal("TRANSFER"),
  targetDomain: z.string().min(3),
  isomorphicScenario: z.string().min(15),
  structuralMappings: z.array(StructuralMappingSchema).min(1),
  transferChallengePrompt: z.string().min(10),
  evaluationCriteria: z.array(z.string().min(5)).min(1),
});

// 10. Readiness Schema
export const AssessmentOptionSchema = z.object({
  id: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1),
  isCorrect: z.boolean(),
  misconceptionKey: DistractorMisconceptionTypeEnum.optional(),
  misconceptionExplanation: z.string().optional(),
});

export const ReadinessElementSchema = z.object({
  id: z.string().min(1),
  elementType: z.literal("READINESS"),
  stem: z.string().min(10),
  options: z.array(AssessmentOptionSchema).length(4),
  correctOptionId: z.enum(["A", "B", "C", "D"]),
  instructorRationale: z.string().min(15),
  distractorExplanations: z.record(z.string()),
  cloId: z.string().min(1),
  bloomLevel: BloomLevelEnum,
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  isFinalGate: z.boolean().default(false),
});

// ─── 5-Layer Pedagogical Depth Schemas ───────────────────────────────────────

export const AcademicTruthLayerSchema = z.object({
  formalStatement: z.string().min(10),
  invariants: z.array(z.string().min(5)).min(1),
  boundaryConditions: z.array(z.string().min(3)).default([]),
  canonicalCitation: z.string().optional(),
});

export const IntuitionMentalModelLayerSchema = z.object({
  metaphor: z.string().min(10),
  analogyDomain: z.string().min(3),
  mappings: z.array(PrimitiveMappingSchema).min(1),
  limitations: z.string().min(10),
});

export const MechanismExplanationLayerSchema = z.object({
  summary: z.string().min(10),
  steps: z.array(MechanismStepSchema).min(2),
  criticalPath: z.string().min(5),
});

export const RealWorldTransferLayerSchema = z.object({
  scenario: z.string().min(10),
  industryContext: z.string().min(3),
  tradeoffs: z.array(TradeOffImpactSchema).default([]),
  lessons: z.array(z.string().min(5)).default([]),
});

export const MisconceptionAlertLayerSchema = z.object({
  alertMessage: z.string().min(10),
  misconceptions: z.array(MisconceptionItemSchema).min(1),
  diagnosticDistractors: z.array(AssessmentOptionSchema).length(4),
  instructorRationale: z.string().min(15),
});

export const FiveLayerPedagogicalDepthSchema = z.object({
  academicTruth: AcademicTruthLayerSchema,
  intuitionMentalModel: IntuitionMentalModelLayerSchema,
  mechanismExplanation: MechanismExplanationLayerSchema,
  realWorldTransfer: RealWorldTransferLayerSchema,
  misconceptionAlert: MisconceptionAlertLayerSchema,
});

// ─── Composite Schemas ───────────────────────────────────────────────────────

export const PedagogicalMetadataSchema = z.object({
  hook: z.string().optional(),
  concept: z.string().optional(),
  mechanism: z.string().optional(),
  mentalModel: z.string().optional(),
  workedExample: z.string().optional(),
  misconception: z.string().optional(),
  practice: z.string().optional(),
  application: z.string().optional(),
  transfer: z.string().optional(),
  readiness: z.string().optional(),
});

export const PedagogicalElementsMapSchema = z.object({
  hook: HookElementSchema.optional(),
  concept: ConceptElementSchema.optional(),
  mechanism: MechanismElementSchema.optional(),
  mentalModel: MentalModelElementSchema.optional(),
  workedExample: WorkedExampleElementSchema.optional(),
  misconception: MisconceptionElementSchema.optional(),
  practice: PracticeElementSchema.optional(),
  application: ApplicationElementSchema.optional(),
  transfer: TransferElementSchema.optional(),
  readiness: ReadinessElementSchema.optional(),
});

export const PedagogicalExperienceBlockSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number().int().positive(),
  stage: PedagogicalStageEnum,
  title: z.string().min(2),
  bloomLevel: BloomLevelEnum,
  cloIds: z.array(z.string()).default([]),
  sourceBlockIds: z.array(z.string()).default([]),
  depth: FiveLayerPedagogicalDepthSchema,
  elements: PedagogicalElementsMapSchema.default({}),
});
