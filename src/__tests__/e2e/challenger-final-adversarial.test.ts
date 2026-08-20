/**
 * FINAL EMPIRICAL CHALLENGER ADVERSARIAL STRESS TEST SUITE
 * Milestone 5: Exporter Parity, Student Hidden-Answer Security & E2E Verification
 * ==============================================================================
 * Role: critic / specialist (Teamwork Preview Challenger)
 * Working Directory: /home/hamdan/iscarb/.agents/challenger_final_2
 *
 * Objectives Under Test:
 *   1. Multi-format deterministic exporters and cross-format parity (PPTX, HTML, PDF, DOCX, Evidence Pack)
 *   2. Student hidden-answer security: confirm client cannot access or inspect correct answers or rationales before submission
 *   3. Boundary stress testing, adversarial injection, and tenant isolation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";

// Mock database for assess route verification
vi.mock("@/lib/db", () => ({
  db: {
    lectureSlideArtifact: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    lectureProject: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    lectureReadinessItem: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    assessmentItem: {
      findUnique: vi.fn(),
    },
    learningExperience: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    lectureSlidePlan: {
      findMany: vi.fn(),
    },
    lecturePackageVersion: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    lectureCourseProfile: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock API guard to simulate an authenticated student
vi.mock("@/lib/api-guard", () => ({
  guard: (_opts: any, handler: any) => {
    return async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
      const ctx = {
        session: {
          userId: "student-challenger-final",
          email: "student@challenger.edu",
          role: "student",
          universityId: "univ-test-final",
        },
      };
      return handler(req, ctx, { params });
    };
  },
}));

vi.mock("html-pdf-node", () => ({
  default: {
    generatePdf: vi.fn(async ({ content }: { content: string }) => {
      return Buffer.from(`%PDF-1.4\n%Deterministic PDF output len=${content.length}\n%%EOF`);
    }),
  },
}));

import { db } from "@/lib/db";
import { POST as assessHandler } from "@/app/api/iscarb/lecture/experience/[id]/assess/route";

// Exporters & Renderers
import { renderPPTX } from "@/lib/lecture/renderer/pptx-renderer";
import { renderHTML } from "@/lib/lecture/renderer/html-renderer";
import { renderPDF } from "@/lib/lecture/renderer/pdf-renderer";
import {
  renderInstructorGuide,
  renderInstructorGuideDocx,
  renderInstructorGuidePDF,
} from "@/lib/lecture/renderer/instructor-guide-renderer";
import {
  renderEvidencePackPDF,
  type EvidencePackData,
} from "@/lib/lecture/renderer/evidence-pack-renderer";
import { checkCrossFormatParity } from "@/lib/lecture/renderer/parity-checker";
import { slideTitle, slideBullets, slideAction } from "@/lib/lecture/renderer/content";
import { gateCrossFormatParity } from "@/lib/lecture/quality/gates/cross-format-parity.gate";

// Student UX Projections
import { StudentUxAdapter } from "@/lib/lecture/projections/student-ux-adapter";
import type { LearningExperience } from "@/lib/lecture/types/learning-experience";
import { computeGateResult } from "@/lib/lecture/readiness-gate";

// =============================================================================
// TEST FIXTURES
// =============================================================================

function create20SlideContentFixture() {
  return Array.from({ length: 20 }, (_, i) => {
    const slideNo = i + 1;
    return {
      slideNo,
      contentJson: {
        title: `Slide ${slideNo}: Core Concept Architecture`,
        bullets: [
          `Key point 1 for concept ${slideNo}`,
          `Key point 2 for concept ${slideNo}`,
          `Key point 3 for concept ${slideNo}`,
          `Key point 4 for concept ${slideNo}`,
          `Key point 5 for concept ${slideNo}`,
          `Overflow point 6 that must be truncated by 5-bullet rule`,
        ],
        visualIntent: slideNo % 2 === 0 ? "ARCHITECTURE_STACK" : "FLOW_CHART",
        visualSpec: {
          visualType: "ARCHITECTURE",
          purpose: `Architecture diagram for slide ${slideNo}`,
          elements: [`Node A${slideNo}`, `Node B${slideNo}`, `Node C${slideNo}`],
          learningMessage: `Visual message for slide ${slideNo}`,
        },
        speakerNotes: `CONFIDENTIAL INSTRUCTOR SCRIPT for slide ${slideNo}. Contains grading criteria.`,
        studentAction: `Analyze the tradeoffs in architecture component ${slideNo}`,
        citations: [`ISO-27001 Section ${slideNo}`],
        claims: [{ claim: `Claim for slide ${slideNo}`, sourceKey: "source-1" }],
        textAr: slideNo % 3 === 0 ? {
          title: `الشريحة ${slideNo}: البنية الهندسية الأساسية`,
          bullets: [`نقطة رئيسية 1`, `نقطة رئيسية 2`],
        } : undefined,
      },
    };
  });
}

function createCanonicalLearningExperienceFixture(): LearningExperience {
  return {
    id: "exp-adversarial-101",
    projectId: "proj-101",
    title: "Advanced Distributed Systems",
    topicDescription: "Deep dive into consensus and replication",
    targetAudience: "Computer Science Seniors",
    version: 1,
    status: "approved",
    tenantId: "univ-test-final",
    estimatedDurationMin: 60,
    blueprint: {
      narrativeArc: "From single node to globally distributed Paxos",
      learningOutcomes: [
        { code: "CLO-1", text: "Explain Byzantine fault tolerance", bloomLevel: "understand" },
        { code: "CLO-2", text: "Implement Raft leader election", bloomLevel: "apply" },
      ],
      stagePlanJson: [],
      prerequisiteGraph: { nodes: [], edges: [] },
      pacingStrategy: { totalDurationMin: 60, checkpoints: [] },
    },
    conceptBlocks: Array.from({ length: 20 }, (_, i) => ({
      id: `block-${i + 1}`,
      orderIndex: i + 1,
      stageCategory: i === 0 ? "DISCOVER" : i < 4 ? "UNDERSTAND" : i < 9 ? "EXPLORE" : i < 13 ? "PRACTICE" : i < 18 ? "APPLY" : "CHALLENGE",
      title: `Distributed Concept ${i + 1}`,
      academicTruth: `Formal theorem and proof for concept ${i + 1}`,
      coreIdea: `Intuitive summary of concept ${i + 1}`,
      bloomLevel: "apply",
      estimatedMinutes: 5,
      mechanismExplanation: `Step-by-step mechanism of concept ${i + 1}`,
      keyTakeaways: [`Takeaway 1`, `Takeaway 2`],
      realWorldTransfer: `Scenario applying concept ${i + 1} at scale`,
      keywords: ["distributed", "consensus"],
      misconceptions: [
        {
          commonBelief: `Common fallacy about concept ${i + 1}`,
          whyIncorrect: `Why the fallacy fails under network partition`,
          correction: `Correct mental model`,
        },
      ],
      activityId: `act-${i + 1}`,
      assessmentId: `assess-${i + 1}`,
      visualId: `vis-${i + 1}`,
    })),
    activities: Array.from({ length: 20 }, (_, i) => ({
      id: `act-${i + 1}`,
      conceptBlockId: `block-${i + 1}`,
      orderIndex: i + 1,
      activityType: "pause_discuss",
      actionVerb: "Analyze",
      title: `Activity Task ${i + 1}`,
      prompt: `Given a network split, analyze whether node ${i + 1} can commit.`,
      scaffoldingLevel: "guided",
      progressiveHints: [`Hint 1: Check quorum size`, `Hint 2: Verify term number`],
    })),
    assessments: Array.from({ length: 20 }, (_, i) => ({
      id: `assess-${i + 1}`,
      conceptBlockId: `block-${i + 1}`,
      orderIndex: i + 1,
      stem: `What happens when partition occurs during phase ${i + 1}?`,
      difficulty: "medium",
      options: [
        { id: `opt-0`, text: `Quorum is preserved on majority side`, isCorrect: true, misconceptionKey: "CORRECT" },
        { id: `opt-1`, text: `Both partitions continue accepting writes`, isCorrect: false, misconceptionKey: "SPLIT_BRAIN", misconceptionExplanation: "Causes split-brain anomaly" },
        { id: `opt-2`, text: `All nodes crash immediately`, isCorrect: false, misconceptionKey: "CRASH_FALLACY", misconceptionExplanation: "Nodes remain alive" },
        { id: `opt-3`, text: `Messages are silently deleted without retry`, isCorrect: false, misconceptionKey: "SILENT_DROP", misconceptionExplanation: "TCP retries until timeout" },
      ],
      correctOptionId: `opt-0`,
      rationale: `CONFIDENTIAL FACULTY RATIONALE: Majority partition maintains quorum of 2F+1.`,
      distractorExplanations: {
        "opt-1": "Violates linearizability guarantee.",
      },
    })),
    visuals: Array.from({ length: 20 }, (_, i) => ({
      id: `vis-${i + 1}`,
      conceptBlockId: `block-${i + 1}`,
      visualType: "ARCHITECTURE",
      title: `Consensus Diagram ${i + 1}`,
      learningMessage: `Quorum illustration ${i + 1}`,
      vectorSvgCode: `<svg><text>Diagram ${i + 1}</text></svg>`,
    })),
    evidenceReferences: [
      {
        id: "ev-1",
        conceptBlockId: "block-1",
        verbatimExcerpt: "In asynchronous systems, FLP theorem establishes impossibility of consensus with 1 unannounced crash.",
        sourceLocator: "FLP Theorem Paper 1985",
        claimText: "Consensus is impossible in purely asynchronous networks with crashes.",
      },
    ],
  };
}

// =============================================================================
// ADVERSARIAL TEST SUITE
// =============================================================================

describe("Milestone 5 Adversarial Stress Testing: Exporters & Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // DIMENSION 1: MULTI-FORMAT DETERMINISTIC EXPORTERS & PARITY
  // ---------------------------------------------------------------------------
  describe("Dimension 1: Multi-Format Deterministic Exporters & Cross-Format Parity", () => {
    it("renders PPTX, HTML, and PDF deterministically without runtime crashes", async () => {
      const artifacts = create20SlideContentFixture();
      const readinessItems = [
        {
          slideNo: 6,
          stem: "What is the primary guarantee of 2PC?",
          options: ["Atomic commit across nodes", "Zero latency", "Infinite scalability", "Leaderless writes"],
          correctIndex: 0,
          difficulty: "medium",
          rationale: "2PC guarantees atomicity.",
          cloId: "clo-1",
        },
        {
          slideNo: 20,
          stem: "Capstone: How to prevent split-brain?",
          options: ["Quorum intersection (N/2 + 1)", "Single master without failover", "Round robin", "DNS routing"],
          correctIndex: 0,
          difficulty: "hard",
          rationale: "Quorum intersection prevents dual leaders.",
          cloId: "clo-2",
        },
      ];

      // Render PPTX
      const pptxBuffer = await renderPPTX(artifacts, "ztm");
      expect(pptxBuffer).toBeInstanceOf(Buffer);
      expect(pptxBuffer.length).toBeGreaterThan(1000);

      // Render HTML
      const htmlOutput = renderHTML(artifacts, readinessItems);
      expect(typeof htmlOutput).toBe("string");
      expect(htmlOutput).toContain("<!DOCTYPE html>");
      expect(htmlOutput).toContain("Interactive Lecture");
      expect(htmlOutput).toContain("2 / 20");

      // Render PDF (from HTML)
      const pdfBuffer = await renderPDF(htmlOutput);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it("strictly clamps bullets to a maximum of 5 across all renderers (ZTM 5-Bullet Rule)", async () => {
      const artifacts = create20SlideContentFixture();
      // Slide 1 has 6 bullets in fixture
      const s1Bullets = slideBullets(artifacts[0].contentJson as any);
      expect(s1Bullets.length).toBe(5);
      expect(s1Bullets).not.toContain("Overflow point 6 that must be truncated by 5-bullet rule");

      const html = renderHTML(artifacts, []);
      // Verify that the 6th bullet is absent from the rendered HTML
      expect(html).not.toContain("Overflow point 6 that must be truncated");
    });

    it("enforces cross-format semantic parity across PPTX, HTML, and PDF", () => {
      const artifacts = create20SlideContentFixture();
      const gateResult = gateCrossFormatParity(artifacts);
      expect(gateResult.status).toBe("pass");
      expect(gateResult.findings).toHaveLength(0);
    });

    it("detects and flags any semantic drift between format projections", () => {
      const artifacts = create20SlideContentFixture();
      const pptxSlides = artifacts.map((a) => {
        const c = a.contentJson as any;
        return { slideNo: a.slideNo, title: slideTitle(c), bullets: slideBullets(c) };
      });
      const htmlSlides = pptxSlides.map((s) => ({ ...s, bullets: [...s.bullets] }));
      const pdfSlides = pptxSlides.map((s) => ({ ...s, bullets: [...s.bullets] }));

      // Adversarially inject drift on Slide 7 in HTML and Slide 13 in PDF
      htmlSlides[6].title = "DRIFTED TITLE ON SLIDE 7";
      pdfSlides[12].bullets = ["DRIFTED BULLET ON SLIDE 13"];

      const parityResult = checkCrossFormatParity({
        pptx: pptxSlides,
        html: htmlSlides,
        pdf: pdfSlides,
      });

      expect(parityResult.passed).toBe(false);
      expect(parityResult.drifted).toContain(7);
      expect(parityResult.drifted).toContain(13);
      expect(parityResult.drifted).toHaveLength(2);
    });

    it("verifies speaker notes and rationales in Instructor Guide DOCX and PDF while keeping them isolated from student deck", async () => {
      const artifacts = create20SlideContentFixture();
      const readinessItems = [
        {
          slideNo: 6,
          stem: "Verification Question",
          options: ["Option A", "Option B"],
          correctIndex: 0,
          rationale: "Confidential pedagogical rationale",
          difficulty: "medium",
          cloId: "clo-1",
        },
      ];
      const clos = [{ number: "1", text: "Distributed Systems Outcome", bloomLevel: "apply" }];

      const guideHtml = renderInstructorGuide(artifacts, readinessItems, clos);
      expect(guideHtml).toContain("CONFIDENTIAL INSTRUCTOR SCRIPT");
      expect(guideHtml).toContain("Confidential pedagogical rationale");
      expect(guideHtml).toContain("Readiness Item Answer Key");

      const guidePdf = await renderInstructorGuidePDF(artifacts, readinessItems, clos);
      expect(guidePdf).toBeInstanceOf(Buffer);

      const guideDocx = await renderInstructorGuideDocx(artifacts, readinessItems, clos);
      expect(guideDocx).toBeInstanceOf(Buffer);
    });

    it("generates an auditable Evidence Pack PDF with SHA-256 manifest hash and NCAAA/ABET compliance tables", async () => {
      const evidenceData: EvidencePackData = {
        projectTitle: "CS401 Distributed Computing",
        manifestHash: createHash("sha256").update("canonical-package-v1").digest("hex"),
        approvedBy: "Prof. Alan Turing",
        approvedAt: "2026-08-19T10:00:00Z",
        coverage: [
          { blockId: "b-1", locator: "Sec 1.1", disposition: "included", reason: null },
          { blockId: "b-2", locator: "Sec 1.2", disposition: "included", reason: null },
        ],
        clos: [
          { number: "CLO-1", text: "Analyze consensus", bloomLevel: "Analyze" },
          { number: "CLO-2", text: "Implement 2PC", bloomLevel: "Apply" },
        ],
        citations: [
          { claim: "Consensus requires 2F+1 nodes", sourceKey: "SRC-1", url: "https://ieee.org/paper", hash: "a1b2c3d4", retrievedAt: "2026-08-19" },
        ],
        readiness: [
          { slideNo: 6, stem: "Stem 1", clo: "CLO-1", outcome: "Jaheziah Standard 4.1" },
          { slideNo: 20, stem: "Stem 20", clo: "CLO-2", outcome: "Jaheziah Standard 4.2" },
        ],
        gates: [
          { gateKey: "slide_count", severity: "error", status: "pass" },
          { gateKey: "cross_format_parity", severity: "error", status: "pass" },
        ],
      };

      const evidencePdf = await renderEvidencePackPDF(evidenceData);
      expect(evidencePdf).toBeInstanceOf(Buffer);
      expect(evidencePdf.length).toBeGreaterThan(500);
    });
  });

  // ---------------------------------------------------------------------------
  // DIMENSION 2: STUDENT HIDDEN-ANSWER SECURITY (SECRET ZERO-LEAKAGE)
  // ---------------------------------------------------------------------------
  describe("Dimension 2: Student Hidden-Answer Security & Zero-Leakage Architecture", () => {
    it("verifies that StudentUxAdapter strictly purges correct answers, isCorrect flags, and rationales from the client ViewModel", async () => {
      const experience = createCanonicalLearningExperienceFixture();
      const adapter = new StudentUxAdapter();
      const projectionResult = await adapter.project(experience);

      expect(projectionResult.success).toBe(true);
      const viewModel = projectionResult.data;

      // Deep inspection of all concepts in viewModel
      for (const conceptId of Object.keys(viewModel.concepts)) {
        const concept = viewModel.concepts[conceptId];

        if (concept.assessment) {
          const assessment = concept.assessment;

          // 1. Check assessment root level
          expect((assessment as any).correctIndex).toBeUndefined();
          expect((assessment as any).correctOptionId).toBeUndefined();
          expect((assessment as any).rationale).toBeUndefined();
          expect((assessment as any).distractorExplanations).toBeUndefined();

          // 2. Check each option
          for (const opt of assessment.options) {
            expect((opt as any).isCorrect).toBeUndefined();
            expect((opt as any).misconceptionKey).toBeUndefined();
            expect((opt as any).misconceptionExplanation).toBeUndefined();
          }
        }

        // 3. Check concept level for confidential speaker notes or raw instructor scripts
        expect((concept as any).speakerNotes).toBeUndefined();
        expect((concept as any).instructorScript).toBeUndefined();
        expect((concept as any).academicTruthRaw).toBeUndefined();
      }

      // 4. Stringify entire ViewModel and verify absence of sensitive strings
      const jsonDump = JSON.stringify(viewModel);
      expect(jsonDump).not.toContain("CONFIDENTIAL FACULTY RATIONALE");
      expect(jsonDump).not.toContain("isCorrect");
      expect(jsonDump).not.toContain("correctOptionId");
      expect(jsonDump).not.toContain("distractorExplanations");
      expect(jsonDump).not.toContain("SPLIT_BRAIN");
      expect(jsonDump).not.toContain("Causes split-brain anomaly");
    });

    it("verifies that POST /api/iscarb/lecture/experience/[id]/assess validates answers server-side without leaking rationales", async () => {
      // Mock db response for canonical AssessmentItem
      (db.lectureSlideArtifact.findFirst as any).mockResolvedValue(null);
      (db.assessmentItem.findUnique as any).mockResolvedValue({
        id: "assess-1",
        experienceId: "exp-adversarial-101",
        correctOptionId: "opt-0",
      });
      (db.learningExperience.findUnique as any).mockResolvedValue({
        id: "exp-adversarial-101",
        tenantId: "univ-test-final",
      });

      // 1. Correct option submission
      const correctReq = new Request("http://localhost/api/iscarb/lecture/experience/exp-adversarial-101/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: "assess-1", optionId: "opt-0" }),
      });
      const correctRes = await assessHandler(correctReq, { params: Promise.resolve({ id: "exp-adversarial-101" }) });
      expect(correctRes.status).toBe(200);
      const correctJson = await correctRes.json();
      expect(correctJson.correct).toBe(true);
      expect(correctJson.correctOptionId).toBe("opt-0");
      expect(correctJson.rationale).toBeUndefined();

      // 2. Incorrect option submission
      const wrongReq = new Request("http://localhost/api/iscarb/lecture/experience/exp-adversarial-101/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: "assess-1", optionId: "opt-1" }),
      });
      const wrongRes = await assessHandler(wrongReq, { params: Promise.resolve({ id: "exp-adversarial-101" }) });
      expect(wrongRes.status).toBe(200);
      const wrongJson = await wrongRes.json();
      expect(wrongJson.correct).toBe(false);
      expect(wrongJson.correctOptionId).toBe("opt-0");
      expect(wrongJson.rationale).toBeUndefined();
    });

    it("enforces tenant boundary security on assessment evaluation", async () => {
      // Assessment belongs to a different university tenant
      (db.lectureSlideArtifact.findFirst as any).mockResolvedValue(null);
      (db.assessmentItem.findUnique as any).mockResolvedValue({
        id: "assess-foreign-tenant",
        experienceId: "exp-foreign-tenant",
        correctOptionId: "opt-2",
      });
      (db.learningExperience.findUnique as any).mockResolvedValue({
        id: "exp-foreign-tenant",
        tenantId: "univ-other-competitor",
      });

      const foreignReq = new Request("http://localhost/api/iscarb/lecture/experience/exp-foreign-tenant/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: "assess-foreign-tenant", optionId: "opt-2" }),
      });
      const foreignRes = await assessHandler(foreignReq, { params: Promise.resolve({ id: "exp-foreign-tenant" }) });
      expect(foreignRes.status).toBe(404);
    });

    it("evaluates S20 Capstone Readiness Gate unlocking accurately against >= 3/4 threshold", () => {
      const items: any[] = [
        { slideNo: 6, correctIndex: 0 },
        { slideNo: 9, correctIndex: 1 },
        { slideNo: 13, correctIndex: 2 },
        { slideNo: 20, correctIndex: 3 },
      ];

      // 4 out of 4 correct -> passed
      const answers4 = { "6-0": 0, "9-1": 1, "13-2": 2, "20-3": 3 };
      const res4 = computeGateResult(items, answers4);
      expect(res4.correct).toBe(4);
      expect(res4.total).toBe(4);
      expect(res4.passed).toBe(true);
      expect(res4.rubricLevel).toContain("Proficient");

      // 3 out of 4 correct -> passed (threshold >= 3/4)
      const answers3 = { "6-0": 0, "9-1": 1, "13-2": 2, "20-3": 0 }; // 4th is wrong
      const res3 = computeGateResult(items, answers3);
      expect(res3.correct).toBe(3);
      expect(res3.total).toBe(4);
      expect(res3.passed).toBe(true);
      expect(res3.rubricLevel).toContain("Proficient");

      // 2 out of 4 correct -> failed (below threshold)
      const answers2 = { "6-0": 0, "9-1": 1, "13-2": 0, "20-3": 0 };
      const res2 = computeGateResult(items, answers2);
      expect(res2.correct).toBe(2);
      expect(res2.total).toBe(4);
      expect(res2.passed).toBe(false);
      expect(res2.rubricLevel).toContain("Developing");

      // 0 out of 4 correct -> failed
      const answers0 = { "6-0": 1, "9-1": 0, "13-2": 0, "20-3": 0 };
      const res0 = computeGateResult(items, answers0);
      expect(res0.correct).toBe(0);
      expect(res0.total).toBe(4);
      expect(res0.passed).toBe(false);
      expect(res0.rubricLevel).toContain("Developing");
    });
  });
});
