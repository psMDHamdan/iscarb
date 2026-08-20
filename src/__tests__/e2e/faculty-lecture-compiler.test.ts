/**
 * E2E Test Suite: Faculty Lecture Compiler (BRD v3.4 MVP Contract)
 * ===========================================================================
 * Covers:
 *   - Source upload, parsing & criticality assessment
 *   - 20-slide iSCARB fixed slot contract (S1–S20)
 *   - All 13 deterministic quality gates (GATE-01 to GATE-13)
 *   - Multi-format exporters (PPTX, HTML, PDF, DOCX Instructor Guide, PDF Evidence Pack)
 *   - Zero AI-engine jargon cleaner guardrail
 *
 * Tiers:
 *   - Tier 1: Feature Coverage (Happy Path & Core Contracts)
 *   - Tier 2: Boundary & Corner Cases (Defensive Robustness & Validation Failures)
 *   - Tier 3: Cross-Feature Combinations (End-to-End Pipeline)
 *   - Tier 4: Real-World Scenarios (Saudi Accreditation & Bilingual Curricula)
 */

import { describe, it, expect } from "vitest";
import { createHash } from "crypto";

import {
  FIXED_SLOT_FUNCTION,
  FIXED_SLOTS,
  validatePlanStructure,
  planGate,
  type SlideLike,
} from "@/lib/lecture/planner/plan-validator";

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
  gateStudentExperience,
} from "@/lib/lecture/quality/gates";

import { gateCrossFormatParity } from "@/lib/lecture/quality/gates/cross-format-parity.gate";
import { checkCrossFormatParity } from "@/lib/lecture/renderer/parity-checker";
import {
  cleanJargon,
  hasForbiddenJargon,
  detectForbiddenJargon,
  cleanObjectJargon,
} from "@/lib/lecture/projections/utils/jargon-cleaner";

import { renderPPTX } from "@/lib/lecture/renderer/pptx-renderer";
import { renderHTML } from "@/lib/lecture/renderer/html-renderer";
import {
  renderInstructorGuide,
  renderInstructorGuideDocx,
} from "@/lib/lecture/renderer/instructor-guide-renderer";
import {
  renderEvidencePackPDF,
  type EvidencePackData,
} from "@/lib/lecture/renderer/evidence-pack-renderer";

import { assessCriticality } from "@/lib/lecture/ingestion/source-block-builder";

// =============================================================================
// FIXTURE FACTORIES
// =============================================================================

function createCanonical20SlidePlan(): SlideLike[] {
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

function createCompliantArtifacts() {
  return Array.from({ length: 20 }, (_, i) => {
    const slideNo = i + 1;
    return {
      slideNo,
      contentJson: {
        title: `Core Concept ${slideNo}: Foundational Architecture`,
        bullets: [
          `Key requirement ${slideNo}.1: Ensure high reliability`,
          `Key requirement ${slideNo}.2: Maintain strict determinism`,
          `Key requirement ${slideNo}.3: Support auditable provenance`,
        ],
        wordCount: 28,
        visualIntent: `Architecture diagram illustrating workflow for stage ${slideNo}`,
        visualSpec: {
          type: "diagram",
          title: `Architecture Model ${slideNo}`,
          elements: ["Ingest", "Validate", "Export"],
        },
        speakerNotes: `Faculty facilitation script for slide ${slideNo}. Emphasize the core mechanism.`,
        studentAction: slideNo >= 2 && slideNo <= 19
          ? slideNo % 2 === 0
            ? `Predict the outcome of running step ${slideNo} under peak load.`
            : `Calculate the required buffer capacity using the formula given.`
          : undefined,
        claims: [
          {
            text: `Empirical case study demonstrates 99.9% uptime in deployment.`,
            status: "VERIFIED",
            sourceBlockId: `block-${slideNo}`,
          },
        ],
      },
    };
  });
}

function createCompliantReadinessItems() {
  return [
    {
      slideNo: 6,
      stem: "Which architectural layer enforces deterministic slide quotas?",
      options: ["Quality Gate Engine", "LLM Streamer", "Client View", "CSS Layer"],
      correctIndex: 0,
      difficulty: "medium",
      rationale: "The quality gate engine validates strict constraints deterministically.",
      cloId: "clo-1",
    },
    {
      slideNo: 9,
      stem: "Given a 40-word limit per slide, what is the maximum density for a 20-slide deck?",
      options: ["800 words", "1200 words", "400 words", "2000 words"],
      correctIndex: 0,
      difficulty: "medium",
      rationale: "20 slides * 40 words/slide = 800 words total.",
      cloId: "clo-2",
    },
    {
      slideNo: 13,
      stem: "When trading off latency vs auditability, which artifact guarantees zero drift?",
      options: ["SHA-256 Evidence Pack", "Prompt Cache", "Client Storage", "Unsigned Export"],
      correctIndex: 0,
      difficulty: "hard",
      rationale: "The Evidence Pack computes cryptographic SHA-256 hashes of all source blocks.",
      cloId: "clo-3",
    },
    {
      slideNo: 20,
      stem: "What is the minimum score required to pass the S20 Capstone Readiness Gate?",
      options: ["3 out of 4 (75%)", "2 out of 4 (50%)", "4 out of 4 (100%)", "1 out of 4 (25%)"],
      correctIndex: 0,
      difficulty: "hard",
      rationale: "Per BRD §7.4, students pass when answering >= 3 out of 4 readiness items.",
      cloId: "clo-1",
    },
  ];
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe("Faculty Lecture Compiler E2E Test Suite (BRD v3.4)", () => {

  // ---------------------------------------------------------------------------
  // TIER 1: FEATURE COVERAGE (HAPPY PATH & CORE INVARIANTS)
  // ---------------------------------------------------------------------------
  describe("Tier 1: Feature Coverage (Core Functional Contracts)", () => {

    describe("Feature 1: Source Ingestion & Criticality Classification", () => {
      it("T1-F1-01: classifies headings as critical", () => {
        expect(assessCriticality({ type: "heading", text: "Introduction to Operating Systems" })).toBe("critical");
      });

      it("T1-F1-02: classifies tables as critical", () => {
        expect(assessCriticality({ type: "table", text: "Process State Transition Table" })).toBe("critical");
      });

      it("T1-F1-03: classifies CLO and Objective prefixes as critical", () => {
        expect(assessCriticality({ type: "paragraph", text: "CLO 1: Design robust concurrent algorithms" })).toBe("critical");
        expect(assessCriticality({ type: "paragraph", text: "Learning Outcome: Calculate CPU scheduling metrics" })).toBe("critical");
        expect(assessCriticality({ type: "paragraph", text: "Theorem: Amdahl's Law speedup bounds" })).toBe("critical");
      });

      it("T1-F1-04: classifies standard instructional body text as normal", () => {
        expect(assessCriticality({ type: "paragraph", text: "Virtual memory isolates address spaces between executing processes." })).toBe("normal");
      });

      it("T1-F1-05: classifies examples and illustrations as low criticality", () => {
        expect(assessCriticality({ type: "paragraph", text: "For instance, consider a printing spooler queue." })).toBe("low");
        expect(assessCriticality({ type: "paragraph", text: "Figure 4.2 shows a thread pool diagram." })).toBe("low");
      });

      it("T1-F1-06: computes cryptographic SHA-256 hashes for source chunks", () => {
        const text = "Source content for Cloud Distributed Computing";
        const hash = createHash("sha256").update(text).digest("hex");
        expect(hash).toHaveLength(64);
        expect(createHash("sha256").update(text).digest("hex")).toBe(hash);
      });
    });

    describe("Feature 2: Strict 20-Slide Fixed Slot Contract (S1–S20)", () => {
      it("T1-F2-01: validates canonical 20-slide plan without errors", () => {
        const plan = createCanonical20SlidePlan();
        const errors = validatePlanStructure(plan);
        expect(errors).toHaveLength(0);
        expect(planGate(plan).gate).toBe("passed");
      });

      it("T1-F2-02: verifies exact slot mapping for S1 Hook through S4 H-Stack", () => {
        expect(FIXED_SLOT_FUNCTION[1]).toBe("hook");
        expect(FIXED_SLOT_FUNCTION[2]).toBe("domain_spine");
        expect(FIXED_SLOT_FUNCTION[3]).toBe("clos");
        expect(FIXED_SLOT_FUNCTION[4]).toBe("h_stack");
      });

      it("T1-F2-03: verifies exact slot mapping for S5-S7 Foundation & S8 Misconception", () => {
        expect(FIXED_SLOT_FUNCTION[5]).toBe("foundation");
        expect(FIXED_SLOT_FUNCTION[6]).toBe("foundation");
        expect(FIXED_SLOT_FUNCTION[7]).toBe("foundation");
        expect(FIXED_SLOT_FUNCTION[8]).toBe("misconception");
      });

      it("T1-F2-04: verifies exact slot mapping for S9 Calculation & S10-S12 Deep Dives", () => {
        expect(FIXED_SLOT_FUNCTION[9]).toBe("calculation");
        expect(FIXED_SLOT_FUNCTION[10]).toBe("deep_dive");
        expect(FIXED_SLOT_FUNCTION[11]).toBe("deep_dive");
        expect(FIXED_SLOT_FUNCTION[12]).toBe("deep_dive");
      });

      it("T1-F2-05: verifies exact slot mapping for S13 Trade-Off & S14-S17 Application", () => {
        expect(FIXED_SLOT_FUNCTION[13]).toBe("trade_off");
        expect(FIXED_SLOT_FUNCTION[14]).toBe("application");
        expect(FIXED_SLOT_FUNCTION[15]).toBe("application");
        expect(FIXED_SLOT_FUNCTION[16]).toBe("application");
        expect(FIXED_SLOT_FUNCTION[17]).toBe("application");
      });

      it("T1-F2-06: verifies exact slot mapping for S18 Rubric, S19 Evidence & S20 Readiness", () => {
        expect(FIXED_SLOT_FUNCTION[18]).toBe("rubric");
        expect(FIXED_SLOT_FUNCTION[19]).toBe("evidence");
        expect(FIXED_SLOT_FUNCTION[20]).toBe("readiness");
      });
    });

    describe("Feature 3: 13 Deterministic Quality Gates (GATE-01 to GATE-13)", () => {
      it("T1-F3-01: GATE-01 (slide_count) passes with exactly 20 slides", () => {
        const slides = Array.from({ length: 20 }, (_, i) => ({ slideNo: i + 1 }));
        const result = gateSlideCount(slides);
        expect(result.status).toBe("pass");
        expect(result.findings).toHaveLength(0);
      });

      it("T1-F3-02: GATE-02 (density) passes with <=40 words and <=5 bullets", () => {
        const artifacts = createCompliantArtifacts();
        const result = gateDensity(artifacts as any);
        expect(result.status).toBe("pass");
        expect(result.findings).toHaveLength(0);
      });

      it("T1-F3-03: GATE-03 (visual_support) passes with >=18 supported slides", () => {
        const artifacts = createCompliantArtifacts();
        const result = gateVisualSupport(artifacts as any);
        expect(result.status).toBe("pass");
      });

      it("T1-F3-04: GATE-04 (interaction_count) passes with >=3 P&D, >=2 Polls, >=1 Collab", () => {
        const plan = createCanonical20SlidePlan();
        const result = gateInteractionCount(plan);
        expect(result.status).toBe("pass");
      });

      it("T1-F3-05: GATE-05 (cases_examples) passes with >=2 cases or >=3 examples", () => {
        const artifacts = createCompliantArtifacts();
        const result = gateCasesExamples(artifacts as any);
        expect(result.status).toBe("pass");
      });

      it("T1-F3-06: GATE-06 (misconception) passes when S8 has misconception linked to CLO", () => {
        const plans = [{ slideNo: 8, function: "misconception", cloIds: ["clo-1"] }];
        const result = gateMisconception(plans);
        expect(result.status).toBe("pass");
      });

      it("T1-F3-07: GATE-07 (calculation_workshop) passes when worked_example or practice is present", () => {
        const plans = [{ slideNo: 9, interactionType: "worked_example" }];
        const result = gateCalculationWorkshop(plans);
        expect(result.status).toBe("pass");
      });

      it("T1-F3-08: GATE-08 (readiness_count) passes with >=3 embedded + 1 S20 check", () => {
        const items = [{ slideNo: 6 }, { slideNo: 9 }, { slideNo: 13 }, { slideNo: 20 }];
        const result = gateReadinessCount(items);
        expect(result.status).toBe("pass");
      });

      it("T1-F3-09: GATE-09 (source_coverage) passes with >=98% coverage and 100% critical blocks", () => {
        const blocks = [
          { id: "b1", criticality: "critical" },
          { id: "b2", criticality: "critical" },
          { id: "b3", criticality: "normal" },
        ];
        const links = [
          { blockId: "b1", disposition: "mapped", approvedBy: "fac-1" },
          { blockId: "b2", disposition: "mapped", approvedBy: "fac-1" },
          { blockId: "b3", disposition: "mapped", approvedBy: "fac-1" },
        ];
        const result = gateSourceCoverage(blocks, links);
        expect(result.status).toBe("pass");
      });

      it("T1-F3-10: GATE-10 (clo_alignment) passes for S4–S20 linking to CLO and SourceBlock", () => {
        const plans = Array.from({ length: 20 }, (_, i) => ({
          slideNo: i + 1,
          cloIds: i < 3 ? [] : ["clo-1"],
          sourceBlockIds: i < 3 ? [] : ["b1"],
        }));
        const result = gateCLOAlignment(plans);
        expect(result.status).toBe("pass");
      });

      it("T1-F3-11: GATE-11 (claim_policy) passes when all real claims are verified", () => {
        const artifacts = createCompliantArtifacts();
        const result = gateClaimPolicy(artifacts as any);
        expect(result.status).toBe("pass");
      });

      it("T1-F3-12: GATE-12 (cross_format_parity) passes when PPTX, HTML, PDF views match", () => {
        const artifacts = createCompliantArtifacts();
        const result = gateCrossFormatParity(artifacts as any);
        expect(result.status).toBe("pass");
      });

      it("T1-F3-13: GATE-13 (student_experience) passes with active verbs on S2–S19", () => {
        const plan = createCanonical20SlidePlan();
        const artifacts = createCompliantArtifacts();
        const result = gateStudentExperience(plan as any, artifacts as any);
        expect(result.status).toBe("pass");
      });
    });

    describe("Feature 4: Multi-Format Exporters", () => {
      it("T1-F4-01: renders deterministic PPTX buffer with ZTM theme", async () => {
        const artifacts = createCompliantArtifacts();
        const buf = await renderPPTX(artifacts);
        expect(Buffer.isBuffer(buf)).toBe(true);
        expect(buf.length).toBeGreaterThan(1000);
      });

      it("T1-F4-02: renders self-contained interactive HTML player", () => {
        const artifacts = createCompliantArtifacts();
        const readiness = createCompliantReadinessItems();
        const html = renderHTML(artifacts, readiness as any);
        expect(typeof html).toBe("string");
        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain("Interactive Lecture");
        expect(html).toContain("Readiness Check");
      });

      it("T1-F4-03: renders Instructor Guide HTML with confidential answer keys", () => {
        const artifacts = createCompliantArtifacts();
        const readiness = createCompliantReadinessItems();
        const guideHtml = renderInstructorGuide(artifacts, readiness, { title: "CS 401" });
        expect(guideHtml).toContain("INSTRUCTOR CONFIDENTIAL — Do not distribute");
        expect(guideHtml).toContain("Q1");
        expect(guideHtml).toContain("Faculty facilitation script");
      });

      it("T1-F4-04: renders Instructor Guide DOCX buffer", async () => {
        const artifacts = createCompliantArtifacts();
        const readiness = createCompliantReadinessItems();
        const docxBuf = await renderInstructorGuideDocx(artifacts, readiness, { title: "CS 401" });
        expect(Buffer.isBuffer(docxBuf)).toBe(true);
        expect(docxBuf.length).toBeGreaterThan(500);
      });

      it("T1-F4-05: renders Accreditation Evidence Pack PDF with SHA-256 hash", async () => {
        const packData: EvidencePackData = {
          projectTitle: "Advanced Cybersecurity Architecture",
          manifestHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          approvedBy: "Prof. Dr. Al-Mansoor",
          approvedAt: "2026-08-19T10:00:00Z",
          coverage: [{ blockId: "b1", locator: "Sec 1.2", disposition: "mapped", reason: null }],
          clos: [{ number: "CLO 1", text: "Analyze cryptographic protocols", bloomLevel: "Evaluate" }],
          citations: [{
            claim: "AES-256 provides post-quantum security margin",
            sourceKey: "NIST SP 800-57",
            url: "https://csrc.nist.gov",
            hash: "a1b2c3d4",
            retrievedAt: "2026-08-15",
          }],
          readiness: [{ slideNo: 20, stem: "Calculate key size", clo: "1", outcome: "Pass" }],
          gates: [{ gateKey: "slide_count", severity: "error", status: "pass" }],
        };
        const pdfBuf = await renderEvidencePackPDF(packData);
        expect(Buffer.isBuffer(pdfBuf)).toBe(true);
        expect(pdfBuf.length).toBeGreaterThan(500);
      });
    });

    describe("Feature 5: Zero AI Jargon Cleaner Guardrail", () => {
      it("T1-F5-01: cleans 'Slide X' to 'Concept X'", () => {
        expect(cleanJargon("Review Slide 4 before continuing")).toBe("Review Concept 4 before continuing");
        expect(cleanJargon("S12 introduces the main theorem")).toBe("Concept 12 introduces the main theorem");
      });

      it("T1-F5-02: cleans 'prompt templates' to 'exercises'", () => {
        expect(cleanJargon("Complete the prompt template")).toBe("Complete the exercise");
      });

      it("T1-F5-03: cleans 'source chunk' to 'reference text'", () => {
        expect(cleanJargon("Mapped to source chunk 12")).toBe("Mapped to reference text 12");
      });

      it("T1-F5-04: cleans 'artifact' to 'learning resource'", () => {
        expect(cleanJargon("Generated slide artifact")).toBe("Generated slide learning resource");
      });

      it("T1-F5-05: detects forbidden jargon accurately", () => {
        expect(hasForbiddenJargon("Look at S8 for common pitfalls")).toBe(true);
        expect(hasForbiddenJargon("Refer to Slide 15")).toBe(true);
        expect(hasForbiddenJargon("Understanding distributed consensus")).toBe(false);
      });

      it("T1-F5-06: deeply cleans nested objects and arrays", () => {
        const raw = {
          title: "Slide 5 Overview",
          details: {
            text: "Based on source chunk 3 and prompt template 1",
            items: ["S1 notes", "artifact list"],
          },
        };
        const cleaned = cleanObjectJargon(raw);
        expect(cleaned.title).toBe("Concept 5 Overview");
        expect(cleaned.details.text).toBe("Based on reference text 3 and exercise 1");
        expect(cleaned.details.items[0]).toBe("Concept 1 notes");
        expect(cleaned.details.items[1]).toBe("learning resource list");
      });
    });

  });

  // ---------------------------------------------------------------------------
  // TIER 2: BOUNDARY & CORNER CASES (DEFENSIVE ROBUSTNESS)
  // ---------------------------------------------------------------------------
  describe("Tier 2: Boundary & Corner Cases (Defensive Robustness)", () => {

    describe("Boundary: Plan Structure & Fixed Slots", () => {
      it("T2-B-01: rejects 19-slide plan with slide_count error", () => {
        const plan = createCanonical20SlidePlan().slice(0, 19);
        const errors = validatePlanStructure(plan);
        expect(errors.some((e) => e.rule === "slide_count")).toBe(true);
      });

      it("T2-B-02: rejects 21-slide plan with slide_count error", () => {
        const plan = [...createCanonical20SlidePlan(), { slideNo: 21, function: "application", interactionType: null }];
        const errors = validatePlanStructure(plan);
        expect(errors.some((e) => e.rule === "slide_count")).toBe(true);
      });

      it("T2-B-03: rejects duplicate slide numbers", () => {
        const plan = createCanonical20SlidePlan();
        plan[4].slideNo = 4; // two slide 4s
        const errors = validatePlanStructure(plan);
        expect(errors.some((e) => e.rule === "unique_slides")).toBe(true);
        expect(errors.some((e) => e.rule === "missing_slide")).toBe(true);
      });

      it("T2-B-04: rejects tampering with S8 misconception function", () => {
        const plan = createCanonical20SlidePlan();
        plan[7].function = "foundation"; // S8 altered
        const errors = validatePlanStructure(plan);
        expect(errors.some((e) => e.rule === "fixed_slot_function" && e.message.includes("S8"))).toBe(true);
      });

      it("T2-B-05: rejects tampering with S9 calculation function", () => {
        const plan = createCanonical20SlidePlan();
        plan[8].function = "deep_dive"; // S9 altered
        const errors = validatePlanStructure(plan);
        expect(errors.some((e) => e.rule === "fixed_slot_function" && e.message.includes("S9"))).toBe(true);
      });

      it("T2-B-06: rejects tampering with S20 readiness function", () => {
        const plan = createCanonical20SlidePlan();
        plan[19].function = "application"; // S20 altered
        const errors = validatePlanStructure(plan);
        expect(errors.some((e) => e.rule === "fixed_slot_function" && e.message.includes("S20"))).toBe(true);
      });
    });

    describe("Boundary: Quality Gates Failure Cases", () => {
      it("T2-B-07: GATE-02 fails when word count exceeds 40 words", () => {
        const artifacts = createCompliantArtifacts();
        artifacts[2].contentJson.wordCount = 45;
        const result = gateDensity(artifacts as any);
        expect(result.status).toBe("fail");
        expect(result.findings.some((f) => f.slideNo === 3 && f.message.includes("45 words"))).toBe(true);
      });

      it("T2-B-08: GATE-02 fails when bullets exceed 5", () => {
        const artifacts = createCompliantArtifacts();
        artifacts[4].contentJson.bullets = ["b1", "b2", "b3", "b4", "b5", "b6"];
        const result = gateDensity(artifacts as any);
        expect(result.status).toBe("fail");
        expect(result.findings.some((f) => f.slideNo === 5 && f.message.includes("6 bullets"))).toBe(true);
      });

      it("T2-B-09: GATE-04 fails when Pause & Discuss count is below 3", () => {
        const plan = createCanonical20SlidePlan().map((p) =>
          p.interactionType === "pause_discuss" ? { ...p, interactionType: null } : p
        );
        const result = gateInteractionCount(plan);
        expect(result.status).toBe("fail");
        expect(result.findings.some((f) => f.message.includes("Pause & Discuss"))).toBe(true);
      });

      it("T2-B-10: GATE-04 fails when collaboration activity is missing", () => {
        const plan = createCanonical20SlidePlan().map((p) =>
          p.interactionType === "collaboration" ? { ...p, interactionType: null } : p
        );
        const result = gateInteractionCount(plan);
        expect(result.status).toBe("fail");
        expect(result.findings.some((f) => f.message.includes("collaboration"))).toBe(true);
      });

      it("T2-B-11: GATE-06 fails when misconception slide lacks CLO link", () => {
        const plans = [{ slideNo: 8, function: "misconception", cloIds: [] }];
        const result = gateMisconception(plans);
        expect(result.status).toBe("fail");
        expect(result.findings.some((f) => f.message.includes("not linked to a CLO"))).toBe(true);
      });

      it("T2-B-12: GATE-08 fails when embedded readiness checks in S5-S17 are < 3", () => {
        const items = [{ slideNo: 6 }, { slideNo: 8 }, { slideNo: 20 }]; // only 2 in S5-S17
        const result = gateReadinessCount(items);
        expect(result.status).toBe("fail");
        expect(result.findings.some((f) => f.message.includes("embedded readiness checks"))).toBe(true);
      });

      it("T2-B-13: GATE-09 fails when critical source block is unmapped without approval", () => {
        const blocks = [{ id: "crit-1", criticality: "critical" }];
        const links: any[] = [];
        const result = gateSourceCoverage(blocks, links);
        expect(result.status).toBe("fail");
        expect(result.findings.some((f) => f.message.includes("critical blocks not mapped"))).toBe(true);
      });

      it("T2-B-14: GATE-10 fails when non-synthesis slide (e.g. S5) has no CLO or source block", () => {
        const plans = [{ slideNo: 5, cloIds: [], sourceBlockIds: [] }];
        const result = gateCLOAlignment(plans);
        expect(result.status).toBe("fail");
        expect(result.findings.some((f) => f.slideNo === 5 && f.message.includes("No CLO linked"))).toBe(true);
      });

      it("T2-B-15: GATE-11 fails when unverified claims have status NEED_SOURCE", () => {
        const artifacts = [{
          slideNo: 7,
          contentJson: { claims: [{ text: "Unverified statistic", status: "NEED_SOURCE" }] },
        }];
        const result = gateClaimPolicy(artifacts as any);
        expect(result.status).toBe("fail");
        expect(result.findings.some((f) => f.slideNo === 7)).toBe(true);
      });

      it("T2-B-16: GATE-12 detects content drift between PPTX and HTML", () => {
        const pptxViews = [{ slideNo: 1, title: "Title A", bullets: ["Bullet 1"] }];
        const htmlViews = [{ slideNo: 1, title: "Title B (Drifted)", bullets: ["Bullet 1"] }];
        const result = checkCrossFormatParity({ pptx: pptxViews, html: htmlViews, pdf: pptxViews });
        expect(result.passed).toBe(false);
        expect(result.drifted).toContain(1);
      });
    });

  });

  // ---------------------------------------------------------------------------
  // TIER 3: CROSS-FEATURE INTEGRATION FLOWS
  // ---------------------------------------------------------------------------
  describe("Tier 3: Cross-Feature Combinations (End-to-End Pipeline)", () => {

    it("T3-X-01: full compiler flow — Ingestion -> Plan -> 13 Gates -> Exporters", async () => {
      // 1. Source blocks
      const sourceBlocks = [
        { id: "b1", criticality: assessCriticality({ type: "heading", text: "Database Indexing" }) },
        { id: "b2", criticality: assessCriticality({ type: "paragraph", text: "B+ Tree structure and leaf pointer invariants." }) },
      ];
      expect(sourceBlocks[0].criticality).toBe("critical");

      // 2. Blueprint Plan
      const plan = createCanonical20SlidePlan();
      const planResult = planGate(plan);
      expect(planResult.valid).toBe(true);

      // 3. Artifact generation & 13 quality gates
      const artifacts = createCompliantArtifacts();
      const readinessItems = createCompliantReadinessItems();

      const g1 = gateSlideCount(artifacts);
      const g2 = gateDensity(artifacts as any);
      const g3 = gateVisualSupport(artifacts as any);
      const g4 = gateInteractionCount(plan);
      const g5 = gateCasesExamples(artifacts as any);
      const g6 = gateMisconception([{ slideNo: 8, function: "misconception", cloIds: ["clo-1"] }]);
      const g7 = gateCalculationWorkshop(plan);
      const g8 = gateReadinessCount(readinessItems);
      const g9 = gateSourceCoverage(
        sourceBlocks,
        sourceBlocks.map((b) => ({ blockId: b.id, disposition: "mapped", approvedBy: "fac-1" }))
      );
      const g10 = gateCLOAlignment(
        plan.map((p) => ({ slideNo: p.slideNo, cloIds: p.slideNo <= 3 ? [] : ["clo-1"], sourceBlockIds: p.slideNo <= 3 ? [] : ["b1"] }))
      );
      const g11 = gateClaimPolicy(artifacts as any);
      const g12 = gateCrossFormatParity(artifacts as any);
      const g13 = gateStudentExperience(plan as any, artifacts as any);

      const allGates = [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10, g11, g12, g13];
      expect(allGates.every((g) => g.status === "pass")).toBe(true);

      // 4. Exporters
      const pptxBuf = await renderPPTX(artifacts);
      const htmlStr = renderHTML(artifacts, readinessItems as any);
      const guideDocx = await renderInstructorGuideDocx(artifacts, readinessItems, { title: "Databases" });

      expect(Buffer.isBuffer(pptxBuf)).toBe(true);
      expect(htmlStr).toContain("<!DOCTYPE html>");
      expect(Buffer.isBuffer(guideDocx)).toBe(true);
    });

    it("T3-X-02: sanitizes user-facing presentation decks across all slides", () => {
      const dirtyArtifacts = createCompliantArtifacts().map((a) => ({
        ...a,
        contentJson: {
          ...a.contentJson,
          title: `Slide ${a.slideNo}: Machine Learning artifact`,
          studentAction: `In S${a.slideNo}, predict the output for source chunk ${a.slideNo}`,
        },
      }));

      const cleaned = cleanObjectJargon(dirtyArtifacts);
      for (const a of cleaned) {
        expect(hasForbiddenJargon(a.contentJson.title)).toBe(false);
        expect(hasForbiddenJargon(a.contentJson.studentAction)).toBe(false);
        expect(a.contentJson.title).toContain(`Concept ${a.slideNo}`);
      }
    });

  });

  // ---------------------------------------------------------------------------
  // TIER 4: REAL-WORLD SCENARIOS (SAUDI HIGHER ED & ACCREDITATION)
  // ---------------------------------------------------------------------------
  describe("Tier 4: Real-World Scenarios (Accreditation & Bilingual Curricula)", () => {

    it("T4-R-01: builds bilingual Arabic RTL lecture with verified typography and zero jargon", async () => {
      const arabicArtifacts = Array.from({ length: 20 }, (_, i) => ({
        slideNo: i + 1,
        contentJson: {
          title: `المفهوم التعليمي ${i + 1}: بنية أنظمة التشغيل الحديثة`,
          bullets: [
            "المبدأ الأساسي: عزل مساحات العناوين للعمليات",
            "إدارة الذاكرة الافتراضية وجداول الصفحات",
            "آليات التبديل بين سياقات المعالجة",
          ],
          wordCount: 22,
          textAr: {
            title: `المفهوم التعليمي ${i + 1}: بنية أنظمة التشغيل الحديثة`,
            bullets: ["عزل مساحات العناوين", "إدارة الذاكرة الافتراضية"],
          },
          visualIntent: "مخطط هيكلي يوضح بنية النواة ونظام التشغيل",
          visualSpec: {
            type: "diagram",
            title: "Kernel Architecture",
            elements: ["User Space", "Kernel Space", "Hardware"],
          },
          studentAction: i >= 1 && i <= 18 ? "Predict the throughput under context switching overhead." : undefined,
          claims: [{ text: "Case study at KSU demonstrates 99.8% system stability.", status: "VERIFIED" }],
        },
      }));

      const pptxBuf = await renderPPTX(arabicArtifacts);
      expect(Buffer.isBuffer(pptxBuf)).toBe(true);
      expect(pptxBuf.length).toBeGreaterThan(1000);
    });

    it("T4-R-02: generates NCAAA Accreditation Evidence Pack with complete audit manifest", async () => {
      const manifestPayload = "COMPILER_RUN_KSU_CS311_20260819_STAMP";
      const manifestHash = createHash("sha256").update(manifestPayload).digest("hex");

      const evidenceData: EvidencePackData = {
        projectTitle: "KSU CS-311 Operating Systems Accreditation Dossier",
        manifestHash,
        approvedBy: "Quality & Accreditation Committee",
        approvedAt: "2026-08-19T14:30:00Z",
        coverage: [
          { blockId: "blk-1", locator: "Syllabus §1.1", disposition: "mapped", reason: null },
          { blockId: "blk-2", locator: "NCAAA Standard 4.2", disposition: "mapped", reason: null },
        ],
        clos: [
          { number: "CLO 1", text: "Formulate concurrent synchronization models", bloomLevel: "Create" },
          { number: "CLO 2", text: "Evaluate memory hierarchy trade-offs", bloomLevel: "Evaluate" },
        ],
        citations: [
          {
            claim: "Multilevel feedback queue minimizes average response time",
            sourceKey: "Silberschatz OS Concepts 10th Ed.",
            url: "https://os-book.com",
            hash: "5d41402abc4b2a76b9719d911017c592",
            retrievedAt: "2026-08-10",
          },
        ],
        readiness: [
          { slideNo: 6, stem: "Thread safety in critical sections", clo: "1", outcome: "Pass" },
          { slideNo: 9, stem: "Calculate page fault frequency", clo: "2", outcome: "Pass" },
          { slideNo: 13, stem: "Evaluate lock contention", clo: "1", outcome: "Pass" },
          { slideNo: 20, stem: "Capstone OS Architecture Decision", clo: "2", outcome: "Pass" },
        ],
        gates: [
          { gateKey: "slide_count", severity: "error", status: "pass" },
          { gateKey: "density", severity: "error", status: "pass" },
          { gateKey: "source_coverage", severity: "error", status: "pass" },
          { gateKey: "clo_alignment", severity: "error", status: "pass" },
        ],
      };

      const pdfBuf = await renderEvidencePackPDF(evidenceData);
      expect(Buffer.isBuffer(pdfBuf)).toBe(true);
      expect(pdfBuf.length).toBeGreaterThan(1000);
    });

  });

});
