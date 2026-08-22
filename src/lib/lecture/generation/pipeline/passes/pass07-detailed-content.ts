/**
 * Pass 7: 5-Layer Pedagogical Content Elaboration.
 * =================================================
 * Elaborates the 5 instructional depth layers for all ConceptBlock entities using the AI CONTENT GENERATOR.
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import type { ConceptBlock, Misconception, PedagogicalStage } from "../../../types/learning-experience";
import { ContentRegistry } from "../../content-registry";
import { chatJson } from "@/lib/ai-engine";
import { MASTER_GENERATION_RULES } from "../../prompts/master-rules";

export class Pass07DetailedContent implements PipelinePass {
  readonly passNumber = 7;
  readonly passName = "5-Layer Pedagogical Content Elaboration";
  readonly description = "Elaborates the 5 instructional depth layers for each ConceptBlock via AI Content Generator.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const scaffolded = ctx.scaffoldedBlocks || [];
    const sourceChunks = ctx.sourceChunks || [];
    const blueprint = ctx.blueprintDraft;
    
    if (!blueprint || !blueprint.stagePlanJson) {
        throw new Error("Missing blueprint. Pass05 must run first.");
    }

    const sourceText = sourceChunks.map((c) => c.text).join("\n\n").slice(0, 15000);

    const elaboratedBlocks = await Promise.all(scaffolded.map(async (blockPartial, idx) => {
      const stage = (blockPartial.stageCategory || "UNDERSTAND") as PedagogicalStage;
      const stageInfo = blueprint.stagePlanJson.find((s: any) => s.stageKey === stage);
      const title = stageInfo?.title || blockPartial.title || `${ctx.title} (Stage ${idx + 1})`;
      const goal = stageInfo?.goal || "Establish fundamental concepts";

      const prompt = `
${MASTER_GENERATION_RULES}

You are the CONTENT AI. Your task is to generate scientifically accurate content for ONE specific concept only.

LESSON: ${ctx.title}
CURRENT CONCEPT: ${title}
LEARNING GOAL: ${goal}

SOURCE MATERIAL:
${sourceText}

Generate a JSON object for this slide with:
- academicTruth: A strict, rigorous statement of the core principle.
- intuitionMentalModel: An analogy or intuitive way to understand it.
- mechanismExplanation: A step-by-step causal explanation of how it works.
- realWorldTransfer: How this principle applies in real-world scenarios.
- misconceptionAlert: A short warning about a common misunderstanding.
- misconceptions: Array of 3 misconceptions, each with 'commonBelief', 'whyIncorrect', 'correction', and 'distractorType' (e.g. OVER_GENERALIZATION).
- keyTakeaways: Array of 3 short, concise bullet points summarizing the most important facts.
`;

      const aiResponse = (await chatJson({
        system: "You are the CONTENT AI.",
        user: prompt,
        temperature: 0.3,
      })).json as {
        academicTruth: string;
        intuitionMentalModel: string;
        mechanismExplanation: string;
        realWorldTransfer: string;
        misconceptionAlert: string;
        misconceptions: Misconception[];
        keyTakeaways: string[];
      };

      const block: ConceptBlock = {
        id: blockPartial.id || `concept-${ctx.projectId}-${idx + 1}`,
        experienceId: ctx.projectId,
        orderIndex: idx + 1,
        slug: blockPartial.slug || `concept-${idx + 1}-${stage.toLowerCase()}`,
        title,
        titleAr: blockPartial.titleAr,
        stageCategory: stage,
        bloomLevel: blockPartial.bloomLevel || "apply",
        cloIds: blockPartial.cloIds || [`clo-${(idx % 3) + 1}`],
        sourceBlockIds: blockPartial.sourceBlockIds || (sourceChunks[0] ? [sourceChunks[0].id] : [`src-block-${idx + 1}`]),

        academicTruth: Array.isArray(aiResponse.academicTruth) ? aiResponse.academicTruth.join("\n") : (aiResponse.academicTruth || ""),
        intuitionMentalModel: Array.isArray(aiResponse.intuitionMentalModel) ? aiResponse.intuitionMentalModel.join("\n") : (aiResponse.intuitionMentalModel || ""),
        mechanismExplanation: Array.isArray(aiResponse.mechanismExplanation) ? aiResponse.mechanismExplanation.join("\n\n") : (aiResponse.mechanismExplanation || ""),
        realWorldTransfer: Array.isArray(aiResponse.realWorldTransfer) ? aiResponse.realWorldTransfer.join("\n") : (aiResponse.realWorldTransfer || ""),
        misconceptionAlert: Array.isArray(aiResponse.misconceptionAlert) ? aiResponse.misconceptionAlert.join("\n") : (aiResponse.misconceptionAlert || ""),
        misconceptions: aiResponse.misconceptions || [],

        coreIdea: `${stage} Phase: Mastering ${ctx.title} through rigorous causal analysis.`,
        keyTakeaways: aiResponse.keyTakeaways || [],
        keywords: blockPartial.keywords || [],
        estimatedMinutes: 5,
        status: "draft",
      };
      
      return block;
    }));

    ctx.elaboratedBlocks = elaboratedBlocks;
    return ctx;
  }
}

export const pass07DetailedContent = new Pass07DetailedContent();
