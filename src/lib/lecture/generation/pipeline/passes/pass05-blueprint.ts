/**
 * Pass 5: Pedagogical Blueprint Synthesis.
 * =========================================
 * Creates the macro-pedagogical blueprint defining narrative arc, stage plan, and pacing.
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import { PEDAGOGICAL_STAGES, type LearningBlueprint, type PedagogicalStage } from "../../../types/learning-experience";

export class Pass05Blueprint implements PipelinePass {
  readonly passNumber = 5;
  readonly passName = "Pedagogical Blueprint Synthesis";
  readonly description = "Synthesizes holistic LearningBlueprint with narrative arc, pacing strategy, and stage allocation.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const totalDuration = ctx.estimatedDurationMin || 50;
    const blocks = ctx.scaffoldedBlocks || [];

    const clos = ctx.teacherEnteredClos && ctx.teacherEnteredClos.length > 0
      ? ctx.teacherEnteredClos
      : [
          { id: "clo-1", number: "1", text: `Formulate core principles of ${ctx.title}.`, bloomLevel: "understand" },
          { id: "clo-2", number: "2", text: `Analyze mechanisms and repair misconceptions in ${ctx.title}.`, bloomLevel: "analyze" },
          { id: "clo-3", number: "3", text: `Apply ${ctx.title} to un-taught real-world scenarios.`, bloomLevel: "evaluate" },
        ];

    // Stage plan with exact 7 stages summing to totalDuration
    const stageDurations: Record<PedagogicalStage, number> = {
      DISCOVER: Math.round(totalDuration * 0.1),
      UNDERSTAND: Math.round(totalDuration * 0.16),
      EXPLORE: Math.round(totalDuration * 0.16),
      PRACTICE: Math.round(totalDuration * 0.16),
      APPLY: Math.round(totalDuration * 0.16),
      CHALLENGE: Math.round(totalDuration * 0.16),
      MASTER: totalDuration - (Math.round(totalDuration * 0.1) + Math.round(totalDuration * 0.16) * 5),
    };

    const stageGoals: Record<PedagogicalStage, string> = {
      DISCOVER: "Motivate inquiry through real-world bottleneck or paradox.",
      UNDERSTAND: "Establish rigorous scholarly truth and intuitive mental model.",
      EXPLORE: "Trace step-by-step causal mechanisms and internal dynamics.",
      PRACTICE: "Execute scaffolded diagnostic exercises and identify edge cases.",
      APPLY: "Apply principles to enterprise-scale case studies.",
      CHALLENGE: "Test knowledge transfer on an un-taught cross-domain problem.",
      MASTER: "Synthesize insights, metacognitive self-check, and mastery verification.",
    };

    const stagePlanJson = PEDAGOGICAL_STAGES.map((stageKey, idx) => {
      const blockId = blocks[idx]?.id || `concept-block-${idx + 1}`;
      return {
        stageKey,
        title: `Stage ${idx + 1}: ${stageKey}`,
        goal: stageGoals[stageKey],
        conceptBlockIds: [blockId],
        durationMin: stageDurations[stageKey],
      };
    });

    const narrativeArc = `From initial discovery of ${ctx.title} bottlenecks to formal mathematical and mechanistic foundations, culminating in robust industrial application and cross-domain transfer.`;

    const blueprint: LearningBlueprint = {
      id: `bp-${ctx.projectId}`,
      experienceId: ctx.projectId,
      narrativeArc,
      learningOutcomes: clos.map((c, i) => ({
        id: c.id || `clo-${i + 1}`,
        number: c.number || String(i + 1),
        text: c.text,
        bloomLevel: c.bloomLevel || "apply",
      })),
      stagePlanJson,
      prerequisiteGraph: {
        nodes: PEDAGOGICAL_STAGES.map((s, i) => ({ id: `stage-${i + 1}`, label: s })),
        edges: PEDAGOGICAL_STAGES.slice(0, -1).map((_, i) => ({
          from: `stage-${i + 1}`,
          to: `stage-${i + 2}`,
          relationship: "ENABLES",
        })),
      },
      pacingStrategy: {
        totalDurationMin: totalDuration,
        checkpoints: [
          { stage: "UNDERSTAND", targetMinute: Math.round(totalDuration * 0.3), requiredMastery: 0.7 },
          { stage: "PRACTICE", targetMinute: Math.round(totalDuration * 0.6), requiredMastery: 0.8 },
          { stage: "CHALLENGE", targetMinute: Math.round(totalDuration * 0.9), requiredMastery: 0.85 },
        ],
      },
      structuralReviewScore: 95.0,
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    ctx.blueprintDraft = blueprint;
    return ctx;
  }
}

export const pass05Blueprint = new Pass05Blueprint();
