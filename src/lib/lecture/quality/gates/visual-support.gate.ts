/**
 * GATE-03: visual_support
 * BRD §7.2 — ≥18 visually supported slides → flag slides lacking visual plan.
 */
import { GateResult, GateFinding } from "../types";

export function gateVisualSupport(
  artifacts: { slideNo: number; contentJson: { visualIntent?: string | any; visualSpec?: any } }[]
): GateResult {
  const missing = artifacts.filter((a) => {
    const c = a.contentJson;
    if (c.visualSpec) return false;
    const intentStr = typeof c.visualIntent === "string" 
      ? c.visualIntent 
      : typeof c.visualIntent === "object" && c.visualIntent !== null 
        ? JSON.stringify(c.visualIntent) 
        : "";
    return !intentStr || intentStr.trim().length < 5;
  });
  const findings: GateFinding[] = missing.map((a) => ({
    slideNo: a.slideNo,
    message: "No visual intent specified",
  }));
  // Warning if >2 slides missing (i.e., <18 supported)
  const status = missing.length > 2 ? "fail" : "pass";
  return {
    gateKey: "visual_support",
    severity: "warning",
    status,
    findings,
    ruleVersion: "1.0",
  };
}