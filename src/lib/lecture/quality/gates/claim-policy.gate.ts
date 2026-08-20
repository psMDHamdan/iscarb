/**
 * GATE-11: claim_policy
 * BRD FR-008 — Real claims need source; hypotheticals must be labeled.
 */
import { GateResult, GateFinding } from "../types";

export function gateClaimPolicy(
  artifacts: { slideNo: number; contentJson: { claims?: { status: string }[] } }[]
): GateResult {
  const findings: GateFinding[] = [];
  for (const a of artifacts) {
    const content = a.contentJson;
    const needSource = content.claims?.filter((c) => c.status === "NEED_SOURCE") ?? [];
    if (needSource.length > 0) {
      findings.push({
        slideNo: a.slideNo,
        message: `${needSource.length} claim(s) need source verification`,
      });
    }
  }
  return {
    gateKey: "claim_policy",
    severity: "error",
    status: findings.length ? "fail" : "pass",
    findings,
    ruleVersion: "1.0",
  };
}