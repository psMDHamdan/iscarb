/**
 * AI Visual Learning System — Deterministic Heuristic Pre-Filter
 *
 * Fast, zero-token regex and metadata pre-filter to discard obvious non-diagrams
 * (flags, seals, coats of arms, portraits, coins, stamps, book covers, decorative oil paintings,
 * non-image MIME types, extreme aspect ratios, and tiny icons) before sending candidates
 * to the LLM verification stage.
 */

import type {
  CandidateImageMetadata,
  HeuristicFilterResult,
  RejectionCode,
} from "./types";

/**
 * Regex pattern definitions for non-diagram visual entities
 */
export const HEURISTIC_PATTERNS: Array<{
  category: string;
  code: RejectionCode;
  pattern: RegExp;
  reason: string;
}> = [
  {
    category: "Heraldry & Flags",
    code: "REJECT_FLAG_OR_EMBLEM",
    pattern:
      /\b(flag[_\s]of|flags[_\s]of|coat[_\s]of[_\s]arms|heraldry|insignia|emblem[_\s]of|emblems[_\s]of|seal[_\s]of|seals[_\s]of|standard[_\s]of|banner[_\s]of|vexillology|arms[_\s]of|state[_\s]seal|city[_\s]seal|presidential[_\s]seal|national[_\s]emblem)\b/i,
    reason: "Depicts a flag, coat of arms, seal, or heraldic emblem rather than an instructional diagram.",
  },
  {
    category: "Portraits & Monuments",
    code: "REJECT_PORTRAIT_OR_PERSON",
    pattern:
      /\b(portrait[_\s]of|portraits[_\s]of|headshot|politician|statue[_\s]of|monument[_\s]to|self[_\s]portrait|grave[_\s]of|gravestone|tomb[_\s]of|bust[_\s]of|sculpture[_\s]of|cenotaph|mausoleum|photo[_\s]of[_\s]president|prime[_\s]minister|wax[_\s]figure)\b/i,
    reason: "Depicts an individual person, historical portrait, statue, or monument rather than a schematic concept.",
  },
  {
    category: "Currency & Numismatics",
    code: "REJECT_CURRENCY_OR_STAMP",
    pattern:
      /\b(postage[_\s]stamp|stamp[_\s]of|stamps[_\s]of|coin[_\s]of|coins[_\s]of|banknote|currency[_\s]of|numismatics|commemorative[_\s]coin|medal[_\s]of|medals[_\s]of|penny|dime|nickel|quarter[_\s]dollar|ruble|rupee|pound[_\s]note|dollar[_\s]bill|specimen[_\s]note)\b/i,
    reason: "Depicts currency, banknotes, commemorative coins, or postage stamps.",
  },
  {
    category: "Book Scans & Documents",
    code: "REJECT_BOOK_OR_DOCUMENT_SCAN",
    pattern:
      /\b(book[_\s]cover|frontispiece|title[_\s]page|autograph|signature[_\s]of|manuscript[_\s]page|first[_\s]edition[_\s]cover|printed[_\s]text[_\s]page|newspaper[_\s]clipping|pamphlet[_\s]cover|index[_\s]page)\b/i,
    reason: "Depicts a scanned text page, document cover, signature, or book frontispiece.",
  },
  {
    category: "Decorative Fine Art",
    code: "REJECT_DECORATIVE_ART",
    pattern:
      /\b(oil[_\s]on[_\s]canvas|fresco[_\s]in|painting[_\s]by|watercolor[_\s]painting|acrylic[_\s]on[_\s]canvas|still[_\s]life[_\s]with|mural[_\s]by|impressionist[_\s]painting|baroque[_\s]painting)\b/i,
    reason: "Depicts a fine art painting or decorative artwork lacking schematic/educational labels.",
  },
];

/**
 * Minimum resolution and aspect ratio constraints
 */
export const MIN_IMAGE_WIDTH = 150;
export const MIN_IMAGE_HEIGHT = 150;
export const MIN_IMAGE_TOTAL_PIXELS = 40000; // e.g. 200x200
export const MIN_ASPECT_RATIO = 0.2; // Exclude hyper-tall banners
export const MAX_ASPECT_RATIO = 5.0; // Exclude extreme panoramic ribbons

/**
 * Evaluates a single candidate against heuristic pre-filter rules
 */
export function evaluateHeuristicFilter(
  candidate: CandidateImageMetadata
): HeuristicFilterResult {
  // 1. MIME type check
  if (!candidate.mimeType || !candidate.mimeType.startsWith("image/")) {
    return {
      passed: false,
      rejectionCode: "REJECT_HEURISTIC_FILTER",
      rejectedReason: `Unsupported MIME type "${candidate.mimeType}". Only visual image formats are allowed.`,
    };
  }

  // 2. Aspect ratio constraints
  if (
    candidate.aspectRatio > 0 &&
    (candidate.aspectRatio < MIN_ASPECT_RATIO || candidate.aspectRatio > MAX_ASPECT_RATIO)
  ) {
    return {
      passed: false,
      rejectionCode: "REJECT_HEURISTIC_FILTER",
      rejectedReason: `Extreme aspect ratio ${candidate.aspectRatio} (must be between ${MIN_ASPECT_RATIO} and ${MAX_ASPECT_RATIO}).`,
    };
  }

  // 3. Dimensional constraints (if dimensions are known)
  if (candidate.width > 0 && candidate.height > 0) {
    if (candidate.width < MIN_IMAGE_WIDTH || candidate.height < MIN_IMAGE_HEIGHT) {
      return {
        passed: false,
        rejectionCode: "REJECT_HEURISTIC_FILTER",
        rejectedReason: `Resolution too low (${candidate.width}x${candidate.height}px). Minimum required is ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px.`,
      };
    }
    const totalPixels = candidate.width * candidate.height;
    if (totalPixels < MIN_IMAGE_TOTAL_PIXELS) {
      return {
        passed: false,
        rejectionCode: "REJECT_HEURISTIC_FILTER",
        rejectedReason: `Total pixel area (${totalPixels}px) is below threshold (${MIN_IMAGE_TOTAL_PIXELS}px).`,
      };
    }
  }

  // 4. Combined text analysis across title, filename, categories, and description snippet
  const titleText = `${candidate.title} ${candidate.fileName} ${candidate.cleanTitle}`;
  const categoryText = candidate.categories.join(" ");
  const descSnippet = (candidate.description || "").slice(0, 300);
  const compositeSearchText = `${titleText} ${categoryText} ${descSnippet}`
    .replace(/[-_]+/g, " ");

  for (const rule of HEURISTIC_PATTERNS) {
    // Check against composite text
    const match = rule.pattern.exec(compositeSearchText);
    if (match) {
      return {
        passed: false,
        rejectionCode: rule.code,
        rejectedReason: rule.reason,
        matchedPattern: match[0],
      };
    }
  }

  // Passed all heuristic pre-filters
  return {
    passed: true,
  };
}

/**
 * Partitions candidates into accepted and discarded pools
 */
export function filterCandidatesHeuristically(
  candidates: CandidateImageMetadata[]
): {
  accepted: CandidateImageMetadata[];
  discarded: Array<{
    candidate: CandidateImageMetadata;
    result: HeuristicFilterResult;
  }>;
} {
  const accepted: CandidateImageMetadata[] = [];
  const discarded: Array<{
    candidate: CandidateImageMetadata;
    result: HeuristicFilterResult;
  }> = [];

  for (const candidate of candidates) {
    const result = evaluateHeuristicFilter(candidate);
    if (result.passed) {
      accepted.push(candidate);
    } else {
      discarded.push({ candidate, result });
    }
  }

  return { accepted, discarded };
}
