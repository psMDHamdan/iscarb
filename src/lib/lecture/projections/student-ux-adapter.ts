/**
 * Student UX Projection Adapter (Milestone 1 — Feature F3).
 * =========================================================
 * Projects canonical LearningExperience into the 3-panel Student UX ViewModel.
 * - Organizes content across 7 pedagogical stages (Discover -> Master).
 * - Enforces zero pipeline jargon via deterministic regex scrubbing.
 * - Implements Hidden Answer Architecture (rationales & keys strictly hidden).
 */

import { BaseProjectionAdapter } from "./base-adapter";
import { cleanJargon, cleanObjectJargon } from "./utils/jargon-cleaner";
import { getAcademicAnalogyForSlide } from "@/lib/lecture/academic-analogies";
import { getAcademicVisualForSlide } from "@/lib/lecture/academic-visuals";
import { MathChemTransformer } from "../renderer/math-chem-transformer";
import { PEDAGOGICAL_STAGES, type LearningExperience, type PedagogicalStage } from "../types/learning-experience";
import type {
  PedagogicalPhase,
  StudentConceptViewModel,
  StudentExperienceViewModel,
  StudentFinalChallengeViewModel,
  StudentStageNavViewModel,
} from "./types";

const STAGE_DISPLAY_NAMES: Record<PedagogicalPhase, string> = {
  DISCOVER: "1. Discover Hook",
  UNDERSTAND: "2. Core Principles",
  EXPLORE: "3. Deep Exploration",
  PRACTICE: "4. Guided Practice",
  APPLY: "5. Real-World Application",
  CHALLENGE: "6. Cognitive Challenge",
  MASTER: "7. Synthesis & Mastery",
};

export class StudentUxAdapter extends BaseProjectionAdapter<LearningExperience, StudentExperienceViewModel> {
  readonly format = "STUDENT_UX";
  readonly name = "StudentUxAdapter";

  executeProjection(input: LearningExperience): StudentExperienceViewModel {
    const rawBlocks = input.conceptBlocks || [];
    const sortedBlocks = [...rawBlocks].sort((a, b) => a.orderIndex - b.orderIndex);

    // 1. Build Navigation Stages
    const stageMap = new Map<PedagogicalPhase, typeof sortedBlocks>();
    for (const stage of PEDAGOGICAL_STAGES) {
      stageMap.set(stage, []);
    }

    for (const block of sortedBlocks) {
      const stageKey = (block.stageCategory || "UNDERSTAND") as PedagogicalPhase;
      const list = stageMap.get(stageKey) || [];
      list.push(block);
      stageMap.set(stageKey, list);
    }

    const stageNavs: StudentStageNavViewModel[] = PEDAGOGICAL_STAGES.map((stageKey, idx) => {
      const blocksForStage = stageMap.get(stageKey) || [];
      return {
        stageKey,
        displayName: STAGE_DISPLAY_NAMES[stageKey] || stageKey,
        stageNumber: idx + 1,
        conceptCount: blocksForStage.length,
        conceptSummaries: blocksForStage.map((b) => ({
          id: b.id,
          orderIndex: b.orderIndex,
          title: cleanJargon(b.title),
          bloomLevel: b.bloomLevel || "understand",
          estimatedMinutes: b.estimatedMinutes || 7,
        })),
      };
    });

    // 2. Build Concepts Map (5-layer student friendly view)
    const conceptsRecord: Record<string, StudentConceptViewModel> = {};

    for (const block of sortedBlocks) {
      const stage = (block.stageCategory || "UNDERSTAND") as PedagogicalPhase;

      // Keyword-matched analogy fallback when the canonical block has no mental model.
      const academicAnalogy = getAcademicAnalogyForSlide(
        block.title,
        `${block.academicTruth || ""} ${block.coreIdea || ""} ${(block.keyTakeaways || []).join(" ")}`
      );

      // Find matching activity
      const activity = input.activities?.find(
        (a) => a.conceptBlockId === block.id || a.id === block.activityId
      );

      // Find matching assessment (HIDDEN ANSWER ARCHITECTURE)
      const assessmentItem = input.assessments?.find(
        (item) => item.conceptBlockId === block.id || item.id === block.assessmentId
      );

      // Find matching visual
      const visual = input.visuals?.find(
        (v) => v.conceptBlockId === block.id || v.id === block.visualId
      );

      // Find matching evidence reference
      const evidence = input.evidenceReferences?.find(
        (e) => e.conceptBlockId === block.id
      ) || input.evidenceMap?.find(
        (e) => e.conceptBlockId === block.id
      );

      // Construct Student Concept View (Multi-screen interactive sequence)
      const coreInsightHtml = MathChemTransformer.transformToHtml(cleanJargon(block.academicTruth || block.coreIdea));
      const mechanismExplanationHtml = MathChemTransformer.transformToHtml(cleanJargon(block.mechanismExplanation || ""));
      const transferScenarioHtml = MathChemTransformer.transformToHtml(cleanJargon(block.realWorldTransfer || ""));

      const studentConcept: StudentConceptViewModel = {
        id: block.id,
        stage,
        orderIndex: block.orderIndex,
        title: cleanJargon(block.title),
        titleAr: block.titleAr ? cleanJargon(block.titleAr) : undefined,
        bloomLevel: block.bloomLevel || "understand",
        estimatedMinutes: block.estimatedMinutes || 7,
        flaggedForReview:
          ["review", "flagged", "NEEDS_FACULTY_REVIEW"].includes(String(input.status)) ||
          (block as { flaggedForReview?: boolean }).flaggedForReview === true,

        // iSCARB Content Compiler Schema
        visibleCopy: coreInsightHtml,
        bullets: block.keyTakeaways?.map((t) => MathChemTransformer.transformToHtml(cleanJargon(t))) || [],
        studentAction: undefined,

        // Core Content — drives the ConceptContent center panel
        coreContent: {
          explanation: mechanismExplanationHtml || coreInsightHtml || "",
          analogy: cleanJargon(block.intuitionMentalModel) || academicAnalogy?.analogy || undefined,
          steps: block.keyTakeaways && block.keyTakeaways.length >= 2
            ? block.keyTakeaways.map((t) => MathChemTransformer.transformToHtml(cleanJargon(t)))
            : mechanismExplanationHtml
              ? mechanismExplanationHtml.split(/(?<=[.!?])\s+/).filter(s => s.length > 15).slice(0, 5)
              : undefined,
        } as any,

        // Real World — drives the purple "Real World" panel
        realWorld: transferScenarioHtml
          ? {
              application: transferScenarioHtml,
              scenario: transferScenarioHtml,
              derivedLabel: "system-suggested" as const,
            }
          : undefined,

        // Common Pitfalls — drives the amber pitfall cards
        commonPitfalls: block.misconceptionAlert
          ? [{
              misconception: cleanJargon(block.misconceptionAlert),
              whyWrong: "This conflicts with core principles derived from the source material.",
              betterWay: "Review the explanation above for the correct understanding.",
            }]
          : undefined,

        // Visual Scaffolding — use stored visual, or fallback to academic visual library
        visual: visual
          ? {
              visualType: visual.visualType,
              title: cleanJargon(visual.title),
              caption: cleanJargon(visual.learningMessage || visual.purpose),
              svgCode: visual.vectorSvgCode,
              imageUrl: visual.primaryAssetUrl,
              attribution: visual.attributionText || visual.attribution?.license,
            }
          : (() => {
              // Fallback: use the curated academic visual library
              const fallbackVisual = getAcademicVisualForSlide(
                block.orderIndex,
                block.title,
                `${block.academicTruth || ""} ${block.coreIdea || ""} ${(block.keyTakeaways || []).join(" ")}`
              );
              return {
                title: cleanJargon(fallbackVisual.title),
                caption: cleanJargon(fallbackVisual.caption),
                imageUrl: fallbackVisual.imageUrl,
                visualType: "concept_model",
              };
            })(),

        // Interactive Activity (Answers stripped + MathChem transformation)
        activity: activity
          ? {
              id: activity.id,
              type: activity.activityType,
              actionVerb: activity.actionVerb || "Predict",
              title: cleanJargon(activity.title),
              prompt: MathChemTransformer.transformToHtml(cleanJargon(activity.prompt)),
              promptAr: activity.promptAr ? cleanJargon(activity.promptAr) : undefined,
              scaffoldingLevel: activity.scaffoldingLevel || "guided",
              // Level 1-3 or 4 progressive hints
              progressiveHints: (activity.progressiveHints || []).map((h) => MathChemTransformer.transformToHtml(cleanJargon(h))),
            }
          : undefined,

        // Formative Assessment (Strict Hidden Answer Architecture: NO isCorrect, NO correctOptionId, NO rationales)
        assessment: assessmentItem
          ? {
              id: assessmentItem.id,
              stem: MathChemTransformer.transformToHtml(cleanJargon(assessmentItem.stem)),
              stemAr: assessmentItem.stemAr ? cleanJargon(assessmentItem.stemAr) : undefined,
              difficulty: assessmentItem.difficulty || "medium",
              options: (assessmentItem.options || []).map((opt) => ({
                id: opt.id,
                text: MathChemTransformer.transformToHtml(cleanJargon(opt.text)),
                textAr: opt.textAr ? cleanJargon(opt.textAr) : undefined,
              })),
            }
          : undefined,

        // Grounded citation reference
        sourceCitation: evidence
          ? {
              sourceKey: evidence.citation?.sourceKey || "Source Document",
              citationText: cleanJargon(evidence.verbatimExcerpt || evidence.claimText),
              hash: evidence.citation?.hash,
            }
          : undefined,
      };

      conceptsRecord[block.id] = studentConcept;
    }

    // 3. Final Challenge Synthesis
    const challengeBlock = sortedBlocks.find((b) => b.stageCategory === "CHALLENGE") || sortedBlocks[sortedBlocks.length - 2];
    const finalChallenge: StudentFinalChallengeViewModel | undefined = challengeBlock
      ? {
          id: `challenge-${challengeBlock.id}`,
          title: `Final Challenge: ${cleanJargon(challengeBlock.title)}`,
          scenario: cleanJargon(challengeBlock.realWorldTransfer || "Analyze this novel scenario using the principles learned."),
          prompt: cleanJargon(
            challengeBlock.academicTruth
              ? `Apply your understanding of ${challengeBlock.title} to resolve the bottleneck in this scenario.`
              : "Formulate your solution."
          ),
          rubricCriteria: [
            "Demonstrates accurate identification of underlying theoretical principles",
            "Avoids common misconceptions and flawed reasoning",
            "Applies causal mechanisms correctly to the novel scenario",
          ],
        }
      : undefined;

    // 4. Construct Overview & Aggregate ViewModel
    const overview = {
      hookNarrative: cleanJargon(
        input.blueprint?.narrativeArc ||
          input.topicDescription ||
          `Welcome to ${input.title}. This interactive learning journey is structured across 7 cognitive stages.`
      ),
      learningOutcomes: (input.blueprint?.learningOutcomes || []).map((o) => cleanJargon(o.text)),
      prerequisites: (input.summary?.prerequisites || []).map((p) => cleanJargon(p)),
    };

    const initialActiveStage: PedagogicalPhase = "DISCOVER";
    const initialActiveConceptId = sortedBlocks[0]?.id || "";

    const rawViewModel: StudentExperienceViewModel = {
      experienceId: input.id,
      courseTitle: cleanJargon(input.title),
      targetAudience: cleanJargon(input.targetAudience || "Students"),
      estimatedDurationMinutes: input.estimatedDurationMin || 50,
      overview,
      navigation: {
        stages: stageNavs,
        totalConcepts: sortedBlocks.length,
        initialActiveStage,
        initialActiveConceptId,
      },
      concepts: conceptsRecord,
      finalChallenge,
    };

    // Deep clean all remaining strings
    return cleanObjectJargon(rawViewModel);
  }
}
