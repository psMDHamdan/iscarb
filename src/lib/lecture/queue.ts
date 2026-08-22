/**
 * Lecture Background Jobs — local execution queue helper.
 * ===========================================================================
 * Hardcoded to run in-process for local development and non-serverless deployments.
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
  void generateAllSlides(projectId, targets);
  return targets.length;
}

export async function enqueuePlan(projectId: string, regenerate: boolean): Promise<void> {
  // On Vercel serverless, fire-and-forget (void) tasks are killed when the
  // HTTP response is sent. We must await the plan generation so it completes
  // within the request lifecycle. The frontend polls for progress and picks
  // up the result immediately after POST returns.
  await generateISCARBPlan(projectId, regenerate);
}

export async function enqueueParse(documentId: string): Promise<void> {
  // On Vercel serverless, fire-and-forget tasks are killed when the HTTP
  // response is sent. Await the parse so source blocks are created before
  // the upload response returns.
  await parseSourceDocument(documentId);
}
