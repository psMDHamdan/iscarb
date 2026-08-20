import { PrismaClient } from "@prisma/client";
import { createCanonicalLearningExperience } from "../../../../../tests/lecture/e2e_revamp/harness/mock-factories";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB Seeding for new Learning Experience...");

  // 1. Fetch the first existing project
  const project = await prisma.lectureProject.findFirst({
    select: { id: true, title: true, courseProfile: true },
  });

  if (!project) {
    console.error("No projects found in database. Run standard seeds first.");
    return;
  }

  console.log(`Mapping to project: ${project.title} (${project.id})`);

  // 2. Generate canonical learning experience structure
  const experienceId = "exp-ztm-e2e-canonical";
  const exp = createCanonicalLearningExperience({
    id: experienceId,
    projectId: project.id,
    tenantId: "KFUPM",
  });

  // Clear existing learning experience with this ID if exists
  await prisma.learningExperience.deleteMany({
    where: { id: experienceId },
  });

  // 3. Insert canonical experience using Prisma
  console.log(`Inserting LearningExperience: ${exp.title}`);
  const createdExperience = await prisma.learningExperience.create({
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

  // 4. Insert LearningBlueprint
  console.log("Inserting LearningBlueprint...");
  await prisma.learningBlueprint.create({
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

  // 5. Insert ConceptBlocks
  console.log("Inserting ConceptBlocks...");
  const blockIdMap = new Map<string, string>();
  for (const block of exp.conceptBlocks) {
    const createdBlock = await prisma.conceptBlock.create({
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
    blockIdMap.set(block.id, createdBlock.id);
  }

  // 6. Insert Activities
  console.log("Inserting LearningActivities...");
  for (const act of exp.activities) {
    await prisma.learningActivity.create({
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

  // 7. Insert Assessments
  console.log("Inserting AssessmentItems...");
  for (const item of exp.assessments) {
    await prisma.assessmentItem.create({
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

  // 8. Insert VisualArtifacts
  console.log("Inserting VisualArtifacts...");
  for (const vis of exp.visuals) {
    await prisma.visualArtifact.create({
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

  // 9. Insert ExperienceGuide
  console.log("Inserting ExperienceGuide...");
  if (exp.guide) {
    await prisma.experienceGuide.create({
      data: {
        id: exp.guide.id,
        experienceId: createdExperience.id,
        facultyGuideJson: exp.guide.facultyGuideJson as any,
        studentCompanionJson: exp.guide.studentCompanionJson as any,
      },
    });
  }

  console.log("DB Seeding Complete! Experience ID: exp-ztm-e2e-canonical is fully populated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
