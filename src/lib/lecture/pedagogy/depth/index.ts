import { FiveLayerPedagogicalDepthSchema } from "../schemas";
import type { FiveLayerPedagogicalDepth } from "../types";

export * from "./academic-truth";
export * from "./intuition-mental-model";
export * from "./mechanism-explanation";
export * from "./real-world-transfer";
export * from "./misconception-alert";

export { FiveLayerPedagogicalDepthSchema };
export type { FiveLayerPedagogicalDepth };

export function validateFiveLayerDepth(data: unknown): {
  valid: boolean;
  data?: FiveLayerPedagogicalDepth;
  error?: string;
} {
  const result = FiveLayerPedagogicalDepthSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as FiveLayerPedagogicalDepth };
}
