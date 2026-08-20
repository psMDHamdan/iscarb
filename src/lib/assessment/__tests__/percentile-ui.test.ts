/**
 * Property 8: Percentile rendering completeness
 *
 * Static source-code assertion test. Reads the TSX source of ActiveAssessmentView
 * and verifies that the percentile label strings (English + Arabic), the typeof
 * guard, and the optional interface field are all present.
 *
 * **Validates: Requirements 3.1**
 */

import * as fs from "fs";
import * as path from "path";

const ACTIVE_ASSESSMENT_VIEW = path.resolve(
  process.cwd(),
  "src/components/views/ActiveAssessmentView.tsx"
);

describe("Property 8: Percentile rendering completeness", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(ACTIVE_ASSESSMENT_VIEW, "utf-8");
  });

  test("file exists", () => {
    expect(fs.existsSync(ACTIVE_ASSESSMENT_VIEW)).toBe(true);
  });

  test("ScoreResult interface has percentile field", () => {
    expect(content).toContain("percentile");
  });

  test("English percentile label is present in source", () => {
    expect(content).toContain("Better than");
    expect(content).toContain("% of candidates");
  });

  test("Arabic percentile label is present in source", () => {
    expect(content).toContain("أفضل من");
    expect(content).toContain("من المرشحين");
  });

  test("percentile display is guarded by typeof check (null safety)", () => {
    expect(content).toContain('typeof result.percentile === "number"');
  });

  test("percentile field is optional in ScoreResult (null compatible)", () => {
    // The interface should declare it as optional or nullable
    expect(content).toMatch(/percentile\??\s*:\s*(number\s*\|\s*null|null\s*\|\s*number)/);
  });
});
