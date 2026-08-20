/**
 * GATE-12: invented_numbers
 * Detects fabricated statistics, percentages, and numerical claims
 * that are presented as fact but have no source grounding.
 *
 * The AI must NEVER invent:
 * - Scientific percentages (e.g., "95% efficiency")
 * - Experimental results
 * - Clinical outcomes
 * - Quantitative comparisons not in the source
 *
 * If a number appears in the content but is not in the source blocks,
 * it must be flagged as potentially fabricated.
 */
import { GateResult, GateStatus, GateSeverity, type GateFinding } from "../types";

/** Patterns that suggest invented quantitative claims */
const NUMBER_PATTERNS = [
  /\b\d{1,3}(?:\.\d+)?%/g,                                    // Percentages: 95%, 33.3%
  /\b(?:approximately|about|roughly|nearly|over|more than|less than)\s+\d/gi, // Approximate claims
  /\b\d+(?:\.\d+)?\s*(?:fold|times|x)\b/gi,                   // Multipliers: 2x, 3-fold
  /\b\d+(?:\.\d+)?\s*(?:nm|μm|mm|m|km|kb|mb|gb|tb)\b/gi,     // Units with numbers
  /\b(?:efficiency|accuracy|rate|yield|recovery|success)\s*(?:of|:|=)\s*\d/gi, // Metric claims
  /\b\d+(?:\.\d+)?\s*(?:patients?|subjects?|samples?|trials?|replicates?)\b/gi, // Study size claims
];

/** Known safe generic numbers that don't need source grounding */
const SAFE_NUMBERS = new Set([
  "1", "2", "3", "4", "5", "10", "20", "100", // Simple counts
]);

function extractNumbers(text: string): Array<{ value: string; context: string }> {
  const results: Array<{ value: string; context: string }> = [];
  for (const pattern of NUMBER_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const value = match[0];
      const start = Math.max(0, match.index - 40);
      const end = Math.min(text.length, match.index + value.length + 40);
      const context = text.slice(start, end).trim();
      results.push({ value, context });
    }
  }
  return results;
}

export function gateInventedNumbers(
  artifacts: {
    slideNo: number;
    contentJson: {
      bullets?: string[];
      studentAction?: string;
      speakerNotes?: string;
      title?: string;
      teachingExplanation?: string;
      claims?: Array<{ text?: string; status?: string; type?: string }>;
    };
  }[],
  sourceTexts: string[] = []
): GateResult {
  const findings: GateFinding[] = [];
  const allSourceText = sourceTexts.join(" ").toLowerCase();

  for (const art of artifacts) {
    const c = art.contentJson;

    // Combine all student-facing text (NOT speaker notes — those can reference external knowledge)
    const studentText = [
      c.title ?? "",
      ...(c.bullets ?? []),
      c.studentAction ?? "",
      c.teachingExplanation ?? "",
    ].join(" ");

    const numbers = extractNumbers(studentText);

    for (const { value, context } of numbers) {
      // Skip safe simple numbers
      const numOnly = value.replace(/[^0-9.]/g, "");
      if (SAFE_NUMBERS.has(numOnly)) continue;

      // Check if the number appears in source material
      const numberInSource = allSourceText.includes(numOnly) ||
        allSourceText.includes(value.toLowerCase());

      if (!numberInSource) {
        findings.push({
          slideNo: art.slideNo,
          message: `Potentially invented number "${value}" — not found in source material. Context: "${context.slice(0, 80)}..."`,
        });
      }
    }

    // Also check claims that are marked as SOURCE_FACT but may be fabricated
    if (c.claims) {
      for (const claim of c.claims) {
        if (claim.type === "SOURCE_FACT" && claim.status === "NEED_SOURCE") {
          findings.push({
            slideNo: art.slideNo,
            message: `Claim "${(claim.text ?? "").slice(0, 60)}..." is marked as SOURCE_FACT but has no supporting source`,
          });
        }
      }
    }
  }

  // Fail only if there are MANY invented numbers (>3 total) — small counts are warnings
  const status: GateStatus = findings.length > 3 ? "fail" : findings.length > 0 ? "warn" : "pass";

  return {
    gateKey: "invented_numbers",
    severity: "error" as GateSeverity,
    status,
    findings,
    ruleVersion: "1.0",
  };
}
