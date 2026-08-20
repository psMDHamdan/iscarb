/**
 * Property 7: Scoring System Prompt Bypasses Anti-Hallucination Preamble
 *
 * For any invocation of the four-block scorer, the `system` string passed to
 * `chatJsonRaw` SHALL NOT contain "ANTI-HALLUCINATION" or
 * "iSCARB is a sovereign readiness engine", and SHALL contain
 * "calibrated competency assessor inside iSCARB" and "STRICT JSON".
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// server-only is already mocked in tests/setup.ts; guard here too
vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Capture variable — must be declared before vi.mock so the factory closure
// can reference it via the module-level binding.
// ---------------------------------------------------------------------------
let capturedSystem: string | null = null;

vi.mock("@/lib/ai-engine", () => {
  return {
    chatJsonRaw: async (opts: { system: string; user: string; temperature?: number; model?: string }) => {
      capturedSystem = opts.system;
      // Return a well-formed four-block AI response so the scorer completes
      return {
        content: JSON.stringify({
          score: 72,
          perCriterion: [
            { criterion: "Threat Identification", score: 28, justification: "Student correctly identified the phishing link." },
            { criterion: "Response Protocol", score: 22, justification: "Student described reporting steps clearly." },
            { criterion: "Risk Articulation", score: 22, justification: "Risk impact was well-articulated." },
          ],
          feedback: "Good overall understanding of phishing threats. The student demonstrated clear risk awareness.",
          strengths: ["Identified phishing indicators", "Described escalation path"],
          improvements: ["Add specific policy references", "Mention data-loss consequences"],
        }),
        json: {
          score: 72,
          perCriterion: [
            { criterion: "Threat Identification", score: 28, justification: "Student correctly identified the phishing link." },
            { criterion: "Response Protocol", score: 22, justification: "Student described reporting steps clearly." },
            { criterion: "Risk Articulation", score: 22, justification: "Risk impact was well-articulated." },
          ],
          feedback: "Good overall understanding of phishing threats. The student demonstrated clear risk awareness.",
          strengths: ["Identified phishing indicators", "Described escalation path"],
          improvements: ["Add specific policy references", "Mention data-loss consequences"],
        },
        usage: { prompt_tokens: 200, completion_tokens: 80 },
        latencyMs: 1200,
        model: "gpt-4-turbo",
        guarded: false,
      };
    },
    // Re-export withTimeout in case it is used transitively
    withTimeout: async <T>(promise: Promise<T>) => promise,
    clamp: (n: number, min: number, max: number) => Math.max(min, Math.min(max, n)),
  };
});

// Import AFTER vi.mock so the mock is in place
import { scoreResponseFourBlock } from "@/lib/assessment/four-block-scoring";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";

// ---------------------------------------------------------------------------
// M19-style fixture (Cybersecurity / phishing scenario with a gate criterion)
// ---------------------------------------------------------------------------
const M19_FIXTURE: AssessmentModuleSpec = {
  code: "M19",
  title: "Cybersecurity Threat Response",
  dimension: "job_fit",
  level: "L2",
  framework: "STAR method",
  focus: "Phishing threat identification and incident response",
  saudiContext: "Saudi financial-sector context under NCA ECC-1 controls.",
  scenario:
    "You receive an email from 'IT Support' asking you to click a link to reset your password before the end of the day.",
  instructions:
    "Identify whether this email is a phishing attempt. Explain the indicators, the risk, and the correct protocol to follow.",
  rubric: [
    {
      criterion: "Threat Identification",
      weight: 40,
      descriptor: "Correctly identifies this as a phishing attempt and names at least two specific indicators.",
      gate: true,
    },
    {
      criterion: "Response Protocol",
      weight: 30,
      descriptor: "Describes the correct steps: do not click, report to IT/CERT, preserve the email.",
    },
    {
      criterion: "Risk Articulation",
      weight: 30,
      descriptor: "Explains the business risk (credential theft, data breach, financial loss).",
    },
  ],
  fewShot: [
    {
      response: "It looks like a phishing email. I would delete it.",
      score: 35,
      feedback: "Identifies threat but lacks specific indicators and proper escalation steps.",
    },
    {
      response:
        "This is phishing — unsolicited password-reset request, generic greeting, urgency tactics, suspicious domain. I would not click, forward to security@company.sa, and preserve headers for forensics.",
      score: 88,
      feedback: "Strong identification with multiple indicators, correct response protocol, and risk awareness.",
    },
  ],
  passThreshold: 60,
  validationEnabled: false,
  modelTag: "gpt-4-turbo",
  temperature: 0.3,
  specialization: "Cybersecurity",
  generated: false,
  estimateMinutes: 15,
};

const SAMPLE_STUDENT_RESPONSE =
  "This appears to be a phishing email. The indicators are: it creates urgency, the sender is generic 'IT Support' without a proper domain, and password resets are never done by email at my organisation. I would not click the link, report it to the IT security team immediately, and preserve the email for investigation.";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 7: Scoring System Prompt Bypasses Anti-Hallucination Preamble", () => {
  beforeEach(() => {
    capturedSystem = null;
  });

  it("system prompt MUST NOT contain 'ANTI-HALLUCINATION'", async () => {
    await scoreResponseFourBlock(M19_FIXTURE, SAMPLE_STUDENT_RESPONSE);

    expect(capturedSystem).not.toBeNull();
    expect(capturedSystem).not.toContain("ANTI-HALLUCINATION");
  });

  it("system prompt MUST NOT contain 'iSCARB is a sovereign readiness engine'", async () => {
    await scoreResponseFourBlock(M19_FIXTURE, SAMPLE_STUDENT_RESPONSE);

    expect(capturedSystem).not.toBeNull();
    expect(capturedSystem).not.toContain("iSCARB is a sovereign readiness engine");
  });

  it("system prompt MUST contain 'calibrated competency assessor inside iSCARB'", async () => {
    await scoreResponseFourBlock(M19_FIXTURE, SAMPLE_STUDENT_RESPONSE);

    expect(capturedSystem).not.toBeNull();
    expect(capturedSystem).toContain("calibrated competency assessor inside iSCARB");
  });

  it("system prompt MUST contain 'STRICT JSON'", async () => {
    await scoreResponseFourBlock(M19_FIXTURE, SAMPLE_STUDENT_RESPONSE);

    expect(capturedSystem).not.toBeNull();
    expect(capturedSystem).toContain("STRICT JSON");
  });

  it("all four constraints hold in a single invocation", async () => {
    await scoreResponseFourBlock(M19_FIXTURE, SAMPLE_STUDENT_RESPONSE);

    expect(capturedSystem).not.toBeNull();
    const sys = capturedSystem as string;

    // Prohibited strings (anti-hallucination preamble must not appear)
    expect(sys).not.toContain("ANTI-HALLUCINATION");
    expect(sys).not.toContain("iSCARB is a sovereign readiness engine");

    // Required strings (scoring-focused system prompt must be intact)
    expect(sys).toContain("calibrated competency assessor inside iSCARB");
    expect(sys).toContain("STRICT JSON");
  });

  it("chatJsonRaw receives opts.system unchanged (not wrapped by withGuardrails)", async () => {
    await scoreResponseFourBlock(M19_FIXTURE, SAMPLE_STUDENT_RESPONSE);

    // The system prompt passed to chatJsonRaw must be exactly the scorer's
    // own prompt — not prefixed by the preamble that withGuardrails adds.
    // We confirm by checking the preamble's unique opening phrase is absent.
    expect(capturedSystem).not.toContain(
      "You are operating inside iSCARB, a sovereign readiness engine"
    );
  });

  it("scorer completes successfully and returns a ScoredResponse", async () => {
    const result = await scoreResponseFourBlock(M19_FIXTURE, SAMPLE_STUDENT_RESPONSE);

    expect(result).toBeDefined();
    expect(result.moduleCode).toBe("M19");
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.source).toBe("ai");
    expect(result.perCriterion).toHaveLength(M19_FIXTURE.rubric.length);
  });
});
