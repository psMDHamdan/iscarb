import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import type { AssessmentItem, AssessmentOption, DistractorMisconceptionType } from "../../../types/learning-experience";
import { chatJson } from "@/lib/ai-engine";
import { MASTER_GENERATION_RULES } from "../../prompts/master-rules";

export class Pass09Assessments implements PipelinePass {
  readonly passNumber = 9;
  readonly passName = "Diagnostic Academic Assessment Generation";
  readonly description = "Generates MCQs using ACTIVITY AI adhering to strict pedagogical and anti-trivia rules.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const blocks = ctx.elaboratedBlocks || [];
    
    const assessments = await Promise.all(blocks.map(async (block, idx) => {
      const isFinalGate = idx === blocks.length - 1;
      const prevBlock = idx > 0 ? blocks[idx - 1] : null;

      const prompt = `
${MASTER_GENERATION_RULES}

You are the ACTIVITY AI. 
Generate a multiple-choice question for this slide.

RULE: The question MUST directly test the learning objective/core idea of the CURRENT slide or the PREVIOUS slide. Do not test random trivia. 
RULE: Exactly one correct answer. Wrong options must be plausible but unambiguously incorrect.

CURRENT SLIDE TITLE: ${block.title}
CURRENT SLIDE IDEA: ${block.academicTruth}
PREVIOUS SLIDE TITLE: ${prevBlock ? prevBlock.title : "None"}

Generate JSON:
- stem: The question text.
- options: Array of 4 strings (1 correct, 3 distractors).
- correctIndex: 0, 1, 2, or 3 representing which option is correct.
- instructorRationale: Explanation of why the correct answer is correct and others are wrong.
`;

      const aiResponse = (await chatJson({
        system: "You are the PEDAGOGY AI.",
        user: prompt,
        temperature: 0.3,
      })).json as {
        stem: string;
        options: string[];
        correctIndex: number;
        instructorRationale: string;
      };

      if (!aiResponse || !Array.isArray(aiResponse.options) || aiResponse.options.length < 4) {
        console.warn(`[Pass09Assessments] Invalid or missing options for block: ${block.title}. Skipping assessment.`);
        return null;
      }

      const options: AssessmentOption[] = aiResponse.options.map((optText, i) => ({
        id: (["A", "B", "C", "D"])[i] as any,
        text: optText,
        isCorrect: i === aiResponse.correctIndex,
        misconceptionExplanation: i === aiResponse.correctIndex ? "Correct" : "Incorrect: This represents a common distractor or misunderstanding."
      }));

      const distractorExplanations: Record<string, string> = {
        A: options[0].isCorrect ? "Correct" : options[0].misconceptionExplanation!,
        B: options[1].isCorrect ? "Correct" : options[1].misconceptionExplanation!,
        C: options[2].isCorrect ? "Correct" : options[2].misconceptionExplanation!,
        D: options[3].isCorrect ? "Correct" : options[3].misconceptionExplanation!,
      };

      return {
        id: `assess-${ctx.projectId}-${idx + 1}`,
        experienceId: ctx.projectId,
        conceptBlockId: block.id,
        assessmentType: isFinalGate ? "TRANSFER_CHALLENGE" : "DIAGNOSTIC_MCQ",
        bloomLevel: block.bloomLevel === "remember" ? "understand" : block.bloomLevel as any,
        difficulty: idx < 3 ? "easy" : (idx < 5 ? "medium" : "hard"),
        stem: aiResponse.stem,
        options,
        correctOptionId: (["A", "B", "C", "D"])[aiResponse.correctIndex] as any,
        instructorRationale: aiResponse.instructorRationale,
        distractorExplanations,
        progressiveHints: ["Consider the core mechanism discussed.", "Eliminate answers that reverse causality."],
        cloId: block.cloIds?.[0] || "clo-1",
        orderIndex: idx + 1,
        isFinalGate,
        createdAt: new Date()
      } as AssessmentItem;
    }));

    ctx.assessments = assessments.filter(Boolean) as AssessmentItem[];
    return ctx;
  }
}

export const pass09Assessments = new Pass09Assessments();
