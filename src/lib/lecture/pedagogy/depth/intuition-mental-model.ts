import { IntuitionMentalModelLayerSchema } from "../schemas";
import type { IntuitionMentalModelLayer } from "../types";

export { IntuitionMentalModelLayerSchema };
export type { IntuitionMentalModelLayer };

export function validateIntuitionMentalModelLayer(data: unknown): { valid: boolean; data?: IntuitionMentalModelLayer; error?: string } {
  const result = IntuitionMentalModelLayerSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, error: result.error.message };
  }
  return { valid: true, data: result.data as IntuitionMentalModelLayer };
}

export function createIntuitionMentalModelLayer(params: IntuitionMentalModelLayer): IntuitionMentalModelLayer {
  return IntuitionMentalModelLayerSchema.parse(params) as IntuitionMentalModelLayer;
}
