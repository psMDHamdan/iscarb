/**
 * GATE-02: density
 * BRD §7.2 — ≤40 visible words per slide; ≤5 bullets → block or require override.
 */
import { GateResult, GateFinding, GATE_SEVERITY } from "../types";

export function gateDensity(
  artifacts: { slideNo: number; contentJson: { wordCount: number; bullets?: string[] } }[]
): GateResult {
  const findings: GateFinding[] = [];
  for (const a of artifacts) {
    const content = a.contentJson;
    if (content.wordCount > 40) {
      findings.push({ slideNo: a.slideNo, message: `${content.wordCount} words — max 40` });
    }
    if (content.bullets && content.bullets.length > 5) {
      findings.push({ slideNo: a.slideNo, message: `${content.bullets.length} bullets — max 5` });
    }
  }
  return {
    gateKey: "density",
    severity: GATE_SEVERITY.density,
    status: findings.length ? "warn" : "pass",
    findings,
    ruleVersion: "1.0",
  };
}