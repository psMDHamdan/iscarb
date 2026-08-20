/**
 * Pass Registry & Base Pipeline Interface (Milestone 1 — Feature F2).
 * ===================================================================
 */

import type { PipelineContext } from "./pipeline-context";

export interface PipelinePass {
  readonly passNumber: number;
  readonly passName: string;
  readonly description: string;
  execute(ctx: PipelineContext): Promise<PipelineContext>;
}

export class PassRegistry {
  private passes = new Map<number, PipelinePass>();

  register(pass: PipelinePass): void {
    if (this.passes.has(pass.passNumber)) {
      console.warn(`[PassRegistry] Overwriting existing pass ${pass.passNumber}: ${pass.passName}`);
    }
    this.passes.set(pass.passNumber, pass);
  }

  get(passNumber: number): PipelinePass | undefined {
    return this.passes.get(passNumber);
  }

  has(passNumber: number): boolean {
    return this.passes.has(passNumber);
  }

  getAll(): PipelinePass[] {
    return Array.from(this.passes.values()).sort((a, b) => a.passNumber - b.passNumber);
  }
}

export const globalPassRegistry = new PassRegistry();
