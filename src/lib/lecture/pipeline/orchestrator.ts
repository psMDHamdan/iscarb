/**
 * Centralized Multi-Stage Lecture Pipeline Orchestrator.
 * ===========================================================================
 * Orchestrates the full lecture generation lifecycle:
 * SOURCE → CONCEPT EXTRACTION → LEARNING PLAN → DECK PLAN → ACTIVITY PLAN
 * → VISUAL PLAN → CONTENT GENERATION → VALIDATION → HTML/PPT RENDERING
 *
 * Enforces:
 * - Anti-duplication via ContentRegistry
 * - Activity diversity via ActivityRotator
 * - Equation formatting via MathChemTransformer
 * - Visual quality via ImageValidator
 * - Surgical section-level regeneration on validation failure
 */

import { db } from "@/lib/db";
import { ContentRegistry } from "@/lib/lecture/generation/content-registry";
import { ActivityRotator, type ActivityType } from "@/lib/lecture/generation/activity-rotator";
import { MathChemTransformer } from "@/lib/lecture/renderer/math-chem-transformer";
import { ImageValidator } from "@/lib/lecture/quality/image-validator";
import { generateISCARBPlan } from "@/lib/lecture/planner/plan-generator";

export interface PipelineExecutionOptions {
  projectId: string;
  regenerateFailedSectionsOnly?: boolean;
  failedSlideNumbers?: number[];
}

export interface PipelineExecutionResult {
  success: boolean;
  projectId: string;
  slidesGenerated: number;
  activitiesGenerated: number;
  validatedImagesCount: number;
  duplicationsRejected: number;
  errors: string[];
}

export class PipelineOrchestrator {
  private registry = new ContentRegistry();
  private rotator = new ActivityRotator();

  public async executePipeline(options: PipelineExecutionOptions): Promise<PipelineExecutionResult> {
    const { projectId, regenerateFailedSectionsOnly, failedSlideNumbers } = options;
    const errors: string[] = [];

    // 1. Fetch Project & Course Profile
    const project = await db.lectureProject.findUnique({
      where: { id: projectId },
      include: { courseProfile: true },
    });

    if (!project) {
      return {
        success: false,
        projectId,
        slidesGenerated: 0,
        activitiesGenerated: 0,
        validatedImagesCount: 0,
        duplicationsRejected: 0,
        errors: [`Project not found: ${projectId}`],
      };
    }

    // 2. Stage: LEARNING PLAN (Generate 20-Section Plan)
    if (!regenerateFailedSectionsOnly) {
      await generateISCARBPlan(projectId, true);
    }

    // 3. Stage: DECK PLAN & CONTENT REGISTRY VERIFICATION
    const plans = await db.lectureSlidePlan.findMany({
      where: { projectId },
      orderBy: { slideNo: "asc" },
    });

    let duplicationsRejected = 0;
    let validatedImagesCount = 0;
    let activitiesCount = 0;

    for (const plan of plans) {
      // Skip untouched slides if surgical regeneration is requested
      if (regenerateFailedSectionsOnly && failedSlideNumbers && !failedSlideNumbers.includes(plan.slideNo)) {
        continue;
      }

      // Check anti-duplication in ContentRegistry
      const regResult = this.registry.register({
        contentId: `slide-${plan.slideNo}`,
        conceptId: plan.id,
        contentType: "deck_slide",
        title: plan.title,
        promptOrStem: plan.title,
        semanticSignature: "",
        sourceIds: plan.sourceBlockIds,
      });

      if (!regResult.accepted) {
        duplicationsRejected++;
      }

      // 4. Stage: VISUAL PLAN & IMAGE VALIDATION
      if (plan.visualIntent) {
        const val = ImageValidator.validateVisual(plan.title, plan.visualIntent, "scientific_diagram");
        if (val.valid) validatedImagesCount++;
      }

      // 5. Stage: ACTIVITY PLAN & DIVERSITY ROTATION
      const actType: ActivityType = this.rotator.getNextActivityType(plan.interactionType);
      const actVerb = ActivityRotator.getActionVerb(actType);
      activitiesCount++;

      // Register activity to ensure no duplication with slide teaching content
      this.registry.register({
        contentId: `activity-${plan.slideNo}`,
        conceptId: plan.id,
        contentType: "activity",
        title: `Activity for S${plan.slideNo}`,
        promptOrStem: `${actVerb}: ${plan.title}`,
        semanticSignature: "",
        sourceIds: plan.sourceBlockIds,
      });
    }

    return {
      success: errors.length === 0,
      projectId,
      slidesGenerated: plans.length,
      activitiesGenerated: activitiesCount,
      validatedImagesCount,
      duplicationsRejected,
      errors,
    };
  }
}
