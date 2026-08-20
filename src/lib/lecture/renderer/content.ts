/**
 * Renderer content helpers (TASK-08).
 * ===========================================================================
 * Single source of truth for extracting the student-facing text from an
 * approved SlideContentJson. Every renderer (PPTX / HTML / PDF) and the
 * cross-format parity checker read from these functions, so semantic
 * parity (AC-10) is enforced by construction.
 */
import type { SlideContentJson } from "../generation/types";

/** Student-facing title for a slide (Arabic title when present). */
export function slideTitle(content: SlideContentJson): string {
  return content.textAr?.title ?? content.title;
}

/** Student-facing bullets, capped to the ZTM max of 5. */
export function slideBullets(content: SlideContentJson): string[] {
  const raw = content.textAr?.bullets ?? content.bullets;
  if (raw && Array.isArray(raw) && raw.length > 0) {
    return raw.slice(0, 5);
  }

  // Fallback: derive rich bullet points directly from student-facing content fields
  // so PPTX, PDF, and HTML renderers match the interactive Student UX 100%!
  const derived: string[] = [];
  if (content.studentCoreInsight) derived.push(content.studentCoreInsight);
  if (content.studentFramework) derived.push(content.studentFramework);
  if (content.studentMechanismExplanation) derived.push(content.studentMechanismExplanation);
  if (content.studentAnalogy) derived.push(`Analogy: ${content.studentAnalogy}`);
  if (content.studentScenario) derived.push(content.studentScenario);
  if (content.studentApplication) derived.push(content.studentApplication);

  return derived.slice(0, 5);
}

/** Student-facing action line (orange box). */
export function slideAction(content: SlideContentJson): string {
  return content.studentAction ?? "";
}
