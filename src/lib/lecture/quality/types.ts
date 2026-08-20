/**
 * Quality Gate — shared types.
 * ===========================================================================
 * GateResult is the contract every deterministic gate must return.
 * GateFinding carries per-slide or per-item diagnostic detail.
 */
export type GateSeverity = "error" | "warning" | "info";
export type GateStatus = "pass" | "fail" | "warn" | "waived" | "pending";

export interface GateFinding {
  slideNo?: number;
  blockId?: string;
  message: string;
}

export interface GateResult {
  gateKey: string;
  severity: GateSeverity;
  status: GateStatus;
  findings: GateFinding[];
  ruleVersion?: string;
}

/** Ordered list of all gate keys for runner ordering. */
export const GATE_KEYS = [
  "slide_count",
  "density",
  "visual_support",
  "interaction_count",
  "cases_examples",
  "misconception",
  "calculation_workshop",
  "readiness_count",
  "source_coverage",
  "clo_alignment",
  "claim_policy",
  "cross_format_parity",
  "student_experience",
  "invented_numbers",
  "jargon_leak",
  "visual_uniqueness",
] as const;

export type GateKey = (typeof GATE_KEYS)[number];

/** Severity map — only visual_support is warning; rest are error. */
export const GATE_SEVERITY: Record<GateKey, GateSeverity> = {
  slide_count: "error",
  density: "error",
  visual_support: "warning",
  interaction_count: "error",
  cases_examples: "error",
  misconception: "error",
  calculation_workshop: "error",
  readiness_count: "error",
  source_coverage: "error",
  clo_alignment: "error",
  claim_policy: "error",
  cross_format_parity: "error",
  student_experience: "error",
  invented_numbers: "error",
  jargon_leak: "warning",
  visual_uniqueness: "warning",
};

/** Whether a gate can be waived (only warning gates). */
export function isWaivable(gateKey: GateKey): boolean {
  return GATE_SEVERITY[gateKey] === "warning";
}