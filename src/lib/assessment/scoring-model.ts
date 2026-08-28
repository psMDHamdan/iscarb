/**
 * Scoring model selection.
 *
 * Live AI scoring of exam answers is the slowest user-facing path (one LLM
 * call per answered module at finish). It defaults to a fast Meta Llama model
 * on the NVIDIA catalog so scoring finishes in seconds instead of minutes.
 * Override per-deployment with EXAM_SCORING_MODEL.
 */
import "server-only";

/** Fast small Llama on the NVIDIA API. Override via EXAM_SCORING_MODEL. */
export const SCORING_MODEL = process.env.EXAM_SCORING_MODEL || "nvidia/nemotron-3-nano-30b-a3b";

/** Resolve the model for a scoring call, preferring the fast scoring model. */
export function scoringModel(_moduleModelTag: string): string {
  return SCORING_MODEL;
}
