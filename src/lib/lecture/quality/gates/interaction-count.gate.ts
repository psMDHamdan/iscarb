/**
 * GATE-04: interaction_count
 * BRD §7.2 — ≥3 Pause & Discuss; ≥2 polls; ≥1 collaboration → block if below minimum.
 */
import { GateResult, GateFinding } from "../types";

export function gateInteractionCount(
  plans: { interactionType: string | null }[]
): GateResult {
  const pauseDiscuss = plans.filter((p) => p.interactionType === "pause_discuss").length;
  const polls = plans.filter((p) => p.interactionType === "poll").length;
  const collabs = plans.filter((p) => p.interactionType === "collaboration").length;
  const findings: GateFinding[] = [];
  if (pauseDiscuss < 3) findings.push({ message: `Only ${pauseDiscuss} Pause & Discuss — need ≥3` });
  if (polls < 2) findings.push({ message: `Only ${polls} polls — need ≥2` });
  if (collabs < 1) findings.push({ message: "No collaboration activity — need ≥1" });
  return {
    gateKey: "interaction_count",
    severity: "error",
    status: findings.length ? "fail" : "pass",
    findings,
    ruleVersion: "1.0",
  };
}