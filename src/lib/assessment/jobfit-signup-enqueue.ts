/**
 * Phase 5 — Fire-and-forget enqueue for signup/specialty Job-Fit generation.
 * Must never block signup/exam. Never invoke from exam module assembly.
 */
import "server-only";

import {
  generateSignupJobFitForSpecialty,
  type SignupJobFitGenerationResult,
} from "@/lib/assessment/jobfit-signup-generator";
import {
  hasPublishedJobFitCoverage,
  specialtyNeedsSignupJobFitGeneration,
} from "@/lib/assessment/jobfit-signup-coverage";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("jobfit-signup-enqueue");

/** In-process lock so concurrent signups for the same specialty don't double-generate. */
const inFlight = new Set<string>();

export function isSignupJobFitGenerationInFlight(
  specialization: string,
): boolean {
  return inFlight.has(specialization.trim().toLowerCase());
}

/**
 * Schedule background generation after specialty is captured.
 * Returns immediately; work runs via setImmediate.
 */
export function enqueueSignupJobFitGeneration(
  specializationRaw: string,
): void {
  const specialization = specializationRaw.trim();
  if (!specialization) return;
  if (!specialtyNeedsSignupJobFitGeneration(specialization)) {
    log.debug(
      { specialization },
      "enqueue skipped — curated Job-Fit track",
    );
    return;
  }

  const lockKey = specialization.toLowerCase();
  if (inFlight.has(lockKey)) {
    log.info({ specialization }, "enqueue skipped — generation already in flight");
    return;
  }

  inFlight.add(lockKey);
  setImmediate(() => {
    void (async () => {
      try {
        if (await hasPublishedJobFitCoverage(specialization)) {
          log.info(
            { specialization },
            "enqueue no-op — coverage appeared before worker ran",
          );
          return;
        }
        const result: SignupJobFitGenerationResult =
          await generateSignupJobFitForSpecialty(specialization);
        log.info(
          {
            specialization,
            skipped: result.skipped,
            reason: result.reason,
            autoPublished: result.slots.filter((s) => s.autoPublished).length,
            inReview: result.slots.filter((s) => !s.autoPublished && !s.error)
              .length,
          },
          "signup Job-Fit background generation finished",
        );
      } catch (err) {
        log.error(
          {
            specialization,
            err: err instanceof Error ? err.message : String(err),
          },
          "signup Job-Fit background generation crashed",
        );
      } finally {
        inFlight.delete(lockKey);
      }
    })();
  });
}
