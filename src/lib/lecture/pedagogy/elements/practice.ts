import { PracticeElementSchema, RubricCriterionSchema } from "../schemas";
import type { PracticeElement, RubricCriterion } from "../types";

export { PracticeElementSchema, RubricCriterionSchema };
export type { PracticeElement, RubricCriterion };

export function validatePracticeElement(data: unknown): { valid: boolean; data?: PracticeElement; error?: string } {
  const result = PracticeElementSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as PracticeElement };
}

export function createPracticeElement(params: Omit<PracticeElement, "elementType">): PracticeElement {
  return PracticeElementSchema.parse({
    ...params,
    elementType: "PRACTICE",
  }) as PracticeElement;
}
