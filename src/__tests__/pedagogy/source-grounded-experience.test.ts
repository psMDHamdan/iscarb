import { describe, it, expect, vi } from "vitest";
import { scanGeneratedSlide } from "@/lib/lecture/generation/leak-scan";
import { gateStudentExperience } from "@/lib/lecture/quality/gates/student-experience.gate";

// ---------------------------------------------------------------------------
// Leak scan — zero-jargon / zero-invention contract on generated content
// ---------------------------------------------------------------------------

const SOURCE_BLOCKS = [
  {
    id: "src-1",
    locator: "chapter1.pdf#p3",
    text: "PCR is a technique to amplify DNA sequences across several orders of magnitude, from a single copy to millions.",
  },
  {
    id: "src-2",
    locator: "chapter1.pdf#p5",
    text: "The annealing temperature is typically 55\u00b0C for standard primers.",
  },
];

function makeSlideContent(overrides: Record<string, unknown> = {}) {
  return {
    title: "PCR Amplification",
    purpose: "Explain how PCR amplifies DNA",
    academicTruth: "PCR amplifies DNA across orders of magnitude.",
    teachingExplanation: "The three steps of PCR are denaturation, annealing, and extension.",
    bullets: ["Denaturation melts the double strand", "Annealing binds primers"],
    studentAction: "Explain the three-step cycle in your own words.",
    studentCoreInsight: "PCR copies DNA using a three-step thermal cycle.",
    studentAnalogy: "A photocopier for DNA.",
    studentFramework: "",
    studentMechanismExplanation: "Each cycle doubles the copies.",
    studentScenario: "A lab needs many copies of a gene.",
    studentApplication: "Amplify the gene before sequencing.",
    learningActivity: "Sequence the PCR steps correctly.",
    ...overrides,
  };
}

describe("scanGeneratedSlide — post-generation leak scan", () => {
  it("marks clean, source-grounded content as clean", () => {
    const result = scanGeneratedSlide(makeSlideContent(), SOURCE_BLOCKS);
    expect(result.clean).toBe(true);
    expect(result.flaggedForReview).toBe(false);
    expect(result.jargon).toEqual([]);
    expect(result.inventedNumbers).toEqual([]);
    expect(result.placeholders).toEqual([]);
  });

  it("flags forbidden internal jargon labels", () => {
    const result = scanGeneratedSlide(
      makeSlideContent({ studentFramework: "Mental Model: the core principle in action" }),
      SOURCE_BLOCKS
    );
    expect(result.flaggedForReview).toBe(true);
    expect(result.jargon.length).toBeGreaterThan(0);
  });

  it("flags invented numbers not present in the source", () => {
    const result = scanGeneratedSlide(
      makeSlideContent({ studentCoreInsight: "PCR achieves 95% amplification efficiency in every run." }),
      SOURCE_BLOCKS
    );
    expect(result.flaggedForReview).toBe(true);
    expect(result.inventedNumbers.length).toBeGreaterThan(0);
  });

  it("does NOT flag numbers that exist in the source", () => {
    const result = scanGeneratedSlide(
      makeSlideContent({ studentMechanismExplanation: "Annealing temperature is 55\u00b0C." }),
      SOURCE_BLOCKS
    );
    expect(result.inventedNumbers).toEqual([]);
  });

  it("flags placeholder scaffold phrases", () => {
    const result = scanGeneratedSlide(
      makeSlideContent({ studentAnalogy: "Think of this like a system with inputs, processing rules, and outputs." }),
      SOURCE_BLOCKS
    );
    expect(result.flaggedForReview).toBe(true);
    expect(result.placeholders.length).toBeGreaterThan(0);
  });

  // Domain-agnosticism: the leak scan must behave identically for a completely
  // unrelated, non-biology topic (e.g. linear algebra / PCA).
  it("is domain-agnostic — scans a non-biology topic identically", () => {
    const algebraBlocks = [
      { id: "src-a", locator: "la.pdf#p1", text: "PCA finds orthogonal axes of maximum variance." },
      { id: "src-b", locator: "la.pdf#p2", text: "The covariance matrix is symmetric and diagonalizable." },
    ];
    const clean = scanGeneratedSlide(
      {
        title: "Spectral Decomposition",
        academicTruth: "The covariance matrix is symmetric and diagonalizable.",
        studentCoreInsight: "Eigenvectors point along axes of maximum variance.",
        studentAnalogy: "A camera rotating to the angle with the clearest view.",
      },
      algebraBlocks
    );
    expect(clean.clean).toBe(true);
    expect(clean.inventedNumbers).toEqual([]);

    // Same rule set flags invented figures for the algebra topic too.
    const dirty = scanGeneratedSlide(
      { title: "Spectral Decomposition", studentCoreInsight: "99.9% of variance explained in all cases." },
      algebraBlocks
    );
    expect(dirty.flaggedForReview).toBe(true);
    expect(dirty.inventedNumbers.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Gate extension — forbidden labels, placeholder leaks, invented numbers
// ---------------------------------------------------------------------------

function gateArtifacts() {
  return [
    { slideNo: 1, contentJson: { bullets: ["Intro"], wordCount: 20, studentAction: "" } },
    { slideNo: 2, contentJson: { bullets: ["a", "b"], wordCount: 15, studentAction: "Explain the mechanism" } },
  ];
}

function gatePlans() {
  return [
    { slideNo: 1, function: "opening", interactionType: "poll" },
    { slideNo: 2, function: "teach", interactionType: "pause_discuss" },
    { slideNo: 3, function: "teach", interactionType: "pause_discuss" },
    { slideNo: 4, function: "teach", interactionType: "pause_discuss" },
    { slideNo: 5, function: "close", interactionType: "poll" },
    { slideNo: 6, function: "activity", interactionType: "collaboration" },
  ];
}

function vm(slideNo: number, overrides: Record<string, unknown> = {}) {
  return {
    slideNo,
    title: "PCR",
    coreInsight: "PCR amplifies DNA exponentially.",
    analogy: "A photocopier for DNA.",
    framework: "",
    explanation: "Denaturation, annealing, extension.",
    scenario: "A lab amplifies a gene.",
    application: "Sequencing.",
    pitfalls: [],
    sourceTexts: ["PCR amplifies DNA across orders of magnitude."],
    ...overrides,
  };
}

describe("gateStudentExperience — modern source-grounded checks", () => {
  it("passes clean, conditional content", () => {
    const result = gateStudentExperience(gatePlans(), gateArtifacts(), [
      vm(2, { coreInsight: "PCR amplifies DNA using a three-step thermal cycle." }),
    ]);
    expect(result.status).toBe("pass");
  });

  it("rejects forbidden template labels", () => {
    const result = gateStudentExperience(gatePlans(), gateArtifacts(), [
      vm(2, { framework: "Core Framework: the 5 pillars" }),
    ]);
    expect(result.status).toBe("fail");
    expect(result.findings.some((f) => f.message.includes("Forbidden template label"))).toBe(true);
  });

  it("rejects ungrounded invented numbers in student content", () => {
    const result = gateStudentExperience(gatePlans(), gateArtifacts(), [
      vm(2, { coreInsight: "PCR reaches 95% efficiency every cycle." }),
    ]);
    expect(result.status).toBe("fail");
    expect(result.findings.some((f) => f.message.includes("Potentially invented number"))).toBe(true);
  });

  it("allows numbers that are grounded in the source", () => {
    const result = gateStudentExperience(gatePlans(), gateArtifacts(), [
      vm(2, { coreInsight: "PCR amplifies DNA across orders of magnitude." }),
    ]);
    expect(result.status).toBe("pass");
  });

  // Domain-agnosticism: the gate treats a non-biology (linear algebra) view
  // model with the same rules.
  it("is domain-agnostic — gates a non-biology view model with the same rules", () => {
    const algebraVm = vm(2, {
      title: "Spectral Decomposition",
      coreInsight: "Eigenvectors point along axes of maximum variance.",
      analogy: "A camera rotating to the angle with the clearest view.",
      sourceTexts: ["The covariance matrix is symmetric and diagonalizable."],
    });
    expect(gateStudentExperience(gatePlans(), gateArtifacts(), [algebraVm]).status).toBe("pass");

    const dirtyAlgebra = vm(2, {
      title: "Spectral Decomposition",
      coreInsight: "Eigen-decomposition yields 99.9% variance in every dataset.",
      sourceTexts: ["The covariance matrix is symmetric and diagonalizable."],
    });
    const result = gateStudentExperience(gatePlans(), gateArtifacts(), [dirtyAlgebra]);
    expect(result.status).toBe("fail");
    expect(result.findings.some((f) => f.message.includes("Potentially invented number"))).toBe(true);
  });

  it("still enforces the legacy activity/interaction rules", () => {
    const result = gateStudentExperience(
      [{ slideNo: 1, function: "opening", interactionType: null }],
      gateArtifacts(),
      [vm(2)]
    );
    expect(result.status).toBe("fail");
    expect(result.findings.some((f) => f.message.includes("Pause & Discuss"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mastery computation — server-computed mastery + gated final challenge
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    studentExperienceSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { computeMastery, finalChallengeUnlocked, MASTERY_PASS_THRESHOLD } from "@/lib/lecture/session/session-service";

describe("session-service — server-computed mastery", () => {
  it("returns 0 with no interactions", async () => {
    (db.studentExperienceSession.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "s1",
      interactions: [],
    });
    expect(await computeMastery("s1")).toBe(0);
  });

  it("computes 100% mastery on all-correct weighted interactions", async () => {
    (db.studentExperienceSession.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "s1",
      interactions: [
        { activityType: "MCQ_ANSWER", isCorrect: true, evaluatedMasteryScore: null },
        { activityType: "MCQ_ANSWER", isCorrect: true, evaluatedMasteryScore: null },
        { activityType: "ACTIVE_RECALL", isCorrect: true, evaluatedMasteryScore: null },
      ],
    });
    const mastery = await computeMastery("s1");
    expect(mastery).toBe(100);
  });

  it("drops mastery below the pass threshold with wrong answers", async () => {
    (db.studentExperienceSession.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "s1",
      interactions: [
        { activityType: "MCQ_ANSWER", isCorrect: false, evaluatedMasteryScore: null },
        { activityType: "MCQ_ANSWER", isCorrect: false, evaluatedMasteryScore: null },
        { activityType: "ACTIVE_RECALL", isCorrect: true, evaluatedMasteryScore: null },
      ],
    });
    const mastery = await computeMastery("s1");
    expect(mastery).toBeLessThan(MASTERY_PASS_THRESHOLD);
  });

  it("gates the final challenge until mastery >= 70", async () => {
    expect(MASTERY_PASS_THRESHOLD).toBe(70);
    (db.studentExperienceSession.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "s1",
      masteryPercent: 65,
    });
    expect(await finalChallengeUnlocked("s1")).toBe(false);
    (db.studentExperienceSession.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "s1",
      masteryPercent: 70,
    });
    expect(await finalChallengeUnlocked("s1")).toBe(true);
  });
});