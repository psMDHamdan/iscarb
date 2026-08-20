import { MechanismElementSchema, MechanismStepSchema } from "../schemas";
import type { MechanismElement, MechanismStep } from "../types";

export { MechanismElementSchema, MechanismStepSchema };
export type { MechanismElement, MechanismStep };

export function validateMechanismElement(data: unknown): { valid: boolean; data?: MechanismElement; error?: string } {
  const result = MechanismElementSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as MechanismElement };
}

export function createMechanismElement(params: Omit<MechanismElement, "elementType">): MechanismElement {
  return MechanismElementSchema.parse({
    ...params,
    elementType: "MECHANISM",
  }) as MechanismElement;
}
