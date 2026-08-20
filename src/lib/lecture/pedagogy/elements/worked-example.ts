import { WorkedExampleElementSchema, WorkedExampleStepSchema } from "../schemas";
import type { WorkedExampleElement, WorkedExampleStep } from "../types";

export { WorkedExampleElementSchema, WorkedExampleStepSchema };
export type { WorkedExampleElement, WorkedExampleStep };

export function validateWorkedExampleElement(data: unknown): { valid: boolean; data?: WorkedExampleElement; error?: string } {
  const result = WorkedExampleElementSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as WorkedExampleElement };
}

export function createWorkedExampleElement(params: Omit<WorkedExampleElement, "elementType">): WorkedExampleElement {
  return WorkedExampleElementSchema.parse({
    ...params,
    elementType: "WORKED_EXAMPLE",
  }) as WorkedExampleElement;
}
