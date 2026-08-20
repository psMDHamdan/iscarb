/**
 * Lecture Generation — model-run cost ledger (NFR-03).
 * ===========================================================================
 * Persists one LectureModelRun row per real model call during lecture
 * generation (slides, readiness items, Vision 2030 ranking) so the university
 * can audit cost, latency, tokens, and output integrity per call — mirroring
 * the AssessmentResponse cost-monitor fields (tokensInput/tokensOutput/costUsd)
 * in the lecture domain. Soft-failed calls (chatJson fallback, model
 * "fallback") are NOT recorded — they never reached the provider, so they
 * cost nothing and would pollute the ledger. Recording is best-effort: a
 * ledger failure must never abort generation, so every error is swallowed
 * after logging.
 */
import { db } from "@/lib/db";
import { calculateTokenCost } from "@/services/cost-tracking.service";
import { createHash } from "crypto";
import type { ChatResult } from "@/lib/ai-engine";

export type ModelRunKind = "slide" | "readiness" | "vision";

export interface RecordModelRunInput {
  projectId: string;
  kind: ModelRunKind;
  result: ChatResult;
  /** LectureSlideArtifact id when the run backs a slide artifact. */
  artifactId?: string | null;
}

/** Best-effort record of one real model call. Never throws. */
export async function recordModelRun(input: RecordModelRunInput): Promise<void> {
  try {
    // chatJson soft-fails (API outage / provider error) with model "fallback".
    // Those calls never produced billable output — skip them for an honest ledger.
    if (input.result.model === "fallback") return;

    const promptTokens = input.result.usage?.promptTokens ?? 0;
    const completionTokens = input.result.usage?.completionTokens ?? 0;
    const costUsd = calculateTokenCost(promptTokens, completionTokens, input.result.model);
    const outputHash = createHash("sha256").update(input.result.content).digest("hex");

    await db.lectureModelRun.create({
      data: {
        projectId: input.projectId,
        kind: input.kind,
        artifactId: input.artifactId ?? null,
        model: input.result.model,
        promptTokens,
        completionTokens,
        latencyMs: input.result.latencyMs,
        costUsd,
        outputHash,
      },
    });
  } catch (err) {
    // Cost tracking is an audit concern, not a generation gate.
    console.error(`recordModelRun (${input.kind}) failed:`, err);
  }
}
