/**
 * Pass 3: 7-Stage Concept Block Segmentation.
 * ============================================
 * Partitions the knowledge map into exactly 7 ConceptBlock entities matching
 * the 7 canonical pedagogical stages (Discover -> Master).
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import { PEDAGOGICAL_STAGES, type ConceptBlock, type PedagogicalStage } from "../../../types/learning-experience";

export class Pass03BlockScaffold implements PipelinePass {
  readonly passNumber = 3;
  readonly passName = "7-Stage Concept Block Segmentation";
  readonly description = "Partitions knowledge map into 7 sequential ConceptBlock scaffolding entities.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const nodes = ctx.knowledgeGraph?.nodes || [];
    const scaffolded: Array<Partial<ConceptBlock>> = [];

    const stageTitles: Record<PedagogicalStage, string> = {
      DISCOVER: `${ctx.title}: Foundations & Problem Framing`,
      UNDERSTAND: `${ctx.title}: Core Scholarly Principle`,
      EXPLORE: `${ctx.title}: Architectural Mechanism & Data Flow`,
      PRACTICE: `${ctx.title}: Diagnostic Problem Solving`,
      APPLY: `${ctx.title}: Real-World Industrial Case Study`,
      CHALLENGE: `${ctx.title}: Cross-Domain Transfer Challenge`,
      MASTER: `${ctx.title}: Metacognitive Mastery & Review`,
    };

    PEDAGOGICAL_STAGES.forEach((stage, idx) => {
      const orderIndex = idx + 1;
      const matchingNode = nodes[idx];

      const block: Partial<ConceptBlock> = {
        id: `concept-${ctx.projectId}-${orderIndex}`,
        experienceId: ctx.projectId,
        orderIndex,
        slug: `concept-${orderIndex}-${stage.toLowerCase()}`,
        title: stageTitles[stage],
        titleAr: `المفهوم ${orderIndex}: ${stage}`,
        stageCategory: stage,
        bloomLevel: matchingNode?.bloomLevel || (stage === "DISCOVER" ? "remember" : stage === "CHALLENGE" ? "evaluate" : "apply"),
        cloIds: [],
        sourceBlockIds: matchingNode?.sourceChunkIds || (ctx.sourceChunks?.[0] ? [ctx.sourceChunks[0].id] : [`src-block-${orderIndex}`]),
        estimatedMinutes: stage === "DISCOVER" ? 5 : stage === "CHALLENGE" ? 10 : 7,
      };

      scaffolded.push(block);
    });

    ctx.scaffoldedBlocks = scaffolded;
    return ctx;
  }
}

export const pass03BlockScaffold = new Pass03BlockScaffold();
