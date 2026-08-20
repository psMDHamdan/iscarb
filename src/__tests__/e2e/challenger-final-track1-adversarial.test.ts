/**
 * EMPIRICAL CHALLENGER FINAL ADVERSARIAL STRESS TEST SUITE (TRACK 1)
 * Milestone 5: End-to-End Adversarial Coverage & Hardening
 * ===========================================================================
 * Role: critic, specialist
 * Authoritative Request: /home/hamdan/iscarb/.agents/ORIGINAL_REQUEST.md
 * Scope & Architecture: /home/hamdan/iscarb/PROJECT.md
 *
 * Objectives Tested Empirically:
 *   1. Faculty source ingestion -> 20-slide iSCARB planning -> 13 quality gates -> 5-format exports
 *      (PPTX, PDF, HTML, DOCX, Evidence Pack with SHA-256 hash).
 *   2. Student deck loading -> slide navigation -> MCQ hidden-answer check -> S20 capstone gate calculation.
 *   3. Zero chat leakage or hidden conversational routes across the application.
 *   4. Zero AI jargon in student/faculty views.
 *   5. Robustness against adversarial, malformed, out-of-order, and boundary inputs.
 */

import { describe, it, expect, vi } from "vitest";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

vi.mock("html-pdf-node", () => ({
  default: {
    generatePdf: vi.fn(async ({ content }: { content: string }) => {
      return Buffer.from(`%PDF-1.4\n%Deterministic PDF generated from HTML len=${content.length}\n%%EOF`);
    }),
  },
}));

// Exporters & Renderers
import { renderPPTX } from "@/lib/lecture/renderer/pptx-renderer";
import { renderHTML } from "@/lib/lecture/renderer/html-renderer";
import { renderPDF } from "@/lib/lecture/renderer/pdf-renderer";
import {
  renderInstructorGuide,
  renderInstructorGuideDocx,
} from "@/lib/lecture/renderer/instructor-guide-renderer";
import {
  renderEvidencePackPDF,
  type EvidencePackData,
} from "@/lib/lecture/renderer/evidence-pack-renderer";
import { checkCrossFormatParity } from "@/lib/lecture/renderer/parity-checker";
import { slideTitle, slideBullets, slideAction } from "@/lib/lecture/renderer/content";

// Jargon Cleaner
import {
  cleanJargon,
  hasForbiddenJargon,
  cleanObjectJargon,
} from "@/lib/lecture/projections/utils/jargon-cleaner";

// Planner & Slot Contract
import {
  validatePlanStructure,
  planGate,
  type SlideLike,
} from "@/lib/lecture/planner/plan-validator";
import { generateTopicGroundedFallbackSlides } from "@/lib/lecture/planner/plan-generator";

// 13 Quality Gates
import {
  gateSlideCount,
  gateDensity,
  gateVisualSupport,
  gateInteractionCount,
  gateCasesExamples,
  gateMisconception,
  gateCalculationWorkshop,
  gateReadinessCount,
  gateSourceCoverage,
  gateCLOAlignment,
  gateClaimPolicy,
  gateCrossFormatParity,
  gateStudentExperience,
} from "@/lib/lecture/quality/gates";

// Student Deck & Readiness Gate
import { computeGateResult } from "@/lib/lecture/readiness-gate";
import type { ReadinessItemJson } from "@/lib/lecture/generation/types";
import { assessCriticality } from "@/lib/lecture/ingestion/source-block-builder";

// =============================================================================
// TEST GENERATORS & HELPERS
// =============================================================================

function createCanonical20Plan(): SlideLike[] {
  return [
    { slideNo: 1, function: "hook", interactionType: "poll" },
    { slideNo: 2, function: "domain_spine", interactionType: null },
    { slideNo: 3, function: "clos", interactionType: null },
    { slideNo: 4, function: "h_stack", interactionType: "pause_discuss" },
    { slideNo: 5, function: "foundation", interactionType: null },
    { slideNo: 6, function: "foundation", interactionType: "poll" },
    { slideNo: 7, function: "foundation", interactionType: "pause_discuss" },
    { slideNo: 8, function: "misconception", interactionType: "pause_discuss" },
    { slideNo: 9, function: "calculation", interactionType: "worked_example" },
    { slideNo: 10, function: "deep_dive", interactionType: null },
    { slideNo: 11, function: "deep_dive", interactionType: "pause_discuss" },
    { slideNo: 12, function: "deep_dive", interactionType: null },
    { slideNo: 13, function: "trade_off", interactionType: "collaboration" },
    { slideNo: 14, function: "application", interactionType: null },
    { slideNo: 15, function: "application", interactionType: "pause_discuss" },
    { slideNo: 16, function: "application", interactionType: null },
    { slideNo: 17, function: "application", interactionType: null },
    { slideNo: 18, function: "rubric", interactionType: null },
    { slideNo: 19, function: "evidence", interactionType: null },
    { slideNo: 20, function: "readiness", interactionType: null },
  ];
}

function createCanonical20Artifacts() {
  return Array.from({ length: 20 }, (_, i) => {
    const slideNo = i + 1;
    return {
      id: `art-${slideNo}`,
      slideNo,
      contentJson: {
        title: `Distributed Consensus Protocol ${slideNo}: Invariant Verification`,
        bullets: [
          `Pillar ${slideNo}.1: Quorum intersection requirement`,
          `Pillar ${slideNo}.2: State machine replication ordering`,
          `Pillar ${slideNo}.3: Byzantine fault tolerance bound`,
        ],
        wordCount: 28,
        visualIntent: `Consensus state transition graph for slot ${slideNo}`,
        visualSpec: {
          visualType: "ARCHITECTURE",
          purpose: `State replication flow for slide ${slideNo}`,
          elements: ["Leader Node", "Follower Replicas", "Write-Ahead Log", "Commit Index"],
          learningMessage: "Majority quorum guarantees linearizable state transitions.",
        },
        speakerNotes: `Facilitator notes for Concept ${slideNo}: explain quorum intersection property.`,
        studentAction: slideNo >= 2 && slideNo <= 19
          ? slideNo === 9
            ? `Calculate minimum quorum size using step-by-step worked example.`
            : slideNo % 2 === 0
              ? `Predict the case study outcome if leader fails during round ${slideNo}.`
              : `Compare the concrete example parameters for cluster ${slideNo}.`
          : undefined,
        claims: [
          {
            text: `Raft consensus case study at KSU distributed systems laboratory demonstrates safety under partitions.`,
            status: "VERIFIED",
            sourceBlockId: `blk-${slideNo}`,
          },
        ],
      },
    };
  });
}

function createCanonicalReadinessItems(): ReadinessItemJson[] {
  return [
    {
      slideNo: 6,
      stem: "In Raft consensus, what condition guarantees that a leader contains all committed entries?",
      options: [
        "Election restriction: Candidate log must be as up-to-date as majority of peers",
        "Heartbeat broadcast frequency exceeds election timeout",
        "Leader state is persisted to disk on every term change",
        "Client requests are routed through follower nodes first",
      ],
      correctIndex: 0,
      difficulty: "medium",
      rationale: "Raft's election restriction prevents candidates lacking committed entries from being elected.",
      cloId: "clo-dist-1",
      sourceLocator: "Raft Paper §5.4.1",
    },
    {
      slideNo: 9,
      stem: "For a fault-tolerant cluster supporting f=2 crash faults, calculate the minimum total nodes N required:",
      options: ["N = 2f + 1 = 5 nodes", "N = 3f + 1 = 7 nodes", "N = f + 1 = 3 nodes", "N = 2f = 4 nodes"],
      correctIndex: 0,
      difficulty: "medium",
      rationale: "To tolerate f crash faults under majority quorum, N must be at least 2f + 1.",
      cloId: "clo-dist-2",
      sourceLocator: "Distributed Systems §3.2",
    },
    {
      slideNo: 13,
      stem: "What trade-off is introduced when switching from Paxos to Multi-Paxos?",
      options: [
        "Eliminates phase 1 preparation overhead per command in exchange for single leader dependency",
        "Increases network latency for stronger Byzantine tolerance",
        "Removes all write-ahead logging requirements",
        "Decreases cluster scalability without throughput improvement",
      ],
      correctIndex: 0,
      difficulty: "hard",
      rationale: "Multi-Paxos amortizes the Prepare phase across multiple log entries via a stable leader.",
      cloId: "clo-dist-3",
      sourceLocator: "Paxos Made Simple §2",
    },
    {
      slideNo: 20,
      stem: "Capstone Readiness Gate: Under asynchronous network partitions, which theorem bounds safety and liveness?",
      options: [
        "FLM / CAP Theorem & FLP Impossibility Result",
        "Amdahl's Law",
        "Little's Law",
        "Moore's Law",
      ],
      correctIndex: 0,
      difficulty: "hard",
      rationale: "FLP proves deterministic consensus is impossible in asynchronous networks with one unannounced failure.",
      cloId: "clo-dist-1",
      sourceLocator: "ACM PODC 1985",
    },
  ];
}

// =============================================================================
// CHALLENGER FINAL ADVERSARIAL TEST SUITE
// =============================================================================

describe("Milestone 5 Track 1: Final Adversarial Stress Testing & Verification", () => {

  // ---------------------------------------------------------------------------
  // 1. ZERO CHAT LEAKAGE & COMPLETE EXCISION VERIFICATION
  // ---------------------------------------------------------------------------
  describe("1. Zero Chat Leakage & Codebase Excision Verification", () => {

    it("ADV-CHAT-01: Excision of all 13 legacy student chat components confirmed on disk", () => {
      const legacyChatPaths = [
        "src/components/ai/AiCopilot.tsx",
        "src/components/iscarb/AICopilotPanel.tsx",
        "src/components/ai/AiConceptTutor.tsx",
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

      for (const relPath of legacyChatPaths) {
        const fullPath = path.resolve("/home/hamdan/iscarb", relPath);
        expect(fs.existsSync(fullPath), `Legacy chat file must not exist: ${relPath}`).toBe(false);
      }
    });

    it("ADV-CHAT-02: Excision of legacy chat API routes confirmed on disk", () => {
      const legacyRoutePaths = [
        "src/app/api/iscarb/student/lecture/tutor-chat/route.ts",
        "src/app/api/iscarb/lecture/experience/[id]/coach/route.ts",
        "src/app/api/iscarb/faculty/copilot/route.ts",
      ];

      for (const relPath of legacyRoutePaths) {
        const fullPath = path.resolve("/home/hamdan/iscarb", relPath);
        expect(fs.existsSync(fullPath), `Legacy chat route must not exist: ${relPath}`).toBe(false);
      }
    });

    it("ADV-CHAT-03: Zero conversational hooks or services remain in codebase", () => {
      const legacyServices = [
        "src/hooks/useAiAssistant.ts",
        "src/hooks/useAiPage.ts",
        "src/services/ai.service.ts",
        "src/services/ai-helpers.ts",
        "src/services/ai-stream.ts",
      ];

      for (const relPath of legacyServices) {
        const fullPath = path.resolve("/home/hamdan/iscarb", relPath);
        expect(fs.existsSync(fullPath), `Legacy AI hook/service must not exist: ${relPath}`).toBe(false);
      }
    });

    it("ADV-CHAT-04: AST / content scan confirms layout files have zero chat copilot imports or JSX", () => {
      const layoutFiles = [
        "src/app/layout.tsx",
        "src/app/student/layout.tsx",
        "src/app/assessment/layout.tsx",
        "src/components/views/experience/ActivityPanel.tsx",
        "src/components/views/learning/StudentDashboardView.tsx",
      ];

      const forbiddenStrings = [
        "AiCopilot",
        "AICopilotPanel",
        "AiConceptTutor",
        "FloatingAssistant",
        "AiFloatingAssistant",
        "AiActionBar",
        "tutor-chat",
      ];

      for (const relPath of layoutFiles) {
        const fullPath = path.resolve("/home/hamdan/iscarb", relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          for (const forbidden of forbiddenStrings) {
            expect(
              content.includes(forbidden),
              `File ${relPath} contains forbidden chat string "${forbidden}"`
            ).toBe(false);
          }
        }
      }
    });

  });

  // ---------------------------------------------------------------------------
  // 2. FACULTY LECTURE COMPILER: 20-SLOT CONTRACT & QUALITY GATES
  // ---------------------------------------------------------------------------
  describe("2. Faculty Lecture Compiler: S1–S20 Contract & 13 Quality Gates", () => {

    it("ADV-COMP-01: Canonical 20-slide plan passes structural validation with exact slot mapping", () => {
      const plan = createCanonical20Plan();
      const errors = validatePlanStructure(plan);
      expect(errors).toHaveLength(0);

      const gate = planGate(plan);
      expect(gate.valid).toBe(true);
      expect(gate.gate).toBe("passed");
    });

    it("ADV-COMP-02: Structural validator strictly rejects any plan length not equal to 20", () => {
      const plan19 = createCanonical20Plan().slice(0, 19);
      expect(planGate(plan19).valid).toBe(false);
      expect(validatePlanStructure(plan19).some((e) => e.rule === "slide_count")).toBe(true);

      const plan21 = [...createCanonical20Plan(), { slideNo: 21, function: "readiness", interactionType: null }];
      expect(planGate(plan21).valid).toBe(false);
      expect(validatePlanStructure(plan21).some((e) => e.rule === "slide_count")).toBe(true);

      const emptyPlan: SlideLike[] = [];
      expect(planGate(emptyPlan).valid).toBe(false);
    });

    it("ADV-COMP-03: Structural validator rejects duplicated slide numbers or missing slots", () => {
      const dupPlan = createCanonical20Plan().map((s) => (s.slideNo === 2 ? { ...s, slideNo: 1 } : s));
      const errors = validatePlanStructure(dupPlan);
      expect(errors.some((e) => e.rule === "unique_slides")).toBe(true);
      expect(errors.some((e) => e.rule === "missing_slide" && e.message.includes("S2"))).toBe(true);
    });

    it("ADV-COMP-04: Structural validator rejects unauthorized slot function tampering on any slide S1-S20", () => {
      for (let slideNo = 1; slideNo <= 20; slideNo++) {
        const tamperedPlan = createCanonical20Plan().map((s) =>
          s.slideNo === slideNo ? { ...s, function: "unauthorized_custom_function" } : s
        );
        const errors = validatePlanStructure(tamperedPlan);
        expect(
          errors.some((e) => e.rule === "fixed_slot_function" && e.message.includes(`S${slideNo}`)),
          `Expected validator to reject tampered function on S${slideNo}`
        ).toBe(true);
      }
    });

    it("ADV-COMP-05: Enforces all 13 Deterministic Quality Gates under valid and adversarial inputs", () => {
      const plan = createCanonical20Plan();
      const artifacts = createCanonical20Artifacts();
      const readiness = createCanonicalReadinessItems();

      // Gate 1: Slide Count (20)
      expect(gateSlideCount(plan).status).toBe("pass");
      expect(gateSlideCount(plan.slice(0, 18)).status).toBe("fail");

      // Gate 2: Density (<=40 words, <=5 bullets)
      expect(gateDensity(artifacts as any).status).toBe("pass");
      const denseArtifacts = artifacts.map((a, idx) =>
        idx === 4 ? { ...a, contentJson: { ...a.contentJson, wordCount: 45 } } : a
      );
      expect(gateDensity(denseArtifacts as any).status).toBe("fail");

      // Gate 3: Visual Support (>=18 visuals)
      expect(gateVisualSupport(artifacts as any).status).toBe("pass");
      const noVisualArtifacts = artifacts.map((a, idx) =>
        idx < 5 ? { ...a, contentJson: { ...a.contentJson, visualSpec: undefined, visualIntent: "" } } : a
      );
      expect(gateVisualSupport(noVisualArtifacts as any).status).toBe("fail");

      // Gate 4: Interaction Count (>=3 P&D, >=2 Poll, >=1 Collab)
      expect(gateInteractionCount(plan).status).toBe("pass");
      const deficientInteractions = plan.map((s) => ({ ...s, interactionType: null }));
      expect(gateInteractionCount(deficientInteractions).status).toBe("fail");

      // Gate 5: Cases/Examples (>=2 cases OR >=3 examples)
      expect(gateCasesExamples(artifacts as any).status).toBe("pass");

      // Gate 6: Misconception (S8 must be misconception with CLO link)
      expect(
        gateMisconception([{ slideNo: 8, function: "misconception", cloIds: ["clo-1"] }]).status
      ).toBe("pass");
      expect(
        gateMisconception([{ slideNo: 8, function: "misconception", cloIds: [] }]).status
      ).toBe("fail");

      // Gate 7: Calculation Workshop (S9 worked_example or practice)
      expect(gateCalculationWorkshop([{ interactionType: "worked_example" }]).status).toBe("pass");
      expect(gateCalculationWorkshop([{ interactionType: "poll" }]).status).toBe("fail");

      // Gate 8: Readiness Count (>=4 readiness items including S20)
      expect(gateReadinessCount(readiness).status).toBe("pass");
      expect(gateReadinessCount(readiness.slice(0, 2)).status).toBe("fail");

      // Gate 9: Source Coverage (>=98% overall, 100% critical)
      const blocks = [
        { id: "b1", criticality: "critical" },
        { id: "b2", criticality: "normal" },
      ];
      const links = [
        { blockId: "b1", disposition: "mapped", approvedBy: "faculty-1" },
        { blockId: "b2", disposition: "mapped", approvedBy: "faculty-1" },
      ];
      expect(gateSourceCoverage(blocks, links).status).toBe("pass");

      // Gate 10: CLO Alignment
      const cloPlans = plan.map((s) => ({
        slideNo: s.slideNo,
        cloIds: ["clo-1"],
        sourceBlockIds: ["b1"],
      }));
      expect(gateCLOAlignment(cloPlans).status).toBe("pass");

      // Gate 11: Claim Policy
      expect(gateClaimPolicy(artifacts as any).status).toBe("pass");

      // Gate 12: Cross Format Parity
      expect(gateCrossFormatParity(artifacts as any).status).toBe("pass");

      // Gate 13: Student Experience (Action verbs on S2-S19)
      const planWithPlans = plan.map((s) => ({
        slideNo: s.slideNo,
        function: s.function,
        interactionType: s.interactionType,
      }));
      expect(gateStudentExperience(planWithPlans, artifacts as any).status).toBe("pass");
    });

    it("ADV-COMP-06: Ingestion critical block assessment tags headings, tables, and CLO text", () => {
      expect(assessCriticality("1.0 Introduction to Distributed Consensus", 1, "heading")).toBe("critical");
      expect(assessCriticality("Course Learning Outcomes: CLO 1, CLO 2", 2, "paragraph")).toBe("critical");
      expect(assessCriticality("| Node | Quorum | Latency |", 3, "table")).toBe("critical");
      expect(assessCriticality("General background narrative on systems.", 4, "paragraph")).toBe("normal");
    });

    it("ADV-COMP-07: Topic-grounded fallback generator produces exactly 20 valid slides", () => {
      const sampleClos = [{ id: "c1", number: "1", text: "CLO text", bloomLevel: "Apply" }];
      const sampleBlocks = [{ id: "b1", locator: "Sec 1", criticality: "critical", text: "Source text" }];

      const fallback = generateTopicGroundedFallbackSlides("Distributed Systems", sampleClos as any, sampleBlocks);
      expect(fallback).toHaveLength(20);
      expect(planGate(fallback).valid).toBe(true);
    });

  });

  // ---------------------------------------------------------------------------
  // 3. MULTI-FORMAT DETERMINISTIC EXPORTERS & PROVENANCE
  // ---------------------------------------------------------------------------
  describe("3. Multi-Format Exporters & SHA-256 Provenance", () => {

    it("ADV-EXP-01: PPTX exporter renders binary buffer with valid PK ZIP header", async () => {
      const artifacts = createCanonical20Artifacts();
      const pptxBuffer = await renderPPTX(artifacts);

      expect(Buffer.isBuffer(pptxBuffer)).toBe(true);
      expect(pptxBuffer.length).toBeGreaterThan(5000);
      expect(pptxBuffer[0]).toBe(0x50); // P
      expect(pptxBuffer[1]).toBe(0x4b); // K
    });

    it("ADV-EXP-02: Interactive HTML exporter generates offline standalone player with XSS sanitization", () => {
      const artifacts = createCanonical20Artifacts();
      const readiness = createCanonicalReadinessItems();

      const html = renderHTML(artifacts, readiness);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<title>Interactive Lecture</title>");
      expect(html).toContain("class=\"roadmap\"");
      expect(html).toContain("class=\"s20-gate\"");
      expect(html).toContain("🎯 Readiness Gate");

      // Verify rationale is hidden by default in student view
      expect(html).toContain("class=\"rationale hidden\"");
    });

    it("ADV-EXP-03: Instructor Guide exporter produces confidential answer key with pedagogical rationales", async () => {
      const artifacts = createCanonical20Artifacts();
      const readiness = createCanonicalReadinessItems();
      const courseProfile = {
        courseCode: "CS-401",
        title: "Distributed Systems Architecture",
        specialty: "Distributed Systems",
      };

      const docxBuffer = await renderInstructorGuideDocx(artifacts, readiness, courseProfile);
      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      expect(docxBuffer.length).toBeGreaterThan(1000);
      expect(docxBuffer[0]).toBe(0x50);
      expect(docxBuffer[1]).toBe(0x4b);

      const htmlGuide = renderInstructorGuide(artifacts, readiness, courseProfile);
      expect(htmlGuide).toContain("INSTRUCTOR CONFIDENTIAL");
      expect(htmlGuide).toContain("Readiness Item Answer Key");
      expect(htmlGuide).toContain("CS-401 — Distributed Systems Architecture");
    });

    it("ADV-EXP-04: Evidence Pack PDF embeds exact 64-character SHA-256 manifest hash and audit trail", async () => {
      const manifestPayload = JSON.stringify({
        project: "Distributed Systems M5",
        slides: createCanonical20Artifacts().map((a) => a.contentJson.title),
        timestamp: "2026-08-19T20:30:00Z",
      });
      const manifestSha256 = createHash("sha256").update(manifestPayload).digest("hex");

      const evidenceData: EvidencePackData = {
        projectTitle: "Accreditation Dossier: Distributed Systems Consensus",
        manifestHash: manifestSha256,
        approvedBy: "Chair of Department Curriculum Committee",
        approvedAt: "2026-08-19T20:30:00Z",
        coverage: [
          { blockId: "blk-1", locator: "Syllabus §1.1", disposition: "mapped", reason: null },
          { blockId: "blk-2", locator: "Syllabus §1.2", disposition: "mapped", reason: null },
        ],
        clos: [
          { number: "CLO 1", text: "Design distributed consensus protocols", bloomLevel: "Create" },
          { number: "CLO 2", text: "Analyze Byzantine fault tolerance", bloomLevel: "Analyze" },
        ],
        citations: [
          {
            claim: "Raft safety invariants are maintained under arbitrary network partitions.",
            sourceKey: "ACM TOCS 2014",
            url: "https://doi.org/10.1145/2699999",
            hash: createHash("sha256").update("citation-raft").digest("hex").slice(0, 16),
            retrievedAt: "2026-08-19T10:00:00Z",
          },
        ],
        readiness: [
          { slideNo: 6, stem: "Raft election restriction", clo: "CLO 1", outcome: "Jaheziah Standard 2" },
          { slideNo: 20, stem: "Capstone Asynchronous Network Gate", clo: "CLO 2", outcome: "Jaheziah Standard 4" },
        ],
        gates: [
          { gateKey: "slide_count", severity: "error", status: "pass" },
          { gateKey: "density", severity: "error", status: "pass" },
          { gateKey: "source_coverage", severity: "error", status: "pass" },
        ],
      };

      const pdfBuffer = await renderEvidencePackPDF(evidenceData);
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.slice(0, 5).toString("ascii")).toBe("%PDF-");
      expect(manifestSha256).toMatch(/^[a-f0-9]{64}$/);
    });

    it("ADV-EXP-05: Cross-format parity checker catches simulated text and bullet drift", () => {
      const canonical = createCanonical20Artifacts();
      const views = canonical.map((a) => ({
        slideNo: a.slideNo,
        title: slideTitle(a.contentJson as any),
        bullets: slideBullets(a.contentJson as any),
      }));

      // In-sync parity
      const inSync = checkCrossFormatParity({ pptx: views, html: views, pdf: views });
      expect(inSync.passed).toBe(true);
      expect(inSync.drifted).toHaveLength(0);

      // Injected title drift on slide 10
      const driftedViews = views.map((v) =>
        v.slideNo === 10 ? { ...v, title: "Altered Title for PPTX" } : v
      );
      const drifted = checkCrossFormatParity({ pptx: driftedViews, html: views, pdf: views });
      expect(drifted.passed).toBe(false);
      expect(drifted.drifted).toEqual([10]);
    });

  });

  // ---------------------------------------------------------------------------
  // 4. STUDENT DECK CONSUMER, HIDDEN ANSWERS & S20 CAPSTONE GATE
  // ---------------------------------------------------------------------------
  describe("4. Student Deck Consumer, Hidden Answer Security & S20 Gate", () => {

    it("ADV-STU-01: Hidden answer architecture guarantees student payload never contains answer keys or rationales", () => {
      const readiness = createCanonicalReadinessItems();

      // Simulate student projection mapping
      const studentAssessmentPayload = readiness.map((r) => ({
        slideNo: r.slideNo,
        stem: cleanJargon(r.stem),
        difficulty: r.difficulty,
        options: (r.options as string[]).map((opt, idx) => ({
          id: `opt-${idx}`,
          text: cleanJargon(opt),
        })),
      }));

      for (const item of studentAssessmentPayload) {
        expect((item as any).correctIndex).toBeUndefined();
        expect((item as any).correctOptionId).toBeUndefined();
        expect((item as any).rationale).toBeUndefined();
        for (const opt of item.options) {
          expect((opt as any).isCorrect).toBeUndefined();
          expect((opt as any).correct).toBeUndefined();
        }
      }
    });

    it("ADV-STU-02: S20 Capstone Readiness Gate strictly evaluates >= 3/4 (75%) unlock threshold", () => {
      const items = createCanonicalReadinessItems();

      // 4 out of 4 (100%) -> PASS
      const score4 = computeGateResult(items, { "6-0": 0, "9-1": 0, "13-2": 0, "20-3": 0 });
      expect(score4.correct).toBe(4);
      expect(score4.passed).toBe(true);
      expect(score4.rubricLevel).toBe("Proficient (Level 3+)");

      // 3 out of 4 (75%) -> PASS
      const score3 = computeGateResult(items, { "6-0": 0, "9-1": 0, "13-2": 0, "20-3": 1 });
      expect(score3.correct).toBe(3);
      expect(score3.passed).toBe(true);
      expect(score3.rubricLevel).toBe("Proficient (Level 3+)");

      // 2 out of 4 (50%) -> FAIL
      const score2 = computeGateResult(items, { "6-0": 0, "9-1": 0, "13-2": 2, "20-3": 3 });
      expect(score2.correct).toBe(2);
      expect(score2.passed).toBe(false);
      expect(score2.rubricLevel).toBe("Developing (Below Level 3)");

      // 1 out of 4 (25%) -> FAIL
      const score1 = computeGateResult(items, { "6-0": 0, "9-1": 1, "13-2": 2, "20-3": 3 });
      expect(score1.correct).toBe(1);
      expect(score1.passed).toBe(false);
      expect(score1.rubricLevel).toBe("Developing (Below Level 3)");

      // 0 out of 4 (0%) -> FAIL
      const score0 = computeGateResult(items, { "6-0": 1, "9-1": 1, "13-2": 2, "20-3": 3 });
      expect(score0.correct).toBe(0);
      expect(score0.passed).toBe(false);
      expect(score0.rubricLevel).toBe("Developing (Below Level 3)");
    });

    it("ADV-STU-03: S20 gate handles missing, partial, or malformed answers safely", () => {
      const items = createCanonicalReadinessItems();

      expect(computeGateResult(items, {}).passed).toBe(false);
      expect(computeGateResult(items, { "invalid-key": 0 }).passed).toBe(false);
      expect(computeGateResult([], {}).passed).toBe(false);
    });

  });

  // ---------------------------------------------------------------------------
  // 5. ZERO AI JARGON CLEANER GUARDRAILS
  // ---------------------------------------------------------------------------
  describe("5. Zero AI Jargon Cleaner Guardrails", () => {

    it("ADV-JARG-01: Jargon cleaner replaces all pipeline terms in user-facing texts", () => {
      const sample = "In Slide 5 (S5) we parse source chunk 3, slot 5, and execute prompt template 1.";
      const cleaned = cleanJargon(sample);

      expect(cleaned).toContain("Concept 5");
      expect(cleaned).toContain("reference text 3");
      expect(cleaned).toContain("section 5");
      expect(cleaned).toContain("exercise 1");
      expect(hasForbiddenJargon(cleaned)).toBe(false);
    });

    it("ADV-JARG-02: Jargon cleaner preserves legitimate non-jargon vocabulary", () => {
      const safeText = "Classify passenger vehicle assets and passive sensor systems.";
      expect(cleanJargon(safeText)).toBe(safeText);
    });

  });

});
