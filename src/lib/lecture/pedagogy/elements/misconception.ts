import { MisconceptionElementSchema, MisconceptionItemSchema } from "../schemas";
import type { MisconceptionElement, MisconceptionItem } from "../types";

export { MisconceptionElementSchema, MisconceptionItemSchema };
export type { MisconceptionElement, MisconceptionItem };

export function validateMisconceptionElement(data: unknown): { valid: boolean; data?: MisconceptionElement; error?: string } {
  const result = MisconceptionElementSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as MisconceptionElement };
}

export function createMisconceptionElement(params: Omit<MisconceptionElement, "elementType">): MisconceptionElement {
  return MisconceptionElementSchema.parse({
    ...params,
    elementType: "MISCONCEPTION",
  }) as MisconceptionElement;
}
