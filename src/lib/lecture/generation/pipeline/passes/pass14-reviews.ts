import type { PipelinePass } from "../pass-registry";
import type { PipelineContext, ReviewFinding } from "../pipeline-context";
import { chatJson } from "@/lib/ai-engine";
import { MASTER_GENERATION_RULES } from "../../prompts/master-rules";

export class Pass14Reviews implements PipelinePass {
  readonly passNumber = 14;
  readonly passName = "Multi-Agent Academic Quality Review";
  readonly description = "AI Quality Gate that validates pedagogical depth, fact grounding, visuals, and activities.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const findings: ReviewFinding[] = [];
    const blocks = ctx.elaboratedBlocks || [];
    const visuals = ctx.visuals || [];
    const activities = ctx.activities || [];
    const assessments = ctx.assessments || [];

    await Promise.all(blocks.map(async (block, idx) => {
      const visual = visuals.find(v => v.conceptBlockId === block.id);
      const activity = activities.find(a => a.conceptBlockId === block.id);
      const assessment = assessments.find(a => a.conceptBlockId === block.id);

      const prompt = `
${MASTER_GENERATION_RULES}

You are the VALIDATOR AI. Evaluate the following generated slide.
Score it from 0 to 100 based on the Master Rules.

LESSON TOPIC: ${ctx.title}
SLIDE TITLE: ${block.title}
CONTENT: ${block.academicTruth}
MECHANISM: ${block.mechanismExplanation}
VISUAL: ${visual ? visual.visualType + " - " + visual.purpose : "none"}
ASSESSMENT: ${assessment ? assessment.stem : "none"}

Generate JSON:
- valid: boolean (true if score >= 85)
- score: number (0-100)
- errors: array of strings describing violations (empty if none)
- action: "render" (>=85), "fix" (70-84), or "regenerate" (<70)
`;

      const aiResponse = (await chatJson({
        system: "You are the REVIEWER AI.",
        user: prompt,
        temperature: 0.1,
      })).json as {
        valid: boolean;
        score: number;
        errors: string[];
        action: "render" | "fix" | "regenerate";
      };

      if (aiResponse.score < 85) {
        findings.push({
          passNumber: 14,
          issue: `AI Validator scored slide ${idx + 1} at ${aiResponse.score}. Errors: ${aiResponse.errors.join(", ")}`,
          componentId: block.id,
          repairNeeded: true,
          severity: aiResponse.score < 70 ? "error" : "warning",
          guidance: aiResponse.action,
        });
      }
    }));

    ctx.reviewFindings = (ctx.reviewFindings || []).concat(findings);
    return ctx;
  }
}

export const pass14Reviews = new Pass14Reviews();
