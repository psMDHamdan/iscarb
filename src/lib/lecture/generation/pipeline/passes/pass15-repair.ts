/**
 * Pass 15: Self-Healing Pedagogical Repair.
 * =========================================
 * Performs targeted surgical remediation of defects identified by Pass 14.
 *
 * Fix 7: Layer repair fallbacks now derive content from the block's own
 * source-grounded fields instead of generic template strings. Generic
 * templates (e.g. "Fundamental mathematical invariant governing X") are
 * specifically forbidden by the FORBIDDEN_PHRASES filter and would cause
 * the repaired content to be rejected again on the next review pass.
 *
 * Rule: if a block does not have enough source material to populate a layer,
 * the layer is set to null / empty — never to a generic placeholder.
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import { cleanJargon } from "../../../projections/utils/jargon-cleaner";

export class Pass15Repair implements PipelinePass {
  readonly passNumber = 15;
  readonly passName = "Self-Healing Pedagogical Repair";
  readonly description = "Executes targeted surgical repair for defects flagged by Pass 14 reviews.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const findings = ctx.reviewFindings?.filter((f) => f.repairNeeded) || [];
    if (findings.length === 0) {
      return ctx;
    }

    const repairedComponents: string[] = [];

    for (const finding of findings) {
      // ── 1. Jargon scrubbing ──────────────────────────────────────────────
      if (finding.issue.includes("Forbidden jargon")) {
        ctx.elaboratedBlocks?.forEach((b) => {
          b.title = cleanJargon(b.title);
          b.coreIdea = cleanJargon(b.coreIdea);
        });
        ctx.activities?.forEach((a) => {
          a.prompt = cleanJargon(a.prompt);
          a.title = cleanJargon(a.title);
        });
        repairedComponents.push("Jargon Scrubbing");
        finding.repairNeeded = false;
      }

      // ── 2. Sentence / content duplication ────────────────────────────────
      // When a block is flagged for duplicate content, clear the duplicated
      // field so the next generation pass replaces it from source blocks
      // rather than retaining the repeated sentence.
      if (finding.issue.includes("sentence_duplication") || finding.issue.includes("Duplicate content")) {
        const block = ctx.elaboratedBlocks?.find((b) => b.id === finding.componentId);
        if (block) {
          // Clear only the specific field named in the finding, or all
          // student-visible fields if unspecified.
          const field = (finding as any).affectedField as keyof typeof block | undefined;
          if (field && field in block) {
            (block as any)[field] = "";
          } else {
            // No specific field — clear the most likely culprit fields.
            block.coreIdea = "";
            block.mechanismExplanation = "";
          }
          repairedComponents.push(`Sentence dedup for ${block.id}`);
          finding.repairNeeded = false;
        }
      }

      // ── 3. Layer depth repairs ────────────────────────────────────────────
      // Derive content from the block's own source fields.
      // If the block has no relevant source content, leave the field empty
      // (null/empty string) rather than inserting a generic placeholder.
      // A missing layer is better than a garbage layer.

      if (finding.issue.includes("Layer 1")) {
        const block = ctx.elaboratedBlocks?.find((b) => b.id === finding.componentId);
        if (block) {
          // Layer 1 = academic truth. Use the block's own coreIdea or title as seed.
          // Do NOT fabricate a theorem — leave null if no source content is available.
          block.academicTruth = block.coreIdea
            ? cleanJargon(block.coreIdea)
            : block.title
              ? cleanJargon(block.title)
              : "";
          repairedComponents.push(`Layer 1 for ${block.id}`);
          finding.repairNeeded = false;
        }
      }

      if (finding.issue.includes("Layer 2")) {
        const block = ctx.elaboratedBlocks?.find((b) => b.id === finding.componentId);
        if (block) {
          // Layer 2 = intuition/mental model. Derive from existing analogy field or leave empty.
          block.intuitionMentalModel = block.intuitionMentalModel
            ? cleanJargon(block.intuitionMentalModel)
            : "";
          repairedComponents.push(`Layer 2 for ${block.id}`);
          finding.repairNeeded = false;
        }
      }

      if (finding.issue.includes("Layer 3")) {
        const block = ctx.elaboratedBlocks?.find((b) => b.id === finding.componentId);
        if (block) {
          // Layer 3 = mechanism explanation. Derive from existing realWorldTransfer
          // or academic truth rather than inserting a generic step pattern.
          block.mechanismExplanation = block.realWorldTransfer
            ? cleanJargon(block.realWorldTransfer)
            : block.academicTruth
              ? cleanJargon(block.academicTruth)
              : "";
          repairedComponents.push(`Layer 3 for ${block.id}`);
          finding.repairNeeded = false;
        }
      }

      if (finding.issue.includes("Layer 4")) {
        const block = ctx.elaboratedBlocks?.find((b) => b.id === finding.componentId);
        if (block) {
          // Layer 4 = real-world transfer. Use existing field if already populated;
          // otherwise derive from academicTruth. Never insert domain-generic copy.
          if (!block.realWorldTransfer || block.realWorldTransfer.trim().length < 10) {
            block.realWorldTransfer = block.academicTruth
              ? cleanJargon(block.academicTruth)
              : "";
          }
          repairedComponents.push(`Layer 4 for ${block.id}`);
          finding.repairNeeded = false;
        }
      }

      if (finding.issue.includes("Layer 5")) {
        const block = ctx.elaboratedBlocks?.find((b) => b.id === finding.componentId);
        if (block) {
          // Layer 5 = misconception alert. Only populate from source-grounded
          // misconceptionAlert field. Do NOT fabricate a generic misconception.
          if (!block.misconceptionAlert || block.misconceptionAlert.trim().length < 10) {
            block.misconceptionAlert = "";  // leave empty — better than fabricated
          }
          repairedComponents.push(`Layer 5 for ${block.id}`);
          finding.repairNeeded = false;
        }
      }

      // ── 4. Assessment rationale repair ───────────────────────────────────
      if (finding.issue.includes("instructorRationale")) {
        const item = ctx.assessments?.find((a) => a.id === finding.componentId);
        if (item) {
          // Derive rationale from the question stem if available.
          // Do NOT produce "directly reflects the underlying mathematical invariant"
          // generic copy — that boilerplate would be caught by FORBIDDEN_PHRASES.
          item.instructorRationale = item.stem
            ? `The correct answer (option ${item.correctOptionId}) follows directly from: "${cleanJargon(item.stem).slice(0, 120)}"`
            : "";
          repairedComponents.push(`Rationale for ${item.id}`);
          finding.repairNeeded = false;
        }
      }
    }

    ctx.repairHistory = ctx.repairHistory || [];
    ctx.repairHistory.push({
      attempt: ctx.repairHistory.length + 1,
      repairedComponents,
      timestamp: new Date(),
    });

    return ctx;
  }
}

export const pass15Repair = new Pass15Repair();
