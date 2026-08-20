import { describe, expect, it, vi } from "vitest";
import { recordScoredText, shouldScoreOnFinish } from "../finish-scoring";

describe("shouldScoreOnFinish", () => {
  it("returns false for empty / whitespace-only text", () => {
    expect(shouldScoreOnFinish("M01", "", {})).toBe(false);
    expect(shouldScoreOnFinish("M01", "   ", {})).toBe(false);
  });

  it("returns true when module has never been scored", () => {
    expect(shouldScoreOnFinish("M01", "My first answer here.", {})).toBe(true);
  });

  it("returns false when text is unchanged from last scored version", () => {
    const last: Record<string, string> = {};
    recordScoredText(last, "M01", "Stable answer that was already scored.");
    expect(shouldScoreOnFinish("M01", "Stable answer that was already scored.", last)).toBe(false);
    // Trim equivalence
    expect(shouldScoreOnFinish("M01", "  Stable answer that was already scored.  ", last)).toBe(false);
  });

  it("returns true when student edited the answer after it was scored", () => {
    const last: Record<string, string> = {};
    recordScoredText(last, "M01", "Original answer.");
    expect(shouldScoreOnFinish("M01", "Original answer. Plus an edit.", last)).toBe(true);
  });

  it("is per-module — scoring M01 does not skip M02", () => {
    const last: Record<string, string> = {};
    recordScoredText(last, "M01", "Answer for M01.");
    expect(shouldScoreOnFinish("M01", "Answer for M01.", last)).toBe(false);
    expect(shouldScoreOnFinish("M02", "Answer for M02.", last)).toBe(true);
  });
});

describe("submitAllAnswers skip contract (simulated finish loop)", () => {
  it("does NOT call scoreAndPersist again for unchanged answers; DOES for edited ones", async () => {
    const lastScored: Record<string, string> = {};
    const scoreAndPersist = vi.fn(async (code: string, text: string) => {
      recordScoredText(lastScored, code, text);
    });

    const modules = [{ code: "M01" }, { code: "M02" }, { code: "M03" }];
    // Student already scored M01 and M02 during navigation:
    await scoreAndPersist("M01", "Already scored M01 answer.");
    await scoreAndPersist("M02", "Already scored M02 answer.");
    scoreAndPersist.mockClear();

    // Finish snap: M01 unchanged, M02 edited, M03 new
    const snap: Record<string, string> = {
      M01: "Already scored M01 answer.",
      M02: "Already scored M02 answer. Edited on finish.",
      M03: "Brand new M03 answer.",
    };

    for (const mod of modules) {
      const text = (snap[mod.code] ?? "").trim();
      if (!shouldScoreOnFinish(mod.code, text, lastScored)) continue;
      await scoreAndPersist(mod.code, text);
    }

    expect(scoreAndPersist).toHaveBeenCalledTimes(2);
    expect(scoreAndPersist).toHaveBeenCalledWith("M02", "Already scored M02 answer. Edited on finish.");
    expect(scoreAndPersist).toHaveBeenCalledWith("M03", "Brand new M03 answer.");
    expect(scoreAndPersist).not.toHaveBeenCalledWith("M01", expect.anything());
  });
});
