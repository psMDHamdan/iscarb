import { MentalModelElementSchema, PrimitiveMappingSchema } from "../schemas";
import type { MentalModelElement, PrimitiveMapping } from "../types";

export { MentalModelElementSchema, PrimitiveMappingSchema };
export type { MentalModelElement, PrimitiveMapping };

export function validateMentalModelElement(data: unknown): { valid: boolean; data?: MentalModelElement; error?: string } {
  const result = MentalModelElementSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as MentalModelElement };
}

export function createMentalModelElement(params: Omit<MentalModelElement, "elementType">): MentalModelElement {
  return MentalModelElementSchema.parse({
    ...params,
    elementType: "MENTAL_MODEL",
  }) as MentalModelElement;
}
