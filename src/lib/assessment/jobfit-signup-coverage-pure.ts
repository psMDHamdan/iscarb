/**
 * Phase 5 — Pure helpers for signup Job-Fit coverage (no DB / safe for unit tests).
 */
import {
  resolveJobFitTrackKey,
  normalizeSpec,
  generateGenericJobFit,
} from "@/lib/assessment/catalog";

/** Module codes the exam will request for a generic specialty Job-Fit trio. */
export function expectedGenericJobFitCodes(specialization: string): string[] {
  const blueprint = generateGenericJobFit(specialization);
  const specKey =
    normalizeSpec(blueprint.specialization).toUpperCase() || "GENERIC";
  return [1, 2, 3].map((i) => `JOBFIT-${specKey}-${i}`);
}

/**
 * True when specialty is outside JOBFIT_TRACKS / aliases (needs signup generation).
 */
export function specialtyNeedsSignupJobFitGeneration(
  specialization: string,
): boolean {
  const trimmed = specialization.trim();
  if (!trimmed) return false;
  return resolveJobFitTrackKey(trimmed) == null;
}
