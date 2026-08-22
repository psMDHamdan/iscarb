import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("MEGA-PROMPT Integration Test", () => {
  it("should contain the optimized prompt within slide-generator.ts", () => {
    const generatorPath = path.join(__dirname, "../slide-generator.ts");
    const content = fs.readFileSync(generatorPath, "utf-8");
    
    // Core Identity
    expect(content).toContain("iSCARB Pedagogical Rewriter");
    
    // Core Rules (optimized from verbose FORBIDDEN_PATTERNS)
    expect(content).toContain("NEVER copy-paste text from the SourceBlocks");
    expect(content).toContain("The source gives you FACTS");
    
    // Schema adherence
    expect(content).toContain('"slideNo": number');
    expect(content).toContain('"timingMinutes": 3-10');
    
    // Per-slide guidance is in FUNCTION_GUIDANCE (not system prompt)
    expect(content).toContain("FUNCTION_GUIDANCE");
    expect(content).toContain("problem:");
    expect(content).toContain("readiness:");
  });

  it("should have per-slide guidance for all 17 slide types", () => {
    const generatorPath = path.join(__dirname, "../slide-generator.ts");
    const content = fs.readFileSync(generatorPath, "utf-8");
    
    const slideTypes = [
      "problem", "mental_map", "clos", "prior_knowledge", "core_concept",
      "mechanism", "misconception", "worked_example", "guided_practice",
      "independent_practice", "deeper_mechanism", "trade_off", "real_case",
      "guided_application", "independent_application", "decision_challenge",
      "transfer_challenge", "rubric", "evidence", "readiness"
    ];
    
    for (const type of slideTypes) {
      expect(content).toContain(`${type}:`);
    }
  });
});
