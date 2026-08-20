/**
 * Adversarial Empirical Verification Suite: Milestone 1 Extraneous Feature & Chat Excision
 * =========================================================================================
 * Author: challenger_m1_1 (Critic / Specialist)
 * Purpose: Empirically stress-test all assumptions, boundary conditions, and contracts
 *          for Milestone 1 chat and extraneous feature removal.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

// Mock database for assess route verification
vi.mock("@/lib/db", () => ({
  db: {
    lectureSlideArtifact: {
      findFirst: vi.fn(),
    },
    lectureProject: {
      findFirst: vi.fn(),
    },
    lectureReadinessItem: {
      findFirst: vi.fn(),
    },
    assessmentItem: {
      findUnique: vi.fn(),
    },
    learningExperience: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

// Mock API guard session to simulate an authenticated student
vi.mock("@/lib/api-guard", () => ({
  guard: (_opts: any, handler: any) => {
    return async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
      const ctx = {
        session: {
          userId: "student-challenger-1",
          email: "student@challenger.edu",
          role: "student",
          universityId: "univ-test-1",
        },
      };
      return handler(req, ctx, { params });
    };
  },
}));

import { db } from "@/lib/db";
import { POST as assessHandler } from "@/app/api/iscarb/lecture/experience/[id]/assess/route";

describe("Milestone 1 Adversarial Empirical Verification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // SECTION 1: EXCISED FILES & DIRECTORIES INTEGRITY
  // ===========================================================================
  describe("Section 1: Exhaustive File Deletion Verification", () => {
    const EXCISED_TARGETS = [
      "src/components/ai",
      "src/components/iscarb/AICopilotPanel.tsx",
      "src/components/views/experience/AiConceptTutor.tsx",
      "src/components/iscarb/AiActionBar.tsx",
      "src/components/career/AICareerAssistant.tsx",
      "src/components/dashboard/widgets/AIAcademicAdvisor.tsx",
      "src/components/views/AiAssistantView.tsx",
      "src/hooks/useAiAssistant.ts",
      "src/hooks/useAiPage.ts",
      "src/services/ai.service.ts",
      "src/lib/ai-helpers.ts",
      "src/lib/__test__/ai-helpers.test.ts",
      "src/lib/ai-stream.ts",
      "src/app/api/iscarb/student/lecture/tutor-chat",
      "src/app/api/iscarb/lecture/experience/[id]/coach",
      "src/app/api/iscarb/faculty/copilot",
    ];

    EXCISED_TARGETS.forEach((targetPath) => {
      it(`verifies deletion of '${targetPath}'`, () => {
        const fullPath = path.resolve(process.cwd(), targetPath);
        const exists = fs.existsSync(fullPath);
        expect(exists, `Expected '${targetPath}' to be completely removed from disk`).toBe(false);
      });
    });
  });

  // ===========================================================================
  // SECTION 2: CLEAN CALLERS & ZERO RESIDUAL CHAT LEAKAGE
  // ===========================================================================
  describe("Section 2: Clean Callers & Zero Residual Chat References", () => {
    const CRITICAL_CALLER_FILES = [
      "src/app/layout.tsx",
      "src/app/student/layout.tsx",
      "src/app/assessment/layout.tsx",
      "src/app/student/lecture/[id]/page.tsx",
      "src/components/views/experience/ActivityPanel.tsx",
      "src/components/views/StudentDashboardView.tsx",
      "src/components/views/AssessmentOverviewView.tsx",
      "src/components/rdf/RdfGraphViewer.tsx",
      "src/components/rdf/RdfNodeDetails.tsx",
      "src/components/index.ts",
      "src/components/dashboard/widgets/index.ts",
    ];

    const FORBIDDEN_TOKENS = [
      "AiCopilot",
      "AICopilotPanel",
      "FloatingAssistant",
      "AiFloatingAssistant",
      "AiConceptTutor",
      "AiActionBar",
      "AICareerAssistant",
      "AIAcademicAdvisor",
      "AiAssistantView",
      "useAiAssistant",
      "useAiPage",
      "tutor-chat",
      "@/components/ai",
      "@/services/ai.service",
      "@/hooks/useAiAssistant",
      "@/hooks/useAiPage",
      "@/lib/ai-helpers",
      "@/lib/ai-stream",
    ];

    CRITICAL_CALLER_FILES.forEach((filePath) => {
      it(`confirms '${filePath}' contains zero forbidden chat tokens`, () => {
        const fullPath = path.resolve(process.cwd(), filePath);
        expect(fs.existsSync(fullPath), `File must exist: ${filePath}`).toBe(true);

        const content = fs.readFileSync(fullPath, "utf-8");
        for (const token of FORBIDDEN_TOKENS) {
          const regex = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
          const matches = content.match(regex) || [];
          expect(
            matches.length,
            `Forbidden token '${token}' found in ${filePath}`
          ).toBe(0);
        }
      });
    });
  });

  // ===========================================================================
  // SECTION 3: REPOSITORY-WIDE AST & STRING SCAN FOR SOURCE CODE
  // ===========================================================================
  describe("Section 3: Repository-wide Source Code Chat Excision Scan", () => {
    function walkDir(dir: string): string[] {
      const files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const res = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".agents" && entry.name !== ".git") {
            files.push(...walkDir(res));
          }
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.includes(".test.") && !entry.name.includes(".spec.")) {
          files.push(res);
        }
      }
      return files;
    }

    it("verifies zero chat components, hooks, or routes are imported anywhere across src/", () => {
      const sourceFiles = walkDir(path.resolve(process.cwd(), "src"));
      const forbiddenImports = [
        "@/components/ai",
        "@/components/iscarb/AICopilotPanel",
        "@/components/views/experience/AiConceptTutor",
        "@/services/ai.service",
        "@/hooks/useAiAssistant",
        "@/hooks/useAiPage",
        "@/lib/ai-helpers",
        "@/lib/ai-stream",
      ];

      const violations: string[] = [];

      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, "utf-8");
        for (const imp of forbiddenImports) {
          if (content.includes(imp)) {
            violations.push(`${file} imports forbidden module '${imp}'`);
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  // ===========================================================================
  // SECTION 4: STUDENT MCQ ACTIVITY SUBMISSION (/api/.../assess) CONTRACT
  // ===========================================================================
  describe("Section 4: Student MCQ Activity Submission (/api/.../assess) Verification", () => {
    const paramsPromise = Promise.resolve({ id: "exp-test-401" });

    it("rejects invalid or unparseable JSON body with 400", async () => {
      const req = new Request("http://localhost/api/iscarb/lecture/experience/exp-test-401/assess", {
        method: "POST",
        body: "invalid-json",
      });

      const res = await assessHandler(req, { params: paramsPromise });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid JSON body");
    });

    it("rejects request missing assessmentId with 400", async () => {
      const req = new Request("http://localhost/api/iscarb/lecture/experience/exp-test-401/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: "opt-1" }),
      });

      const res = await assessHandler(req, { params: paramsPromise });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("assessmentId and optionId are required");
    });

    it("rejects request missing optionId with 400", async () => {
      const req = new Request("http://localhost/api/iscarb/lecture/experience/exp-test-401/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: "assess-art-1" }),
      });

      const res = await assessHandler(req, { params: paramsPromise });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("assessmentId and optionId are required");
    });

    it("successfully scores a correct answer via legacy artifact path without leaking rationale", async () => {
      // Mock artifact lookup
      (db.lectureSlideArtifact.findFirst as any).mockResolvedValue({
        id: "art-101",
        projectId: "proj-101",
        slideNo: 6,
      });

      // Mock project lookup with matching tenant
      (db.lectureProject.findFirst as any).mockResolvedValue({
        id: "proj-101",
        tenantId: "univ-test-1",
      });

      // Mock readiness item lookup
      (db.lectureReadinessItem.findFirst as any).mockResolvedValue({
        projectId: "proj-101",
        slideNo: 6,
        approved: true,
        correctIndex: 2,
      });

      const req = new Request("http://localhost/api/iscarb/lecture/experience/exp-test-401/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: "assess-art-101", optionId: "opt-2" }),
      });

      const res = await assessHandler(req, { params: paramsPromise });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        correct: true,
        correctOptionId: "opt-2",
      });
      // Ensure zero instructor rationale or extra fields leak to student
      expect(json.rationale).toBeUndefined();
      expect(json.explanation).toBeUndefined();
    });

    it("successfully scores an incorrect answer via legacy artifact path without leaking rationale", async () => {
      (db.lectureSlideArtifact.findFirst as any).mockResolvedValue({
        id: "art-101",
        projectId: "proj-101",
        slideNo: 6,
      });
      (db.lectureProject.findFirst as any).mockResolvedValue({
        id: "proj-101",
        tenantId: "univ-test-1",
      });
      (db.lectureReadinessItem.findFirst as any).mockResolvedValue({
        projectId: "proj-101",
        slideNo: 6,
        approved: true,
        correctIndex: 2,
      });

      const req = new Request("http://localhost/api/iscarb/lecture/experience/exp-test-401/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: "assess-art-101", optionId: "opt-0" }),
      });

      const res = await assessHandler(req, { params: paramsPromise });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        correct: false,
        correctOptionId: "opt-2",
      });
      expect(json.rationale).toBeUndefined();
    });

    it("enforces tenant isolation and returns 404 when project belongs to a different university", async () => {
      (db.lectureSlideArtifact.findFirst as any).mockResolvedValue({
        id: "art-101",
        projectId: "proj-alien",
        slideNo: 6,
      });
      (db.lectureProject.findFirst as any).mockResolvedValue({
        id: "proj-alien",
        tenantId: "univ-other-domain",
      });

      const req = new Request("http://localhost/api/iscarb/lecture/experience/exp-test-401/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: "assess-art-101", optionId: "opt-2" }),
      });

      const res = await assessHandler(req, { params: paramsPromise });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Not found");
    });

    it("returns 404 when the readiness item is not approved by faculty", async () => {
      (db.lectureSlideArtifact.findFirst as any).mockResolvedValue({
        id: "art-101",
        projectId: "proj-101",
        slideNo: 6,
      });
      (db.lectureProject.findFirst as any).mockResolvedValue({
        id: "proj-101",
        tenantId: "univ-test-1",
      });
      // Not approved: findFirst returns null
      (db.lectureReadinessItem.findFirst as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/iscarb/lecture/experience/exp-test-401/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: "assess-art-101", optionId: "opt-2" }),
      });

      const res = await assessHandler(req, { params: paramsPromise });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Assessment not found");
    });

    it("evaluates canonical AssessmentItem path correctly", async () => {
      (db.lectureSlideArtifact.findFirst as any).mockResolvedValue(null);
      (db.assessmentItem.findUnique as any).mockResolvedValue({
        id: "canonical-item-1",
        experienceId: "exp-test-401",
        correctOptionId: "opt-c",
      });
      (db.learningExperience.findUnique as any).mockResolvedValue({
        id: "exp-test-401",
        tenantId: "univ-test-1",
      });

      const req = new Request("http://localhost/api/iscarb/lecture/experience/exp-test-401/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: "canonical-item-1", optionId: "opt-c" }),
      });

      const res = await assessHandler(req, { params: paramsPromise });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        correct: true,
        correctOptionId: "opt-c",
      });
    });
  });

  // ===========================================================================
  // SECTION 5: ACTIVITY PANEL COMPONENT CONTRACTS & BEHAVIOR
  // ===========================================================================
  describe("Section 5: ActivityPanel Structural & Behavior Verification", () => {
    it("ActivityPanel file contains strict non-chat mode rendering", () => {
      const activityPanelPath = path.resolve(
        process.cwd(),
        "src/components/views/experience/ActivityPanel.tsx"
      );
      const content = fs.readFileSync(activityPanelPath, "utf-8");

      // Verify presence of required interactive components
      expect(content).toContain("export function ActivityPanel");
      expect(content).toContain("function AssessmentMCQ");
      expect(content).toContain("function ActivityPrompt");
      expect(content).toContain("function DefaultTaskPrompt");

      // Verify MCQ posts to the assess endpoint
      expect(content).toContain("/api/iscarb/lecture/experience/");
      expect(content).toContain("/assess");

      // Verify no mention of tutor chat or streaming
      expect(content).not.toContain("AiConceptTutor");
      expect(content).not.toContain("tutor-chat");
      expect(content).not.toContain("fetchHint");
      expect(content).not.toContain("useAiAssistant");
    });
  });
});
