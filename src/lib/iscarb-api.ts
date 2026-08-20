// Re-export from new locations — update imports to @/utils/*
export {
  safeJson, clamp, participationScore, attendanceRate, marketHeat,
  titleCase, PERSONA_FALLBACK_NUDGE, PROGRAM_FALLBACK, fallbackCareer,
  ENFORCE_SEPARATION, isGenericTitle, withTimeout,
} from "@/utils/iscarb-api";
// apiSuccess/apiError live in api-response.ts (single source of truth)
export { apiSuccess, apiError } from "@/utils/api-response";

// Missing re-exports needed by API routes
export const DEAN_NOTIFICATION_THRESHOLD_PCT = 20;
export const SEPARATION_NOTE = "Grades and evaluations are handled separately from attendance and participation tracking.";
