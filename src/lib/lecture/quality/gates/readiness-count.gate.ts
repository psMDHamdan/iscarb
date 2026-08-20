/**
 * GATE-08: readiness_count
 * BRD §7.2 — At least 4 readiness checks: 3 embedded + 1 final S20 gate.
 */
import { GateResult, GateFinding } from "../types";

export function gateReadinessCount(
  items: { slideNo: number }[]
): GateResult {
  const embedded = items.filter((i) => i.slideNo >= 5 && i.slideNo <= 17).length;
  const gate = items.filter((i) => i.slideNo === 20).length;
  const findings: GateFinding[] = [];
  if (embedded < 3) findings.push({ message: `Only ${embedded} embedded readiness checks — need ≥3 in S5–S17` });
  if (gate < 1) findings.push({ message: "No readiness gate on S20" });
  return {
    gateKey: "readiness_count",
    severity: "error",
    status: findings.length ? "fail" : "pass",
    findings,
    ruleVersion: "1.0",
  };
}