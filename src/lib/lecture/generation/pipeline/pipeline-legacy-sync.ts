import { db } from "@/lib/db";
import type { PipelineContext } from "./pipeline-context";

/**
 * Maps the new LearningExperience graph back to the legacy LectureSlideArtifact
 * format so the existing Faculty Studio UI works seamlessly.
 */
export async function syncToLegacyArtifacts(ctx: PipelineContext): Promise<void> {
  const exp = ctx.canonicalExperience;
  if (!exp) return;

  const projectId = exp.projectId;

  // Clear existing artifacts for this project
  await db.lectureSlideArtifact.deleteMany({
    where: { projectId },
  });

  console.log(`[LegacySync] Syncing ${exp.conceptBlocks.length} concept blocks to LectureSlideArtifacts...`);

  // We need to fetch the existing SlidePlans to associate the slidePlanId
  const plans = await db.lectureSlidePlan.findMany({
    where: { projectId },
    orderBy: { slideNo: "asc" },
  });

  for (const block of exp.conceptBlocks) {
    // Find matching plan by slideNo (assuming orderIndex == slideNo)
    const plan = plans.find((p: any) => p.slideNo === block.orderIndex) || plans[block.orderIndex - 1];
    if (!plan) continue;

    const activity = exp.activities.find((a) => a.conceptBlockId === block.id);
    const assessment = exp.assessments.find((a) => a.conceptBlockId === block.id);
    const visual = exp.visuals.find((v) => v.conceptBlockId === block.id);

    const contentJson = {
      title: block.title,
      bullets: [block.coreIdea, ...block.keyTakeaways],
      visibleCopy: block.mechanismExplanation || block.intuitionMentalModel || "",
      studentAction: activity?.prompt || assessment?.stem || "",
      visualIntent: visual?.purpose || visual?.learningMessage || "",
      visualType: visual?.visualType || "none",
      visualSpec: {
        imageUrl: visual?.primaryAssetUrl || "",
        title: visual?.title || block.title,
        caption: visual?.learningMessage || "",
        visualType: visual?.visualType || "none",
        svgCode: visual?.vectorSvgCode || "",
      },
    };

    await db.lectureSlideArtifact.create({
      data: {
        projectId,
        slidePlanId: plan.id,
        slideNo: block.orderIndex,
        version: 1,
        status: "generated",
        contentJson,
        wordCount: 50,
        bulletCount: contentJson.bullets.length,
      },
    });
  }

  console.log("[LegacySync] Successfully synced to legacy artifacts.");
}
