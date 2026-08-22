import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import type { LearningActivity, ActivityType } from "../../../types/learning-experience";
import { chatJson } from "@/lib/ai-engine";
import { MASTER_GENERATION_RULES } from "../../prompts/master-rules";

export class Pass08Activities implements PipelinePass {
  readonly passNumber = 8;
  readonly passName = "Cognitive Learning Activities Synthesis";
  readonly description = "Generates interactive cognitive checkpoints using the ACTIVITY AI.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const blocks = ctx.elaboratedBlocks || [];
    
    const activities = await Promise.all(blocks.map(async (block, idx) => {
      const prevBlock = idx > 0 ? blocks[idx - 1] : null;

      const prompt = `
${MASTER_GENERATION_RULES}

You are the ACTIVITY AI. Generate a cognitive interactive activity (Predict, Analyze, Compare, Calculate).
RULE: This activity MUST directly test the learning objective/core idea of the CURRENT slide or PREVIOUS slide.

CURRENT SLIDE TITLE: ${block.title}
CURRENT SLIDE IDEA: ${block.academicTruth}
PREVIOUS SLIDE TITLE: ${prevBlock ? prevBlock.title : "None"}

Generate JSON:
- activityType: one of "PREDICT", "TEACH_IT_BACK", "ACTIVE_RECALL", "WORKED_EXAMPLE", "GUIDED_DISCUSSION", "CALCULATION_LAB", "PEER_POLL"
- actionVerb: e.g. "Predict", "Analyze", "Calculate"
- title: short title
- prompt: the question/task posed to the student
- modelAnswer: the ideal student response
- progressiveHints: array of 4 hints, from vague guiding question to full explanation.
`;

      const aiResponse = (await chatJson({
        system: "You are the PEDAGOGY AI.",
        user: prompt,
        temperature: 0.3,
      })).json as {
        activityType: ActivityType;
        actionVerb: string;
        title: string;
        prompt: string;
        modelAnswer: string;
        progressiveHints: [string, string, string, string];
      };

      return {
        id: `act-${ctx.projectId}-${idx + 1}`,
        experienceId: ctx.projectId,
        conceptBlockId: block.id,
        activityType: aiResponse.activityType,
        title: aiResponse.title,
        prompt: aiResponse.prompt,
        actionVerb: aiResponse.actionVerb,
        scaffoldingLevel: "fading",
        modelAnswer: aiResponse.modelAnswer,
        progressiveHints: aiResponse.progressiveHints,
        orderIndex: idx + 1,
        createdAt: new Date(),
      } as LearningActivity;
    }));

    ctx.activities = activities;
    return ctx;
  }
}

export const pass08Activities = new Pass08Activities();
