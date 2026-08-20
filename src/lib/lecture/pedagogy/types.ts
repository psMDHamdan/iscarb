/**
 * 10-Element Pedagogical Framework & 5-Layer Pedagogical Depth Type Definitions.
 * ==============================================================================
 * Authoritative TypeScript interfaces matching ORIGINAL_REQUEST.md §R2 and PROJECT.md §2.
 */

// ─── Enums & Primitives ──────────────────────────────────────────────────────

export type PedagogicalStage =
  | "DISCOVER"
  | "UNDERSTAND"
  | "EXPLORE"
  | "PRACTICE"
  | "APPLY"
  | "CHALLENGE"
  | "MASTER";

export type BloomLevel =
  | "remember"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";

export type DistractorMisconceptionType =
  | "OVER_GENERALIZATION"
  | "REVERSE_CAUSALITY"
  | "EDGE_CASE_NEGLECT"
  | "CONFUSION_OF_TERMS";

export type ObservableActivityType =
  | "PREDICT"
  | "CALCULATE"
  | "ANALYZE"
  | "CLASSIFY"
  | "SEQUENCE"
  | "DIAGNOSE"
  | "MATCH"
  | "GRAPH_INTERPRETATION"
  | "ERROR_DETECTION"
  | "WORKED_EXAMPLE"
  | "TEACH_IT_BACK"
  | "GUIDED_DISCUSSION"
  | "CALCULATION_LAB"
  | "PEER_POLL";

// ─── 10-Element Pedagogical Framework Interfaces ─────────────────────────────

// 1. Hook Element
export interface HookElement {
  id: string;
  elementType: "HOOK";
  headline: string;
  tensionContext: string;
  provocation: string;
  targetCuriosity: string;
  estimatedDurationSec: number;
}

// 2. Concept Element
export interface ConceptElement {
  id: string;
  elementType: "CONCEPT";
  title: string;
  canonicalDefinition: string;
  governingInvariants: string[];
  bloomLevel: BloomLevel;
  prerequisites: string[];
  cloIds: string[];
}

// 3. Mechanism Element
export interface MechanismStep {
  stepNumber: number;
  phase: string;
  trigger: string;
  action: string;
  outcome: string;
  stateChange?: string;
}

export interface MechanismElement {
  id: string;
  elementType: "MECHANISM";
  overview: string;
  causalChain: MechanismStep[];
  invariantsEnforced: string[];
  bottlenecks: string[];
}

// 4. Mental Model Element
export interface PrimitiveMapping {
  sourcePrimitive: string;
  targetPrimitive: string;
  rationale: string;
}

export interface MentalModelElement {
  id: string;
  elementType: "MENTAL_MODEL";
  analogyDomain: string;
  metaphor: string;
  primitiveMappings: PrimitiveMapping[];
  breakdownLimits: string;
}

// 5. Worked Example Element
export interface WorkedExampleStep {
  stepNumber: number;
  subGoal: string;
  mathematicalExpression?: string;
  calculation?: string;
  explanatoryNote: string;
  expertTip?: string;
}

export interface WorkedExampleElement {
  id: string;
  elementType: "WORKED_EXAMPLE";
  problemStatement: string;
  initialConditions: Record<string, string | number>;
  steps: WorkedExampleStep[];
  finalSolution: string;
  verificationCheck: string;
}

// 6. Misconception Element
export interface MisconceptionItem {
  commonBelief: string;
  distractorType: DistractorMisconceptionType;
  whyIncorrect: string;
  refutationEvidence: string;
  correction: string;
  repairStrategy: string;
}

export interface MisconceptionElement {
  id: string;
  elementType: "MISCONCEPTION";
  alertSummary: string;
  misconceptions: MisconceptionItem[];
}

// 7. Practice Element
export interface RubricCriterion {
  criterion: string;
  weight: number;
  descriptor: string;
}

export interface PracticeElement {
  id: string;
  elementType: "PRACTICE";
  activityType: ObservableActivityType;
  title: string;
  prompt: string;
  actionVerb: string;
  scaffoldingLevel: "guided" | "fading" | "independent";
  progressiveHints: [string, string, string, string];
  rubricCriteria: RubricCriterion[];
  modelAnswer: string;
}

// 8. Application Element
export interface TradeOffImpact {
  dimensionA: string;
  dimensionB: string;
  resolution: string;
}

export interface ApplicationElement {
  id: string;
  elementType: "APPLICATION";
  industryDomain: string;
  realWorldScenario: string;
  constraints: string[];
  tradeoffs: TradeOffImpact[];
  appliedSolution: string;
  keyLessons: string[];
}

// 9. Transfer Element
export interface StructuralMapping {
  sourceInvariant: string;
  targetDomainFeature: string;
  transferRule: string;
}

export interface TransferElement {
  id: string;
  elementType: "TRANSFER";
  targetDomain: string;
  isomorphicScenario: string;
  structuralMappings: StructuralMapping[];
  transferChallengePrompt: string;
  evaluationCriteria: string[];
}

// 10. Readiness Element
export interface AssessmentOption {
  id: "A" | "B" | "C" | "D";
  text: string;
  isCorrect: boolean;
  misconceptionKey?: DistractorMisconceptionType;
  misconceptionExplanation?: string;
}

export interface ReadinessElement {
  id: string;
  elementType: "READINESS";
  stem: string;
  options: AssessmentOption[];
  correctOptionId: "A" | "B" | "C" | "D";
  instructorRationale: string;
  distractorExplanations: Record<string, string>;
  cloId: string;
  bloomLevel: BloomLevel;
  difficulty: "easy" | "medium" | "hard" | "expert";
  isFinalGate: boolean;
}

// ─── 5-Layer Pedagogical Depth Interfaces ────────────────────────────────────

export interface AcademicTruthLayer {
  formalStatement: string;
  invariants: string[];
  boundaryConditions: string[];
  canonicalCitation?: string;
}

export interface IntuitionMentalModelLayer {
  metaphor: string;
  analogyDomain: string;
  mappings: PrimitiveMapping[];
  limitations: string;
}

export interface MechanismExplanationLayer {
  summary: string;
  steps: MechanismStep[];
  criticalPath: string;
}

export interface RealWorldTransferLayer {
  scenario: string;
  industryContext: string;
  tradeoffs: TradeOffImpact[];
  lessons: string[];
}

export interface MisconceptionAlertLayer {
  alertMessage: string;
  misconceptions: MisconceptionItem[];
  diagnosticDistractors: AssessmentOption[];
  instructorRationale: string;
}

export interface FiveLayerPedagogicalDepth {
  academicTruth: AcademicTruthLayer;
  intuitionMentalModel: IntuitionMentalModelLayer;
  mechanismExplanation: MechanismExplanationLayer;
  realWorldTransfer: RealWorldTransferLayer;
  misconceptionAlert: MisconceptionAlertLayer;
}

// ─── Composite Interfaces ────────────────────────────────────────────────────

export interface PedagogicalMetadata {
  hook?: string;
  concept?: string;
  mechanism?: string;
  mentalModel?: string;
  workedExample?: string;
  misconception?: string;
  practice?: string;
  application?: string;
  transfer?: string;
  readiness?: string;
}

export interface PedagogicalElementsMap {
  hook?: HookElement;
  concept?: ConceptElement;
  mechanism?: MechanismElement;
  mentalModel?: MentalModelElement;
  workedExample?: WorkedExampleElement;
  misconception?: MisconceptionElement;
  practice?: PracticeElement;
  application?: ApplicationElement;
  transfer?: TransferElement;
  readiness?: ReadinessElement;
}

export interface PedagogicalExperienceBlock {
  id: string;
  orderIndex: number;
  stage: PedagogicalStage;
  title: string;
  bloomLevel: BloomLevel;
  cloIds: string[];
  sourceBlockIds: string[];
  depth: FiveLayerPedagogicalDepth;
  elements: PedagogicalElementsMap;
}
