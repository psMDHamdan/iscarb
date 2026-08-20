/**
 * Abstract Base Class for Multi-Format Projection Adapters.
 * ==========================================================
 * Provides standardized error formatting, metadata collection, checksumming,
 * and contract validation across all export formats.
 */

import { createHash } from "crypto";
import type {
  LearningExperience,
  LearningExperienceModel,
} from "../types/learning-experience";
import type {
  ProjectionAdapter,
  ProjectionError,
  ProjectionMetadata,
  ProjectionResult,
} from "./types";

export abstract class BaseProjectionAdapter<
  TInput extends LearningExperience = LearningExperience,
  TOutput = unknown,
  TOptions = unknown
> implements ProjectionAdapter<TInput, TOutput, TOptions> {
  abstract readonly format: string;
  abstract readonly name: string;

  /**
   * Primary projection method to be implemented by concrete adapters.
   */
  abstract executeProjection(input: TInput, options?: TOptions): Promise<TOutput> | TOutput;

  /**
   * Executes the projection lifecycle with error handling, telemetry, and validation.
   */
  async project(input: TInput, options?: TOptions): Promise<ProjectionResult<TOutput>> {
    const startTime = Date.now();
    const errors: ProjectionError[] = [];
    const warnings: ProjectionError[] = [];

    // 1. Validation Step
    const isValid = await this.validate(input);
    if (!isValid) {
      errors.push({
        code: "VALIDATION_FAILED",
        message: `Input canonical model failed validation for adapter ${this.name}`,
        severity: "error",
      });
      return this.formatResult(undefined, errors, warnings, input, startTime);
    }

    // 2. Execution Step
    let outputData: TOutput | undefined;
    try {
      outputData = await this.executeProjection(input, options);
    } catch (err: any) {
      errors.push({
        code: "PROJECTION_EXECUTION_ERROR",
        message: err?.message || String(err),
        severity: "error",
      });
    }

    return this.formatResult(outputData, errors, warnings, input, startTime);
  }

  /**
   * Validates that the input possesses required canonical properties.
   */
  async validate(input: TInput): Promise<boolean> {
    if (!input || typeof input !== "object") {
      return false;
    }
    if (!input.id || !input.title) {
      return false;
    }
    if (!Array.isArray(input.conceptBlocks)) {
      return false;
    }
    return true;
  }

  /**
   * Helper to format a ProjectionResult with metadata and duration.
   */
  protected formatResult(
    data: TOutput | undefined,
    errors: ProjectionError[],
    warnings: ProjectionError[],
    input: TInput,
    startTime: number
  ): ProjectionResult<TOutput> {
    const durationMs = Date.now() - startTime;
    const checksum = data ? this.calculateChecksum(data) : undefined;

    const metadata: ProjectionMetadata = {
      adapterName: this.name,
      targetFormat: this.format as any,
      projectedAt: new Date(),
      sourceExperienceId: input?.id,
      sourceVersion: input?.version,
      itemCount: input?.conceptBlocks?.length ?? 0,
      checksum,
      executionDurationMs: durationMs,
    };

    return {
      success: errors.length === 0 && data !== undefined,
      data,
      errors,
      warnings,
      metadata,
    };
  }

  /**
   * Calculates a SHA-256 checksum of the projected output for immutability tracking.
   */
  protected calculateChecksum(data: unknown): string {
    try {
      if (Buffer.isBuffer(data)) {
        return createHash("sha256").update(data).digest("hex");
      }
      const jsonStr = typeof data === "string" ? data : JSON.stringify(data);
      return createHash("sha256").update(jsonStr).digest("hex");
    } catch {
      return "checksum_calculation_failed";
    }
  }
}
