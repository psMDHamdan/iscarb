/**
 * GATE-06: misconception
 * BRD §7.2 — Mandatory "Why Simple X Lies" misconception → block if absent.
 */
import { GateResult, GateFinding } from "../types";

export function gateMisconception(
  plans: { slideNo: number; function: string; cloIds: string[] }[]
): GateResult {
  const misconceptionSlides = plans.filter((p) => p.function === "misconception");
  const findings: GateFinding[] = [];
  if (misconceptionSlides.length === 0) {
    findings.push({ message: "No misconception slide found" });
  } else {
    const unlinked = misconceptionSlides.filter((p) => p.cloIds.length === 0);
    if (unlinked.length > 0) {
      findings.push({ message: "Misconception slide not linked to a CLO" });
    }
  }
  return {
    gateKey: "misconception",
    severity: "error",
    status: findings.length ? "fail" : "pass",
    findings,
    ruleVersion: "1.0",
  };
}