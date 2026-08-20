/**
 * Math Utilities for Renderers.
 * =================================================================
 * - PPTX/PDF: Strip LaTeX and provide readable fallback text
 * - HTML: StemRenderer handles KaTeX rendering (already implemented)
 *
 * Key rule: raw LaTeX MUST NEVER appear in student-facing output.
 * PPTX and PDF convert to readable text; HTML uses KaTeX.
 */

/**
 * Strip LaTeX delimiters and convert to readable plain text for PPTX/PDF.
 *
 * Examples:
 *   "$v = \\frac{V_{max}[S]}{K_m+[S]}$" → "v = Vmax[S] / (Km + [S])"
 *   "$$F = ma$$" → "F = ma"
 *   "\\( E = mc^2 \\)" → "E = mc²"
 *   "$\\alpha + \\beta$" → "α + β"
 */
export function stripLatexToReadable(text: string): string {
  if (!text) return "";

  let result = text;

  // Remove block math delimiters
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, expr: string) => renderLatexAsText(expr));
  result = result.replace(/\\\[(\s\S]*?)\\\]/g, (_, expr: string) => renderLatexAsText(expr));

  // Remove inline math delimiters
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, expr: string) => renderLatexAsText(expr));
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, expr: string) => renderLatexAsText(expr));

  return result;
}

/**
 * Convert a LaTeX math expression to readable plain text.
 * Not perfect, but handles the most common STEM notations.
 */
function renderLatexAsText(expr: string): string {
  let result = expr.trim();

  // Fractions: \frac{a}{b} → a / b
  result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1) / ($2)");

  // Superscripts: x^{2} → x², x^2 → x²
  result = result.replace(/\^{([^}]+)}/g, (_, content: string) => toSuperscript(content));
  result = result.replace(/\^(\w)/g, (_, ch: string) => toSuperscript(ch));

  // Subscripts: x_{1} → x₁
  result = result.replace(/_{([^}]+)}/g, (_, content: string) => toSubscript(content));
  result = result.replace(/_(\w)/g, (_, ch: string) => toSubscript(ch));

  // Common Greek letters
  const greekMap: Record<string, string> = {
    "\\alpha": "α", "\\beta": "β", "\\gamma": "γ", "\\delta": "δ",
    "\\epsilon": "ε", "\\theta": "θ", "\\lambda": "λ", "\\mu": "μ",
    "\\pi": "π", "\\sigma": "σ", "\\omega": "ω", "\\phi": "φ",
    "\\psi": "ψ", "\\rho": "ρ", "\\tau": "τ", "\\eta": "η",
    "\\Delta": "Δ", "\\Sigma": "Σ", "\\Omega": "Ω", "\\Phi": "Φ",
    "\\Gamma": "Γ", "\\Theta": "Θ", "\\Lambda": "Λ", "\\Pi": "Π",
    "\\Psi": "Ψ",
  };
  for (const [cmd, sym] of Object.entries(greekMap)) {
    result = result.replaceAll(cmd, sym);
  }

  // Common operators
  const operatorMap: Record<string, string> = {
    "\\sum": "Σ", "\\prod": "Π", "\\int": "∫",
    "\\sqrt": "√", "\\infty": "∞", "\\pm": "±", "\\mp": "∓",
    "\\times": "×", "\\div": "÷", "\\cdot": "·",
    "\\leq": "≤", "\\geq": "≥", "\\neq": "≠", "\\approx": "≈",
    "\\rightarrow": "→", "\\leftarrow": "←", "\\Rightarrow": "⇒",
    "\\Leftarrow": "⇐", "\\leftrightarrow": "↔",
    "\\partial": "∂", "\\nabla": "∇",
    "\\forall": "∀", "\\exists": "∃",
    "\\in": "∈", "\\subset": "⊂", "\\cup": "∪", "\\cap": "∩",
    "\\emptyset": "∅",
  };
  for (const [cmd, sym] of Object.entries(operatorMap)) {
    result = result.replaceAll(cmd, sym);
  }

  // Braces and backslash cleanup
  result = result.replace(/\{([^}]*)\}/g, "$1");
  result = result.replace(/\\[a-zA-Z]+/g, "");
  result = result.replace(/\s{2,}/g, " ").trim();

  // Remove remaining $ signs
  result = result.replace(/\$/g, "");

  return result;
}

function toSuperscript(text: string): string {
  const map: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "n": "ⁿ", "i": "ⁱ", "+": "⁺", "-": "⁻", "=": "⁼",
    "(": "⁽", ")": "⁾",
  };
  return text.split("").map((ch) => map[ch] ?? ch).join("");
}

function toSubscript(text: string): string {
  const map: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
    "a": "ₐ", "e": "ₑ", "o": "ₒ", "x": "ₓ",
  };
  return text.split("").map((ch) => map[ch] ?? ch).join("");
}

/**
 * Check if a text contains any LaTeX that should be rendered.
 */
export function hasLatex(text: string): boolean {
  if (!text) return false;
  return /\$[^$]|\\\(|\\\[/g.test(text);
}

/**
 * Strip ALL LaTeX from text (for contexts where rendering is impossible).
 * Returns the readable plain text version.
 */
export function stripAllLatex(text: string): string {
  return stripLatexToReadable(text);
}
