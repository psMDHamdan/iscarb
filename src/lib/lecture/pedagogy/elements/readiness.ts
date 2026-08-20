import { ReadinessElementSchema, AssessmentOptionSchema } from "../schemas";
import type { ReadinessElement, AssessmentOption } from "../types";

export { ReadinessElementSchema, AssessmentOptionSchema };
export type { ReadinessElement, AssessmentOption };

export function validateReadinessElement(data: unknown): { valid: boolean; data?: ReadinessElement; error?: string } {
  const result = ReadinessElementSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as ReadinessElement };
}

export function createReadinessElement(params: Omit<ReadinessElement, "elementType">): ReadinessElement {
  return ReadinessElementSchema.parse({
    ...params,
    elementType: "READINESS",
  }) as ReadinessElement;
}
