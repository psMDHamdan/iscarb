/**
 * Lecture Background Jobs — in-process queue for the long-lived Node/Docker VM.
 * ===========================================================================
 * Fire-and-forget on the same process is correct here: generation can run for
 * many minutes. Do not replace with a serverless enqueue without an off-box worker.
 */
import { generateAllSlides } from "./generation/generation-worker";
import { generateISCARBPlan } from "./planner/plan-generator";
import { parseSourceDocument } from "./ingestion/parse-worker";

/** Slides per generation job (maintained for structural compatibility if needed) */
export const GENERATE_CHUNK_SIZE = Math.max(
  1,
  Number.parseInt(process.env.LECTURE_GENERATE_CHUNK_SIZE || "4", 10) || 4,
);

export async function enqueueGeneration(projectId: string, slideNos?: number[]): Promise<number> {
  const targets = slideNos && slideNos.length > 0 ? slideNos : Array.from({ length: 20 }, (_, i) => i + 1);
  void generateAllSlides(projectId, targets).catch((err) => {
    console.error(`[lecture-queue] generate failed project=${projectId}:`, err);
  });
  return targets.length;
}

export async function enqueuePlan(projectId: string, regenerate: boolean): Promise<void> {
  void generateISCARBPlan(projectId, regenerate).catch((err) => {
    console.error(`[lecture-queue] plan failed project=${projectId}:`, err);
  });
}

export async function enqueueParse(documentId: string): Promise<void> {
  void parseSourceDocument(documentId).catch((err) => {
    console.error(`[lecture-queue] parse failed document=${documentId}:`, err);
  });
}
