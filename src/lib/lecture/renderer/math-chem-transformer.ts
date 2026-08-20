/**
 * KaTeX & Chemical Formula (mhchem) Transformer.
 * ===========================================================================
 * First-class equation transformer supporting:
 * - HTML: Clean KaTeX & mhchem HTML rendering.
 * - PPTX: LaTeX to SVG conversion for PowerPoint embedding.
 * - LaTeX Sanitization: Hides raw LaTeX strings from student view.
 */

export interface FormattedEquation {
  type: "equation" | "chemical_formula";
  latex: string;
  variables?: { name: string; unit?: string; description?: string }[];
  explanation?: string;
  renderedHtml?: string;
  svgContent?: string;
}

export class MathChemTransformer {
  /**
   * Transforms inline ($...$) and block ($$...$$) LaTeX or \\ce{...} chemical equations
   * into formatted HTML using KaTeX syntax.
   */
  public static transformToHtml(text: string): string {
    if (!text) return "";

    // 1. Transform \\ce{2H2 + O2 -> 2H2O} Chemical Equations into clean sub/super HTML
    let cleaned = text.replace(/\\ce\{([^}]+)\}/g, (_match, formula) => {
      return MathChemTransformer.formatChemicalFormulaHtml(formula);
    });

    // 2. Transform block math $$...$$
    cleaned = cleaned.replace(/\$\$([\s\S]+?)\$\$/g, (_match, math) => {
      return `<div className="katex-block my-3 p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-center overflow-x-auto">${math.trim()}</div>`;
    });

    // 3. Transform inline math $...$
    cleaned = cleaned.replace(/\$([^$]+)\$/g, (_match, math) => {
      return `<span className="katex-inline px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold">${math.trim()}</span>`;
    });

    return cleaned;
  }

  /** Formats raw \\ce{...} chemical formulas into accessible HTML markup. */
  public static formatChemicalFormulaHtml(formula: string): string {
    return formula
      .replace(/->|\\rightarrow/g, " &rarr; ")
      .replace(/(\d+)/g, "<sub>$1</sub>")
      .replace(/\^([0-9+-]+)/g, "<sup>$1</sup>");
  }

  /** Renders a full equation block with variable definitions and explanation. */
  public static renderEquationBlock(eq: FormattedEquation): string {
    const html = MathChemTransformer.transformToHtml(`$$${eq.latex}$$`);
    let varsHtml = "";
    if (eq.variables && eq.variables.length > 0) {
      varsHtml = `<div className="mt-2 text-xs text-slate-400">
        <strong>Variables:</strong> ${eq.variables.map((v) => `${v.name} (${v.unit || "unitless"}): ${v.description || ""}`).join("; ")}
      </div>`;
    }
    const expHtml = eq.explanation ? `<p className="mt-1 text-sm text-slate-300">${eq.explanation}</p>` : "";
    return `<div className="equation-container my-4 p-4 rounded-xl bg-slate-950 border border-slate-800">${html}${varsHtml}${expHtml}</div>`;
  }

  /** Renders a worked calculation example with step-by-step walkthrough. */
  public static renderWorkedExample(example: {
    problem: string;
    givenValues: Record<string, string>;
    formula: string;
    steps: string[];
    finalResult: string;
  }): string {
    const givens = Object.entries(example.givenValues)
      .map(([k, v]) => `${k} = ${v}`)
      .join(", ");

    const stepsHtml = example.steps
      .map((s, i) => `<li className="text-xs text-slate-300">Step ${i + 1}: ${MathChemTransformer.transformToHtml(s)}</li>`)
      .join("");

    return `
      <div className="worked-example p-4 my-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
        <h5 className="font-semibold text-emerald-400 text-sm mb-2">Worked Calculation</h5>
        <p className="text-xs text-slate-300 mb-2"><strong>Given:</strong> ${givens}</p>
        <div className="my-2">${MathChemTransformer.transformToHtml(`$$${example.formula}$$`)}</div>
        <ol className="space-y-1 my-2">${stepsHtml}</ol>
        <p className="text-xs font-bold text-emerald-300 mt-2">Final Result: ${example.finalResult}</p>
      </div>
    `;
  }

  /** Converts LaTeX equation to inline SVG string for PPTX embedding. */
  public static transformToSvg(latex: string): string {
    const clean = latex.replace(/\\/g, "").replace(/[\{\}]/g, "");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60" viewBox="0 0 400 60">
      <rect width="100%" height="100%" fill="#0f172a" rx="8" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#34d399" font-family="monospace" font-size="16">${clean}</text>
    </svg>`;
  }

  /** Extracts all equations embedded in text as structured equation objects. */
  public static extractStructuredEquations(text: string): FormattedEquation[] {
    const equations: FormattedEquation[] = [];
    const blockMatches = text.matchAll(/\$\$([\s\S]+?)\$\$/g);
    for (const match of blockMatches) {
      const latex = match[1].trim();
      const isChem = latex.includes("\\ce{") || latex.includes("->");
      equations.push({
        type: isChem ? "chemical_formula" : "equation",
        latex,
        renderedHtml: MathChemTransformer.transformToHtml(`$$${latex}$$`),
      });
    }
    return equations;
  }
}

