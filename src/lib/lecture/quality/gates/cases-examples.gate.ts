/**
 * GATE-05: cases_examples
 * BRD §7.2 — Either 2 developed cases or ≥3 concrete examples → block if neither.
 * Derivation (approved Q1 decision, no schema change): a slide counts as a case
 * when its studentAction mentions "case" or a claim contains "case study";
 * it counts as a concrete example when studentAction mentions "example" or a
 * claim contains "worked example"/"step-by-step".
 */
import { GateResult, GateFinding } from "../types";

function hasCaseStudy(
  a: { contentJson: { studentAction?: string; claims?: { text: string }[] } }
): boolean {
  const c = a.contentJson;
  if (c.studentAction && c.studentAction.toLowerCase().includes("case")) return true;
  if (c.claims?.some((cl) => cl.text.toLowerCase().includes("case study"))) return true;
  return false;
}

function hasConcreteExample(
  a: { contentJson: { studentAction?: string; claims?: { text: string }[] } }
): boolean {
  const c = a.contentJson;
  if (c.studentAction && c.studentAction.toLowerCase().includes("example")) return true;
  if (c.claims?.some((cl) => cl.text.toLowerCase().includes("worked example"))) return true;
  if (c.claims?.some((cl) => cl.text.toLowerCase().includes("step-by-step"))) return true;
  return false;
}

export function gateCasesExamples(
  artifacts: { contentJson: { studentAction?: string; claims?: { text: string }[] } }[]
): GateResult {
  const cases = artifacts.filter(hasCaseStudy).length;
  const examples = artifacts.filter(hasConcreteExample).length;
  const pass = cases >= 2 || examples >= 3;
  const findings: GateFinding[] =
    pass
      ? []
      : [{ message: `Need 2 cases OR 3 examples. Found: ${cases} cases, ${examples} examples` }];
  return {
    gateKey: "cases_examples",
    severity: "error",
    status: pass ? "pass" : "fail",
    findings,
    ruleVersion: "1.0",
  };
}