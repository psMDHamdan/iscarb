/**
 * Lecture Generation — post-generation artifact validation (TASK-04 §C).
 * ===========================================================================
 * Every generated artifact must satisfy the content contract before it can be
 * persisted as clean: ≤40 visible words, ≤5 bullets, a specific visual intent,
 * at least one source citation, ≥1 linked CLO and ≥1 linked source block
 * (AC-08). Failures flag the artifact.
 */
import type { SlideContentJson } from "./types";

export const MAX_VISIBLE_WORDS = 40;
export const MAX_BULLETS = 5;

export function validateArtifact(artifact: SlideContentJson, opts: { allowSynthesis?: boolean } = {}): string[] {
  const errors: string[] = [];

  if (artifact.wordCount > MAX_VISIBLE_WORDS) {
    errors.push(`Word count ${artifact.wordCount} exceeds ${MAX_VISIBLE_WORDS}`);
  }
  if (artifact.bullets.length > MAX_BULLETS) {
    errors.push(`${artifact.bullets.length} bullets — max is ${MAX_BULLETS}`);
  }
  if (!artifact.visualIntent || artifact.visualIntent.trim().length === 0) {
    errors.push("Missing visual intent");
  }
  if (!artifact.citations || artifact.citations.length === 0) {
    if (!opts.allowSynthesis) {
      errors.push("No source citations");
    }
  }
  if (!artifact.cloIds || artifact.cloIds.length === 0) {
    errors.push("Artifact must link to at least one CLO");
  }
  // AC-08: approved synthesis slides (e.g. S3 verbatim CLO slide) are exempt
  // from the source-block linkage requirement.
  if (!opts.allowSynthesis && (!artifact.sourceBlockIds || artifact.sourceBlockIds.length === 0)) {
    errors.push("Artifact must link to at least one source block");
  }

  return errors;
}

export function artifactGate(artifact: SlideContentJson, opts: { allowSynthesis?: boolean } = {}): { valid: boolean; errors: string[] } {
  const errors = validateArtifact(artifact, opts);
  return { valid: errors.length === 0, errors };
}
