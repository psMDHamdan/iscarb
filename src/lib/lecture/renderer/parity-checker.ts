/**
 * Cross-Format Parity Check (TASK-08 §G, AC-10).
 * ===========================================================================
 * Verifies that student-facing content (titles + bullets) is semantically
 * identical across PPTX, HTML, and PDF. Because all three renderers derive
 * from the same approved SlideContentJson via ./content.ts, parity holds by
 * construction; this checker still guards against renderer drift. Any drifted
 * slide is reported by index so callers can create a GateResult with
 * gateKey "cross_format_parity".
 */

export interface ParitySlide {
  slideNo: number;
  title: string;
  bullets: string[];
}

export interface ParityInput {
  pptx: ParitySlide[];
  html: ParitySlide[];
  pdf: ParitySlide[];
}

export interface ParityResult {
  passed: boolean;
  drifted: number[];
}

function key(slide: ParitySlide): string {
  return `${slide.title}||${slide.bullets.join("\u0001")}`;
}

/** Compare the three format datasets slide-by-slide; report drifted slideNos. */
export function checkCrossFormatParity(input: ParityInput): ParityResult {
  const pptxBySlide = new Map(input.pptx.map((s) => [s.slideNo, s]));
  const htmlBySlide = new Map(input.html.map((s) => [s.slideNo, s]));
  const pdfBySlide = new Map(input.pdf.map((s) => [s.slideNo, s]));

  const slideNos = new Set<number>([
    ...pptxBySlide.keys(),
    ...htmlBySlide.keys(),
    ...pdfBySlide.keys(),
  ]);

  const drifted: number[] = [];
  for (const no of slideNos) {
    const p = pptxBySlide.get(no);
    const h = htmlBySlide.get(no);
    const f = pdfBySlide.get(no);
    const pKey = p ? key(p) : "<missing>";
    const hKey = h ? key(h) : "<missing>";
    const fKey = f ? key(f) : "<missing>";
    if (pKey !== hKey || hKey !== fKey) drifted.push(no);
  }

  return { passed: drifted.length === 0, drifted };
}
