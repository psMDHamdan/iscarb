import type {
  PedagogicalExperienceBlock,
  PedagogicalStage,
  BloomLevel,
  DistractorMisconceptionType,
  FiveLayerPedagogicalDepth,
} from "../types";
import { PedagogicalExperienceBlockSchema } from "../schemas";

/**
 * Transforms raw LLM generation output into a structured and validated PedagogicalExperienceBlock.
 */
export function parseRawToPedagogical(
  raw: any,
  defaultStage: PedagogicalStage = "UNDERSTAND",
  orderIndex = 1
): PedagogicalExperienceBlock {
  const stage = (raw.stage || raw.stageCategory || defaultStage) as PedagogicalStage;
  const title = String(raw.title || `Concept ${orderIndex}`).trim();
  const bloomLevel = (raw.bloomLevel || "understand") as BloomLevel;
  const id = String(raw.id || `concept-block-${orderIndex}`);

  // 1. Layer 1: Academic Truth
  const rawTruth = raw.academicTruth || raw.truth || raw.coreIdea || title;
  const formalStatement = typeof rawTruth === "string" ? rawTruth : String(rawTruth?.formalStatement || title);
  const invariants = Array.isArray(rawTruth?.invariants) && rawTruth.invariants.length > 0
    ? rawTruth.invariants.map(String)
    : [formalStatement];

  // 2. Layer 2: Intuition & Mental Model
  const rawModel = raw.intuitionMentalModel || raw.mentalModel || raw.analogy || {};
  const metaphor = typeof rawModel === "string"
    ? rawModel
    : String(rawModel.metaphor || rawModel.analogy || `Conceptual bridge for understanding ${title}`);
  const analogyDomain = String(rawModel.analogyDomain || "Physical Systems");
  const mappings = Array.isArray(rawModel.mappings || rawModel.primitiveMappings) && (rawModel.mappings || rawModel.primitiveMappings).length > 0
    ? (rawModel.mappings || rawModel.primitiveMappings)
    : [
        {
          sourcePrimitive: "Physical Model",
          targetPrimitive: title,
          rationale: `Illustrates the core mechanism of ${title}`,
        },
      ];
  const limitations = String(rawModel.limitations || rawModel.breakdownLimits || "Metaphor breaks down at extreme edge scale.");

  // 3. Layer 3: Mechanism Explanation
  const rawMech = raw.mechanismExplanation || raw.mechanism || {};
  const summary = typeof rawMech === "string" ? rawMech : String(rawMech.summary || rawMech.overview || `Operational mechanism governing ${title}`);
  const steps = Array.isArray(rawMech.steps || rawMech.causalChain) && (rawMech.steps || rawMech.causalChain).length >= 2
    ? (rawMech.steps || rawMech.causalChain).map((s: any, idx: number) => ({
        stepNumber: s.stepNumber ?? idx + 1,
        phase: String(s.phase || `Phase ${idx + 1}`),
        trigger: String(s.trigger || "System input stimulus"),
        action: String(s.action || s.text || "Executes state transition"),
        outcome: String(s.outcome || "Produces invariant state output"),
        stateChange: s.stateChange ? String(s.stateChange) : undefined,
      }))
    : [
        {
          stepNumber: 1,
          phase: "Initiation",
          trigger: "Input received",
          action: "Process initial state variables",
          outcome: "State initialized",
        },
        {
          stepNumber: 2,
          phase: "Transformation",
          trigger: "Validation passed",
          action: "Execute core algorithmic transformation",
          outcome: "Invariant preserved output generated",
        },
      ];

  // 4. Layer 4: Real-World Transfer
  const rawTransfer = raw.realWorldTransfer || raw.transfer || raw.application || {};
  const scenario = typeof rawTransfer === "string" ? rawTransfer : String(rawTransfer.scenario || `Industrial deployment context applying ${title}`);
  const industryContext = String(rawTransfer.industryContext || rawTransfer.industryDomain || "Enterprise Systems");
  const tradeoffs = Array.isArray(rawTransfer.tradeoffs)
    ? rawTransfer.tradeoffs
    : [
        {
          dimensionA: "Performance / Latency",
          dimensionB: "Consistency / Accuracy",
          resolution: "Balanced via architectural trade-off",
        },
      ];
  const lessons = Array.isArray(rawTransfer.lessons || rawTransfer.keyLessons)
    ? (rawTransfer.lessons || rawTransfer.keyLessons).map(String)
    : [`Apply ${title} with full awareness of system constraints.`];

  // 5. Layer 5: Misconception Alert & Distractor Modeling
  const rawAlert = raw.misconceptionAlert || raw.misconception || {};
  const alertMessage = typeof rawAlert === "string" ? rawAlert : String(rawAlert.alertMessage || rawAlert.alertSummary || `Critical pitfalls and flawed intuition regarding ${title}`);
  const rawMisconceptions = Array.isArray(rawAlert.misconceptions || raw.misconceptions) && (rawAlert.misconceptions || raw.misconceptions).length > 0
    ? (rawAlert.misconceptions || raw.misconceptions)
    : [
        {
          commonBelief: `Believing ${title} applies universally without boundary constraints.`,
          distractorType: "OVER_GENERALIZATION" as DistractorMisconceptionType,
          whyIncorrect: "Violates fundamental boundary constraints.",
          refutationEvidence: "Empirical benchmarking reveals system failure under overloaded parameters.",
          correction: `Verify boundary conditions prior to applying ${title}.`,
          repairStrategy: "Check system preconditions before state transition.",
        },
      ];

  const diagnosticDistractors = Array.isArray(rawAlert.diagnosticDistractors) && rawAlert.diagnosticDistractors.length === 4
    ? rawAlert.diagnosticDistractors
    : [
        { id: "A" as const, text: formalStatement, isCorrect: true },
        {
          id: "B" as const,
          text: `Inverting the causal order in ${title}`,
          isCorrect: false,
          misconceptionKey: "REVERSE_CAUSALITY" as DistractorMisconceptionType,
          misconceptionExplanation: "Causes cannot follow effects.",
        },
        {
          id: "C" as const,
          text: `Applying ${title} without considering edge cases`,
          isCorrect: false,
          misconceptionKey: "EDGE_CASE_NEGLECT" as DistractorMisconceptionType,
          misconceptionExplanation: "Boundary limits must be maintained.",
        },
        {
          id: "D" as const,
          text: `Conflating ${title} with unrelated mechanisms`,
          isCorrect: false,
          misconceptionKey: "CONFUSION_OF_TERMS" as DistractorMisconceptionType,
          misconceptionExplanation: "Terminology must remain precise.",
        },
      ];

  const depth: FiveLayerPedagogicalDepth = {
    academicTruth: {
      formalStatement,
      invariants,
      boundaryConditions: Array.isArray(rawTruth?.boundaryConditions) ? rawTruth.boundaryConditions : [],
      canonicalCitation: rawTruth?.canonicalCitation,
    },
    intuitionMentalModel: {
      metaphor,
      analogyDomain,
      mappings,
      limitations,
    },
    mechanismExplanation: {
      summary,
      steps,
      criticalPath: String(rawMech.criticalPath || "Core state transition bottleneck"),
    },
    realWorldTransfer: {
      scenario,
      industryContext,
      tradeoffs,
      lessons,
    },
    misconceptionAlert: {
      alertMessage,
      misconceptions: rawMisconceptions,
      diagnosticDistractors,
      instructorRationale: String(rawAlert.instructorRationale || `Option A accurately states the governing invariant: ${formalStatement}`),
    },
  };

  const blockCandidate = {
    id,
    orderIndex,
    stage,
    title,
    bloomLevel,
    cloIds: Array.isArray(raw.cloIds) ? raw.cloIds : [],
    sourceBlockIds: Array.isArray(raw.sourceBlockIds) ? raw.sourceBlockIds : [],
    depth,
    elements: raw.elements || {},
  };

  return PedagogicalExperienceBlockSchema.parse(blockCandidate) as PedagogicalExperienceBlock;
}
