import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import type {
  AssessmentItem,
  AssessmentOption,
  DistractorMisconceptionType,
} from "../../../types/learning-experience";
import { ContentRegistry } from "../../content-registry";

export class Pass09Assessments implements PipelinePass {
  readonly passNumber = 9;
  readonly passName = "Diagnostic Academic Assessment Generation";
  readonly description = "Generates 4-option diagnostic MCQs with misconception modeling, deduplication, and hidden instructor rationales.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const blocks = ctx.elaboratedBlocks || [];
    const assessments: AssessmentItem[] = [];
    const registry = ctx.contentRegistry || new ContentRegistry();

    blocks.forEach((block, idx) => {
      const isFinalGate = idx === blocks.length - 1;
      const assessId = `assess-${idx + 1}`;

      const correctText = `${block.academicTruth}`;
      const m1 = block.misconceptions?.[0] || {
        commonBelief: "Confusion of basic terminology leads to flawed assumptions.",
        whyIncorrect: "Confuses foundational definitions with operational parameters.",
        distractorType: "CONFUSION_OF_TERMS" as DistractorMisconceptionType,
      };
      const m2 = block.misconceptions?.[1] || {
        commonBelief: "Causal direction is inverted in system transitions.",
        whyIncorrect: "Inverts cause and effect in the state machine mechanism.",
        distractorType: "REVERSE_CAUSALITY" as DistractorMisconceptionType,
      };
      const m3 = block.misconceptions?.[2] || {
        commonBelief: "Boundary edge cases can be safely ignored under normal load.",
        whyIncorrect: "Neglects scale and boundary limits in distributed operations.",
        distractorType: "EDGE_CASE_NEGLECT" as DistractorMisconceptionType,
      };

      const options: AssessmentOption[] = [
        {
          id: "A",
          text: correctText,
          isCorrect: true,
        },
        {
          id: "B",
          text: `${m1.commonBelief}`,
          isCorrect: false,
          misconceptionKey: m1.distractorType,
          misconceptionExplanation: m1.whyIncorrect,
        },
        {
          id: "C",
          text: `${m2.commonBelief}`,
          isCorrect: false,
          misconceptionKey: m2.distractorType,
          misconceptionExplanation: m2.whyIncorrect,
        },
        {
          id: "D",
          text: `${m3.commonBelief}`,
          isCorrect: false,
          misconceptionKey: m3.distractorType,
          misconceptionExplanation: m3.whyIncorrect,
        },
      ];

      const distractorExplanations: Record<string, string> = {
        A: "Correct: Directly aligns with the foundational theoretical theorem and proven mechanism.",
        B: `Incorrect: Reflects ${m1.distractorType} — ${m1.whyIncorrect}`,
        C: `Incorrect: Reflects ${m2.distractorType} — ${m2.whyIncorrect}`,
        D: `Incorrect: Reflects ${m3.distractorType} — ${m3.whyIncorrect}`,
      };

      const instructorRationale = `Option A is the correct scholarly answer because it directly reflects the underlying mathematical invariant: ${block.academicTruth}. Options B, C, and D are systematic distractors targeting student cognitive errors in ${m1.distractorType}, ${m2.distractorType}, and ${m3.distractorType}.`;

      const assessmentItem: AssessmentItem = {
        id: assessId,
        experienceId: ctx.projectId,
        conceptBlockId: block.id,
        assessmentType: isFinalGate ? "TRANSFER_CHALLENGE" : "DIAGNOSTIC_MCQ",
        bloomLevel: block.bloomLevel === "remember" ? "understand" : block.bloomLevel as any,
        difficulty: idx < 3 ? "easy" : idx < 5 ? "medium" : "hard",
        stem: `In evaluating ${block.title}, which statement correctly articulates the fundamental invariant governing system correctness?`,
        stemAr: `في تقييم ${block.title}، أي العبارات توضح بشكل صحيح المبدأ الأساسي الحاكم لصحة النظام؟`,
        options,
        correctOptionId: "A",
        instructorRationale,
        distractorExplanations,
        progressiveHints: [
          `Level 1: Focus on the core invariant defined in ${block.title}.`,
          `Level 2: Differentiate between surface symptoms and foundational mathematical truths.`,
          `Level 3: Eliminate options that invert causal direction or confuse terminology.`,
          `Level 4: The only option that preserves complete invariant integrity is Option A.`,
        ],
        cloId: block.cloIds?.[0] || "clo-1",
        orderIndex: idx + 1,
        isFinalGate,
        createdAt: new Date(),
      };

      block.assessmentId = assessId;
      assessments.push(assessmentItem);
    });

    ctx.assessments = assessments;
    return ctx;
  }
}

export const pass09Assessments = new Pass09Assessments();
