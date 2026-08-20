import { MechanismExplanationLayerSchema } from "../schemas";
import type { MechanismExplanationLayer } from "../types";

export { MechanismExplanationLayerSchema };
export type { MechanismExplanationLayer };

export function validateMechanismExplanationLayer(data: unknown): { valid: boolean; data?: MechanismExplanationLayer; error?: string } {
  const result = MechanismExplanationLayerSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as MechanismExplanationLayer };
}

export function createMechanismExplanationLayer(params: MechanismExplanationLayer): MechanismExplanationLayer {
  return MechanismExplanationLayerSchema.parse(params) as MechanismExplanationLayer;
}
