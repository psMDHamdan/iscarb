import { UNIVERSAL_MODULES } from "../catalog";
import { rubricWeightsValid } from "../framework";

const LEVEL1_NEW = ["M05","M06","M07","M09","M10","M12","M13","M14","M15"];
const LEVEL2_NEW = ["M17","M20"];

function assertModuleStructure(code: string) {
  const m = UNIVERSAL_MODULES.find(x => x.code === code);
  expect(m).toBeDefined();
  if (!m) return;
  expect(m.code.trim()).not.toBe("");
  expect(m.title.trim()).not.toBe("");
  expect(m.titleAr?.trim()).not.toBe("");
  expect(m.framework.trim()).not.toBe("");
  expect(m.scenario.trim()).not.toBe("");
  expect(m.instructions.trim()).not.toBe("");
  expect(m.estimateMinutes).toBeGreaterThan(0);
  expect(rubricWeightsValid(m.rubric)).toBe(true);
  expect(m.fewShot.length).toBeGreaterThanOrEqual(2);
}

describe("Level 1 new modules structural completeness", () => {
  test("all 9 Level-1 new modules exist", () => {
    const found = UNIVERSAL_MODULES.filter(m => LEVEL1_NEW.includes(m.code));
    expect(found).toHaveLength(9);
  });

  test.each(LEVEL1_NEW)("module %s is structurally complete", (code) => {
    assertModuleStructure(code);
  });
});

describe("Level 2 new modules structural completeness", () => {
  test("M17 and M20 exist", () => {
    const found = UNIVERSAL_MODULES.filter(m => LEVEL2_NEW.includes(m.code));
    expect(found).toHaveLength(2);
  });

  test.each(LEVEL2_NEW)("module %s is structurally complete", (code) => {
    assertModuleStructure(code);
  });
});
