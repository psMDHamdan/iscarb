/**
 * Source Content Sanitizer
 * ===========================================================================
 * Programmatically strips raw PDF/source document artifacts that LLMs might
 * copy-paste directly into generated slide content or student-facing text.
 *
 * Safe for LaTeX math, inline code, and code blocks via AST markdown tokenization.
 */

import { tokenizeMarkdown, type MarkdownToken } from "./jargon-cleaner";

// ─── Source Contamination Patterns ───────────────────────────────────────────

const SOURCE_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  // 1. Internal IDs & parenthetical hashes >15 chars: (cmt14fy1g0009onsbby7pm5q9)
  { regex: /\([a-z0-9]{15,}\)/gi, replacement: "" },
  { regex: /\bcmt[a-z0-9]{15,}\b/gi, replacement: "" },

  // 2. Catalog / SKU product codes: SKU GE100019, SKU GE100052
  { regex: /\bSKU\s*[A-Z0-9_-]{5,}\b/gi, replacement: "" },
  { regex: /\b\(?SKU\s*[^)\n]+\)?/gi, replacement: "" },

  // 3. Raw figure / table references: "Figure 17. Vector maps...", "Fig. 2 Scheme..."
  { regex: /\b(?:Figure|Fig\.?|Table)\s*\d+\.?:?\s*[^.\n]*(?:\.|$)/gi, replacement: "" },

  // 4. PDF line/note numbers leading a line: "58 Note:", "41 Figure"
  { regex: /^\s*\d{1,3}\s+(?:Note|Figure|Table|Fig\.?)\s*:\s*/gim, replacement: "" },

  // 5. Raw protocol steps & micro-measurements: "Incubate at 37°C for 3 hrs", "30 μL", "100 μM"
  { regex: /\b\d+\s*[μµ]L\b/gi, replacement: "" },
  { regex: /\b\d+\s*[μµ]M\b/gi, replacement: "" },
  { regex: /\b\d+\s*ng\/[μµ]L\b/gi, replacement: "" },

  // 6. Package contents & reagent inventory lines: "Package contents: 2 vials of gRNA", "1 vial of ..., lyophilized"
  { regex: /\bPackage\s+contents\s*:[^;\n]*/gi, replacement: "" },
  { regex: /\bRelated\s+Optional\s+Reagents\s*:[^;\n]*/gi, replacement: "" },
  { regex: /\b\d+\s*vials?\s+of\b/gi, replacement: "" },
  { regex: /\b\d+\s*[μµ]g,?\s*lyophilized\b/gi, replacement: "" },

  // 7. Long raw DNA/RNA nucleotide sequences: GATCGAGTGCCGATCG... (>10 nt)
  { regex: /\b[ACGTUN]{12,}\b/g, replacement: "" },

  // Cleanup leftover empty parentheticals, double commas, or leading punctuation
  { regex: /\(\s*stock\s*\)/gi, replacement: "" },
  { regex: /\(\s*\)/g, replacement: "" },
  { regex: /\[\s*\]/g, replacement: "" },
  { regex: /,\s*,/g, replacement: "," },
  { regex: /,\s*\./g, replacement: "." },
  { regex: /^\s*,\s*/g, replacement: "" },
  { regex: /\s{2,}/g, replacement: " " },
];

/**
 * Strips raw source document fragments (SKUs, IDs, figure captions, protocol steps)
 * from a single line of text.
 */
function sanitizeLine(line: string): string {
  let text = line;
  for (const { regex, replacement } of SOURCE_PATTERNS) {
    text = text.replace(regex, replacement);
  }
  return text.trim();
}

/**
 * AST-aware source content sanitizer.
 * Sanitizes plain text segments while strictly preserving code blocks and LaTeX math.
 */
export function sanitizeSourceContent(text?: string | null): string {
  if (!text || typeof text !== "string") return "";

  const tokens = tokenizeMarkdown(text);
  const cleaned = tokens
    .map((token: MarkdownToken) => {
      if (token.type === "text") {
        return sanitizeLine(token.raw);
      }
      return token.raw;
    })
    .join("");

  return cleaned.trim();
}

/**
 * Deeply traverses an object or array and applies sanitizeSourceContent to all string values.
 */
export function sanitizeObjectSourceContent<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return sanitizeSourceContent(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectSourceContent(item)) as unknown as T;
  }

  if (typeof obj === "object" && !(obj instanceof Date) && !(obj instanceof RegExp)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      result[key] = sanitizeObjectSourceContent((obj as Record<string, unknown>)[key]);
    }
    return result as unknown as T;
  }

  return obj;
}
