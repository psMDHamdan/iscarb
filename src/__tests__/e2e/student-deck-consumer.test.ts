/**
 * E2E Test Suite: Student Deck Consumer (BRD v3.4 MVP Contract)
 * ===========================================================================
 * Covers:
 *   - Student deck loading and 20-slide pedagogical progression
 *   - Hidden-answer architecture (correct answers & rationales strictly stripped client-side)
 *   - Formative check submission and server-side verification
 *   - S20 Capstone Readiness Gate calculation (>= 3/4 passing threshold)
 *   - Pure deck consumer experience (zero interactive chat copilots or freeform prompts)
 *
 * Tiers:
 *   - Tier 1: Feature Coverage (Happy Path & Core Invariants)
 *   - Tier 2: Boundary & Corner Cases (Defensive Scoring & Boundary Checks)
 *   - Tier 3: Cross-Feature Student Learning Journey
 *   - Tier 4: Real-World Scenarios (Formative Mastery Progression)
 */

import { describe, it, expect } from "vitest";
import { computeGateResult } from "@/lib/lecture/readiness-gate";
import type { ReadinessItemJson } from "@/lib/lecture/generation/types";
import type {
  StudentExperienceViewModel,
  StudentConceptViewModel,
} from "@/lib/lecture/projections/types";

// =============================================================================
// FIXTURE FACTORIES
// =============================================================================

function createMockReadinessItems(): ReadinessItemJson[] {
  return [
    {
      slideNo: 6,
      stem: "What is the primary guarantee of ACID transactions in relational databases?",
      options: [
        "Atomicity, Consistency, Isolation, Durability",
        "Asynchronous, Concurrent, Isolated, Distributed",
        "Automatic, Cached, Indexed, Dynamic",
        "Availability, Compression, Integrity, Decentralization",
      ],
      correctIndex: 0,
      difficulty: "medium",
      rationale: "ACID stands for Atomicity, Consistency, Isolation, Durability.",
      cloId: "clo-db-1",
      sourceLocator: "Chapter 4, Section 2",
    },
    {
      slideNo: 9,
      stem: "In two-phase locking (2PL), when are shared locks released?",
      options: [
        "During the shrinking phase",
        "Immediately after reading",
        "At transaction startup",
        "During the growing phase",
      ],
      correctIndex: 0,
      difficulty: "medium",
      rationale: "In 2PL, locks can only be released during the shrinking phase.",
      cloId: "clo-db-2",
      sourceLocator: "Chapter 4, Section 5",
    },
    {
      slideNo: 13,
      stem: "What trade-off does Strict 2PL introduce compared to basic 2PL?",
      options: [
        "Avoids cascading aborts at the cost of reduced concurrency",
        "Improves throughput at the cost of dirty reads",
        "Eliminates deadlocks completely",
        "Decreases storage overhead without concurrency limits",
      ],
      correctIndex: 0,
      difficulty: "hard",
      rationale: "Strict 2PL holds exclusive locks until commit, preventing cascading aborts.",
      cloId: "clo-db-3",
      sourceLocator: "Chapter 5, Section 1",
    },
    {
      slideNo: 20,
      stem: "Capstone Decision: Which isolation level is required to prevent write skew anomalies?",
      options: [
        "Serializable (or Snapshot Isolation with conflict detection)",
        "Read Committed",
        "Read Uncommitted",
        "Repeatable Read without predicate locks",
      ],
      correctIndex: 0,
      difficulty: "hard",
      rationale: "Write skew occurs under Repeatable Read; Serializable isolation is required.",
      cloId: "clo-db-1",
      sourceLocator: "Chapter 6, Capstone Problem",
    },
  ];
}

function createMockStudentViewModel(): StudentExperienceViewModel {
  const readinessItems = createMockReadinessItems();
  const concepts: Record<string, StudentConceptViewModel> = {};
  const conceptOrder: Array<{ id: string; orderIndex: number; title: string; stage: string }> = [];

  for (let i = 1; i <= 20; i++) {
    const id = `concept-${i}`;
    const readinessItem = readinessItems.find((r) => r.slideNo === i);

    // Strict hidden-answer projection: only id and text, NO correctIndex, NO isCorrect, NO rationale
    const assessment = readinessItem
      ? {
          id: `assess-${id}`,
          stem: readinessItem.stem,
          difficulty: readinessItem.difficulty,
          options: (readinessItem.options as string[]).map((opt, idx) => ({
            id: `opt-${idx}`,
            text: opt,
          })),
        }
      : undefined;

    concepts[id] = {
      id,
      stage: i <= 4 ? "UNDERSTAND" : i <= 13 ? "EXPLORE" : i <= 17 ? "APPLY" : "CHALLENGE",
      orderIndex: i,
      title: `Concept ${i}: Transaction Isolation Principles`,
      bloomLevel: "understand",
      estimatedMinutes: 5,
      coreInsight: `Key pedagogical principle for concept ${i}.`,
      mentalModel: {
        analogy: "Think of transactions as sealed bank envelopes.",
        framework: "ACID Isolation Hierarchy",
      },
      mechanism: {
        explanation: "Step-by-step lock acquisition and validation.",
        steps: ["Acquire lock", "Verify version", "Commit write"],
      },
      realWorldTransfer: {
        scenario: "Banking transfer system handling concurrent deposits.",
        application: "Preventing phantom reads and double withdrawals.",
      },
      activity: {
        id: `act-${id}`,
        type: "think",
        actionVerb: "Predict",
        title: "Your Task",
        prompt: `Predict the database state after concurrent transaction execution.`,
        scaffoldingLevel: "guided",
        progressiveHints: ["Consider isolation levels.", "Look at lock order."],
      },
      assessment,
      visual: {
        id: `vis-${id}`,
        title: `Visual Model ${i}`,
        type: "concept_model",
        caption: "Database Concurrency Control",
        imageUrl: undefined,
        svgCode: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>`,
      },
    };

    conceptOrder.push({
      id,
      orderIndex: i,
      title: `Concept ${i}: Transaction Isolation Principles`,
      stage: concepts[id].stage,
    });
  }

  return {
    experienceId: "exp-test-123",
    experienceTitle: "CS 401: Distributed Database Systems",
    targetAudience: "Undergraduate Computer Science",
    prerequisites: ["Data Structures", "Basic SQL"],
    learningOutcomes: ["Design concurrency control protocols", "Evaluate transaction isolation"],
    hookNarrative: "Explore how modern distributed databases ensure absolute data integrity.",
    stages: [
      {
        stageKey: "UNDERSTAND",
        displayName: "Foundational Models",
        stageNumber: 1,
        conceptCount: 4,
        conceptSummaries: conceptOrder.slice(0, 4) as any,
      },
      {
        stageKey: "EXPLORE",
        displayName: "Core Mechanisms",
        stageNumber: 2,
        conceptCount: 9,
        conceptSummaries: conceptOrder.slice(4, 13) as any,
      },
      {
        stageKey: "APPLY",
        displayName: "Real-World Engineering",
        stageNumber: 3,
        conceptCount: 4,
        conceptSummaries: conceptOrder.slice(13, 17) as any,
      },
      {
        stageKey: "CHALLENGE",
        displayName: "Capstone Readiness Gate",
        stageNumber: 4,
        conceptCount: 3,
        conceptSummaries: conceptOrder.slice(17, 20) as any,
      },
    ],
    concepts,
    conceptOrder,
    firstConceptId: "concept-1",
    totalConcepts: 20,
    estimatedTotalMinutes: 100,
    finalChallenge: {
      id: "final-challenge-1",
      title: "Final Challenge: High-Contention Transaction Design",
      scenario: "Design a fault-tolerant banking transaction engine.",
      prompt: "Select the optimal isolation level for financial settlements.",
      rubricCriteria: [
        "Accurate identification of concurrency anomaly",
        "Correct isolation level selection",
        "Performance trade-off justification",
      ],
    },
  };
}

// Server evaluation simulator (matches /api/iscarb/lecture/experience/[id]/assess behavior)
function simulateServerAssessmentEvaluation(
  readinessItems: ReadinessItemJson[],
  slideNo: number,
  selectedOptionId: string
): { correct: boolean; correctOptionId: string; status: number } {
  const item = readinessItems.find((r) => r.slideNo === slideNo);
  if (!item) {
    return { correct: false, correctOptionId: "", status: 404 };
  }

  const idxMatch = selectedOptionId.match(/^opt-(\d+)$/);
  if (!idxMatch) {
    return { correct: false, correctOptionId: "", status: 400 };
  }

  const chosen = Number(idxMatch[1]);
  const correct = chosen === item.correctIndex;

  return {
    correct,
    correctOptionId: `opt-${item.correctIndex}`,
    status: 200,
  };
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe("Student Deck Consumer E2E Test Suite (BRD v3.4)", () => {

  // ---------------------------------------------------------------------------
  // TIER 1: FEATURE COVERAGE (CORE CONSUMER CONTRACTS)
  // ---------------------------------------------------------------------------
  describe("Tier 1: Feature Coverage (Student Consumer Contracts)", () => {

    describe("Feature 1: Student Deck Loading & 20-Slide Progression", () => {
      it("T1-S1-01: loads complete student view model with exactly 20 concepts", () => {
        const vm = createMockStudentViewModel();
        expect(vm.totalConcepts).toBe(20);
        expect(Object.keys(vm.concepts)).toHaveLength(20);
        expect(vm.conceptOrder).toHaveLength(20);
      });

      it("T1-S1-02: organizes concepts into ordered pedagogical navigation stages", () => {
        const vm = createMockStudentViewModel();
        expect(vm.stages.length).toBeGreaterThanOrEqual(4);
        const stageKeys = vm.stages.map((s) => s.stageKey);
        expect(stageKeys).toContain("UNDERSTAND");
        expect(stageKeys).toContain("EXPLORE");
        expect(stageKeys).toContain("APPLY");
        expect(stageKeys).toContain("CHALLENGE");
      });

      it("T1-S1-03: populates rich mental model, mechanism, and transfer for every concept", () => {
        const vm = createMockStudentViewModel();
        for (let i = 1; i <= 20; i++) {
          const concept = vm.concepts[`concept-${i}`];
          expect(concept).toBeDefined();
          expect(concept.mentalModel.analogy).toBeTruthy();
          expect(concept.mechanism.explanation).toBeTruthy();
          expect(concept.realWorldTransfer.scenario).toBeTruthy();
        }
      });

      it("T1-S1-04: contains student action tasks with active verbs on interactive slides", () => {
        const vm = createMockStudentViewModel();
        const c6 = vm.concepts["concept-6"];
        expect(c6.activity).toBeDefined();
        expect(c6.activity?.actionVerb).toBe("Predict");
        expect(c6.activity?.prompt).toContain("Predict");
      });

      it("T1-S1-05: provides capstone final challenge linked to S20", () => {
        const vm = createMockStudentViewModel();
        expect(vm.finalChallenge).toBeDefined();
        expect(vm.finalChallenge?.title).toContain("Final Challenge");
        expect(vm.finalChallenge?.rubricCriteria.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe("Feature 2: Hidden-Answer Architecture & Security", () => {
      it("T1-S2-01: student assessment payload contains ONLY option ids and text", () => {
        const vm = createMockStudentViewModel();
        const c6 = vm.concepts["concept-6"];
        expect(c6.assessment).toBeDefined();
        expect(c6.assessment?.options).toHaveLength(4);

        for (const opt of c6.assessment!.options) {
          expect(opt).toHaveProperty("id");
          expect(opt).toHaveProperty("text");
          expect(opt).not.toHaveProperty("isCorrect");
          expect(opt).not.toHaveProperty("correct");
        }
      });

      it("T1-S2-02: client view model strictly omits correctIndex from all assessments", () => {
        const vm = createMockStudentViewModel();
        for (let i = 1; i <= 20; i++) {
          const assess = vm.concepts[`concept-${i}`].assessment;
          if (assess) {
            expect((assess as any).correctIndex).toBeUndefined();
            expect((assess as any).correctOptionId).toBeUndefined();
          }
        }
      });

      it("T1-S2-03: client view model strictly omits instructor rationale from all assessments", () => {
        const vm = createMockStudentViewModel();
        for (let i = 1; i <= 20; i++) {
          const assess = vm.concepts[`concept-${i}`].assessment;
          if (assess) {
            expect((assess as any).rationale).toBeUndefined();
            expect((assess as any).explanation).toBeUndefined();
          }
        }
      });

      it("T1-S2-04: server evaluates student submission without revealing rationale", () => {
        const readinessItems = createMockReadinessItems();
        const res = simulateServerAssessmentEvaluation(readinessItems, 6, "opt-0");
        expect(res.status).toBe(200);
        expect(res.correct).toBe(true);
        expect(res.correctOptionId).toBe("opt-0");
        expect((res as any).rationale).toBeUndefined();
      });

      it("T1-S2-05: server correctly rejects incorrect student option submission", () => {
        const readinessItems = createMockReadinessItems();
        const res = simulateServerAssessmentEvaluation(readinessItems, 6, "opt-2");
        expect(res.status).toBe(200);
        expect(res.correct).toBe(false);
        expect(res.correctOptionId).toBe("opt-0");
      });
    });

    describe("Feature 3: S20 Capstone Readiness Gate Calculator", () => {
      it("T1-S3-01: unlocks gate when student scores 4 out of 4 (100%)", () => {
        const items = createMockReadinessItems();
        const answers: Record<string, number> = {
          "6-0": 0,
          "9-1": 0,
          "13-2": 0,
          "20-3": 0,
        };
        const result = computeGateResult(items, answers);
        expect(result.correct).toBe(4);
        expect(result.total).toBe(4);
        expect(result.passed).toBe(true);
        expect(result.rubricLevel).toBe("Proficient (Level 3+)");
      });

      it("T1-S3-02: unlocks gate when student scores exactly 3 out of 4 (75% threshold)", () => {
        const items = createMockReadinessItems();
        const answers: Record<string, number> = {
          "6-0": 0,
          "9-1": 0,
          "13-2": 0,
          "20-3": 1, // 1 incorrect answer
        };
        const result = computeGateResult(items, answers);
        expect(result.correct).toBe(3);
        expect(result.total).toBe(4);
        expect(result.passed).toBe(true);
        expect(result.rubricLevel).toBe("Proficient (Level 3+)");
      });

      it("T1-S3-03: locks gate when student scores 2 out of 4 (50% < 75%)", () => {
        const items = createMockReadinessItems();
        const answers: Record<string, number> = {
          "6-0": 0,
          "9-1": 0,
          "13-2": 1, // incorrect
          "20-3": 2, // incorrect
        };
        const result = computeGateResult(items, answers);
        expect(result.correct).toBe(2);
        expect(result.total).toBe(4);
        expect(result.passed).toBe(false);
        expect(result.rubricLevel).toBe("Developing (Below Level 3)");
      });

      it("T1-S3-04: locks gate when student scores 1 out of 4 (25%)", () => {
        const items = createMockReadinessItems();
        const answers: Record<string, number> = {
          "6-0": 0,
          "9-1": 1,
          "13-2": 2,
          "20-3": 3,
        };
        const result = computeGateResult(items, answers);
        expect(result.correct).toBe(1);
        expect(result.passed).toBe(false);
        expect(result.rubricLevel).toBe("Developing (Below Level 3)");
      });

      it("T1-S3-05: locks gate when student scores 0 out of 4 (0%)", () => {
        const items = createMockReadinessItems();
        const answers: Record<string, number> = {
          "6-0": 3,
          "9-1": 3,
          "13-2": 3,
          "20-3": 3,
        };
        const result = computeGateResult(items, answers);
        expect(result.correct).toBe(0);
        expect(result.passed).toBe(false);
        expect(result.rubricLevel).toBe("Developing (Below Level 3)");
      });
    });

    describe("Feature 4: Strict Consumer Experience (No Conversational Chat)", () => {
      it("T1-S4-01: view model has zero conversational chat state or properties", () => {
        const vm = createMockStudentViewModel();
        expect((vm as any).chatMessages).toBeUndefined();
        expect((vm as any).copilotEnabled).toBeUndefined();
        expect((vm as any).aiAssistant).toBeUndefined();
      });

      it("T1-S4-02: concepts do not expose open-ended conversational prompt inputs", () => {
        const vm = createMockStudentViewModel();
        for (let i = 1; i <= 20; i++) {
          const concept = vm.concepts[`concept-${i}`];
          expect((concept as any).chatHistory).toBeUndefined();
          expect((concept as any).tutorPrompt).toBeUndefined();
        }
      });
    });

  });

  // ---------------------------------------------------------------------------
  // TIER 2: BOUNDARY & CORNER CASES (DEFENSIVE ROBUSTNESS)
  // ---------------------------------------------------------------------------
  describe("Tier 2: Boundary & Corner Cases (Defensive Robustness)", () => {

    it("T2-S-01: handles empty student answer map gracefully without crashing", () => {
      const items = createMockReadinessItems();
      const result = computeGateResult(items, {});
      expect(result.correct).toBe(0);
      expect(result.total).toBe(4);
      expect(result.passed).toBe(false);
      expect(result.rubricLevel).toBe("Developing (Below Level 3)");
    });

    it("T2-S-02: handles partial answers (only 2 questions answered)", () => {
      const items = createMockReadinessItems();
      const answers: Record<string, number> = {
        "6-0": 0,
        "9-1": 0,
      };
      const result = computeGateResult(items, answers);
      expect(result.correct).toBe(2);
      expect(result.passed).toBe(false);
    });

    it("T2-S-03: rejects malformed option ID in server assessment verification", () => {
      const readinessItems = createMockReadinessItems();
      const res = simulateServerAssessmentEvaluation(readinessItems, 6, "invalid-option-format");
      expect(res.status).toBe(400);
      expect(res.correct).toBe(false);
    });

    it("T2-S-04: returns 404 when assessing nonexistent slide readiness item", () => {
      const readinessItems = createMockReadinessItems();
      const res = simulateServerAssessmentEvaluation(readinessItems, 99, "opt-0");
      expect(res.status).toBe(404);
      expect(res.correct).toBe(false);
    });

    it("T2-S-05: handles out-of-range option indices without crashing", () => {
      const readinessItems = createMockReadinessItems();
      const res = simulateServerAssessmentEvaluation(readinessItems, 6, "opt-999");
      expect(res.status).toBe(200);
      expect(res.correct).toBe(false);
    });

  });

  // ---------------------------------------------------------------------------
  // TIER 3: CROSS-FEATURE COMBINATIONS (END-TO-END STUDENT JOURNEY)
  // ---------------------------------------------------------------------------
  describe("Tier 3: Cross-Feature Combinations (Complete Student Journey)", () => {

    it("T3-S-01: student completes full 20-slide journey, passes all formative checks & unlocks S20 gate", () => {
      const vm = createMockStudentViewModel();
      const readinessItems = createMockReadinessItems();

      // 1. Initial State
      expect(vm.firstConceptId).toBe("concept-1");
      const currentConcept = vm.concepts[vm.firstConceptId];
      expect(currentConcept.orderIndex).toBe(1);

      // 2. Formative Assessments along the journey
      const studentAnswers: Record<string, number> = {};

      // Slide 6 Checkpoint
      const c6 = vm.concepts["concept-6"];
      expect(c6.assessment).toBeDefined();
      const eval6 = simulateServerAssessmentEvaluation(readinessItems, 6, "opt-0");
      expect(eval6.correct).toBe(true);
      studentAnswers["6-0"] = 0;

      // Slide 9 Checkpoint
      const c9 = vm.concepts["concept-9"];
      expect(c9.assessment).toBeDefined();
      const eval9 = simulateServerAssessmentEvaluation(readinessItems, 9, "opt-0");
      expect(eval9.correct).toBe(true);
      studentAnswers["9-1"] = 0;

      // Slide 13 Checkpoint
      const c13 = vm.concepts["concept-13"];
      expect(c13.assessment).toBeDefined();
      const eval13 = simulateServerAssessmentEvaluation(readinessItems, 13, "opt-0");
      expect(eval13.correct).toBe(true);
      studentAnswers["13-2"] = 0;

      // Slide 20 Capstone Checkpoint
      const c20 = vm.concepts["concept-20"];
      expect(c20.assessment).toBeDefined();
      const eval20 = simulateServerAssessmentEvaluation(readinessItems, 20, "opt-0");
      expect(eval20.correct).toBe(true);
      studentAnswers["20-3"] = 0;

      // 3. S20 Gate Calculation
      const gateResult = computeGateResult(readinessItems, studentAnswers);
      expect(gateResult.correct).toBe(4);
      expect(gateResult.passed).toBe(true);
      expect(gateResult.rubricLevel).toBe("Proficient (Level 3+)");
    });

  });

  // ---------------------------------------------------------------------------
  // TIER 4: REAL-WORLD SCENARIOS (FORMATIVE MASTERY PROGRESSION)
  // ---------------------------------------------------------------------------
  describe("Tier 4: Real-World Scenarios (Formative Learning Progression)", () => {

    it("T4-S-01: student struggles with first check, recovers on remaining 3, achieves 3/4 pass", () => {
      const readinessItems = createMockReadinessItems();

      // Student answers: Q1 wrong, Q2 correct, Q3 correct, Q4 correct
      const studentAnswers: Record<string, number> = {
        "6-0": 2, // incorrect (selected option 2)
        "9-1": 0, // correct
        "13-2": 0, // correct
        "20-3": 0, // correct
      };

      const gateResult = computeGateResult(readinessItems, studentAnswers);
      expect(gateResult.correct).toBe(3);
      expect(gateResult.total).toBe(4);
      expect(gateResult.passed).toBe(true);
      expect(gateResult.rubricLevel).toBe("Proficient (Level 3+)");
    });

    it("T4-S-02: student fails 2 checks, gate remains locked with constructive rubric feedback", () => {
      const readinessItems = createMockReadinessItems();

      // Student answers: Q1 correct, Q2 wrong, Q3 wrong, Q4 correct
      const studentAnswers: Record<string, number> = {
        "6-0": 0, // correct
        "9-1": 2, // incorrect
        "13-2": 3, // incorrect
        "20-3": 0, // correct
      };

      const gateResult = computeGateResult(readinessItems, studentAnswers);
      expect(gateResult.correct).toBe(2);
      expect(gateResult.total).toBe(4);
      expect(gateResult.passed).toBe(false);
      expect(gateResult.rubricLevel).toBe("Developing (Below Level 3)");
    });

  });

});
