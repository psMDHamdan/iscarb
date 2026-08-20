import { GateFinding, GateResult, GATE_SEVERITY } from "../types";

const ACTION_VERBS = new Set([
  "predict",
  "calculate",
  "design",
  "true",
  "poll",
  "in",
  "debate",
  "compare",
  "define",
  "which",
  "select",
  "pause",
  "identify",
  "diagnose",
  "classify",
  "sequence",
  "match",
  "explain",
  "justify",
  "choose",
  "detect",
  "solve",
  "apply",
  "interpret",
  "complete",
  "describe",
  "evaluate",
]);

/** Vague activity patterns that must be banned from student-facing content */
const VAGUE_ACTIVITY_PATTERNS = [
  /how\s+(?:does|would)\s+.+\s+behave\s+under\s+real[- ]world\s+constraints/i,
  /pause\s*&?\s+discuss\s*:\s*how\s+does\s+.+\s+behave/i,
  /discuss\s+(?:the\s+)?(?:implications?|applications?|importance)/i,
  /think\s+about\s+(?:how|the|what)/i,
  /explore\s+(?:the|how|what)/i,
  /consider\s+(?:the|how|what)/i,
];

function isCollaboration(type: string | null): boolean {
  return type === "collaboration" || type === "collaborate";
}

export function gateStudentExperience(
  plans: { slideNo: number; function: string; interactionType: string | null }[],
  artifacts: { slideNo: number; contentJson: { bullets?: string[]; wordCount?: number; studentAction?: string; visualIntent?: string; speakerNotes?: string } }[]
): GateResult {
  const findings: GateFinding[] = [];

  if (artifacts.length === 0) {
    return {
      gateKey: "student_experience",
      status: "fail",
      severity: GATE_SEVERITY.student_experience,
      findings: [{ message: "No slides generated" }],
      ruleVersion: "1.0",
    };
  }

  for (const art of artifacts) {
    if (art.slideNo !== 1 && (art.contentJson.bullets?.length || 0) > 5) {
      findings.push({
        slideNo: art.slideNo,
        message: `Exceeds 5 bullets (${art.contentJson.bullets?.length})`,
      });
    }
    if ((art.contentJson.wordCount || 0) > 40) {
      findings.push({
        slideNo: art.slideNo,
        message: `Exceeds 40 words (${art.contentJson.wordCount})`,
      });
    }
  }

  for (const art of artifacts.filter((a) => a.slideNo >= 2 && a.slideNo <= 19)) {
    const rawAction: unknown = art.contentJson.studentAction;
    const action = typeof rawAction === "string" 
      ? rawAction 
      : typeof rawAction === "object" && rawAction !== null 
        ? ((rawAction as any).prompt || (rawAction as any).text || JSON.stringify(rawAction)) 
        : "";
    if (!action || !action.trim()) {
      findings.push({ slideNo: art.slideNo, message: "Missing student action" });
    } else {
      const firstWord = action.trim().split(/\s+/)[0]?.toLowerCase().replace(":", "") || "";
      if (firstWord && !ACTION_VERBS.has(firstWord)) {
        findings.push({
          slideNo: art.slideNo,
          message: `Action does not start with strong verb (got: ${firstWord})`,
        });
      }
      // Check for vague activity patterns
      for (const pattern of VAGUE_ACTIVITY_PATTERNS) {
        if (pattern.test(action)) {
          findings.push({
            slideNo: art.slideNo,
            message: `Vague activity pattern detected: "${action.slice(0, 60)}..." — must require specific observable student action`,
          });
          break;
        }
      }
    }
  }

  const pauses = plans.filter((p) => p.interactionType === "pause_discuss").length;
  const polls = plans.filter((p) => p.interactionType === "poll").length;
  const collab = plans.filter((p) => isCollaboration(p.interactionType)).length;

  if (pauses < 3) {
    findings.push({ message: `Missing Pause & Discuss interactions (found ${pauses}, need 3)` });
  }
  if (polls < 2) {
    findings.push({ message: `Missing Poll interactions (found ${polls}, need 2)` });
  }
  if (collab < 1) {
    findings.push({ message: `Missing Collaborate interactions (found ${collab}, need 1)` });
  }

  return {
    gateKey: "student_experience",
    status: findings.length ? "fail" : "pass",
    severity: GATE_SEVERITY.student_experience,
    findings,
    ruleVersion: "1.0",
  };
}
