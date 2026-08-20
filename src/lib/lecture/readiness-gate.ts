import type { ReadinessItemJson } from "./generation/types";

/**
 * Computes the S20 Readiness Gate result per BRD §7.4.
 *
 * A student passes when they answer ≥ 3 out of the provided readiness items
 * correctly. The answer key is built from `${item.slideNo}-${idx}` so it is
 * consistent with how `selectedAnswers` is keyed elsewhere in the workbench.
 *
 * @param readinessItems - All readiness items for the lecture.
 * @param selectedAnswers - Map of answer keys to the selected option index.
 * @returns `{ correct, total, passed, rubricLevel }`
 */
export function computeGateResult(
  readinessItems: ReadinessItemJson[],
  selectedAnswers: Record<string, number>
): { correct: number; total: number; passed: boolean; rubricLevel: string } {
  const total = readinessItems.length;
  let correct = 0;

  readinessItems.forEach((item, idx) => {
    const key = `${item.slideNo}-${idx}`;
    if (selectedAnswers[key] === item.correctIndex) correct++;
  });

  const passed = correct >= 3;
  const rubricLevel = passed ? "Proficient (Level 3+)" : "Developing (Below Level 3)";

  return { correct, total, passed, rubricLevel };
}
