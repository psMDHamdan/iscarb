import type { ConceptBlock } from "../../types/learning-experience";
import type { PedagogicalExperienceBlock } from "../types";

/**
 * Builds a canonical ConceptBlock for the LearningExperience entity from
 * a validated PedagogicalExperienceBlock.
 */
export function buildConceptBlockFromPedagogical(
  block: PedagogicalExperienceBlock,
  experienceId = "experience-default"
): ConceptBlock {
  const depth = block.depth;

  const keyTakeaways = depth.mechanismExplanation.steps.map(
    (step) => `${step.action}: ${step.outcome}`
  );

  const keywords = [
    ...depth.academicTruth.invariants,
    ...depth.realWorldTransfer.lessons,
  ].filter(Boolean);

  const misconceptions = depth.misconceptionAlert.misconceptions.map((m) => ({
    commonBelief: m.commonBelief,
    whyIncorrect: m.whyIncorrect,
    correction: m.correction,
    distractorType: m.distractorType,
  }));

  const now = new Date();

  return {
    id: block.id,
    experienceId,
    orderIndex: block.orderIndex,
    slug: block.id.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    stageCategory: block.stage,
    title: block.title,
    bloomLevel: block.bloomLevel,
    coreIdea: depth.academicTruth.invariants[0] || depth.academicTruth.formalStatement,
    academicTruth: depth.academicTruth.formalStatement,
    intuitionMentalModel: depth.intuitionMentalModel.metaphor,
    mechanismExplanation: depth.mechanismExplanation.summary,
    realWorldTransfer: depth.realWorldTransfer.scenario,
    misconceptionAlert: depth.misconceptionAlert.alertMessage,
    misconceptions,
    keyTakeaways,
    keywords,
    estimatedMinutes: 7,
    cloIds: block.cloIds,
    sourceBlockIds: block.sourceBlockIds,
    createdAt: now,
    updatedAt: now,
  };
}
