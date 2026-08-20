import type {
  FoundFigure,
  QuantitativeCategory,
  QuantitativeScanResult,
  SourceBlock,
} from "./types";

/**
 * Known safe numbers used for structural pedagogical counts,
 * fundamental constants, or standard geometry/time divisions.
 */
export const SAFE_NUMBERS = new Set([
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "12",
  "20",
  "24",
  "60",
  "100",
  "360",
]);

/**
 * Common chemical formulas with numeric subscripts/valences that should be excluded.
 */
const CHEMICAL_FORMULAS = [
  /\b[A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)+(?:[+-]\d*|\d+[+-])?\b/g, // e.g. H2O, CO2, C6H12O6, SO4^2-
  /\b[A-Z][a-z]?\d+[+-]?\b/g, // e.g. Ca2+, Fe3+, O2, N2, H2
];

/**
 * Regular expressions for the 9 quantitative categories.
 */
const QUANTITATIVE_PATTERNS: Array<{
  category: QuantitativeCategory;
  pattern: RegExp;
}> = [
  {
    category: "percentage",
    pattern: /\b\d{1,3}(?:\.\d+)?\s*%/g,
  },
  {
    category: "approximate",
    pattern:
      /\b(?:approximately|about|roughly|nearly|over|more than|less than)\s+\d+(?:\.\d+)?%?/gi,
  },
  {
    category: "multiplier",
    pattern: /\b\d+(?:\.\d+)?(?:[-\s]*(?:fold|times|x|:1))\b/gi,
  },
  {
    category: "chemical_concentration",
    pattern:
      /\b\d+(?:\.\d+)?\s*(?:mg\/kg|ug\/ml|μg\/ml|mg\/ml|ng\/ml|mg\/L|g\/L|M|mM|μM|uM|nM|%\s*w\/v|%\s*v\/v|μL|uL|mL|L)\b/gi,
  },
  {
    category: "unit",
    pattern:
      /\b\d+(?:\.\d+)?(?:[-\s]*(?:nm|μm|um|mm|cm|m|km|s|ms|ns|μs|us|Hz|kHz|MHz|GHz|kb|mb|gb|tb|kg|g|mg|μg|ug|V|mV|kV|mA|A|W|kW|MW|J|kJ|cal|kcal|mol|mmol|μmol|umol|K|°C|degC|MPa|kPa|Pa|rpm|mmHg|torr|bar|psi|atm|dB|lux|bps|kbps|mbps|gbps))\b/gi,
  },
  {
    category: "performance",
    pattern:
      /\b(?:efficiency|accuracy|rate|yield|recovery|success|throughput|latency|f1-score|auc|loss)\s*(?:of|:|=|\bis\b|\bwas\b)?\s*\d+(?:\.\d+)?%?/gi,
  },
  {
    category: "cohort_size",
    pattern:
      /\b\d+(?:\.\d+)?\s*(?:patients?|subjects?|samples?|trials?|replicates?|participants?|volunteers?|cases?)\b/gi,
  },
  {
    category: "citation",
    pattern:
      /\b[A-Z][a-zA-Z]+(?:\s+et\s+al\.)?,?\s+(?:19\d\d|20\d\d)\b|\[\d{1,3}\]|\bdoi:\s*10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/g,
  },
  {
    category: "date",
    pattern:
      /\b(?:19\d\d|20\d\d)\b|\b\d{4}-\d{2}-\d{2}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi,
  },
];

/**
 * Normalizes text for numerical comparison (canonicalizing prefixes, separators).
 */
export function normalizeQuantitativeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/\b(\d+),(\d{3})\b/g, "$1$2") // remove thousands separators: 1,500 -> 1500
    .replace(/μ/g, "u") // normalize micro symbol
    .replace(/°c/g, "degc")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if a match index is inside LaTeX math delimiters ($...$, $$...$$, \(...\)).
 */
function isInsideMathDelimiters(text: string, matchIndex: number): boolean {
  // Check inline $...$
  let inDollar = false;
  for (let i = 0; i < matchIndex; i++) {
    if (text[i] === "$" && (i === 0 || text[i - 1] !== "\\")) {
      inDollar = !inDollar;
    }
  }
  if (inDollar) return true;

  // Check \( ... \) or \[ ... \]
  const prefix = text.slice(0, matchIndex);
  const openParen = (prefix.match(/\\\(/g) || []).length;
  const closeParen = (prefix.match(/\\\)/g) || []).length;
  if (openParen > closeParen) return true;

  const openBracket = (prefix.match(/\\\[/g) || []).length;
  const closeBracket = (prefix.match(/\\\]/g) || []).length;
  if (openBracket > closeBracket) return true;

  return false;
}

/**
 * Checks if the match belongs to a structural/pedagogical step (e.g. "Step 1", "Bloom Level 2").
 */
function isStructuralStep(text: string, matchIndex: number, matchLen: number): boolean {
  const start = Math.max(0, matchIndex - 20);
  const end = Math.min(text.length, matchIndex + matchLen + 20);
  const surrounding = text.slice(start, end);
  return /\b(?:step|stage|phase|part|bloom level|level|chapter|section|module|figure|table|slide|page)\s+\d+/i.test(
    surrounding
  );
}

/**
 * Checks if the match is part of a chemical formula.
 */
function isChemicalFormulaMatch(text: string, matchIndex: number, matchLen: number): boolean {
  const start = Math.max(0, matchIndex - 15);
  const end = Math.min(text.length, matchIndex + matchLen + 15);
  const surrounding = text.slice(start, end);

  for (const chemRegex of CHEMICAL_FORMULAS) {
    const re = new RegExp(chemRegex.source, chemRegex.flags);
    let chemMatch;
    while ((chemMatch = re.exec(surrounding)) !== null) {
      if (
        chemMatch.index <= matchIndex - start &&
        matchIndex - start < chemMatch.index + chemMatch[0].length
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Scans generated student-facing text for quantitative assertions and validates
 * each against the project's source blocks corpus.
 */
export function scanQuantitativeFigures(
  generatedText: string,
  sources: SourceBlock[]
): QuantitativeScanResult {
  const rawText = generatedText || "";
  if (!rawText.trim()) {
    return {
      foundFigures: [],
      hallucinatedFigures: [],
      passed: true,
    };
  }

  // Combine and normalize all source text
  const rawCombinedSources = sources.map((s) => s.text).join(" ");
  const normalizedSources = normalizeQuantitativeText(rawCombinedSources);

  const foundFigures: FoundFigure[] = [];
  const seenMatches = new Set<string>();

  for (const { category, pattern } of QUANTITATIVE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(rawText)) !== null) {
      const rawMatch = match[0];
      const matchIndex = match.index;
      const key = `${category}:${rawMatch.toLowerCase()}:${matchIndex}`;
      if (seenMatches.has(key)) continue;
      seenMatches.add(key);

      // 1. Math expressions exclusion
      if (isInsideMathDelimiters(rawText, matchIndex)) {
        continue;
      }

      // 2. Chemical formulas exclusion
      if (isChemicalFormulaMatch(rawText, matchIndex, rawMatch.length)) {
        continue;
      }

      // 3. Structural steps exclusion (e.g. Step 1, Stage 2)
      if (isStructuralStep(rawText, matchIndex, rawMatch.length)) {
        continue;
      }

      // 4. Safe counting numbers whitelist
      const digitsOnly = rawMatch.replace(/[^0-9.]/g, "");
      if (
        SAFE_NUMBERS.has(digitsOnly) &&
        category !== "percentage" &&
        category !== "chemical_concentration" &&
        category !== "performance" &&
        category !== "multiplier"
      ) {
        continue;
      }

      // Extract context snippet
      const ctxStart = Math.max(0, matchIndex - 35);
      const ctxEnd = Math.min(rawText.length, matchIndex + rawMatch.length + 35);
      const context = rawText.slice(ctxStart, ctxEnd).trim();

      // Check if figure is grounded in source text
      const normalizedMatch = normalizeQuantitativeText(rawMatch);

      let isGrounded = false;

      if (category === "percentage") {
        const pctNormalized = normalizedMatch.replace(/\s+/g, "");
        isGrounded =
          normalizedSources.replace(/\s+/g, "").includes(pctNormalized) ||
          normalizedSources.includes(normalizedMatch);
      } else if (category === "date") {
        isGrounded =
          normalizedSources.includes(normalizedMatch) ||
          (digitsOnly.length === 4 && normalizedSources.includes(digitsOnly));
      } else {
        isGrounded =
          normalizedSources.includes(normalizedMatch) ||
          rawCombinedSources.includes(rawMatch);
      }

      foundFigures.push({
        value: digitsOnly || rawMatch,
        rawMatch,
        category,
        isGrounded,
        context,
      });
    }
  }

  const hallucinatedFigures = foundFigures
    .filter((f) => !f.isGrounded)
    .map((f) => f.rawMatch);

  return {
    foundFigures,
    hallucinatedFigures,
    passed: hallucinatedFigures.length === 0,
  };
}
