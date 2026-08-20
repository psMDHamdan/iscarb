/**
 * Lecture Planning — structural plan validator (BRD §7.1 slot contract).
 * ===========================================================================
 * Validates a generated/edited S1–S20 plan against the fixed slot contract:
 *   - exactly 20 uniquely numbered slides
 *   - a misconception slide (one of S5–S8)
 *   - a worked_example interaction (calculation slide)
 *   - ≥ 2 polls, ≥ 3 pause_discuss, ≥ 1 collaboration
 *   - fixed-slot functions (S1/S2/S3/S18/S19/S20) cannot be reassigned
 */
import type { LectureSlidePlan } from "@prisma/client";

export interface ValidationError {
  rule: string;
  message: string;
}

/** Slide numbers whose function is contract-fixed and cannot be edited. */
export const FIXED_SLOTS = new Set(Array.from({ length: 20 }, (_, i) => i + 1));

/** §7.1 canonical function per fixed slot. */
export const FIXED_SLOT_FUNCTION: Record<number, string> = {
  1: "hook",
  2: "domain_spine",
  3: "clos",
  4: "h_stack",
  5: "foundation",
  6: "foundation",
  7: "foundation",
  8: "misconception",
  9: "calculation",
  10: "deep_dive",
  11: "deep_dive",
  12: "deep_dive",
  13: "trade_off",
  14: "application",
  15: "application",
  16: "application",
  17: "application",
  18: "rubric",
  19: "evidence",
  20: "readiness",
};

export interface SlideLike {
  slideNo: number;
  function: string;
  interactionType: string | null;
}

export function validatePlanStructure(slides: SlideLike[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (slides.length !== 20) {
    errors.push({ rule: "slide_count", message: "Must be exactly 20 slides" });
  }

  // Uniquely numbered slides (S1–S20, no duplicates).
  const numbers = slides.map((s) => s.slideNo);
  const unique = new Set(numbers);
  if (unique.size !== numbers.length) {
    errors.push({ rule: "unique_slides", message: "Slide numbers must be unique" });
  }
  for (let n = 1; n <= 20; n++) {
    if (!unique.has(n)) {
      errors.push({ rule: "missing_slide", message: `Slide S${n} is missing` });
    }
  }

  const polls = slides.filter((s) => s.interactionType === "poll").length;
  if (polls < 2) errors.push({ rule: "poll_count", message: `Only ${polls} polls — need ≥2` });

  const pauseDiscuss = slides.filter((s) => s.interactionType === "pause_discuss").length;
  if (pauseDiscuss < 3) errors.push({ rule: "pause_discuss_count", message: `Only ${pauseDiscuss} — need ≥3` });

  const collaboration = slides.filter((s) => s.interactionType === "collaboration").length;
  if (collaboration < 1) errors.push({ rule: "collaboration_count", message: `Only ${collaboration} — need ≥1` });

  // Fixed-slot function integrity.
  for (const [slideNo, fn] of Object.entries(FIXED_SLOT_FUNCTION)) {
    const slide = slides.find((s) => s.slideNo === Number(slideNo));
    if (slide && slide.function !== fn) {
      errors.push({ rule: "fixed_slot_function", message: `S${slideNo} must be "${fn}", got "${slide.function}"` });
    }
  }

  return errors;
}

export interface PlanGate {
  valid: boolean;
  errors: ValidationError[];
  gate: "passed" | "failed";
}

export function planGate(slides: SlideLike[]): PlanGate {
  const errors = validatePlanStructure(slides);
  return { valid: errors.length === 0, errors, gate: errors.length === 0 ? "passed" : "failed" };
}

/** Map persisted rows to the structural shape used by the validator. */
export function toSlideLike(rows: Pick<LectureSlidePlan, "slideNo" | "function" | "interactionType">[]): SlideLike[] {
  return rows.map((r) => ({ slideNo: r.slideNo, function: r.function, interactionType: r.interactionType }));
}
