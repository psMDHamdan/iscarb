/**
 * Zero Jargon Leakage Engine & AST Markdown Sanitizer.
 * =================================================================
 * Systematically sanitizes internal pipeline vocabulary and scaffold
 * meta-headers from student-facing strings, projection view models,
 * and exported documents (PPTX, DOCX, QTI, HTML).
 *
 * Implements:
 * - AST Tokenizer protecting fenced code blocks, inline code, and LaTeX math.
 * - Prefix stripper handling markdown-wrapped prefixes (**Label:**, ### Label:, - Label:).
 * - Word-boundary pipeline term replacements with singular/plural distinction.
 * - validateZeroJargon verification oracle.
 */

// ─── Prefix strip catalog (~60 patterns) ──────────────────────────────────────

const LABEL_NAMES = [
  // 10 Core Pedagogical Elements
  "Hook", "Discover Hook", "Cognitive Hook",
  "Core Principle", "Core Concept", "Core Idea", "Concept", "Domain Spine",
  "Mechanism", "Mechanism in Action", "Causal Mechanism", "Structural Mechanism", "Mechanism Explanation",
  "Mental Model(?:\\s*\\(Analogy\\))?", "Intuition & Mental Model", "Intuitive Framework", "Conceptual Model",
  "Worked Example", "Step-by-Step Example", "Model Problem", "Calculation Model",
  "Misconception", "Misconception Alert", "Common Misconception", "Targeted Misconception", "Common Pitfall", "Student Misconception",
  "Practice", "Guided Practice", "Independent Practice", "Guided & Independent Practice", "Active Practice", "Your Turn",
  "Application", "Application Context", "Real-World Application", "Industrial Application",
  "Transfer", "Real-World Transfer", "Transfer Challenge", "Cross-Domain Transfer", "Novel Scenario",
  "Readiness", "Readiness Gate", "Readiness Check", "Check for Understanding", "Formative Check",

  // 5 Depth Layers
  "Layer [1-5](?:\\s*\\([^)]+\\))?",
  "Academic Truth",
  "Intuition(?: & Mental Model)?",

  // Student Override Fields
  "Core Insight", "Student Core Insight", "Student Analogy", "Student Framework", "Student Mechanism Explanation", "Student Scenario", "Student Application",

  // Taxonomy & Metadata
  "Bloom'?s?\\s*Level(?:\\s*:\\s*(?:remember|understand|apply|analyze|evaluate|create))?",
  "Bloom'?s?\\s*Taxonomy",
  "Cognitive Level",
  "Pedagogical Role", "Pedagogical Depth", "Pedagogical Stage", "Pedagogical Phase", "Pedagogical Intent",
  "Problem Context", "Key Requirement", "Scenario Visual", "Evidence of Mastery", "Cognitive Load", "Learning Objective", "Teaching Explanation", "Student Action", "Speaker Notes", "Visual Intent", "Domain Spine", "Foundation", "Deep Dive",
  "iSCARB Framework", "H-Stack Architecture", "H-Stack", "Learning Compiler", "Generation Stage",
  "Real Case Study", "Guided Application", "Independent Application", "Career & Domain Applications", "Performance Rubric & Standards", "Performance Rubric", "Evidence & Mastery Portfolio", "Readiness & Final Assessment", "Trade-offs", "Trade-off",

  // Pipeline & Generation Metadata (NEVER expose to students)
  "Generation Strategy", "Source Block", "Claim Ledger", "Prompt", "Internal Reasoning", "Framework Metadata",
  "Cognitive Level", "Content Type", "Concept ID", "Visual ID", "Activity Type", "Difficulty Level",
  "Semantic Embedding", "Answer Signature", "Duplication Score", "Validation Gate",
  "Pipeline Stage", "Pass Number", "Artifact ID", "Projection Format",

  "Summary", "Overview", "Introduction to", "Definition of",
];

const COMBINED_LABEL_REGEX = new RegExp(
  `^\\s*[*_~]*(?:${LABEL_NAMES.join("|")})\\s*(?::\\s*[*_~]*|[*_~]*\\s*:\\s*[*_~]*|[*_~]+)\\s*`,
  "i"
);

export const LABEL_PREFIXES: RegExp[] = [
  COMBINED_LABEL_REGEX,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Hook|Discover Hook|Cognitive Hook)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Core Principle|Core Concept|Core Idea|Concept|Domain Spine)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Mechanism|Mechanism in Action|Causal Mechanism|Structural Mechanism|Mechanism Explanation)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Mental Model|Mental Model \(Analogy\)|Intuition & Mental Model|Intuitive Framework|Conceptual Model)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Worked Example|Step-by-Step Example|Model Problem|Calculation Model)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Misconception|Misconception Alert|Common Misconception|Targeted Misconception|Common Pitfall|Student Misconception)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Practice|Guided Practice|Independent Practice|Guided & Independent Practice|Active Practice|Your Turn)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Application|Application Context|Real-World Application|Industrial Application)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Transfer|Real-World Transfer|Transfer Challenge|Cross-Domain Transfer|Novel Scenario)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Readiness|Readiness Gate|Readiness Check|Check for Understanding|Formative Check)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?Layer [1-5](?:\s*\([^)]+\))?\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?Academic Truth\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?Intuition(?: & Mental Model)?\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Core Insight|Student Core Insight|Student Analogy|Student Framework|Student Mechanism Explanation|Student Scenario|Student Application)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Bloom'?s?\s*Level|Bloom'?s?\s*Taxonomy|Cognitive Level)(?:\s*:\s*(?:remember|understand|apply|analyze|evaluate|create))?\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Bloom'?s?\s*Level|Bloom'?s?\s*Taxonomy|Cognitive Level)\s*:\s*(?:remember|understand|apply|analyze|evaluate|create)\*?\*?\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Pedagogical Role|Pedagogical Depth|Pedagogical Stage|Pedagogical Phase|Pedagogical Intent)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Problem Context|Key Requirement|Scenario Visual|Evidence of Mastery|Cognitive Load|Learning Objective|Teaching Explanation|Student Action|Speaker Notes|Visual Intent|Domain Spine|Foundation|Deep Dive|Deep Dive:)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:iSCARB Framework|H-Stack Architecture|H-Stack|Learning Compiler|Generation Stage)\*?\*?\s*:\s*/i,
  /^(?:[*_~#> -]*|\d+\.\s*)\*?\*?(?:Summary|Overview|Introduction to|Definition of)\*?\*?\s*:\s*/i,
];

// ─── Pipeline Jargon Replacements ────────────────────────────────────────────

export const JARGON_REPLACEMENTS: Array<{ regex: RegExp; replacement: string | ((substring: string, ...args: any[]) => string) }> = [
  // Slide and phase numbering
  { regex: /\bSlide\s*(\d{1,2})\b/gi, replacement: "Concept $1" },
  { regex: /\bS(\d{1,2})\b/g, replacement: "Concept $1" },
  { regex: /\bPhase\s*(\d{1,2})\b/gi, replacement: "Stage $1" },

  // Generation terminology (singular & plural distinction)
  { regex: /\bartifacts\b/gi, replacement: "learning resources" },
  { regex: /\bartifact\b/gi, replacement: "learning resource" },
  { regex: /\bprompt\s*templates\b/gi, replacement: "exercises" },
  { regex: /\bprompt\s*template\b/gi, replacement: "exercise" },
  { regex: /\bsource\s*chunks\b/gi, replacement: "reference texts" },
  { regex: /\bsource\s*chunk\b/gi, replacement: "reference text" },
  { regex: /\bvectorSvgCode\b/gi, replacement: "diagram" },
  { regex: /\bgeneration\s*passes\b/gi, replacement: "learning steps" },
  { regex: /\bgeneration\s*pass\b/gi, replacement: "learning step" },
  { regex: /\bpass\s*(\d{1,2})\b/gi, replacement: "step $1" },
  { regex: /\bslots\b/gi, replacement: "sections" },
  { regex: /\bslot\b/gi, replacement: "section" },

  // Framework & system internals to eliminate or rewrite
  { regex: /\biSCARB\s*Framework\b/gi, replacement: "" },
  { regex: /\bH-Stack\s*Architecture\b/gi, replacement: "" },
  { regex: /\bH-Stack\b/gi, replacement: "" },
  { regex: /\bLearning\s*Compiler\b/gi, replacement: "" },
  { regex: /\bGeneration\s*Stage\b/gi, replacement: "" },
  { regex: /\bSource\s*Blocks\b/gi, replacement: "reference materials" },
  { regex: /\bSource\s*Block\b/gi, replacement: "reference material" },
  { regex: /\bCoverage\s*Link\b/gi, replacement: "" },
  { regex: /\bCLO\s*Alignment\b/gi, replacement: "learning outcome alignment" },
  { regex: /\bBloom'?s?\s*Taxonomy\b/gi, replacement: "cognitive levels" },
  { regex: /\bJaheziah\b/gi, replacement: "" },
  { regex: /\bNCAAA\b/gi, replacement: "national standards" },
  { regex: /\bVision\s*2030\b/gi, replacement: "national development goals" },
  { regex: /\bReadiness\s*Gate\b/gi, replacement: "final check" },
  { regex: /\bReadiness\s*Check\b/gi, replacement: "understanding check" },
  { regex: /\bDecision\s*Inbox\b/gi, replacement: "" },
  { regex: /\bQuality\s*Gate\b/gi, replacement: "" },
  { regex: /\bSource\s*Map\b/gi, replacement: "" },
  { regex: /\bConcept\s*Graph\b/gi, replacement: "" },
  { regex: /\bClaim\s*Ledger\b/gi, replacement: "" },
  { regex: /\bClaim\s*Verifier\b/gi, replacement: "" },
  { regex: /\bEvidence\s*Reviewer\b/gi, replacement: "" },
  { regex: /\bPedagogical\s*Reviewer\b/gi, replacement: "" },
  { regex: /\bCLO\s*Alignment\s*Reviewer\b/gi, replacement: "" },
  { regex: /\bDeterministic\s*QA\b/gi, replacement: "" },
  { regex: /\bVisual\s*QA\b/gi, replacement: "" },
  { regex: /\bScreenshot\s*QA\b/gi, replacement: "" },
  { regex: /\bSlide\s*Composer\b/gi, replacement: "" },
  { regex: /\bVisual\s*Intelligence\b/gi, replacement: "" },
  { regex: /\bAssessment\s*Generator\b/gi, replacement: "" },
  { regex: /\bSource\s*Analyst\b/gi, replacement: "" },
  { regex: /\bRepair\s*Loop\b/gi, replacement: "" },
  { regex: /\bFallback\s*Slide\b/gi, replacement: "" },
  { regex: /\bGeneration\s*Worker\b/gi, replacement: "" },
  { regex: /\bQStash\b/gi, replacement: "" },
  { regex: /\bRedis\b/gi, replacement: "" },
  { regex: /\bPrisma\b/gi, replacement: "" },
  { regex: /\bAPI\s*Endpoint\b/gi, replacement: "" },
];

export const FORBIDDEN_JARGON_PATTERNS: RegExp[] = [
  /\bS\d{1,2}\b/,
  /\bSlide\s*\d{1,2}\b/i,
  /\bPhase\s*\d{1,2}\b/i,
  /\bartifact\b/i,
  /\bslot\b/i,
  /\bsource\s*chunk\b/i,
  /\bvectorSvgCode\b/i,
  /\bCore\s*Principle\b/i,
  /\bKey\s*Requirement\b/i,
  /\bApplication\s*Context\b/i,
  /\bProblem\s*Context\b/i,
  /\bScenario\s*Visual\b/i,
  /\bEvidence\s*of\s*Mastery\b/i,
  /\bMechanism\s*in\s*Action\b/i,
  /\bGuided\s*&?\s*Independent\s*Practice\b/i,
  /\bMental\s*Model\s*:/i,
  /\biSCARB\s*Framework\b/i,
  /\bH-Stack\b/i,
  /\bLearning\s*Compiler\b/i,
  /\bBloom'?s?\s*Level\b/i,
  /\bLayer\s*[1-5]\b/i,
  /\bAcademic\s*Truth\s*:/i,
  /\bIntuition\s*&\s*Mental\s*Model\s*:/i,
  /\bPedagogical\s*Role\b/i,
  /\bPedagogical\s*Depth\b/i,
  /\bReadiness\s*Gate\s*:/i,
];

// ─── AST Markdown Tokenizer ──────────────────────────────────────────────────

export interface MarkdownToken {
  type: "code_block" | "inline_code" | "math_block" | "inline_math" | "text";
  raw: string;
  lang?: string;
}

/**
 * Currency disambiguation heuristic: ignores monetary quantities such as
 * "$100M", "$50 to $100", "$20 - $30" so they are treated as plain text rather than LaTeX.
 */
function isCurrencyOrNonMath(s: string): boolean {
  return /^\s*(\$?\d[\d,]*(\.\d+)?([MBKk])?(\s*(to|-)\s*\$?\d[\d,]*(\.\d+)?([MBKk])?)?)\s*$/.test(s);
}

/**
 * Tokenizes markdown into protected segments (code blocks, inline code, display/inline math)
 * and sanitizable text segments.
 */
export function tokenizeMarkdown(text: string): MarkdownToken[] {
  if (!text) return [];

  const tokens: MarkdownToken[] = [];
  // Tokenizer pattern:
  // 1: Fenced code block: ```lang\n...\n``` or ```...```
  // 2: Display math: $$...$$ or \[...\]
  // 3: Inline code: `...`
  // 4: Inline math: \(...\) or $...$ with boundary checks
  const tokenRegex = /(```[a-zA-Z0-9_-]*\n[\s\S]*?\n```|```[\s\S]*?```)|(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])|(`[^`\n]+`)|(\\\([\s\S]*?\\\)|(?<=\s|^|[(\[{«'"\u060C\u061B<>=])\$(?!\s)([^\$\n]+?)(?<!\s)\$(?=[.,;:!?\)\]}»'"\u060C\u061B\s<>=]|$))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        raw: text.slice(lastIndex, match.index),
      });
    }

    if (match[1]) {
      // Fenced code block
      const langMatch = match[1].match(/^```([a-zA-Z0-9_-]*)\n/);
      tokens.push({
        type: "code_block",
        raw: match[1],
        lang: langMatch ? langMatch[1] : "",
      });
    } else if (match[2]) {
      // Display/block math
      tokens.push({
        type: "math_block",
        raw: match[2],
      });
    } else if (match[3]) {
      // Inline code
      tokens.push({
        type: "inline_code",
        raw: match[3],
      });
    } else if (match[4]) {
      // Inline math or currency
      const mathExpr = match[5] ?? match[4];
      if (isCurrencyOrNonMath(mathExpr)) {
        tokens.push({
          type: "text",
          raw: match[0],
        });
      } else {
        tokens.push({
          type: "inline_math",
          raw: match[0],
        });
      }
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      raw: text.slice(lastIndex),
    });
  }

  return tokens;
}

/**
 * Sanitizes a single line of text by stripping meta-header prefixes and applying jargon replacements.
 */
function sanitizeSingleLine(line: string): string {
  let text = line;

  // Detect leading list marker (e.g. "- ", "+ ", "• ", "* " where * is followed by space, or "1. ")
  const bulletMatch = text.match(/^(\s*(?:[-+•]|\*(?!\*))\s+|\s*\d+\.\s+)/);
  const bulletPrefix = bulletMatch ? bulletMatch[1] : "";
  let content = bulletPrefix ? text.slice(bulletPrefix.length) : text;

  // Also detect markdown header prefix (e.g. "### ", "## ")
  const headerMatch = content.match(/^(\s*#{1,6}\s+)/);
  const headerPrefix = headerMatch ? headerMatch[1] : "";
  if (headerPrefix) {
    content = content.slice(headerPrefix.length);
  }

  // Strip label prefixes from the content part
  content = content.replace(COMBINED_LABEL_REGEX, "");
  for (const prefix of LABEL_PREFIXES) {
    content = content.replace(prefix, "");
  }

  // Clean empty markdown wrappers (e.g. "** **", "****", "**:", "**")
  content = content.replace(/^\s*\*\*\s*\*\*\s*/, "");
  content = content.replace(/^\s*\*\*\s*:\s*\*\*\s*/, "");
  content = content.replace(/^\s*[:\-]\s*/, "");

  // Clean unclosed leading or trailing ** on content if it has an odd count of **
  const boldCount = (content.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    if (content.startsWith("**")) {
      content = content.slice(2).trim();
    } else if (content.endsWith("**")) {
      content = content.slice(0, -2).trim();
    }
  }

  // Clean unclosed leading or trailing * on content if it has an odd count of *
  const starCount = (content.match(/\*/g) || []).length;
  if (starCount % 2 !== 0) {
    if (content.startsWith("*")) {
      content = content.slice(1).trim();
    } else if (content.endsWith("*")) {
      content = content.slice(0, -1).trim();
    }
  }

  // Re-attach header and bullet prefixes
  text = bulletPrefix + headerPrefix + content;

  // Apply word-boundary jargon replacements
  for (const { regex, replacement } of JARGON_REPLACEMENTS) {
    if (typeof replacement === "function") {
      text = text.replace(regex, replacement as any);
    } else {
      text = text.replace(regex, replacement);
    }
  }

  text = text.replace(/\s{2,}/g, " ");

  return text;
}

/**
 * Sanitizes a text node (which may have multiple lines).
 */
function sanitizeTextNode(textNode: string): string {
  const lines = textNode.split("\n");
  const cleanedLines = lines.map(sanitizeSingleLine);
  return cleanedLines.join("\n");
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Strips all internal pipeline jargon and framework prefixes from a string.
 * Code blocks and LaTeX math expressions are strictly preserved.
 */
export function cleanJargon(text?: string | null, _context: "student" | "faculty" = "student"): string {
  if (!text || typeof text !== "string") return "";

  const tokens = tokenizeMarkdown(text);
  const cleaned = tokens
    .map((token) => {
      if (token.type === "text") {
        return sanitizeTextNode(token.raw);
      }
      return token.raw;
    })
    .join("");

  return cleaned.trim();
}

/** Alias for cleanJargon */
export const cleanseJargon = cleanJargon;

/**
 * Checks whether a text string contains any forbidden internal jargon.
 */
export function hasForbiddenJargon(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return FORBIDDEN_JARGON_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Detects specific instances of forbidden jargon for diagnostics and validation reports.
 */
export function detectForbiddenJargon(text: string): { hasJargon: boolean; matchedJargon: string[] } {
  if (!text || typeof text !== "string") {
    return { hasJargon: false, matchedJargon: [] };
  }

  const matches: string[] = [];
  for (const pattern of FORBIDDEN_JARGON_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }

  return {
    hasJargon: matches.length > 0,
    matchedJargon: matches,
  };
}

/**
 * Deeply traverses an object, array, or primitive and applies cleanJargon to all string values
 * while strictly preserving non-string objects (Date, Buffer, RegExp, Numbers, Booleans).
 */
export function cleanObjectJargon<T>(obj: T, context: "student" | "faculty" = "student"): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return cleanJargon(obj, context) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanObjectJargon(item, context)) as unknown as T;
  }

  if (
    typeof obj === "object" &&
    !(obj instanceof Date) &&
    !(obj instanceof RegExp) &&
    !Buffer.isBuffer(obj)
  ) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanObjectJargon(value, context);
    }
    return cleaned as T;
  }

  return obj;
}

/**
 * Validates that an arbitrary data structure (string, array, view model object)
 * contains zero forbidden internal jargon.
 */
export function validateZeroJargon(
  content: unknown,
  locationPrefix = "root"
): {
  valid: boolean;
  violations: Array<{ pattern: string; matched: string; sampleSnippet: string; location: string }>;
} {
  const violations: Array<{ pattern: string; matched: string; sampleSnippet: string; location: string }> = [];

  const inspect = (val: unknown, currentPath: string) => {
    if (typeof val === "string") {
      const detection = detectForbiddenJargon(val);
      if (detection.hasJargon) {
        for (const match of detection.matchedJargon) {
          violations.push({
            pattern: match,
            matched: match,
            sampleSnippet: val.length > 120 ? `${val.slice(0, 117)}...` : val,
            location: currentPath,
          });
        }
      }
    } else if (Array.isArray(val)) {
      val.forEach((item, idx) => inspect(item, `${currentPath}[${idx}]`));
    } else if (
      val !== null &&
      typeof val === "object" &&
      !(val instanceof Date) &&
      !(val instanceof RegExp) &&
      !Buffer.isBuffer(val)
    ) {
      for (const [k, v] of Object.entries(val)) {
        inspect(v, `${currentPath}.${k}`);
      }
    }
  };

  inspect(content, locationPrefix);

  return {
    valid: violations.length === 0,
    violations,
  };
}
