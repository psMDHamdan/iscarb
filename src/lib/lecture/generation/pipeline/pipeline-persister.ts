import { db } from "@/lib/db";
import type { PipelineContext } from "./pipeline-context";

/**
 * Persists the entire canonical LearningExperience graph from PipelineContext
 * into the PostgreSQL database.
 */
export async function persistPipelineContext(ctx: PipelineContext): Promise<void> {
  const exp = ctx.canonicalExperience;
  if (!exp) {
    throw new Error("[PipelinePersister] Cannot persist: canonicalExperience is undefined in context.");
  }

  const experienceId = exp.id;

  // Clear existing learning experience with this ID or Project ID to prevent duplicate constraint errors
  await db.learningExperience.deleteMany({
    where: { projectId: exp.projectId },
  });

  // 1. Insert LearningExperience
  console.log(`[PipelinePersister] Persisting LearningExperience: ${exp.title}`);
  const createdExperience = await db.learningExperience.create({
    data: {
      id: exp.id,
      tenantId: exp.tenantId,
      projectId: exp.projectId,
      version: exp.version,
      status: exp.status,
      title: exp.title,
      topicDescription: exp.topicDescription,
      targetAudience: exp.targetAudience,
      languagePolicy: exp.languagePolicy,
      bloomLevel: exp.bloomLevel,
      estimatedDurationMin: exp.estimatedDurationMin,
      pedagogicalFramework: exp.pedagogicalFramework,
    },
  });

  // 2. Insert LearningBlueprint
  if (exp.blueprint) {
    console.log("[PipelinePersister] Persisting LearningBlueprint...");
    await db.learningBlueprint.create({
      data: {
        id: exp.blueprint.id,
        experienceId: createdExperience.id,
        narrativeArc: exp.blueprint.narrativeArc,
        learningOutcomes: exp.blueprint.learningOutcomes as any,
        stagePlanJson: exp.blueprint.stagePlanJson as any,
        prerequisiteGraph: exp.blueprint.prerequisiteGraph as any,
        pacingStrategy: exp.blueprint.pacingStrategy as any,
        isApproved: exp.blueprint.isApproved,
      },
    });
  }

  // 3. Insert ConceptBlocks
  console.log("[PipelinePersister] Persisting ConceptBlocks...");
  for (const block of exp.conceptBlocks) {
    await db.conceptBlock.create({
      data: {
        id: block.id,
        experienceId: createdExperience.id,
        orderIndex: block.orderIndex,
        slug: block.slug,
        title: block.title,
        titleAr: block.titleAr,
        stageCategory: block.stageCategory,
        bloomLevel: block.bloomLevel,
        cloIds: block.cloIds,
        sourceBlockIds: block.sourceBlockIds,
        academicTruth: block.academicTruth,
        intuitionMentalModel: block.intuitionMentalModel,
        mechanismExplanation: block.mechanismExplanation,
        realWorldTransfer: block.realWorldTransfer,
        misconceptionAlert: block.misconceptionAlert,
        coreIdea: block.coreIdea,
        keyTakeaways: block.keyTakeaways,
        keywords: block.keywords,
        estimatedMinutes: block.estimatedMinutes,
      },
    });
  }

  // 4. Insert Activities
  console.log("[PipelinePersister] Persisting LearningActivities...");
  for (const act of exp.activities) {
    await db.learningActivity.create({
      data: {
        id: act.id,
        experienceId: createdExperience.id,
        conceptBlockId: act.conceptBlockId,
        activityType: act.activityType,
        title: act.title,
        prompt: act.prompt,
        promptAr: act.promptAr,
        actionVerb: act.actionVerb,
        scaffoldingLevel: act.scaffoldingLevel,
        initialContext: act.initialContext as any,
        expectedResponseCriteria: act.expectedResponseCriteria as any,
        modelAnswer: act.modelAnswer,
        progressiveHints: act.progressiveHints,
        misconceptionTriggers: act.misconceptionTriggers as any,
        orderIndex: act.orderIndex,
      },
    });
  }

  // 5. Insert Assessments
  console.log("[PipelinePersister] Persisting AssessmentItems...");
  for (const item of exp.assessments) {
    await db.assessmentItem.create({
      data: {
        id: item.id,
        experienceId: createdExperience.id,
        conceptBlockId: item.conceptBlockId,
        assessmentType: item.assessmentType,
        bloomLevel: item.bloomLevel,
        difficulty: item.difficulty,
        stem: item.stem,
        stemAr: item.stemAr,
        options: item.options as any,
        correctOptionId: item.correctOptionId,
        instructorRationale: item.instructorRationale,
        distractorExplanations: item.distractorExplanations as any,
        cloId: item.cloId,
        orderIndex: item.orderIndex,
        isFinalGate: item.isFinalGate,
      },
    });
  }

  // 6. Insert VisualArtifacts
  console.log("[PipelinePersister] Persisting VisualArtifacts...");
  for (const vis of exp.visuals) {
    await db.visualArtifact.create({
      data: {
        id: vis.id,
        experienceId: createdExperience.id,
        conceptBlockId: vis.conceptBlockId,
        visualType: vis.visualType,
        title: vis.title,
        purpose: vis.purpose,
        learningMessage: vis.learningMessage,
        specificationJson: vis.specificationJson as any,
        assetSourceTier: vis.assetSourceTier,
        primaryAssetUrl: vis.primaryAssetUrl,
        vectorSvgCode: vis.vectorSvgCode,
        thumbnailUrl: vis.thumbnailUrl,
        licenseType: vis.licenseType,
        attributionText: vis.attributionText,
        orderIndex: vis.orderIndex,
      },
    });
  }

  // 7. Insert EvidenceReferences
  console.log("[PipelinePersister] Persisting EvidenceReferences...");
  for (const ev of exp.evidenceReferences) {
    await db.evidenceReference.create({
      data: {
        id: ev.id,
        experienceId: createdExperience.id,
        conceptBlockId: ev.conceptBlockId,
        sourceBlockId: ev.sourceBlockId,
        claimText: ev.claimText,
        claimType: ev.claimType,
        sourceLocator: ev.sourceLocator,
        verbatimExcerpt: ev.verbatimExcerpt,
        verificationStatus: ev.verificationStatus,
        confidenceScore: ev.confidenceScore,
      },
    });
  }

  // 8. Insert ExperienceGuide
  if (exp.guide) {
    console.log("[PipelinePersister] Persisting ExperienceGuide...");
    await db.experienceGuide.create({
      data: {
        id: exp.guide.id,
        experienceId: createdExperience.id,
        facultyGuideJson: exp.guide.facultyGuideJson as any,
        studentCompanionJson: exp.guide.studentCompanionJson as any,
      },
    });
  }

  // 9. Insert ExperienceGateResults
  console.log("[PipelinePersister] Persisting ExperienceGateResults...");
  for (const gate of exp.gateResults || []) {
    await db.experienceGateResult.create({
      data: {
        id: gate.id,
        experienceId: createdExperience.id,
        passNumber: gate.passNumber,
        gateName: gate.gateName,
        status: gate.status,
        score: gate.score,
        findingsJson: gate.findingsJson as any,
        waivedBy: gate.waivedBy,
        waiveReason: gate.waiveReason,
        checkedAt: gate.checkedAt,
      },
    });
  }
}
