import { FiveLayerPedagogicalDepthSchema, PedagogicalExperienceBlockSchema } from "../schemas";
import { validateZeroJargon } from "../../projections/utils/jargon-cleaner";

/**
 * Validates the completeness and pedagogical integrity of a PedagogicalExperienceBlock.
 */
export function validatePedagogicalBlock(block: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const parseResult = PedagogicalExperienceBlockSchema.safeParse(block);
  if (!parseResult.success) {
    parseResult.error.issues.forEach((issue) => {
      errors.push(`[${issue.path.join(".")}]: ${issue.message}`);
    });
    return { valid: false, errors };
  }

  const validBlock = parseResult.data;

  // Verify Depth Constraints
  if (validBlock.depth.academicTruth.formalStatement.length < 10) {
    errors.push("academicTruth.formalStatement must be at least 10 characters long.");
  }
  if (validBlock.depth.mechanismExplanation.steps.length < 2) {
    errors.push("mechanismExplanation must have at least 2 causal steps.");
  }
  if (validBlock.depth.misconceptionAlert.diagnosticDistractors.length !== 4) {
    errors.push("misconceptionAlert.diagnosticDistractors must contain exactly 4 options.");
  }

  // Verify Zero Jargon Leakage
  const jargonCheck = validateZeroJargon(validBlock);
  if (!jargonCheck.valid) {
    jargonCheck.violations.forEach((v) => {
      errors.push(`Forbidden jargon leaked at ${v.location}: "${v.matched}"`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that a complete learning experience satisfies pedagogical coherence and depth.
 */
export function validatePedagogicalCompleteness(experience: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!experience || typeof experience !== "object") {
    return { valid: false, errors: ["Experience must be a valid non-null object."] };
  }

  const blocks = experience.conceptBlocks || experience.blocks || [];
  if (!Array.isArray(blocks) || blocks.length === 0) {
    errors.push("Experience must contain at least one concept block.");
    return { valid: false, errors };
  }

  // Check each block
  blocks.forEach((block: any, idx: number) => {
    if (!block.academicTruth && !block.coreIdea && !block.depth) {
      errors.push(`Block [${idx + 1}] is missing academic truth / core idea.`);
    }
    if (!block.intuitionMentalModel && !block.depth?.intuitionMentalModel) {
      errors.push(`Block [${idx + 1}] is missing intuition / mental model.`);
    }
    if (!block.mechanismExplanation && !block.depth?.mechanismExplanation) {
      errors.push(`Block [${idx + 1}] is missing mechanism explanation.`);
    }
    if (!block.realWorldTransfer && !block.depth?.realWorldTransfer) {
      errors.push(`Block [${idx + 1}] is missing real-world transfer.`);
    }
    if (!block.misconceptionAlert && !block.depth?.misconceptionAlert) {
      errors.push(`Block [${idx + 1}] is missing misconception alert.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
