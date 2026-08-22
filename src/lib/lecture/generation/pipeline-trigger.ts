import { db } from "@/lib/db";
import { PipelineRunner } from "./pipeline/pipeline-runner";
import { createInitialPipelineContext } from "./pipeline/pipeline-context";
import { moduleLogger } from "@/lib/logger";
import { persistPipelineContext } from "./pipeline/pipeline-persister";
import { syncToLegacyArtifacts } from "./pipeline/pipeline-legacy-sync";
import { clearProjectionCache } from "../projections/projection-cache";
import { redis } from "@/config/redis";
import { generationJobKey } from "./generation-worker";

const log = moduleLogger("pipeline-trigger");

async function setProgress(projectId: string, state: { status: string; progress: number; error?: string }) {
  try {
    await redis.hset(generationJobKey(projectId), state);
  } catch (e: any) {
    log.warn({ projectId, error: e?.message }, "Failed to update pipeline progress in Redis");
  }
}

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

    const rawSourceDocuments = project.sourceDocuments.flatMap((doc) => {
      return (doc.sourceBlocks || []).map((b) => ({
        id: b.id,
        title: doc.originalName || doc.id,
        text: b.text,
      }));
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
      .then(async (finishedCtx) => {
        if (finishedCtx.status === "failed") {
          log.error({ projectId, errors: finishedCtx.errors }, "17-pass pipeline generation failed");
          await setProgress(projectId, { status: "failed", progress: 100, error: finishedCtx.errors.join(", ") });
        } else {
          log.info({ projectId, status: finishedCtx.status }, "17-pass pipeline generation completed successfully, persisting to DB...");
          await persistPipelineContext(finishedCtx);
          await syncToLegacyArtifacts(finishedCtx);
          clearProjectionCache(projectId);
          await setProgress(projectId, { status: "done", progress: 100 });
          log.info({ projectId }, "Pipeline data persisted successfully.");
        }
      })
      .catch((err) => {
        log.error({ projectId, error: err?.message || String(err) }, "Fatal error during 17-pass pipeline run");
      });

  } catch (err: any) {
    log.error({ projectId, error: err?.message || String(err) }, "Failed to initialize 17-pass pipeline trigger");
  }
}
