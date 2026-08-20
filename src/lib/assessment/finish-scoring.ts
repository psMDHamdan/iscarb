/**
 * Finish-flow scoring gate: skip AI re-score when the answer text is unchanged
 * since the last successful score for that module.
 */

/** True when Finish should call scoreAndPersist for this module text. */
export function shouldScoreOnFinish(
  moduleCode: string,
  text: string,
  lastScoredTextByCode: Readonly<Record<string, string>>,
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return lastScoredTextByCode[moduleCode] !== trimmed;
}

/** Record the text that was just successfully scored for a module. */
export function recordScoredText(
  lastScoredTextByCode: Record<string, string>,
  moduleCode: string,
  text: string,
): void {
  lastScoredTextByCode[moduleCode] = text.trim();
}
