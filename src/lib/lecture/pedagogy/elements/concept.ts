import { ConceptElementSchema } from "../schemas";
import type { ConceptElement } from "../types";

export { ConceptElementSchema };
export type { ConceptElement };

export function validateConceptElement(data: unknown): { valid: boolean; data?: ConceptElement; error?: string } {
  const result = ConceptElementSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as ConceptElement };
}

export function createConceptElement(params: Omit<ConceptElement, "elementType">): ConceptElement {
  return ConceptElementSchema.parse({
    ...params,
    elementType: "CONCEPT",
  }) as ConceptElement;
}
