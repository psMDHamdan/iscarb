/**
 * E2E / Structural Test Suite: Chat Removal & Excision Verification (BRD R2/R3)
 * ===========================================================================
 * Verifies that:
 *   - All legacy interactive student chat copilots are completely removed
 *   - Legacy AI tutor panels and floating assistants are removed from components
 *   - Legacy chat backend API endpoints are removed
 *   - Layout files (root, student, assessment) contain zero chat imports or JSX
 *   - Student runtime experience operates strictly without conversational chat
 *
 * Tiers:
 *   - Tier 1: Component & Route Excision Verification
 *   - Tier 2: Source AST & Import Scan (Zero Legacy References)
 *   - Tier 3: Layout & Caller Decoupling Verification
 *   - Tier 4: Student Runtime Cleanliness (Zero Chat State)
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// Target paths required to be excised by BRD v3.4 MVP contract (PROJECT.md M1)
const EXCISED_COMPONENT_FILES = [
  "src/components/ai/AiCopilot.tsx",
  "src/components/iscarb/AICopilotPanel.tsx",
  "src/components/views/experience/AiConceptTutor.tsx",
  "src/components/ai/FloatingAssistant.tsx",
  "src/components/ai/AiFloatingAssistant.tsx",
  "src/components/ai/AiPageAssistant.tsx",
  "src/components/ai/AiContextProvider.tsx",
  "src/components/ai/EnhanceButton.tsx",
  "src/components/ai/AiInsightsWidget.tsx",
  "src/components/ai/AiActionBar.tsx",
  "src/components/ai/AICareerAssistant.tsx",
  "src/components/ai/AIAcademicAdvisor.tsx",
  "src/components/ai/AiAssistantView.tsx",
];

const EXCISED_ROUTE_FILES = [
  "src/app/api/iscarb/student/lecture/tutor-chat/route.ts",
  "src/app/api/iscarb/lecture/experience/[id]/coach/route.ts",
  "src/app/api/iscarb/faculty/copilot/route.ts",
];

const FORBIDDEN_CHAT_IDENTIFIERS = [
  "AiCopilot",
  "AICopilotPanel",
  "AiConceptTutor",
  "FloatingAssistant",
  "AiFloatingAssistant",
  "AiPageAssistant",
  "tutor-chat",
];

const APP_LAYOUT_FILES = [
  "src/app/layout.tsx",
  "src/app/student/layout.tsx",
  "src/app/faculty/layout.tsx",
  "src/components/views/experience/ActivityPanel.tsx",
  "src/components/student/StudentDashboardView.tsx",
];

describe("Extraneous Chat Excision Verification (BRD R2 & R3)", () => {

  // ---------------------------------------------------------------------------
  // TIER 1: FILE SYSTEM VERIFICATION (COMPONENT & ROUTE ABSENCE)
  // ---------------------------------------------------------------------------
  describe("Tier 1: Component & Route Excision Verification", () => {

    describe("Excision of Forbidden Component Files", () => {
      EXCISED_COMPONENT_FILES.forEach((filePath) => {
        it(`T1-EX-01: verifies component file '${filePath}' is absent or deleted`, () => {
          const absolutePath = path.resolve(process.cwd(), filePath);
          const exists = fs.existsSync(absolutePath);
          // If file is still present, provide clear diagnosis
          expect(exists, `Forbidden chat component file must be deleted: ${filePath}`).toBe(false);
        });
      });
    });

    describe("Excision of Forbidden Backend API Routes", () => {
      EXCISED_ROUTE_FILES.forEach((routePath) => {
        it(`T1-EX-02: verifies backend chat route '${routePath}' is absent or deleted`, () => {
          const absolutePath = path.resolve(process.cwd(), routePath);
          const exists = fs.existsSync(absolutePath);
          expect(exists, `Forbidden chat backend route must be deleted: ${routePath}`).toBe(false);
        });
      });
    });

  });

  // ---------------------------------------------------------------------------
  // TIER 2: IMPORT & CALLER SCAN (ZERO ACTIVE REFERENCES)
  // ---------------------------------------------------------------------------
  describe("Tier 2: Source Scan for Decoupled Callers", () => {

    APP_LAYOUT_FILES.forEach((layoutPath) => {
      it(`T2-SC-01: verifies '${layoutPath}' has no imports of excised chat components`, () => {
        const absolutePath = path.resolve(process.cwd(), layoutPath);
        if (!fs.existsSync(absolutePath)) {
          // File may not exist or be optional in some project structures
          return;
        }

        const content = fs.readFileSync(absolutePath, "utf-8");
        for (const identifier of FORBIDDEN_CHAT_IDENTIFIERS) {
          const importPattern = new RegExp(`import.*\\b${identifier}\\b.*from`, "g");
          const matches = content.match(importPattern) || [];
          expect(
            matches.length,
            `Found forbidden import '${identifier}' in ${layoutPath}: ${matches.join(", ")}`
          ).toBe(0);
        }
      });

      it(`T2-SC-02: verifies '${layoutPath}' has no JSX rendering of excised chat tags`, () => {
        const absolutePath = path.resolve(process.cwd(), layoutPath);
        if (!fs.existsSync(absolutePath)) {
          return;
        }

        const content = fs.readFileSync(absolutePath, "utf-8");
        for (const identifier of ["<AiCopilot", "<AICopilotPanel", "<AiConceptTutor", "<FloatingAssistant"]) {
          expect(
            content.includes(identifier),
            `Found forbidden JSX tag '${identifier}' in ${layoutPath}`
          ).toBe(false);
        }
      });
    });

  });

  // ---------------------------------------------------------------------------
  // TIER 3: CROSS-FEATURE STRUCTURAL INTEGRITY
  // ---------------------------------------------------------------------------
  describe("Tier 3: Cross-Feature Structural Decoupling", () => {

    it("T3-ST-01: activity panel does not invoke tutor-chat fetch hints", () => {
      const activityPanelPath = path.resolve(process.cwd(), "src/components/views/experience/ActivityPanel.tsx");
      if (fs.existsSync(activityPanelPath)) {
        const content = fs.readFileSync(activityPanelPath, "utf-8");
        expect(content).not.toContain("tutor-chat");
        expect(content).not.toContain("fetchHint");
      }
    });

    it("T3-ST-02: student player page contains zero chat widgets or floating assistants", () => {
      const playerPagePath = path.resolve(process.cwd(), "src/app/student/lecture/[id]/page.tsx");
      if (fs.existsSync(playerPagePath)) {
        const content = fs.readFileSync(playerPagePath, "utf-8");
        expect(content).not.toContain("AiCopilot");
        expect(content).not.toContain("AICopilotPanel");
        expect(content).not.toContain("AiConceptTutor");
        expect(content).not.toContain("FloatingAssistant");
      }
    });

  });

  // ---------------------------------------------------------------------------
  // TIER 4: REAL-WORLD RUNTIME COMPLIANCE
  // ---------------------------------------------------------------------------
  describe("Tier 4: Student Runtime Cleanliness", () => {

    it("T4-ST-01: verifies student lecture package exports contain pure content without chat configurations", () => {
      const legacyStudentAdapterPath = path.resolve(
        process.cwd(),
        "src/lib/lecture/projections/legacy-student-ux-adapter.ts"
      );
      expect(fs.existsSync(legacyStudentAdapterPath)).toBe(true);

      const content = fs.readFileSync(legacyStudentAdapterPath, "utf-8");
      expect(content).not.toContain("tutorChatUrl");
      expect(content).not.toContain("copilotSessionId");
      expect(content).not.toContain("chatToken");
    });

  });

});
