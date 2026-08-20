/**
 * GATE-10: clo_alignment
 * BRD FR-017 — Every slide and assessment links to ≥1 CLO and ≥1 SourceBlock.
 * Exempt approved synthesis slides: S1 (hook), S2 (spine), S3 (CLO slide —
 * verbatim faculty CLO text, no source citations by design; TASK-04 AC-08).
 */
import { GateResult, GateFinding } from "../types";

export function gateCLOAlignment(
  plans: { slideNo: number; cloIds: string[]; sourceBlockIds: string[] }[]
): GateResult {
  const checkableSlides = plans.filter((p) => ![1, 2, 3].includes(p.slideNo));
  const missingCLO = checkableSlides.filter((p) => p.cloIds.length === 0);
  const missingBlock = checkableSlides.filter((p) => p.sourceBlockIds.length === 0);
  const findings: GateFinding[] = [
    ...missingCLO.map((p) => ({ slideNo: p.slideNo, message: "No CLO linked" })),
    ...missingBlock.map((p) => ({ slideNo: p.slideNo, message: "No source block linked" })),
  ];
  return {
    gateKey: "clo_alignment",
    severity: "error",
    status: findings.length ? "fail" : "pass",
    findings,
    ruleVersion: "1.0",
  };
}