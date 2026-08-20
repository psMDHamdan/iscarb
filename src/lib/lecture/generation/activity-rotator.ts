/**
 * Activity Diversity Rotator & Student Action Engine.
 * ===========================================================================
 * Rotates activity types intelligently across 15 interaction categories to
 * ensure high cognitive engagement without repetitive multiple-choice questions.
 */

export type ActivityType =
  | "prediction"
  | "classification"
  | "matching"
  | "ordering"
  | "calculation"
  | "graph_interpretation"
  | "image_interpretation"
  | "diagram_labeling"
  | "error_detection"
  | "scenario_diagnosis"
  | "comparison"
  | "short_explanation"
  | "case_decision"
  | "transfer"
  | "confidence_check";

export interface InteractiveActivity {
  id: string;
  slideNo: number;
  type: ActivityType;
  prompt: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation: string;
  actionRequired: string;
}

const ROTATION_SEQUENCE: ActivityType[] = [
  "prediction",
  "classification",
  "diagram_labeling",
  "calculation",
  "graph_interpretation",
  "error_detection",
  "scenario_diagnosis",
  "matching",
  "ordering",
  "comparison",
  "case_decision",
  "transfer",
  "short_explanation",
  "image_interpretation",
  "confidence_check",
];

export class ActivityRotator {
  private currentIndex = 0;

  public getNextActivityType(preferredType?: string | null): ActivityType {
    if (preferredType && preferredType !== "null" && preferredType !== "mcq") {
      const normalized = preferredType.toLowerCase().replace(/\s+/g, "_") as ActivityType;
      if (ROTATION_SEQUENCE.includes(normalized)) {
        return normalized;
      }
    }
    const type = ROTATION_SEQUENCE[this.currentIndex % ROTATION_SEQUENCE.length];
    this.currentIndex++;
    return type;
  }

  /** Select optimal activity type based on slide position and function, ensuring diversity. */
  public getActivityTypeForSlide(slideNo: number, slideFunction?: string): ActivityType {
    const stageMap: Record<string, ActivityType[]> = {
      problem: ["prediction", "scenario_diagnosis"],
      mental_map: ["classification", "diagram_labeling"],
      clos: ["confidence_check"],
      prior_knowledge: ["prediction", "matching"],
      core_concept: ["diagram_labeling", "classification"],
      mechanism: ["ordering", "error_detection"],
      misconception: ["error_detection", "comparison"],
      worked_example: ["calculation", "graph_interpretation"],
      guided_practice: ["calculation", "matching"],
      independent_practice: ["case_decision", "scenario_diagnosis"],
      real_world_case: ["case_decision", "transfer"],
      synthesis: ["short_explanation", "transfer"],
      readiness_gate: ["case_decision", "transfer", "calculation"],
    };

    if (slideFunction && stageMap[slideFunction]) {
      const options = stageMap[slideFunction];
      const selected = options[(slideNo - 1) % options.length];
      return selected;
    }

    return ROTATION_SEQUENCE[(slideNo - 1) % ROTATION_SEQUENCE.length];
  }

  public static getActionVerb(type: ActivityType): string {
    switch (type) {
      case "prediction":
        return "Predict what will happen next when the mechanism executes";
      case "classification":
        return "Categorize each item into its correct system domain";
      case "matching":
        return "Match each component to its corresponding functional role";
      case "ordering":
        return "Arrange the procedural steps in exact operational sequence";
      case "calculation":
        return "Calculate the quantitative value using the given formula";
      case "graph_interpretation":
        return "Analyze the graph trend and select the correct conclusion";
      case "image_interpretation":
        return "Examine the scientific diagram and identify the target anomaly";
      case "diagram_labeling":
        return "Label each component on the structural diagram";
      case "error_detection":
        return "Identify the flaw or incorrect step in the given scenario";
      case "scenario_diagnosis":
        return "Diagnose the root cause of system failure in the case study";
      case "comparison":
        return "Compare trade-offs between Option A and Option B";
      case "short_explanation":
        return "Synthesize a concise 2-sentence explanation of the result";
      case "case_decision":
        return "Make an executive decision for the real-world scenario";
      case "transfer":
        return "Apply this concept to a novel cross-disciplinary domain";
      case "confidence_check":
        return "Rate your confidence and justify your solution approach";
      default:
        return "Select the correct analytical option";
    }
  }
}
