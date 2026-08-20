import { DistractorMisconceptionTypeEnum } from "../schemas";
import type { AssessmentOption, DistractorMisconceptionType } from "../types";

/**
 * Validates the diagnostic integrity of assessment MCQ options:
 * 1. Exactly 4 options (A, B, C, D).
 * 2. Exactly 1 correct answer (isCorrect === true).
 * 3. Exactly 3 distractors (isCorrect === false).
 * 4. All distractors must have a valid DistractorMisconceptionType.
 * 5. Across the 3 distractors, at least 3 distinct misconception types must be represented
 *    to avoid diagnostic blind spots.
 */
export function validateDistractorIntegrity(options: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(options)) {
    return { valid: false, errors: ["Options must be an array of 4 items."] };
  }

  if (options.length !== 4) {
    errors.push(`Expected exactly 4 options, but received ${options.length}.`);
  }

  const expectedIds = ["A", "B", "C", "D"];
  const idsFound = new Set<string>();
  let correctCount = 0;
  const distractorTypes = new Set<DistractorMisconceptionType>();

  options.forEach((opt: any, idx: number) => {
    if (!opt || typeof opt !== "object") {
      errors.push(`Option [${idx + 1}] is not a valid object.`);
      return;
    }

    if (!opt.text || typeof opt.text !== "string" || opt.text.trim().length === 0) {
      errors.push(`Option [${opt.id || idx + 1}] has empty text.`);
    }

    if (opt.id) {
      idsFound.add(opt.id);
    }

    if (opt.isCorrect === true) {
      correctCount++;
    } else {
      // Distractor validation
      if (!opt.misconceptionKey) {
        errors.push(`Distractor [${opt.id || idx + 1}] is missing a misconceptionKey.`);
      } else {
        const parseKey = DistractorMisconceptionTypeEnum.safeParse(opt.misconceptionKey);
        if (!parseKey.success) {
          errors.push(`Distractor [${opt.id || idx + 1}] has invalid misconceptionKey: "${opt.misconceptionKey}".`);
        } else {
          distractorTypes.add(parseKey.data);
        }
      }
    }
  });

  // Verify unique A, B, C, D IDs
  for (const expId of expectedIds) {
    if (!idsFound.has(expId)) {
      errors.push(`Missing option ID '${expId}'.`);
    }
  }

  // Verify exactly 1 correct answer
  if (correctCount !== 1) {
    errors.push(`Assessment item must have exactly 1 correct answer, found ${correctCount}.`);
  }

  // Verify distractor distinctness (at least 3 distinct misconception categories among the 3 distractors)
  if (distractorTypes.size < 3 && options.length === 4 && correctCount === 1) {
    errors.push(
      `Assessment distractors must cover at least 3 distinct misconception types, but only found ${distractorTypes.size}: [${Array.from(distractorTypes).join(", ")}].`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
