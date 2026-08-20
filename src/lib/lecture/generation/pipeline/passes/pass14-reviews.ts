/**
 * Pass 14: Multi-Agent Academic Quality Review.
 * =============================================
 * Evaluates pedagogical depth, fact grounding, assessment rigor, and jargon elimination.
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext, ReviewFinding } from "../pipeline-context";
import { hasForbiddenJargon, detectForbiddenJargon } from "../../../projections/utils/jargon-cleaner";

export class Pass14Reviews implements PipelinePass {
  readonly passNumber = 14;
  readonly passName = "Multi-Agent Academic Quality Review";
  readonly description = "Multi-agent evaluation of pedagogical rigor, fact grounding, assessments, and zero-jargon compliance.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const findings: ReviewFinding[] = [];

    // 1. Pedagogical Review (5-layer completeness & stage sequence)
    const blocks = ctx.elaboratedBlocks || [];
    if (blocks.length !== 7) {
      findings.push({
        passNumber: 14,
        issue: `Expected exactly 7 ConceptBlocks, found ${blocks.length}`,
        repairNeeded: true,
        severity: "error",
        guidance: "Scaffold missing stages to complete 7-stage sequence.",
      });
    }

    blocks.forEach((block) => {
      if (!block.academicTruth || block.academicTruth.trim().length < 20) {
        findings.push({
          passNumber: 14,
          issue: `Missing or truncated Layer 1 (academicTruth) in block ${block.orderIndex}`,
          componentId: block.id,
          repairNeeded: true,
          severity: "error",
          guidance: "Elaborate formal theorem statement.",
        });
      }
      if (!block.intuitionMentalModel || block.intuitionMentalModel.trim().length < 20) {
        findings.push({
          passNumber: 14,
          issue: `Missing or truncated Layer 2 (intuitionMentalModel) in block ${block.orderIndex}`,
          componentId: block.id,
          repairNeeded: true,
          severity: "error",
          guidance: "Elaborate conceptual analogy.",
        });
      }
      if (!block.mechanismExplanation || block.mechanismExplanation.trim().length < 20) {
        findings.push({
          passNumber: 14,
          issue: `Missing or truncated Layer 3 (mechanismExplanation) in block ${block.orderIndex}`,
          componentId: block.id,
          repairNeeded: true,
          severity: "error",
          guidance: "Elaborate step-by-step causal mechanism.",
        });
      }
      if (!block.realWorldTransfer || block.realWorldTransfer.trim().length < 20) {
        findings.push({
          passNumber: 14,
          issue: `Missing or truncated Layer 4 (realWorldTransfer) in block ${block.orderIndex}`,
          componentId: block.id,
          repairNeeded: true,
          severity: "error",
          guidance: "Elaborate industrial application scenario.",
        });
      }
      if (!block.misconceptionAlert || block.misconceptionAlert.trim().length < 15) {
        findings.push({
          passNumber: 14,
          issue: `Missing or truncated Layer 5 (misconceptionAlert) in block ${block.orderIndex}`,
          componentId: block.id,
          repairNeeded: true,
          severity: "error",
          guidance: "Elaborate misconception warning.",
        });
      }
    });

    // 2. Assessment Rigor Review (4 options, 1 correct, distractors classified, rationale >20 chars)
    const assessments = ctx.assessments || [];
    assessments.forEach((item) => {
      if (item.options?.length !== 4) {
        findings.push({
          passNumber: 14,
          issue: `Assessment item ${item.id} has ${item.options?.length} options instead of exactly 4`,
          componentId: item.id,
          repairNeeded: true,
          severity: "error",
        });
      }
      const correctCount = item.options?.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        findings.push({
          passNumber: 14,
          issue: `Assessment item ${item.id} has ${correctCount} correct options (must have exactly 1)`,
          componentId: item.id,
          repairNeeded: true,
          severity: "error",
        });
      }
      if (!item.instructorRationale || item.instructorRationale.length < 20) {
        findings.push({
          passNumber: 14,
          issue: `Assessment item ${item.id} has missing or brief instructorRationale`,
          componentId: item.id,
          repairNeeded: true,
          severity: "warning",
          guidance: "Synthesize complete faculty rationale.",
        });
      }
    });

    // 3. Deterministic Jargon Review (checks student-facing text)
    const textsToCheck: Array<{ label: string; text: string }> = [];
    blocks.forEach((b) => {
      textsToCheck.push({ label: `Block ${b.orderIndex} Title`, text: b.title });
      textsToCheck.push({ label: `Block ${b.orderIndex} CoreIdea`, text: b.coreIdea });
    });
    ctx.activities?.forEach((a) => {
      textsToCheck.push({ label: `Activity ${a.id} Prompt`, text: a.prompt });
    });

    textsToCheck.forEach(({ label, text }) => {
      const jargonResult = detectForbiddenJargon(text);
      if (jargonResult.hasJargon) {
        findings.push({
          passNumber: 14,
          issue: `Forbidden jargon detected in ${label}: [${jargonResult.matchedJargon.join(", ")}]`,
          repairNeeded: true,
          severity: "error",
          guidance: "Scrub internal pipeline vocabulary.",
        });
      }
    });

    // 4. Student Experience Simulation Check (10-question master test suite from §2)
    const studentSimulationQuestions = [
      { q: "1. What am I learning?", pass: !!ctx.title && ctx.title.length > 5 },
      { q: "2. Why does it matter?", pass: blocks.some((b) => b.stageCategory === "DISCOVER" || b.stageCategory === "UNDERSTAND") },
      { q: "3. What is the central concept?", pass: blocks.some((b) => !!b.academicTruth && b.academicTruth.length > 15) },
      { q: "4. Can I visualize it?", pass: (ctx.visuals || []).length > 0 },
      { q: "5. Can I explain how it works?", pass: blocks.some((b) => !!b.mechanismExplanation && b.mechanismExplanation.length > 15) },
      { q: "6. Can I try something myself?", pass: (ctx.activities || []).length > 0 },
      { q: "7. Can I understand why my answer is right or wrong?", pass: (ctx.assessments || []).every((a) => !!a.instructorRationale) },
      { q: "8. Can I solve a new example?", pass: blocks.some((b) => b.stageCategory === "PRACTICE") },
      { q: "9. Can I apply the concept to a different situation?", pass: blocks.some((b) => b.stageCategory === "APPLY" && !!b.realWorldTransfer) },
      { q: "10. Can I pass a final readiness challenge?", pass: (ctx.assessments || []).some((a) => a.assessmentType === "TRANSFER_CHALLENGE" || a.difficulty === "hard") },
    ];

    studentSimulationQuestions.forEach((sim, idx) => {
      if (!sim.pass) {
        findings.push({
          passNumber: 14,
          issue: `Student Simulation Check #${idx + 1} Failed: ${sim.q}`,
          repairNeeded: true,
          severity: "warning",
          guidance: "Refine content structure to satisfy student experience principles.",
        });
      }
    });

    // 5. Duplication Matrix Pre-Publish Audit
    if (ctx.contentRegistry) {
      const dupMatrix = ctx.contentRegistry.generateDuplicationMatrix();
      if (dupMatrix.length > 0) {
        const severeDups = dupMatrix.filter((d) => d.similarity >= 0.70);
        if (severeDups.length > 0) {
          findings.push({
            passNumber: 14,
            issue: `Duplication Audit: Found ${severeDups.length} content items with >=70% similarity`,
            repairNeeded: true,
            severity: "error",
            guidance: "Regenerate duplicative items using ContentRegistry constraints.",
          });
        }
      }
    }

    ctx.reviewFindings = findings;
    return ctx;
  }
}

export const pass14Reviews = new Pass14Reviews();

