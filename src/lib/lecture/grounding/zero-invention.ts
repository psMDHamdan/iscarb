import { scanQuantitativeFigures } from "./quantitative-scanner";
import type { SourceBlock, ZeroInventionResult } from "./types";

/**
 * Authoritative fallback string mandated when source data is missing.
 */
export const NOT_SPECIFIED_FALLBACK = "Not specified in the provided source";

/**
 * Checks if a given text string matches or contains the canonical missing data fallback.
 */
export function isNotSpecified(text: string | null | undefined): boolean {
  if (!text || !text.trim()) return true;
  const lower = text.trim().toLowerCase();
  return (
    lower === NOT_SPECIFIED_FALLBACK.toLowerCase() ||
    lower.includes("not specified in the provided source") ||
    lower.includes("not specified in source") ||
    lower === "not specified" ||
    lower === "n/a" ||
    lower === "unknown"
  );
}

/**
 * Enforces strict zero invention on generated fields or factual parameters.
 * If data is missing or ungrounded fabricated figures are detected, deterministically
 * replaces the output with NOT_SPECIFIED_FALLBACK.
 */
export function enforceZeroInvention(
  field: string,
  requestedData: string | null | undefined,
  sources: SourceBlock[]
): ZeroInventionResult {
  const trimmed = (requestedData || "").trim();

  // 1. Missing or empty requested data
  if (!trimmed || isNotSpecified(trimmed)) {
    return {
      output: NOT_SPECIFIED_FALLBACK,
      hasMissingDataFallback: true,
      fabricatedNumbers: [],
      isClean: true,
    };
  }

  // 2. Empty source corpus
  if (!sources || sources.length === 0) {
    return {
      output: NOT_SPECIFIED_FALLBACK,
      hasMissingDataFallback: true,
      fabricatedNumbers: [],
      isClean: true,
    };
  }

  // 3. Scan for quantitative hallucinations
  const scan = scanQuantitativeFigures(trimmed, sources);

  if (!scan.passed && scan.hallucinatedFigures.length > 0) {
    return {
      output: NOT_SPECIFIED_FALLBACK,
      hasMissingDataFallback: true,
      fabricatedNumbers: scan.hallucinatedFigures,
      isClean: false,
    };
  }

  // 4. Grounded and valid data
  return {
    output: trimmed,
    hasMissingDataFallback: false,
    fabricatedNumbers: [],
    isClean: true,
  };
}
