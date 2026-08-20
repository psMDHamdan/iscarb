import { describe, it, expect } from "vitest";

// Mock AI Engine for evaluation
const mockEvaluate = async (studentResponse: string) => {
   if (studentResponse.includes("latency")) {
      return { whatYouGotRight: "Latency", missing: "Bandwidth", betterExplanation: "...", isMasteryDemonstrated: true };
   }
   return { whatYouGotRight: "Nothing", missing: "Everything", betterExplanation: "...", isMasteryDemonstrated: false };
};

describe("Student Learning Engine - Phase Progress", () => {
  it("should enforce the Predict -> Learn -> Practice loop", async () => {
    let currentPhase = 0; // Phase 0: Start

    // 1. User starts the station
    expect(currentPhase).toBe(0);
    currentPhase = 1; // Transitions to Predict

    // 2. User submits prediction
    const prediction = "I think latency is the issue";
    expect(prediction.length).toBeGreaterThan(5);
    currentPhase = 2; // Transitions to Learn

    // 3. User finishes learning and moves to practice
    currentPhase = 3;

    // 4. User attempts active recall (Teach it back)
    const evaluation = await mockEvaluate("It reduces latency");
    expect(evaluation.isMasteryDemonstrated).toBe(true);

    // 5. Station complete
    currentPhase = 4;
    expect(currentPhase).toBe(4);
  });
});
