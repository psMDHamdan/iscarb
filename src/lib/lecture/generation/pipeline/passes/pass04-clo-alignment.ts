/**
 * Pass 4: CLO Alignment & Bloom Taxonomy Mapping.
 * ===============================================
 * Maps every ConceptBlock to faculty CLOs and assigns Bloom cognitive levels.
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";

export class Pass04CloAlignment implements PipelinePass {
  readonly passNumber = 4;
  readonly passName = "CLO Alignment & Bloom Taxonomy Mapping";
  readonly description = "Maps concept blocks to Course Learning Outcomes with Bloom taxonomy validation.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const blocks = ctx.scaffoldedBlocks || [];
    const clos = ctx.teacherEnteredClos && ctx.teacherEnteredClos.length > 0
      ? ctx.teacherEnteredClos
      : [
          { id: "clo-1", number: "1", text: `Understand foundational principles of ${ctx.title}`, bloomLevel: "understand" },
          { id: "clo-2", number: "2", text: `Analyze mechanisms and solve problems in ${ctx.title}`, bloomLevel: "analyze" },
          { id: "clo-3", number: "3", text: `Evaluate and synthesize novel solutions in ${ctx.title}`, bloomLevel: "evaluate" },
        ];

    const selectedCloIds = ctx.selectedCloIds && ctx.selectedCloIds.length > 0
      ? ctx.selectedCloIds
      : clos.map((c) => c.id);

    const alignmentMap = new Map<string, string[]>();

    // Bloom progression ladder across the 7 stages
    const bloomLadder: Array<"remember" | "understand" | "apply" | "analyze" | "apply" | "evaluate" | "create"> = [
      "remember",
      "understand",
      "apply",
      "analyze",
      "apply",
      "evaluate",
      "create",
    ];

    blocks.forEach((block, idx) => {
      // Ensure round-robin coverage of all selected CLOs
      const cloIdx = idx % selectedCloIds.length;
      const assignedCloId = selectedCloIds[cloIdx];

      const cloIds = [assignedCloId];
      // Additional CLO for capstone blocks
      if (idx >= 4 && selectedCloIds.length > 1) {
        const secondaryCloId = selectedCloIds[(cloIdx + 1) % selectedCloIds.length];
        if (!cloIds.includes(secondaryCloId)) {
          cloIds.push(secondaryCloId);
        }
      }

      block.cloIds = cloIds;
      block.bloomLevel = bloomLadder[idx] || "apply";
      alignmentMap.set(block.id || `concept-block-${idx + 1}`, cloIds);
    });

    ctx.cloAlignmentMap = alignmentMap;
    return ctx;
  }
}

export const pass04CloAlignment = new Pass04CloAlignment();
