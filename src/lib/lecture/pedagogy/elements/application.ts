import { ApplicationElementSchema, TradeOffImpactSchema } from "../schemas";
import type { ApplicationElement, TradeOffImpact } from "../types";

export { ApplicationElementSchema, TradeOffImpactSchema };
export type { ApplicationElement, TradeOffImpact };

export function validateApplicationElement(data: unknown): { valid: boolean; data?: ApplicationElement; error?: string } {
  const result = ApplicationElementSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as ApplicationElement };
}

export function createApplicationElement(params: Omit<ApplicationElement, "elementType">): ApplicationElement {
  return ApplicationElementSchema.parse({
    ...params,
    elementType: "APPLICATION",
  }) as ApplicationElement;
}
