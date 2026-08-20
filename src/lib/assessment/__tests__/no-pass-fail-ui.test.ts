/**
 * Property 6: No pass/fail verdict text in rendered results
 *
 * Static source-code assertion test. Reads the TSX source of each candidate-facing
 * UI component and verifies that none of the forbidden pass/fail verdict strings
 * appear anywhere in the file.
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 3.3**
 */

import * as fs from "fs";
import * as path from "path";

const FILES_TO_CHECK = [
  "src/components/views/ActiveAssessmentView.tsx",
  "src/components/assessment/ResultsPanel.tsx",
  "src/components/assessment/ModuleListView.tsx",
];

/**
 * Strings that must NOT appear in candidate-facing UI source.
 * Each represents a pass/fail verdict that was removed as part of Requirement 2.
 */
const FORBIDDEN_STRINGS = [
  "✓ PASS",
  "✗ FAIL",
  "Pass ✓",
  "Fail ✗",
  "ناجح ✓",
  "لم ينجح ✗",
  "Score ≥",
  "Need … more points",
  "PASS_THRESHOLD",
];

describe("Property 6: No pass/fail verdict text in candidate-facing UI", () => {
  test.each(FILES_TO_CHECK)(
    "file %s contains no pass/fail verdict strings",
    (filePath) => {
      const fullPath = path.resolve(process.cwd(), filePath);

      // Ensure the file exists before asserting its content
      expect(
        fs.existsSync(fullPath),
        `Expected file to exist: ${fullPath}`,
      ).toBe(true);

      const content = fs.readFileSync(fullPath, "utf-8");

      for (const forbidden of FORBIDDEN_STRINGS) {
        expect(
          content,
          `File "${filePath}" must not contain forbidden string: "${forbidden}"`,
        ).not.toContain(forbidden);
      }
    },
  );
});
