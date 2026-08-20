/**
 * Lecture Planning — CLO entry & approval validation (FR-004, AC-15).
 * ===========================================================================
 * Faculty-entered CLO text is immutable after approval. This module validates
 * the shape/selection of submitted CLOs and guards against post-approval edits.
 */
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";

export type { CourseLearningOutcome };

export interface CloValidation {
  valid: boolean;
  errors: string[];
}

export function validateCloSelection(clos: CourseLearningOutcome[], selectedIds: string[]): CloValidation {
  const errors: string[] = [];

  if (!Array.isArray(clos) || clos.length === 0) {
    errors.push("teacherEnteredClos must contain at least one CLO");
  }
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    errors.push("selectedLectureCloIds must contain at least one CLO id");
  } else if (selectedIds.length > 5) {
    errors.push("selectedLectureCloIds must select 1–5 CLOs");
  }

  if (Array.isArray(clos) && Array.isArray(selectedIds)) {
    for (const id of selectedIds) {
      if (!clos.some((c) => c.id === id)) {
        errors.push(`Selected CLO "${id}" does not exist in teacherEnteredClos`);
      }
    }
    for (const clo of clos) {
      if (typeof clo.id !== "string" || !clo.id) errors.push("Every CLO needs an id");
      if (typeof clo.text !== "string" || clo.text.trim().length === 0) {
        errors.push(`CLO ${clo.number ?? clo.id} has empty text`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export interface ApprovalGuard {
  valid: boolean;
  error?: string;
}

/**
 * The plan cannot be generated until CLOs are approved (AC-15). Returns the
 * canonical error code used by the plan generation API.
 */
export function assertClosApproved(approvedAt: Date | string | null | undefined): ApprovalGuard {
  if (!approvedAt) return { valid: false, error: "CLO_APPROVAL_REQUIRED" };
  return { valid: true };
}
