import { describe, expect, test, vi } from "vitest";
import type { AssessmentModuleSpec, RubricCriterion } from "../framework";

// mod() in catalog.ts reads process.env.OPENAI_CHAT_MODEL at module evaluation
// time. vi.hoisted runs before the static imports below are evaluated, so the
// DeepSeek default is asserted regardless of ambient shell/CI env.
vi.hoisted(() => {
  process.env.OPENAI_CHAT_MODEL = "";
});

import { UNIVERSAL_MODULES } from "../catalog";
import { rubricWeightsValid } from "../framework";

describe("Full catalog count and defaults", () => {
  test("UNIVERSAL_MODULES has exactly 47 entries", () => {
    expect(UNIVERSAL_MODULES).toHaveLength(47);
  });

  test.each(UNIVERSAL_MODULES.map((m) => [m.code, m]))(
    "module %s has correct defaults and structure",
    (_code, m) => {
      expect(m.passThreshold).toBe(60);
      expect(m.modelTag).toBe("openai/gpt-oss-20b");
      expect(m.temperature).toBe(0.2);
      expect(m.validationEnabled).toBe(false);
      expect(m.generated).toBe(false);
      expect(rubricWeightsValid(m.rubric as RubricCriterion[])).toBe(true);
      expect(m.fewShot.length).toBeGreaterThanOrEqual(2);
      expect(m.titleAr?.trim()).toBeTruthy();
      expect(m.estimateMinutes).toBeGreaterThan(0);
    }
  );
});
