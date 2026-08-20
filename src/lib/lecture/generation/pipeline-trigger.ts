import { db } from "@/lib/db";
import { PipelineRunner } from "./pipeline/pipeline-runner";
import { createInitialPipelineContext } from "./pipeline/pipeline-context";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("pipeline-trigger");

/**
 * Triggers the 17-pass content generation pipeline for a project in the background.
 */
export async function triggerPipelineGeneration(projectId: string): Promise<void> {
  log.info({ projectId }, "Triggering 17-pass pipeline generation in background");

  try {
    // 1. Fetch project with all source documents and course profile
    const project = await db.lectureProject.findUnique({
      where: { id: projectId },
      include: {
        courseProfile: true,
        sourceDocuments: {
          include: {
            sourceBlocks: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // 2. Format CLOs and documents for the context
    const teacherEnteredClos = (project.courseProfile.teacherEnteredClos as any[]) || [];
    const selectedCloIds = project.courseProfile.selectedLectureCloIds || [];

    const rawSourceDocuments = project.sourceDocuments.map((doc) => {
      const blockText = doc.sourceBlocks?.map((b) => b.text).join("\n\n") || "";
      return {
        id: doc.id,
        title: doc.originalName || doc.id,
        text: blockText,
      };
    });

    // 3. Create pipeline context
    const ctx = createInitialPipelineContext({
      projectId: project.id,
      tenantId: project.tenantId,
      title: project.title,
      topicDescription: project.title, // Fallback to title
      targetAudience: project.courseProfile.specialty || "Undergraduate Students",
      languagePolicy: (project.courseProfile.languagePolicy as any) || "en",
      estimatedDurationMin: 50, // Default duration
      rawSourceDocuments,
      teacherEnteredClos: teacherEnteredClos.map((c) => ({
        id: c.id,
        number: c.number || c.id,
        text: c.text,
        bloomLevel: c.bloomLevel,
      })),
      selectedCloIds,
    });

    // 4. Run the pipeline runner in the background
    const runner = new PipelineRunner();
    
    // We run it as a fire-and-forget promise in the background
    runner.run(ctx)
      .then((finishedCtx) => {
        if (finishedCtx.status === "failed") {
          log.error({ projectId, errors: finishedCtx.errors }, "17-pass pipeline generation failed");
        } else {
          log.info({ projectId, status: finishedCtx.status }, "17-pass pipeline generation completed successfully");
        }
      })
      .catch((err) => {
        log.error({ projectId, error: err?.message || String(err) }, "Fatal error during 17-pass pipeline run");
      });

  } catch (err: any) {
    log.error({ projectId, error: err?.message || String(err) }, "Failed to initialize 17-pass pipeline trigger");
  }
}
