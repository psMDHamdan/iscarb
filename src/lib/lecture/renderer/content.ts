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
  // Priority 1: Arabic bullets
  if (content.textAr?.bullets && Array.isArray(content.textAr.bullets) && content.textAr.bullets.length > 0) {
    return content.textAr.bullets.slice(0, 5);
  }

  // Priority 2: Structured body.bullets (new schema)
  if (content.body?.bullets && Array.isArray(content.body.bullets) && content.body.bullets.length > 0) {
    return content.body.bullets.slice(0, 5);
  }

  // Priority 3: Legacy root-level bullets
  const raw = content.bullets;
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

/** Student-facing action line (orange/green box). Composes poll options if present. */
export function slideAction(content: SlideContentJson): string {
  // Priority 1: Structured body.studentAction (new schema)
  const action = content.body?.studentAction;
  if (action?.stem) {
    const prefix = action.type === "poll" ? "POLL: " : action.type === "pause_discuss" ? "PAUSE & DISCUSS: " : "⚡ ";
    let text = prefix + action.stem;

    // Append poll options if present
    if (action.type === "poll" && action.options && action.options.length > 0) {
      text += "\n" + action.options.join("  ");
    }

    return text;
  }

  // Priority 2: Legacy flat studentAction string
  return content.studentAction ?? "";
}
