import { TransferElementSchema, StructuralMappingSchema } from "../schemas";
import type { TransferElement, StructuralMapping } from "../types";

export { TransferElementSchema, StructuralMappingSchema };
export type { TransferElement, StructuralMapping };

export function validateTransferElement(data: unknown): { valid: boolean; data?: TransferElement; error?: string } {
  const result = TransferElementSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as TransferElement };
}

export function createTransferElement(params: Omit<TransferElement, "elementType">): TransferElement {
  return TransferElementSchema.parse({
    ...params,
    elementType: "TRANSFER",
  }) as TransferElement;
}
