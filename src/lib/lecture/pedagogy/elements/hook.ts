import { HookElementSchema } from "../schemas";
import type { HookElement } from "../types";

export { HookElementSchema };
export type { HookElement };

export function validateHookElement(data: unknown): { valid: boolean; data?: HookElement; error?: string } {
  const result = HookElementSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as HookElement };
}

export function createHookElement(params: Omit<HookElement, "elementType">): HookElement {
  return HookElementSchema.parse({
    ...params,
    elementType: "HOOK",
  }) as HookElement;
}
