/**
 * Lecture Ingestion — parse worker.
 * ===========================================================================
 * Runs a source document through the parse pipeline:
 *   load file → dispatch to parser → build source blocks → update status.
 * Progress is published to Redis at `lecture:job:{documentId}` so the
 * upload/job-status endpoints can report live status. Re-runnable: calling it
 * for an already-parsed document overwrites its blocks (createMany with
 * skipDuplicates is not used here — we delete+recreate so re-parse works).
 */
import { db } from "@/lib/db";
import { redis } from "@/config/redis";
import { getLectureFile } from "@/lib/lecture/storage";
import { parseByType } from "@/lib/lecture/ingestion/parsers";
import { buildSourceBlocks } from "@/lib/lecture/ingestion/source-block-builder";

const JOB_PREFIX = "lecture:job:";

export function jobKey(documentId: string): string {
  return `${JOB_PREFIX}${documentId}`;
}

export async function setJobProgress(
  documentId: string,
  data: { status?: string; progress?: number; error?: string }
): Promise<void> {
  try {
    await redis.hset(jobKey(documentId), data);
  } catch {
    // Redis unavailable (e.g. Vercel) — parse still works, no live progress.
  }
}

export async function parseSourceDocument(documentId: string): Promise<void> {
  try {
    const document = await db.lectureSourceDocument.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new Error(`Source document not found: ${documentId}`);
    }

    await setJobProgress(documentId, { status: "parsing", progress: 10, error: "" });

    const fileBuffer = await getLectureFile(document.storageKey);
    await setJobProgress(documentId, { status: "parsing", progress: 40, error: "" });

    const rawBlocks = await parseByType(document.type, fileBuffer);
    await setJobProgress(documentId, { status: "parsing", progress: 75, error: "" });

    // Re-parse semantics: drop previously built blocks, then rebuild.
    await db.lectureSourceBlock.deleteMany({ where: { documentId } });
    await buildSourceBlocks(document.projectId, documentId, rawBlocks);

    await setJobProgress(documentId, { status: "done", progress: 100, error: "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await db.lectureSourceDocument.update({ where: { id: documentId }, data: { parseStatus: "failed" } });
    } catch {
      // Ignore secondary failures — the job status below still records the error.
    }
    await setJobProgress(documentId, { status: "failed", progress: 100, error: message });
  }
}
