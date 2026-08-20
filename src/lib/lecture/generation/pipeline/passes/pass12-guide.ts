/**
 * Pass 12: Dual Companion Guide Generation.
 * ==========================================
 * Synthesizes faculty facilitation guide and student study companion.
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import { PEDAGOGICAL_STAGES, type ExperienceGuide, type PedagogicalStage } from "../../../types/learning-experience";

export class Pass12Guide implements PipelinePass {
  readonly passNumber = 12;
  readonly passName = "Dual Companion Guide Generation";
  readonly description = "Synthesizes dual-track Faculty Delivery Guide and Student Study Companion.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const blocks = ctx.elaboratedBlocks || [];
    const assessments = ctx.assessments || [];

    const solutionKeys: Record<string, string> = {};
    assessments.forEach((item) => {
      solutionKeys[item.id] = `Option [${item.correctOptionId}]: ${item.instructorRationale}`;
    });

    const pacingGuide = PEDAGOGICAL_STAGES.map((stage, idx) => ({
      stage,
      minutes: blocks[idx]?.estimatedMinutes || 7,
      focus: `Deliver ${blocks[idx]?.title || stage} through active inquiry and misconception clarification.`,
    }));

    const discussionPrompts = blocks.map(
      (b) => `Prompt for ${b.stageCategory}: How does ${b.academicTruth.slice(0, 70)} manifest in large-scale production architectures?`
    );

    const commonMisconceptions = blocks.flatMap((b) =>
      (b.misconceptions || []).map((m) => ({
        belief: m.commonBelief,
        repair: m.correction,
      }))
    );

    const facultyGuideJson = {
      facilitationScript: `Welcome students to ${ctx.title}. Guide them through the 7-stage learning journey with active prediction checkpoints before revealing causal mechanisms.`,
      pacingGuide,
      discussionPrompts,
      commonMisconceptions,
      solutionKeys,
    };

    const studentCompanionJson = {
      executiveSummary: `Comprehensive study guide for ${ctx.title}. Master core theoretical invariants, causal mechanisms, and cross-domain transfer scenarios.`,
      keyConcepts: blocks.map((b) => ({
        title: b.title,
        summary: b.academicTruth,
      })),
      reflectionQuestions: [
        `What is the primary theoretical invariant that guarantees correctness in ${ctx.title}?`,
        `How do you diagnose and refute common cognitive misconceptions when debugging ${ctx.title}?`,
        `How can principles of ${ctx.title} be transferred to novel un-taught domains?`,
      ],
      glossary: {
        Invariant: "A property that remains true across all valid state transitions.",
        Mechanism: "The step-by-step causal dynamics governing state transformations.",
        Transfer: "Applying core scientific principles to novel, un-taught problem domains.",
      },
      furtherReading: [
        { title: `${ctx.title} Master Reference Manual`, url: `https://iscarb.edu.sa/docs/${ctx.projectId}` },
      ],
    };

    const guide: ExperienceGuide = {
      id: `guide-${ctx.projectId}`,
      experienceId: ctx.projectId,
      facultyGuideJson,
      studentCompanionJson,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    ctx.guideDraft = guide;
    return ctx;
  }
}

export const pass12Guide = new Pass12Guide();
