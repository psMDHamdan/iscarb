/**
 * PII Sanitizer — Redact Personal Identifiers Before External AI Calls
 * ===========================================================================
 * Centralized sanitizer applied at the AI-client boundary. All user-derived
 * content sent to external AI endpoints (NVIDIA, etc.) passes through this
 * layer to strip personally identifiable information (PII).
 *
 * This reduces PDPL (Saudi Personal Data Protection Law) exposure: personal
 * identifiers embedded in student answer text or faculty source excerpts no
 * longer leave the application.
 *
 * Only user/student/faculty-derived free text is sanitized. Structural content
 * (rubrics, system instructions, model prompts) is NOT touched.
 */

// ─── PII Patterns ───────────────────────────────────────────────────────────

/** Email addresses: user@domain.tld */
const EMAIL_REGEX =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/**
 * Phone numbers: Saudi (05XXXXXXXX, +9665XXXXXXXX, 9665XXXXXXXX) and
 * international (+XXXXXXXXXXX, 00XXXXXXXXXXX). Narrow patterns to avoid
 * false positives on national IDs and student IDs.
 */
const PHONE_REGEX_SAUDI_LOCAL = /\b05[0-9]{8}\b/g;
const PHONE_REGEX_SAUDI_INTL = /(?:\+966|00966|966)\s*5[0-9]{8}\b/g;
const PHONE_REGEX_INTL = /\+\d{1,3}\s*\d{4,14}\b/g;

/**
 * Saudi National ID / Iqama number: 10-digit number.
 * Saudi national IDs start with 1 or 2 and are exactly 10 digits.
 * Iqama numbers are also 10 digits (often starting with 2).
 * We match sequences of exactly 10 consecutive digits that look like IDs.
 */
const NATIONAL_ID_REGEX =
  /\b(?:1[0-9]{9}|2[0-9]{9})\b/g;

/**
 * Student ID patterns: common formats like "2023012345", "S1234567",
 * "STU-12345", or labeled patterns like "student id: XXXXXXXX".
 */
const STUDENT_ID_LABELED_REGEX =
  /((?:student[_\s]*(?:id|number|no|#))\s*[:=]?\s*)[A-Za-z0-9\-]{4,20}\b/gi;

const STUDENT_ID_PATTERN_REGEX =
  /\b(?:STU[-]?[0-9]{4,10}|20[0-9]{8})\b/g;

/**
 * IBAN (Saudi format starts with SA, but any IBAN is PII).
 * IBANs are 15-34 alphanumeric characters with country prefix.
 */
const IBAN_REGEX =
  /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}\b/g;

// ─── Sanitizer ──────────────────────────────────────────────────────────────

export interface SanitizeResult {
  /** The sanitized text with PII replaced by placeholders */
  sanitized: string;
  /** Number of PII instances redacted */
  redactedCount: number;
  /** Types of PII detected */
  detectedTypes: string[];
}

/**
 * Sanitize a string by redacting common personal identifiers.
 *
 * This function is designed to be applied to user-derived content only
 * (student answers, faculty source excerpts, free-text input). It should
 * NOT be applied to structural content like rubrics, system prompts, or
 * model instructions.
 *
 * @param text - The raw user-derived text
 * @returns Sanitized text with PII replaced by neutral placeholders
 */
export function sanitizePII(text: string): SanitizeResult {
  if (!text || typeof text !== "string") {
    return { sanitized: text ?? "", redactedCount: 0, detectedTypes: [] };
  }

  let result = text;
  let totalRedacted = 0;
  const detectedTypes: string[] = [];

  // 1. Email addresses
  const emailMatches = result.match(EMAIL_REGEX);
  if (emailMatches && emailMatches.length > 0) {
    totalRedacted += emailMatches.length;
    detectedTypes.push("email");
    result = result.replace(EMAIL_REGEX, "[REDACTED_EMAIL]");
  }

  // 2. Labeled student IDs (e.g., "student id: 2023012345") — match BEFORE phone/ID
  const labeledMatches = result.match(STUDENT_ID_LABELED_REGEX);
  if (labeledMatches && labeledMatches.length > 0) {
    totalRedacted += labeledMatches.length;
    detectedTypes.push("student_id");
    result = result.replace(STUDENT_ID_LABELED_REGEX, "$1[REDACTED_STUDENT_ID]");
  }

  // 3. Standalone student ID patterns (STU- prefix, long numeric IDs)
  const studentMatches = result.match(STUDENT_ID_PATTERN_REGEX);
  if (studentMatches && studentMatches.length > 0) {
    const realIds = studentMatches.filter((m) => {
      if (/^20[0-9]{2}$/.test(m)) return false;
      if (m.length < 6) return false;
      return true;
    });
    if (realIds.length > 0) {
      totalRedacted += realIds.length;
      detectedTypes.push("student_id_pattern");
      result = result.replace(STUDENT_ID_PATTERN_REGEX, (match) => {
        if (/^20[0-9]{2}$/.test(match) || match.length < 6) return match;
        return "[REDACTED_STUDENT_ID]";
      });
    }
  }

  // 4. National ID / Iqama (10-digit Saudi IDs) — match BEFORE phone
  const idMatches = result.match(NATIONAL_ID_REGEX);
  if (idMatches && idMatches.length > 0) {
    totalRedacted += idMatches.length;
    detectedTypes.push("national_id");
    result = result.replace(NATIONAL_ID_REGEX, "[REDACTED_ID]");
  }

  // 5. Phone numbers — match AFTER IDs to avoid false positives
  const phoneLocalMatches = result.match(PHONE_REGEX_SAUDI_LOCAL);
  const phoneIntlMatches = result.match(PHONE_REGEX_SAUDI_INTL);
  const phoneGenericMatches = result.match(PHONE_REGEX_INTL);
  const phoneCount =
    (phoneLocalMatches?.length ?? 0) +
    (phoneIntlMatches?.length ?? 0) +
    (phoneGenericMatches?.length ?? 0);
  if (phoneCount > 0) {
    totalRedacted += phoneCount;
    detectedTypes.push("phone");
    result = result.replace(PHONE_REGEX_SAUDI_LOCAL, "[REDACTED_PHONE]");
    result = result.replace(PHONE_REGEX_SAUDI_INTL, "[REDACTED_PHONE]");
    result = result.replace(PHONE_REGEX_INTL, "[REDACTED_PHONE]");
  }

  // 6. IBANs
  const ibanMatches = result.match(IBAN_REGEX);
  if (ibanMatches && ibanMatches.length > 0) {
    // Filter: only match strings that look like IBANs (country code + digits)
    const realIbans = ibanMatches.filter((m) => /^[A-Z]{2}[0-9]{2}[A-Z0-9]/.test(m) && m.length >= 15);
    if (realIbans.length > 0) {
      totalRedacted += realIbans.length;
      detectedTypes.push("iban");
      result = result.replace(IBAN_REGEX, (match) => {
        if (/^[A-Z]{2}[0-9]{2}[A-Z0-9]/.test(match) && match.length >= 15) {
          return "[REDACTED_IBAN]";
        }
        return match;
      });
    }
  }

  return {
    sanitized: result,
    redactedCount: totalRedacted,
    detectedTypes: Array.from(new Set(detectedTypes)),
  };
}

/**
 * Sanitize multiple text fields in an object (e.g., messages array).
 * Useful for batch-sanitizing prompt content.
 */
export function sanitizeTextFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[]
): { result: T; totalRedacted: number; detectedTypes: string[] } {
  const result = { ...obj };
  let totalRedacted = 0;
  const allTypes: string[] = [];

  for (const field of fields) {
    if (typeof result[field] === "string") {
      const sanitized = sanitizePII(result[field] as string);
      (result as Record<string, unknown>)[field] = sanitized.sanitized;
      totalRedacted += sanitized.redactedCount;
      allTypes.push(...sanitized.detectedTypes);
    }
  }

  return {
    result,
    totalRedacted,
    detectedTypes: Array.from(new Set(allTypes)),
  };
}
