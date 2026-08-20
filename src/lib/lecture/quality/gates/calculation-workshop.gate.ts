/**
 * GATE-07: calculation_workshop
 * BRD §7.2 — Mandatory calculation workshop and practice problems → block if missing.
 */
import { GateResult, GateFinding } from "../types";

export function gateCalculationWorkshop(
  plans: { interactionType: string | null }[]
): GateResult {
  const hasCalc = plans.some(
    (p) => p.interactionType === "worked_example" || p.interactionType === "practice"
  );
  const findings: GateFinding[] = hasCalc
    ? []
    : [{ message: "No calculation workshop or practice problems found" }];
  return {
    gateKey: "calculation_workshop",
    severity: "error",
    status: hasCalc ? "pass" : "fail",
    findings,
    ruleVersion: "1.0",
  };
}