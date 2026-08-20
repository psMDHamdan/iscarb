import { RealWorldTransferLayerSchema } from "../schemas";
import type { RealWorldTransferLayer } from "../types";

export { RealWorldTransferLayerSchema };
export type { RealWorldTransferLayer };

export function validateRealWorldTransferLayer(data: unknown): { valid: boolean; data?: RealWorldTransferLayer; error?: string } {
  const result = RealWorldTransferLayerSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as RealWorldTransferLayer };
}

export function createRealWorldTransferLayer(params: RealWorldTransferLayer): RealWorldTransferLayer {
  return RealWorldTransferLayerSchema.parse(params) as RealWorldTransferLayer;
}
