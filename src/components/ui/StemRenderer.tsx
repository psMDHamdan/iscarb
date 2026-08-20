import React from "react";
import katex from "katex";

export interface StemRendererProps {
  content?: string | null;
  children?: React.ReactNode;
  text?: string | null;
  className?: string;
  inline?: boolean;
  as?: "div" | "span" | "p";
  dir?: "ltr" | "rtl" | "auto";
}

/**
 * Disambiguates common currency amounts and non-math dollar patterns (e.g. "$500M", "$100", "$50 to $100")
 */
function isCurrencyOrNonMath(expr: string): boolean {
  const trimmed = expr.trim();
  if (!trimmed) return true;

  // Single currency value like "100", "500M", "20k", "1,000,000", "50.99"
  if (/^\d+(?:[.,]\d+)*(?:\s*(?:[kKmMbBtT]|thousand|million|billion|trillion|usd|sar|eur|gbp|dollars?|riyals?))?$/i.test(trimmed)) {
    return true;
  }

  // Range or english phrase like "50 to 100", "10 or 20"
  if (/^\d+(?:[.,]\d+)*\s+(?:to|or|and|-|–|—)\s+\d+(?:[.,]\d+)*$/i.test(trimmed)) {
    return true;
  }

  // Plain text without any math operators or LaTeX commands or math symbols
  const hasMathIndicators = /[{}\\_^=+\-*/<>|\u2200-\u22FF\u2190-\u21FF\u0391-\u03C9]|\\[a-zA-Z]+/.test(trimmed);
  const isSingleVariable = /^[a-zA-Z]$/.test(trimmed);

  if (!hasMathIndicators && !isSingleVariable) {
    // If it has multiple plain English words with spaces and no math operators, it's plain text
    if (/\s+[a-zA-Z]{2,}\s+/.test(trimmed)) {
      return true;
    }
  }

  return false;
}

/**
 * Render LaTeX math string with KaTeX safely
 */
function renderMathSafely(expr: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(expr.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
      output: "htmlAndMathml",
    });
  } catch (err) {
    console.warn("KaTeX rendering error:", err);
    return null;
  }
}

/**
 * Tokenize and parse inline math ($...$ or \(...\)) in a plain text chunk
 */
function processInlineMath(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return [];

  // Match \( ... \) or $ ... $
  // The $ regex requires non-whitespace immediately inside the delimiters
  const inlineRegex = /\\\(([\s\S]*?)\\\)|(?<=\s|^|[(\[{«'"\u060C\u061B<>=])\$(?!\s)([^\$\n]+?)(?<!\s)\$(?=[.,;:!?\)\]}»'"\u060C\u061B\s<>=]|$)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = inlineRegex.lastIndex;

    // Push preceding text
    if (matchStart > lastIndex) {
      parts.push(text.slice(lastIndex, matchStart));
    }

    const mathExpr = match[1] ?? match[2];
    const isExplicitParen = match[1] !== undefined;

    if (!isExplicitParen && isCurrencyOrNonMath(mathExpr)) {
      // It's currency or non-math, output raw
      parts.push(match[0]);
    } else {
      const html = renderMathSafely(mathExpr, false);
      if (html) {
        parts.push(
          <span
            key={`${keyPrefix}-inline-${matchStart}`}
            className="katex-inline inline-block dir-ltr"
            dir="ltr"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } else {
        parts.push(match[0]);
      }
    }

    lastIndex = matchEnd;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * STEM KaTeX equation and text renderer.
 * Automatically parses inline ($...$, \(...\)) and block ($$...$$, \[...\]) LaTeX formulas.
 * Provides Arabic RTL isolation (dir="ltr") so mathematical operations are never reversed.
 */
export function StemRenderer({
  content,
  children,
  text,
  className,
  inline = false,
  as,
  dir,
}: StemRendererProps) {
  // Determine input content
  let rawContent: string | null = null;

  if (typeof children === "string") {
    rawContent = children;
  } else if (content !== undefined && content !== null) {
    rawContent = content;
  } else if (text !== undefined && text !== null) {
    rawContent = text;
  } else if (React.isValidElement(children)) {
    return children;
  }

  if (!rawContent) return null;

  // Split content by block math: $$...$$ or \[...\]
  const blockRegex = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = blockRegex.exec(rawContent)) !== null) {
    const matchStart = blockMatch.index;
    const matchEnd = blockRegex.lastIndex;

    // Process preceding text for inline math
    if (matchStart > lastIndex) {
      const textBefore = rawContent.slice(lastIndex, matchStart);
      parts.push(...processInlineMath(textBefore, `part-${lastIndex}`));
    }

    const blockMathExpr = blockMatch[1] ?? blockMatch[2];
    const html = renderMathSafely(blockMathExpr, true);

    if (html) {
      parts.push(
        <div
          key={`block-${matchStart}`}
          className="katex-block my-2 text-center overflow-x-auto py-1 dir-ltr"
          dir="ltr"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } else {
      parts.push(blockMatch[0]);
    }

    lastIndex = matchEnd;
  }

  // Process remaining text after the last block match
  if (lastIndex < rawContent.length) {
    const remainingText = rawContent.slice(lastIndex);
    parts.push(...processInlineMath(remainingText, `part-${lastIndex}`));
  }

  // Determine wrapper element tag
  const Tag = as || (inline ? "span" : "div");

  // If inline and no special wrapper styling/dir is requested, return span with className
  return (
    <Tag className={className} dir={dir}>
      {parts}
    </Tag>
  );
}

export const MathText = StemRenderer;
export default StemRenderer;
