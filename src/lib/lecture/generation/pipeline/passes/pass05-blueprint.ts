/**
 * Pass 5: Pedagogical Blueprint Synthesis.
 * =========================================
 * Creates the macro-pedagogical blueprint defining narrative arc, stage plan, and pacing.
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import { PEDAGOGICAL_STAGES, type LearningBlueprint, type PedagogicalStage } from "../../../types/learning-experience";
import { chatJson } from "@/lib/ai-engine";
import { MASTER_GENERATION_RULES } from "../../prompts/master-rules";

export class Pass05Blueprint implements PipelinePass {
  readonly passNumber = 5;
  readonly passName = "Pedagogical Blueprint Synthesis";
  readonly description = "Synthesizes holistic LearningBlueprint with narrative arc, pacing strategy, and stage allocation.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const totalDuration = ctx.estimatedDurationMin || 50;
    const blocks = ctx.scaffoldedBlocks || [];

    const sourceText = (ctx.sourceChunks || []).map((c) => c.text).join("\n\n").slice(0, 15000);

    const clos = ctx.teacherEnteredClos && ctx.teacherEnteredClos.length > 0
      ? ctx.teacherEnteredClos
      : null;

    // AI Planner step
    const prompt = `
${MASTER_GENERATION_RULES}

You are the PLANNER AI. Your task is to generate a pedagogical blueprint for a lecture titled "${ctx.title}".

SOURCE MATERIAL:
${sourceText}

Generate a JSON object with:
- narrativeArc: A 1-2 sentence hook narrative explaining why this topic matters and what the journey looks like.
- outcomes: Array of 3-5 learning outcomes (if not provided). Each should have a text and bloomLevel (understand, apply, analyze, evaluate, create).
- stages: Array of exactly 7 items corresponding to the 7 pedagogical stages (DISCOVER, UNDERSTAND, EXPLORE, PRACTICE, APPLY, CHALLENGE, MASTER). For each, provide a specific 'title' and 'goal' grounded in the source material.

ABSOLUTE RULE: 
- NO CONCEPT MAY BE REPEATED. Each stage must introduce a strictly new pedagogical step.
- The progression must be: Problem/Hook -> Core Concept -> Mechanism -> Visualization -> Application -> Active Recall -> Feedback -> Transfer.
`;

    const aiResponse = (await chatJson({
      system: "You are the PLANNER AI.",
      user: prompt,
      temperature: 0.3,
    })).json as {
      narrativeArc: string;
      outcomes: { text: string; bloomLevel: string }[];
      stages: { stageKey: string; title: string; goal: string }[];
    };

    const aiOutcomes = clos || (aiResponse.outcomes || []).map((o, i) => ({
      id: `clo-${i + 1}`,
      number: String(i + 1),
      text: o.text,
      bloomLevel: o.bloomLevel,
    }));

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

    const aiStagesBykey = new Map((aiResponse.stages || []).map((s) => [s.stageKey, s]));

    const stagePlanJson = PEDAGOGICAL_STAGES.map((stageKey, idx) => {
      const blockId = blocks[idx]?.id || `concept-block-${idx + 1}`;
      const aiStage = aiStagesBykey.get(stageKey);
      return {
        stageKey,
        title: aiStage?.title || `Stage ${idx + 1}: ${stageKey}`,
        goal: aiStage?.goal || "Establish fundamental concepts",
        conceptBlockIds: [blockId],
        durationMin: stageDurations[stageKey],
      };
    });

    const blueprint: LearningBlueprint = {
      id: `bp-${ctx.projectId}`,
      experienceId: ctx.projectId,
      narrativeArc: aiResponse.narrativeArc,
      learningOutcomes: aiOutcomes.map((c, i) => ({
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
      structuralReviewScore: 100.0,
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    ctx.blueprintDraft = blueprint;
    return ctx;
  }
}

export const pass05Blueprint = new Pass05Blueprint();
