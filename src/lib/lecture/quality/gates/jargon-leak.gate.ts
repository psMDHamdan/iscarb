/**
 * GATE-13: jargon_leak
 * Ensures NO internal framework terminology leaks into student-facing content.
 *
 * Students must NEVER see:
 * - Core Principle, Key Requirement, Application Context
 * - Problem Context, Scenario Visual, Evidence of Mastery
 * - Mental Model (as a label), Mechanism in Action
 * - Guided & Independent Practice
 * - iSCARB Framework, H-Stack, Learning Compiler
 * - S1..S20, Phase labels, Source Block, Artifact
 * - Bloom's Taxonomy (as label), Readiness Gate (as label)
 *
 * These terms can exist in speakerNotes (instructor-facing only)
 * but NEVER in bullets, title, studentAction, or teachingExplanation.
 */
import { GateResult, type GateFinding } from "../types";
import { hasForbiddenJargon, detectForbiddenJargon } from "../../projections/utils/jargon-cleaner";

/** Framework labels that must NEVER appear in student-facing fields */
const STUDENT_FACING_BANNED = [
  /\bCore\s*Principle\s*:/i,
  /\bKey\s*Requirement\s*:/i,
  /\bApplication\s*Context\s*:/i,
  /\bProblem\s*Context\s*:/i,
  /\bScenario\s*Visual\s*:/i,
  /\bEvidence\s*of\s*Mastery\s*:/i,
  /\bMental\s*Model\s*:/i,
  /\bMechanism\s*in\s*Action\s*:/i,
  /\bGuided\s*&?\s*Independent\s*Practice\s*:/i,
  /\bH-Stack\b/i,
  /\biSCARB\s*Framework\b/i,
  /\bLearning\s*Compiler\b/i,
  /\bGeneration\s*Stage\b/i,
  /\bSource\s*Block\b/i,
  /\bBloom'?s?\s*Taxonomy\b/i,
  /\bReadiness\s*Gate\b/i,
  /\bQuality\s*Gate\b/i,
  /\bDecision\s*Inbox\b/i,
  /\bJaheziah\b/i,
  /\bNCAAA\b/i,
  /\bVision\s*2030\b/i,
  // Raw LaTeX in student-facing fields
  /\$\\/,
  /\\frac/,
  /\\sum/,
  /\\int/,
];

function findBannedPatterns(text: string): string[] {
  const matches: string[] = [];
  for (const pattern of STUDENT_FACING_BANNED) {
    if (pattern.test(text)) {
      matches.push(pattern.source);
    }
  }
  // Also check for internal pipeline jargon
  const jargon = detectForbiddenJargon(text);
  if (jargon.hasJargon) {
    matches.push(...jargon.matchedJargon.map((j) => `jargon: ${j}`));
  }
  return matches;
}

export function gateJargonLeak(
  artifacts: {
    slideNo: number;
    contentJson: {
      title?: string;
      bullets?: string[];
      studentAction?: string;
      teachingExplanation?: string;
      speakerNotes?: string;
      studentCoreInsight?: string;
      studentAnalogy?: string;
      studentFramework?: string;
      studentMechanismExplanation?: string;
    };
  }[]
): GateResult {
  const findings: GateFinding[] = [];

  for (const art of artifacts) {
    const c = art.contentJson;

    // Check student-facing fields (NOT speakerNotes — that's instructor-only)
    const studentFields: Array<{ name: string; value: string }> = [
      { name: "title", value: c.title ?? "" },
      { name: "bullets", value: (c.bullets ?? []).join(" ") },
      { name: "studentAction", value: c.studentAction ?? "" },
      { name: "teachingExplanation", value: c.teachingExplanation ?? "" },
      { name: "studentCoreInsight", value: c.studentCoreInsight ?? "" },
      { name: "studentAnalogy", value: c.studentAnalogy ?? "" },
      { name: "studentFramework", value: c.studentFramework ?? "" },
      { name: "studentMechanismExplanation", value: c.studentMechanismExplanation ?? "" },
    ];

    for (const { name, value } of studentFields) {
      if (!value) continue;
      const banned = findBannedPatterns(value);
      if (banned.length > 0) {
        findings.push({
          slideNo: art.slideNo,
          message: `Framework label in ${name}: ${banned.join(", ")} — "${value.slice(0, 80)}..."`,
        });
      }
    }
  }

  const status = findings.length > 5 ? "fail" : findings.length > 0 ? "warn" : "pass";

  return {
    gateKey: "jargon_leak",
    severity: "warning",
    status: status as any,
    findings,
    ruleVersion: "1.0",
  };
}
