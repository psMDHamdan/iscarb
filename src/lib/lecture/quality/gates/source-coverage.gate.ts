/**
 * GATE-09: source_coverage
 * BRD §7.2 — Source coverage ≥98%; 100% of critical blocks.
 */
import { GateResult, GateFinding } from "../types";

export function gateSourceCoverage(
  blocks: { id: string; criticality: string }[],
  coverageLinks: { blockId: string; disposition: string; approvedBy: string | null }[]
): GateResult {
  const mappedIds = new Set(
    coverageLinks.filter((l) => l.disposition === "mapped").map((l) => l.blockId)
  );
  const omittedIds = new Set(
    coverageLinks
      .filter((l) => l.disposition === "omitted" && l.approvedBy)
      .map((l) => l.blockId)
  );
  const criticalBlocks = blocks.filter((b) => b.criticality === "critical");
  const unmappedCritical = criticalBlocks.filter(
    (b) => !mappedIds.has(b.id) && !omittedIds.has(b.id)
  );
  const total = blocks.length;
  const covered = blocks.filter(
    (b) => mappedIds.has(b.id) || omittedIds.has(b.id)
  ).length;
  const coveragePct = total > 0 ? (covered / total) * 100 : 100;
  const findings: GateFinding[] = [];
  if (unmappedCritical.length > 0) {
    findings.push({
      message: `${unmappedCritical.length} critical blocks not mapped or approved-omitted`,
    });
  }
  if (coveragePct < 98) {
    findings.push({ message: `Coverage ${coveragePct.toFixed(1)}% — need ≥98%` });
  }
  return {
    gateKey: "source_coverage",
    severity: "error",
    status: findings.length ? "fail" : "pass",
    findings,
    ruleVersion: "1.0",
  };
}