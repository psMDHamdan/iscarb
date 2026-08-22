import { describe, it, expect } from "vitest";
import { sanitizePII } from "../pii-sanitizer";

describe("PII Sanitizer", () => {
  // ─── Email Redaction ──────────────────────────────────────────────

  it("redacts email addresses", () => {
    const result = sanitizePII("My email is john.doe@example.com and I am a student");
    expect(result.sanitized).toBe("My email is [REDACTED_EMAIL] and I am a student");
    expect(result.redactedCount).toBe(1);
    expect(result.detectedTypes).toContain("email");
  });

  it("redacts multiple emails", () => {
    const result = sanitizePII("Contact alice@uni.edu.sa or bob@company.com");
    expect(result.sanitized).toBe("Contact [REDACTED_EMAIL] or [REDACTED_EMAIL]");
    expect(result.redactedCount).toBe(2);
  });

  // ─── Phone Number Redaction ───────────────────────────────────────

  it("redacts Saudi phone numbers (05XXXXXXXX)", () => {
    const result = sanitizePII("Call me at 0512345678 for the project");
    expect(result.sanitized).toBe("Call me at [REDACTED_PHONE] for the project");
    expect(result.redactedCount).toBe(1);
    expect(result.detectedTypes).toContain("phone");
  });

  it("redacts international format (+9665XXXXXXXX)", () => {
    const result = sanitizePII("My number is +966512345678");
    expect(result.sanitized).toBe("My number is [REDACTED_PHONE]");
  });

  // ─── National ID / Iqama ─────────────────────────────────────────

  it("redacts 10-digit Saudi national IDs", () => {
    const result = sanitizePII("My ID is 1234567890 for the registration");
    expect(result.sanitized).toBe("My ID is [REDACTED_ID] for the registration");
    expect(result.redactedCount).toBe(1);
    expect(result.detectedTypes).toContain("national_id");
  });

  it("redacts Iqama numbers starting with 2", () => {
    const result = sanitizePII("Iqama: 2345678901");
    expect(result.sanitized).toBe("Iqama: [REDACTED_ID]");
  });

  // ─── Student ID ──────────────────────────────────────────────────

  it("redacts labeled student IDs", () => {
    const result = sanitizePII("student id: 2023012345 submitted");
    expect(result.sanitized).toBe("student id: [REDACTED_STUDENT_ID] submitted");
    expect(result.redactedCount).toBe(1);
    expect(result.detectedTypes).toContain("student_id");
  });

  it("redacts STU-prefixed student IDs", () => {
    const result = sanitizePII("My STU-1234567 was verified");
    expect(result.sanitized).toBe("My [REDACTED_STUDENT_ID] was verified");
  });

  // ─── Combined PII ────────────────────────────────────────────────

  it("redacts multiple PII types in one string", () => {
    const input =
      "I am Ahmed with email ahmed@kau.edu.sa, phone 0512345678, ID 1234567890, student id: 2023012345";
    const result = sanitizePII(input);
    expect(result.sanitized).toContain("[REDACTED_EMAIL]");
    expect(result.sanitized).toContain("[REDACTED_PHONE]");
    expect(result.sanitized).toContain("[REDACTED_ID]");
    expect(result.sanitized).toContain("[REDACTED_STUDENT_ID]");
    expect(result.redactedCount).toBeGreaterThanOrEqual(4);
    expect(result.detectedTypes.length).toBeGreaterThanOrEqual(4);
  });

  // ─── Structural Content Preserved ────────────────────────────────

  it("does NOT redact structural content (rubric, instructions)", () => {
    const rubric = `Grade the following answer based on CLO-1: "Explain the software development lifecycle".
Points: 10. Criteria: accuracy, completeness, clarity.`;
    const result = sanitizePII(rubric);
    expect(result.sanitized).toBe(rubric);
    expect(result.redactedCount).toBe(0);
  });

  it("does NOT redact code snippets or technical content", () => {
    const code = `function calculateGrade(score: number): number {
  return Math.max(0, Math.min(100, score));
}`;
    const result = sanitizePII(code);
    expect(result.sanitized).toBe(code);
    expect(result.redactedCount).toBe(0);
  });

  it("does NOT redact years that look like student IDs", () => {
    const text = "In 2024, we covered chapters 1-5 of the textbook.";
    const result = sanitizePII(text);
    expect(result.sanitized).toBe(text);
    expect(result.redactedCount).toBe(0);
  });

  // ─── Edge Cases ──────────────────────────────────────────────────

  it("handles empty string", () => {
    const result = sanitizePII("");
    expect(result.sanitized).toBe("");
    expect(result.redactedCount).toBe(0);
  });

  it("handles null/undefined gracefully", () => {
    const result = sanitizePII(null as unknown as string);
    expect(result.sanitized).toBe("");
    expect(result.redactedCount).toBe(0);
  });

  it("returns original text when no PII found", () => {
    const text = "The answer discusses cloud computing architecture patterns.";
    const result = sanitizePII(text);
    expect(result.sanitized).toBe(text);
    expect(result.redactedCount).toBe(0);
    expect(result.detectedTypes).toHaveLength(0);
  });
});
