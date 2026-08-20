/**
 * Post-generation leak scan — enforces the zero-jargon / zero-invention
 * contract on every generated slide artifact BEFORE it is persisted.
 *
 * Complements the existing `student-experience.gate` (which runs at
 * projection time) by catching leaks at the source: any artifact that
 * contains forbidden internal labels, ungrounded invented numbers, or
 * placeholder scaffold text is flagged for review instead of silently
 * reaching the student experience.
 */

import { detectForbiddenJargon } from "@/lib/lecture/projections/utils/jargon-cleaner";
import { scanQuantitativeFigures } from "@/lib/lecture/grounding/quantitative-scanner";
import type { SourceBlock } from "@/lib/lecture/grounding/types";

type ScannableBlock = { id: string; locator: string; text: string };

function toSourceBlocks(blocks: ScannableBlock[]): SourceBlock[] {
  return blocks.map((b) => ({
    id: b.id,
    locator: b.locator,
    text: b.text,
    criticality: "normal" as const,
    sha256Hash: "",
  }));
}

/**
 * Generic scaffold phrases the fallback/template path used in place of
 * real content. Any occurrence means the slide is placeholder-only and
 * must not be shown to students as-is.
 */
const PLACEHOLDER_PHRASES = [
  "Derived strictly from the source blocks",
  "Simplified explanation prioritizing core understanding",
  "Teach core concepts of",
  "high-stakes tension",
  "core capability",
  "driving question",
  "mental model: 5 pillars",
  "5 pillars of domain architecture",
  "think of this like a system with inputs, processing rules, and outputs",
  "replacing a blunt tool with a gps-guided surgical scalpel",
  "racing engine and a high-security vehicle",
  "state invariants",
  "imagine navigating a dense fog",
  "core invariant verification",
  "fix the type annotation for dupmatrix",
];

export interface LeakScanResult {
  clean: boolean;
  jargon: { pattern: string; matched: string; sampleSnippet: string; location: string }[];
  inventedNumbers: string[];
  placeholders: string[];
  flaggedForReview: boolean;
}

const CONTENT_KEYS_TO_SCAN = [
  "title",
  "purpose",
  "learningObjective",
  "academicTruth",
  "teachingExplanation",
  "feedback",
  "mastery",
  "bullets",
  "visibleContent",
  "studentAction",
  "speakerNotes",
  "expectedStudentReasoning",
  "studentCoreInsight",
  "studentAnalogy",
  "studentFramework",
  "studentMechanismExplanation",
  "studentScenario",
  "studentApplication",
  "learningActivity",
  "misconception",
  "assessment",
  "examples",
];

function collectStrings(value: unknown, acc: string[], seen = new Set<object>()): void {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    acc.push(value);
    return;
  }
  if (typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  for (const v of Object.values(value as Record<string, unknown>)) {
    collectStrings(v, acc, seen);
  }
}

/**
 * Scans a generated slide's content for forbidden jargon, invented numbers,
 * and placeholder scaffold phrases. Returns a verdict plus the violations.
 */
export function scanGeneratedSlide(
  content: Record<string, unknown>,
  sources: ScannableBlock[]
): LeakScanResult {
  const strings: string[] = [];
  collectStrings(content, strings);

  const jargonViolations = strings.flatMap((s) =>
    detectForbiddenJargon(s).matchedJargon.map((matched) => ({
      pattern: matched,
      matched,
      sampleSnippet: s.length > 120 ? `${s.slice(0, 117)}...` : s,
      location: "content",
    }))
  );

  const combinedText = strings.join("\n");
  const quantitative = scanQuantitativeFigures(combinedText, toSourceBlocks(sources));

  const lower = combinedText.toLowerCase();
  const placeholders = PLACEHOLDER_PHRASES.filter((p) => lower.includes(p));

  const inventedNumbers = quantitative.hallucinatedFigures;

  const flaggedForReview =
    jargonViolations.length > 0 ||
    inventedNumbers.length > 0 ||
    placeholders.length > 0;

  return {
    clean: !flaggedForReview,
    jargon: jargonViolations,
    inventedNumbers,
    placeholders,
    flaggedForReview,
  };
}