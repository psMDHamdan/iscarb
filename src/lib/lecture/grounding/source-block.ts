import { createHash } from "crypto";
import type { CriticalityTier, SourceBlock } from "./types";

const CRITICAL_PREFIX_REGEX =
  /^(CLO|Learning Outcome|Objective|Definition:|Theorem:|Formula:|Key Principle:|Key Law:)/i;

const CRITICAL_KEYWORDS_REGEX =
  /\b(?:grading|grade[sd]?|exam[s]?|assignment[s]?|due date|deadline[s]?|marks?|weight[s]?|must|required|mandatory|prerequisite[s]?)\b/i;

const LOW_KEYWORDS_REGEX =
  /\b(?:example[s]?|illustration[s]?|e\.g\.|for instance|figure[s]?|image[s]?|appendix|footnote[s]?|acknowledg(?:e)?ment[s]?|note[s]?)\b/i;

/**
 * Normalizes input text and calculates its SHA-256 fingerprint.
 */
export function computeSha256(text: string): string {
  const normalized = (text || "")
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

/**
 * Generates a deterministic block identifier from a locator and sha256 hash.
 */
export function generateDeterministicBlockId(
  locator: string,
  sha256Hash: string
): string {
  const normalizedLocator = normalizeLocator(locator);
  const key = `${normalizedLocator}:${sha256Hash}`;
  const shortHash = createHash("sha256")
    .update(key, "utf8")
    .digest("hex")
    .slice(0, 16);
  return `sb_${shortHash}`;
}

/**
 * Normalizes a locator string by stripping invalid characters and whitespace.
 */
export function normalizeLocator(locator: string): string {
  return (locator || "")
    .replace(/\0/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

/**
 * Evaluates semantic criticality tier of a text block.
 */
export function assessCriticality(
  text: string,
  blockType?: string
): CriticalityTier {
  const raw = (text || "").trim();

  // 1. Structural semantic elements
  if (blockType === "heading" || blockType === "table") {
    return "critical";
  }

  // 2. Explicit critical prefixes
  if (CRITICAL_PREFIX_REGEX.test(raw)) {
    return "critical";
  }

  // 3. Critical instructional keywords
  if (CRITICAL_KEYWORDS_REGEX.test(raw)) {
    return "critical";
  }

  // 4. Short decorative/insignificant fragments
  if (raw.length < 15 || /^\d+$/.test(raw)) {
    return "low";
  }

  // 5. Illustrative and supplementary examples
  if (LOW_KEYWORDS_REGEX.test(raw)) {
    return "low";
  }

  // 6. Default explanatory content
  return "normal";
}

/**
 * Factory function creating an addressable, fingerprinted SourceBlock.
 */
export function createSourceBlock(params: {
  locator: string;
  text: string;
  criticality?: CriticalityTier;
  metadata?: Record<string, any>;
}): SourceBlock {
  const safeText = (params.text || "").replace(/\0/g, "").trim();
  const sha256Hash = computeSha256(safeText);
  const normalizedLocator = normalizeLocator(params.locator || "unknown");
  const criticality =
    params.criticality ??
    assessCriticality(safeText, params.metadata?.type as string | undefined);
  const id = generateDeterministicBlockId(normalizedLocator, sha256Hash);

  return {
    id,
    locator: normalizedLocator,
    text: safeText,
    criticality,
    sha256Hash,
    metadata: params.metadata,
  };
}
