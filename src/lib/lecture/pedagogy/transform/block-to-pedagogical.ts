import type { ConceptBlock } from "../../types/learning-experience";
import type { FiveLayerPedagogicalDepth, DistractorMisconceptionType } from "../types";
import { FiveLayerPedagogicalDepthSchema } from "../schemas";

/**
 * Extracts structured FiveLayerPedagogicalDepth models from a canonical ConceptBlock.
 */
export function extractPedagogicalFromConceptBlock(block: ConceptBlock): FiveLayerPedagogicalDepth {
  const formalStatement = block.academicTruth || block.coreIdea || block.title;
  const invariants = block.coreIdea ? [block.coreIdea] : [formalStatement];

  const metaphor = block.intuitionMentalModel || `Intuitive schema for understanding ${block.title}`;
  const analogyDomain = "Real-World Metaphor";
  const mappings = [
    {
      sourcePrimitive: "Metaphor Schema",
      targetPrimitive: block.title,
      rationale: "Maps physical intuition to technical invariant",
    },
  ];
  const limitations = "Breaks down at extreme scale and edge boundaries.";

  const summary = block.mechanismExplanation || `Causal mechanism for ${block.title}`;
  const steps = block.keyTakeaways && block.keyTakeaways.length >= 2
    ? block.keyTakeaways.map((takeaway, idx) => ({
        stepNumber: idx + 1,
        phase: `Phase ${idx + 1}`,
        trigger: "Precondition verified",
        action: takeaway,
        outcome: "State updated",
      }))
    : [
        {
          stepNumber: 1,
          phase: "Initiation",
          trigger: "Input trigger",
          action: summary.slice(0, 50) || "Initialize state",
          outcome: "State initialized",
        },
        {
          stepNumber: 2,
          phase: "Execution",
          trigger: "Validation",
          action: summary.slice(50, 100) || "Complete state transition",
          outcome: "Output delivered",
        },
      ];

  const scenario = block.realWorldTransfer || `Industrial application context for ${block.title}`;
  const industryContext = "Industry Practice";
  const tradeoffs = [
    {
      dimensionA: "Complexity",
      dimensionB: "Reliability",
      resolution: "Balanced for optimal system robustness",
    },
  ];
  const lessons = block.keywords || [`Mastery of ${block.title} ensures predictable outcomes.`];

  const alertMessage = block.misconceptionAlert || `Common cognitive traps regarding ${block.title}`;
  const misconceptions = block.misconceptions && block.misconceptions.length > 0
    ? block.misconceptions.map((m) => ({
        commonBelief: m.commonBelief,
        distractorType: m.distractorType || ("OVER_GENERALIZATION" as DistractorMisconceptionType),
        whyIncorrect: m.whyIncorrect,
        refutationEvidence: "Theoretical proofs and empirical benchmarks demonstrate this flaw.",
        correction: m.correction,
        repairStrategy: "Trace the step-by-step causal mechanism.",
      }))
    : [
        {
          commonBelief: `Assuming ${block.title} operates unconditionally.`,
          distractorType: "OVER_GENERALIZATION" as DistractorMisconceptionType,
          whyIncorrect: "Ignores governing boundary invariants.",
          refutationEvidence: "System boundary tests fail when invariants are violated.",
          correction: "Always verify boundary constraints.",
          repairStrategy: "Apply precondition assertions before state transition.",
        },
      ];

  const diagnosticDistractors = [
    { id: "A" as const, text: formalStatement, isCorrect: true },
    {
      id: "B" as const,
      text: misconceptions[0]?.commonBelief || "Flawed belief regarding the mechanism",
      isCorrect: false,
      misconceptionKey: (misconceptions[0]?.distractorType || "OVER_GENERALIZATION") as DistractorMisconceptionType,
      misconceptionExplanation: misconceptions[0]?.whyIncorrect || "Violates core principles",
    },
    {
      id: "C" as const,
      text: "Inverting the causal dependency chain",
      isCorrect: false,
      misconceptionKey: "REVERSE_CAUSALITY" as DistractorMisconceptionType,
      misconceptionExplanation: "Causes must precede effects",
    },
    {
      id: "D" as const,
      text: "Conflating distinct domain terminology",
      isCorrect: false,
      misconceptionKey: "CONFUSION_OF_TERMS" as DistractorMisconceptionType,
      misconceptionExplanation: "Terms have distinct mathematical definitions",
    },
  ];

  const candidate: FiveLayerPedagogicalDepth = {
    academicTruth: {
      formalStatement,
      invariants,
      boundaryConditions: [],
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
      criticalPath: "Core causal pathway",
    },
    realWorldTransfer: {
      scenario,
      industryContext,
      tradeoffs,
      lessons,
    },
    misconceptionAlert: {
      alertMessage,
      misconceptions,
      diagnosticDistractors,
      instructorRationale: `Option A is the correct academic truth: ${formalStatement}`,
    },
  };

  return FiveLayerPedagogicalDepthSchema.parse(candidate) as FiveLayerPedagogicalDepth;
}
