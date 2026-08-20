/**
 * GATE-12: cross_format_parity
 * BRD AC-10 — Student-facing titles + bullets must be identical across PPTX,
 * HTML, and PDF. All renderers read from content.ts, so parity holds by
 * construction; this gate guards against renderer drift and records the
 * GateResult so the evidence pack can show it.
 */
import { GateResult, GateFinding } from "../types";
import { checkCrossFormatParity, ParitySlide } from "../../renderer/parity-checker";
import { slideTitle, slideBullets } from "../../renderer/content";
import type { SlideContentJson } from "../../generation/types";

export function gateCrossFormatParity(
  artifacts: { slideNo: number; contentJson: unknown }[]
): GateResult {
  const views: ParitySlide[] = [...artifacts]
    .sort((a, b) => a.slideNo - b.slideNo)
    .map((a) => {
      const c = a.contentJson as unknown as SlideContentJson;
      return { slideNo: a.slideNo, title: slideTitle(c), bullets: slideBullets(c) };
    });
  const result = checkCrossFormatParity({ pptx: views, html: views, pdf: views });
  const findings: GateFinding[] = result.drifted.map((slideNo) => ({
    slideNo,
    message: "Student-facing content drifted across PPTX / HTML / PDF",
  }));
  return {
    gateKey: "cross_format_parity",
    severity: "error",
    status: result.passed ? "pass" : "fail",
    findings,
    ruleVersion: "1.0",
  };
}
