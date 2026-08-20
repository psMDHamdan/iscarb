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
  /pause\s*&?\s+discuss\s*:\s+how\s+does\s+.+\s+behave/i,
  /discuss\s+(?:the\s+)?(?:implications?|applications?|importance)/i,
  /think\s+about\s+(?:how|the|what)/i,
  /explore\s+(?:the|how|what)/i,
  /consider\s+(?:the|how|what)/i,
];

/**
 * Forbidden legacy template labels. The modern student view must render sections
 * conditionally — these labels must never appear verbatim in student content.
 */
const FORBIDDEN_LABELS = [
  "High-Stakes Tension",
  "Core Capability",
  "Driving Question",
  "Mental Model: 5 Pillars",
  "Think of It Like This",
  "Core Framework",
  "In the Real World",
  "Common Pitfalls",
  "How It Works",
];

/** Placeholder markers that indicate a fabrication-free fallback was used. */
const PLACEHOLDER_PATTERNS = [
  /pending faculty review/i,
  /placeholder content/i,
  /review pending/i,
  /\[placeholder\]/i,
];

/** Patterns that suggest invented quantitative claims (mirrors invented-number gate). */
const NUMBER_PATTERNS = [
  /\b\d{1,3}(?:\.\d+)?%/g,
  /\b\d+(?:\.\d+)?\s*(?:nm|μm|mm|m|km|kb|mb|gb|tb)\b/gi,
  /\b(?:approximately|about|roughly|nearly|over|more than|less than)\s+\d/gi,
];
const SAFE_NUMBERS = new Set(["1", "2", "3", "4", "5", "10", "20", "100"]);

function isCollaboration(type: string | null): boolean {
  return type === "collaboration" || type === "collaborate";
}

export function gateStudentExperience(
  plans: { slideNo: number; function: string; interactionType: string | null }[],
  artifacts: { slideNo: number; contentJson: { bullets?: string[]; wordCount?: number; studentAction?: string; visualIntent?: string; speakerNotes?: string } }[],
  viewModels: Array<{
    slideNo: number;
    title: string;
    coreInsight: string;
    analogy: string;
    framework: string;
    explanation: string;
    scenario: string;
    application: string;
    pitfalls: Array<{ misconception: string; whyIncorrect: string; howToThinkAboutIt: string }>;
    sourceTexts?: string[];
  }> = []
): GateResult {
  const findings: GateFinding[] = [];

  if (artifacts.length === 0) {
    return {
      gateKey: "student_experience",
      status: "fail",
      severity: GATE_SEVERITY.student_experience,
      findings: [{ message: "No slides generated" }],
      ruleVersion: "1.1",
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

  // ── Modern source-grounded checks on the student view-model ───────────────
  for (const vm of viewModels) {
    const allStudentText = [
      vm.title,
      vm.coreInsight,
      vm.analogy,
      vm.framework,
      vm.explanation,
      vm.scenario,
      vm.application,
      ...vm.pitfalls.map((p) => `${p.misconception} ${p.whyIncorrect} ${p.howToThinkAboutIt}`),
    ].join(" ");

    // 1. Forbidden template labels must never appear verbatim.
    for (const label of FORBIDDEN_LABELS) {
      if (allStudentText.toLowerCase().includes(label.toLowerCase())) {
        findings.push({
          slideNo: vm.slideNo,
          message: `Forbidden template label present: "${label}" — sections must render conditionally`,
        });
      }
    }

    // 2. Placeholder leaks are only acceptable when the concept is flagged for review.
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(allStudentText)) {
        findings.push({
          slideNo: vm.slideNo,
          message: `Placeholder marker leaked into student content: "${pattern}"`,
        });
      }
    }

    // 3. Invented numbers not grounded in the source.
    const allSource = (vm.sourceTexts ?? []).join(" ").toLowerCase();
    for (const pattern of NUMBER_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(allStudentText)) !== null) {
        const value = match[0];
        const numOnly = value.replace(/[^0-9.]/g, "");
        if (SAFE_NUMBERS.has(numOnly)) continue;
        if (allSource.includes(numOnly) || allSource.includes(value.toLowerCase())) continue;
        const start = Math.max(0, match.index - 40);
        const end = Math.min(allStudentText.length, match.index + value.length + 40);
        findings.push({
          slideNo: vm.slideNo,
          message: `Potentially invented number "${value}" in student content — not found in source. Context: "${allStudentText.slice(start, end).trim()}..."`,
        });
      }
    }
  }

  return {
    gateKey: "student_experience",
    status: findings.length ? "fail" : "pass",
    severity: GATE_SEVERITY.student_experience,
    findings,
    ruleVersion: "1.1",
  };
}