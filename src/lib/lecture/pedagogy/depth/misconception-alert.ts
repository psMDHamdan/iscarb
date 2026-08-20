import { MisconceptionAlertLayerSchema } from "../schemas";
import type { MisconceptionAlertLayer } from "../types";

export { MisconceptionAlertLayerSchema };
export type { MisconceptionAlertLayer };

export function validateMisconceptionAlertLayer(data: unknown): { valid: boolean; data?: MisconceptionAlertLayer; error?: string } {
  const result = MisconceptionAlertLayerSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as MisconceptionAlertLayer };
}

export function createMisconceptionAlertLayer(params: MisconceptionAlertLayer): MisconceptionAlertLayer {
  return MisconceptionAlertLayerSchema.parse(params) as MisconceptionAlertLayer;
}
