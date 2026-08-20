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
  if (artifact.body?.bullets?.length > MAX_BULLETS) {
    errors.push(`${artifact.body.bullets.length} bullets — max is ${MAX_BULLETS}`);
  }
  
  // IMAGE TIER SYSTEM VALIDATION
  const visualIntent = artifact.visualIntent;
  if (!visualIntent) {
    errors.push("Missing visualIntent object");
  } else {
    const hasSourceFigure = Boolean(visualIntent.sourceFigureRef?.trim());
    const generatesDiagram = Boolean(visualIntent.generateDiagram);
    if (!hasSourceFigure && !generatesDiagram) {
      errors.push("Tier 3 Visual (Unsupported): No source figure and generateDiagram is false. BRD requires >=18 visually supported slides.");
    }
  }

  // SOURCE COVERAGE VALIDATION
  if (!artifact.sourceCoverage?.mappedBlockIds || artifact.sourceCoverage.mappedBlockIds.length === 0) {
    if (!opts.allowSynthesis) {
      errors.push("No source citations (mappedBlockIds is empty)");
    }
  }

  if (!artifact.cloLinks || artifact.cloLinks.length === 0) {
    errors.push("Artifact must link to at least one CLO");
  }

  // 7 FORBIDDEN PATTERNS VALIDATION
  const allText = [
    artifact.title,
    artifact.body?.visibleCopy,
    ...(artifact.body?.bullets || []),
    artifact.notes?.instructorNotes,
    artifact.notes?.answers
  ].join(" ").toLowerCase();

  // Pattern 1 & 2: Banned corporate speak
  if (allText.includes("high-performance, secure execution")) {
    errors.push("Forbidden Pattern #1: Contains 'High-performance, secure execution'");
  }
  if (allText.includes("aligned with national digital transformation")) {
    errors.push("Forbidden Pattern #2: Contains 'Aligned with National Digital Transformation'");
  }

  // Pattern 3: Banned generic question
  const titleMatcher = (artifact.title || "").toLowerCase();
  if (allText.includes(`how does ${titleMatcher} behave under real-world constraints?`)) {
    errors.push("Forbidden Pattern #3: Contains generic 'How does [TITLE] behave...' question");
  }

  // Pattern 4: Banned generic instructor note
  if (artifact.notes?.instructorNotes?.trim().toLowerCase() === "introduce the core principle clearly") {
    errors.push("Forbidden Pattern #4: Generic instructor note 'Introduce the core principle clearly'");
  }

  // Pattern 5 & 6 are handled by MAX_VISIBLE_WORDS and MAX_BULLETS above.

  // Pattern 7: Banned generic Unsplash stock photo
  if (artifact.visualIntent?.sourceFigureRef?.toLowerCase().includes("unsplash.com")) {
    errors.push("Forbidden Pattern #7: Using a generic Unsplash stock photo");
  }

  return errors;
}

export function artifactGate(artifact: SlideContentJson, opts: { allowSynthesis?: boolean } = {}): { valid: boolean; errors: string[] } {
  const errors = validateArtifact(artifact, opts);
  return { valid: errors.length === 0, errors };
}
