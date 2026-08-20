import { describe, it, expect } from "vitest";
import { resolveJaheziahMode } from "@/lib/lecture/planner/jaheziah-resolver";

describe("resolveJaheziahMode — AC-17 honesty", () => {
  it("returns COURSE_READINESS when standards list is empty (no approved snapshots)", () => {
    const result = resolveJaheziahMode("Software Engineering", []);
    expect(result.mode).toBe("COURSE_READINESS");
    expect(result.candidateSpecialtyKey).toBeUndefined();
    expect(result.requiredAction).toBeNull();
  });

  it("does not invent CONFIRM_REQUIRED candidates from an empty catalog", () => {
    const result = resolveJaheziahMode("Computer Science", []);
    expect(result.mode).not.toBe("CONFIRM_REQUIRED");
    expect(result.mode).not.toBe("OFFICIAL_JAHEZIAH");
  });
});
