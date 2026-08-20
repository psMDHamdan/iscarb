import { AcademicTruthLayerSchema } from "../schemas";
import type { AcademicTruthLayer } from "../types";

export { AcademicTruthLayerSchema };
export type { AcademicTruthLayer };

export function validateAcademicTruthLayer(data: unknown): { valid: boolean; data?: AcademicTruthLayer; error?: string } {
  const result = AcademicTruthLayerSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as AcademicTruthLayer };
}

export function createAcademicTruthLayer(params: AcademicTruthLayer): AcademicTruthLayer {
  return AcademicTruthLayerSchema.parse(params) as AcademicTruthLayer;
}
