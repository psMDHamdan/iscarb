/**
 * GATE-01: slide_count
 * BRD §7.2 — Exactly 20 slides → block export if count differs.
 */
import { GateResult, GateFinding } from "../types";

export function gateSlideCount(slides: { slideNo: number }[]): GateResult {
  const count = slides.length;
  const findings: GateFinding[] =
    count !== 20
      ? [{ message: `Slide count is ${count} — must be exactly 20` }]
      : [];
  return {
    gateKey: "slide_count",
    severity: "error",
    status: findings.length ? "fail" : "pass",
    findings,
    ruleVersion: "1.0",
  };
}