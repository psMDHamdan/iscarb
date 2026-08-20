/**
 * 17-Pass Content Generation Pipeline Runner (Milestone 1 — Feature F2).
 * =====================================================================
 * Orchestrates sequential pass execution, telemetry tracking, gate check recording,
 * and the Pass 14 / Pass 15 self-healing remediation loop.
 */

import { globalPassRegistry, PassRegistry, PipelinePass } from "./pass-registry";
import { createInitialPipelineContext, PipelineContext } from "./pipeline-context";
import { persistPipelineContext } from "./pipeline-persister";
import { pass01Ingestion } from "./passes/pass01-ingestion";
import { pass02KnowledgeMap } from "./passes/pass02-knowledge-map";
import { pass03BlockScaffold } from "./passes/pass03-block-scaffold";
import { pass04CloAlignment } from "./passes/pass04-clo-alignment";
import { pass05Blueprint } from "./passes/pass05-blueprint";
import { pass06BlueprintReview } from "./passes/pass06-blueprint-review";
import { pass07DetailedContent } from "./passes/pass07-detailed-content";
import { pass08Activities } from "./passes/pass08-activities";
import { pass09Assessments } from "./passes/pass09-assessments";
import { pass10Visuals } from "./passes/pass10-visuals";
import { pass11Assets } from "./passes/pass11-assets";
import { pass12Guide } from "./passes/pass12-guide";
import { pass13Evidence } from "./passes/pass13-evidence";
import { pass14Reviews } from "./passes/pass14-reviews";
import { pass15Repair } from "./passes/pass15-repair";
import { pass16Assembly } from "./passes/pass16-assembly";
import { pass17Projections } from "./passes/pass17-projections";

export class PipelineRunner {
  private registry: PassRegistry;

  constructor(registry: PassRegistry = globalPassRegistry) {
    this.registry = registry;
    this.registerStandardPasses();
  }

  private registerStandardPasses(): void {
    const standardPasses: PipelinePass[] = [
      pass01Ingestion,
      pass02KnowledgeMap,
      pass03BlockScaffold,
      pass04CloAlignment,
      pass05Blueprint,
      pass06BlueprintReview,
      pass07DetailedContent,
      pass08Activities,
      pass09Assessments,
      pass10Visuals,
      pass11Assets,
      pass12Guide,
      pass13Evidence,
      pass14Reviews,
      pass15Repair,
      pass16Assembly,
      pass17Projections,
    ];

    standardPasses.forEach((p) => this.registry.register(p));
  }

  /**
   * Executes the full 17-pass pipeline with self-healing review loops.
   */
  async run(ctx: PipelineContext): Promise<PipelineContext> {
    ctx.status = "running";
    ctx.errors = [];
    ctx.currentPass = 0;
    ctx.progressPercent = 0;

    try {
      // 1. Execute Passes 1 through 13 sequentially
      for (let passNum = 1; passNum <= 13; passNum++) {
        const pass = this.registry.get(passNum);
        if (!pass) {
          throw new Error(`Pipeline pass ${passNum} is not registered in PassRegistry.`);
        }

        ctx.currentPass = passNum;
        ctx.progressPercent = Math.round((passNum / 17) * 100);
        ctx = await pass.execute(ctx);
      }

      // 2. Execute Self-Healing Review/Repair Loop (Pass 14 -> Pass 15)
      ctx = await this.executeSelfHealingLoop(ctx);

      // 3. Execute Pass 16 (Assembly)
      const pass16 = this.registry.get(16);
      if (pass16) {
        ctx.currentPass = 16;
        ctx.progressPercent = Math.round((16 / 17) * 100);
        ctx = await pass16.execute(ctx);
      }

      // 4. Execute Pass 17 (Projections)
      const pass17 = this.registry.get(17);
      if (pass17) {
        ctx.currentPass = 17;
        ctx.progressPercent = 100;
        ctx = await pass17.execute(ctx);
      }

      if (ctx.status !== "needs_faculty_review") {
        ctx.status = "completed";
      }

      if (ctx.canonicalExperience) {
        await persistPipelineContext(ctx);
      }

      return ctx;
    } catch (err: any) {
      console.error("[PipelineRunner] Fatal Pipeline Execution Error:", err);
      ctx.status = "failed";
      ctx.errors.push(err?.message || String(err));
      return ctx;
    }
  }

  /**
   * Self-healing loop bounded by MAX_REPAIR_RETRIES = 2.
   */
  private async executeSelfHealingLoop(ctx: PipelineContext): Promise<PipelineContext> {
    const MAX_REPAIR_RETRIES = 2;
    let retryCount = 0;

    const pass14 = this.registry.get(14);
    const pass15 = this.registry.get(15);

    if (!pass14 || !pass15) {
      throw new Error("Passes 14 and 15 must be registered for self-healing review loop.");
    }

    while (retryCount <= MAX_REPAIR_RETRIES) {
      // Execute Review
      ctx.currentPass = 14;
      ctx = await pass14.execute(ctx);

      const activeIssues = ctx.reviewFindings?.filter((f) => f.repairNeeded) || [];
      if (activeIssues.length === 0) {
        // Clean review achieved
        break;
      }

      if (retryCount >= MAX_REPAIR_RETRIES) {
        // Max retries reached with unresolved defects
        console.warn(`[PipelineRunner] Unresolved defects remain after ${MAX_REPAIR_RETRIES} repair attempts.`);
        ctx.status = "needs_faculty_review";
        break;
      }

      retryCount++;
      console.log(`[PipelineRunner] Executing repair attempt ${retryCount}/${MAX_REPAIR_RETRIES} for ${activeIssues.length} issues.`);

      // Execute Repair
      ctx.currentPass = 15;
      ctx = await pass15.execute(ctx);
    }

    return ctx;
  }
}

export const defaultPipelineRunner = new PipelineRunner();
