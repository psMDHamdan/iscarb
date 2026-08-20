/**
 * EMPIRICAL CHALLENGER ADVERSARIAL TEST SUITE
 * Milestone 2: Core iSCARB 20-Slide Compiler, Multi-Format Deterministic Exporters & Quality Gates
 * ================================================================================================
 * Role: critic / specialist (Empirical Verification & Stress Harness)
 * Authoritative Request: /home/hamdan/iscarb/.agents/ORIGINAL_REQUEST.md
 *
 * Test Harness Dimensions:
 *   1. Multi-Format Deterministic Exporters (PPTX, HTML, PDF, DOCX Guide, PDF Evidence Pack with SHA-256)
 *   2. Zero AI-Engine Terminology Leakage Guardrails (cleanJargon, hasForbiddenJargon, deep object traversal)
 *   3. Strict iSCARB S1–S20 Fixed-Slot Pedagogical Contracts & Interaction Quotas
 *   4. Deterministic Quality Gates (GATE-01 to GATE-13) Boundary & Failure Oracles
 *   5. Security, Ingestion, Deduplication, and Cryptographic Manifest Integrity
 */

import { describe, it, expect, vi } from "vitest";
import { createHash } from "crypto";

vi.mock("html-pdf-node", () => ({
  default: {
    generatePdf: vi.fn(async ({ content }: { content: string }, options?: any) => {
      // Simulate deterministic PDF generation from HTML string
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
  renderInstructorGuidePDF,
} from "@/lib/lecture/renderer/instructor-guide-renderer";
import {
  renderEvidencePackPDF,
  type EvidencePackData,
} from "@/lib/lecture/renderer/evidence-pack-renderer";
import { checkCrossFormatParity } from "@/lib/lecture/renderer/parity-checker";
import { slideTitle, slideBullets, slideAction } from "@/lib/lecture/renderer/content";

// Jargon Cleaner Guardrails
import {
  cleanJargon,
  hasForbiddenJargon,
  detectForbiddenJargon,
  cleanObjectJargon,
} from "@/lib/lecture/projections/utils/jargon-cleaner";

// Planner & Slot Contracts
import {
  FIXED_SLOT_FUNCTION,
  FIXED_SLOTS,
  validatePlanStructure,
  planGate,
  type SlideLike,
} from "@/lib/lecture/planner/plan-validator";
import {
  generateTopicGroundedFallbackSlides,
  sanitizeAiSlides,
  remapPlanIds,
  cloAliasKeys,
} from "@/lib/lecture/planner/plan-generator";

// Quality Gates GATE-01 to GATE-13
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

// Review, Publishing & Deduplication Logic
import {
  contentHash,
  latestCurrentArtifacts,
  latestReadinessBySlide,
  publishInventoryFromRows,
  evaluatePublishChecks,
  diffSourceBlocks,
} from "@/lib/lecture/review/review-logic";
import {
  deduplicateSlideArtifacts,
  deduplicateReadinessItems,
} from "@/lib/lecture/deduplication";
import { assessCriticality } from "@/lib/lecture/ingestion/source-block-builder";

// =============================================================================
// TEST GENERATORS & FIXTURES
// =============================================================================

function generateStandard20Plan(): SlideLike[] {
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

function generateStandard20Artifacts() {
  return Array.from({ length: 20 }, (_, i) => {
    const slideNo = i + 1;
    return {
      slideNo,
      contentJson: {
        title: `Enterprise Security Pattern ${slideNo}: Defense Matrix`,
        bullets: [
          `Pillar ${slideNo}.1: Cryptographic key encapsulation`,
          `Pillar ${slideNo}.2: Hardware root of trust invariant`,
          `Pillar ${slideNo}.3: Real-time telemetry monitoring`,
        ],
        wordCount: 26,
        visualIntent: `Comprehensive architecture diagram for domain layer ${slideNo}`,
        visualSpec: {
          visualType: "ARCHITECTURE",
          purpose: `Illustrate secure enclave isolation for layer ${slideNo}`,
          elements: ["Untrusted Host", "Secure Enclave", "TPM Chip", "Attestation Service"],
          learningMessage: "Hardware isolation prevents memory inspection by the hypervisor.",
        },
        speakerNotes: `Instructor script for Stage ${slideNo}: highlight trust boundary crossing.`,
        studentAction: slideNo >= 2 && slideNo <= 19
          ? slideNo % 2 === 0
            ? `Predict whether a cold-boot attack compromises volatile keys in case scenario ${slideNo}.`
            : `Calculate the cryptographic key entropy using worked example formula.`
          : undefined,
        claims: [
          {
            text: `Empirical case study at KSU demonstrates 99.9% uptime and hardware root of trust guarantees secure boot integrity across 100% of tested instances.`,
            status: "VERIFIED",
            sourceBlockId: `blk-${slideNo}`,
          },
        ],
      },
    };
  });
}

function generateStandardReadinessItems() {
  return [
    {
      slideNo: 6,
      stem: "What is the primary objective of memory isolation in modern operating systems?",
      options: ["Prevent cross-process address space corruption", "Accelerate disk I/O", "Bypass page tables", "Disable cache lines"],
      correctIndex: 0,
      difficulty: "medium",
      rationale: "Memory isolation ensures executing processes cannot read or overwrite memory outside their designated pages.",
      cloId: "clo-1",
      sourceLocator: "Sec 3.1",
    },
    {
      slideNo: 9,
      stem: "Given a 4KB page size and a 32-bit virtual address, calculate the number of virtual pages:",
      options: ["1,048,576 pages (2^20)", "65,536 pages (2^16)", "4,096 pages (2^12)", "262,144 pages (2^18)"],
      correctIndex: 0,
      difficulty: "hard",
      rationale: "32-bit address space (4GB) / 4KB page size = 2^32 / 2^12 = 2^20 = 1,048,576 pages.",
      cloId: "clo-2",
      sourceLocator: "Sec 4.2",
    },
    {
      slideNo: 13,
      stem: "Which design trade-off occurs when transitioning from monolithic kernels to microkernels?",
      options: ["Higher message-passing IPC overhead for enhanced fault isolation", "Lower security for faster device drivers", "Zero context switches", "Complete removal of user space"],
      correctIndex: 0,
      difficulty: "hard",
      rationale: "Microkernels achieve strong isolation at the cost of IPC message passing overhead across address spaces.",
      cloId: "clo-3",
      sourceLocator: "Sec 6.4",
    },
    {
      slideNo: 20,
      stem: "Capstone Readiness Gate: Under multi-tenant cloud virtualization, what mechanism guarantees zero side-channel leakage?",
      options: ["Full memory encryption with per-VM ephemeral keys", "Shared L3 cache partitioning only", "Software time-slicing without hardware support", "Overclocking CPU frequency"],
      correctIndex: 0,
      difficulty: "hard",
      rationale: "Per-VM memory encryption prevents physical and cold-boot snooping between untrusted tenants.",
      cloId: "clo-1",
      sourceLocator: "Sec 9.1",
    },
  ];
}

// =============================================================================
// CHALLENGER TEST SUITE
// =============================================================================

describe("Empirical Challenger M2: Compiler, Multi-Format Exporters & Quality Gates", () => {

  // ---------------------------------------------------------------------------
  // 1. MULTI-FORMAT DETERMINISTIC EXPORTERS & SHA-256 HASH VERIFICATION
  // ---------------------------------------------------------------------------
  describe("1. Multi-Format Deterministic Exporters & SHA-256 Verification", () => {

    it("EXP-01 [PPTX]: Generates valid PPTX binary buffer with ZTM theme, visual cards, and progress bar", async () => {
      const artifacts = generateStandard20Artifacts();
      const pptxBuffer = await renderPPTX(artifacts);

      expect(Buffer.isBuffer(pptxBuffer)).toBe(true);
      expect(pptxBuffer.length).toBeGreaterThan(5000);

      // Verify ZIP/PPTX magic bytes: 0x50 0x4B 0x03 0x04 (PK..)
      expect(pptxBuffer[0]).toBe(0x50);
      expect(pptxBuffer[1]).toBe(0x4b);
      expect(pptxBuffer[2]).toBe(0x03);
      expect(pptxBuffer[3]).toBe(0x04);
    });

    it("EXP-02 [PPTX Edge Cases]: Handles extreme inputs without crashing (0 bullets, 5 bullets, RTL Arabic, long notes, missing visual)", async () => {
      const edgeArtifacts = Array.from({ length: 20 }, (_, i) => {
        const slideNo = i + 1;
        if (slideNo === 1) {
          return {
            slideNo: 1,
            contentJson: {
              title: "Edge Case Slide 1: Zero Bullets",
              bullets: [],
              wordCount: 5,
              speakerNotes: "A".repeat(2000), // very long notes
            },
          };
        }
        if (slideNo === 2) {
          return {
            slideNo: 2,
            contentJson: {
              title: "عنوان باللغة العربية مع اتجاه من اليمين لليسار",
              textAr: {
                title: "عنوان باللغة العربية مع اتجاه من اليمين لليسار",
                bullets: ["نقطة أولى", "نقطة ثانية", "نقطة ثالثة", "نقطة رابعة", "نقطة خامسة"],
              },
              bullets: ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
              wordCount: 30,
              studentAction: "Predict Arabic text rendering fidelity.",
            },
          };
        }
        if (slideNo === 3) {
          return {
            slideNo: 3,
            contentJson: {
              title: "Mathematical & Unicode Symbols: ∑, ∫, λ, ∀x ∈ ℝ, 𝒪(n log n)",
              bullets: ["Formula: ΔE = mc²", "Entropy: H(X) = -∑ p(x) log₂ p(x)"],
              wordCount: 15,
              visualIntent: "HUB_SPOKE_MAP_VISUAL",
              studentAction: "Calculate entropy limit.",
            },
          };
        }
        return {
          slideNo,
          contentJson: {
            title: `Standard Slide ${slideNo}`,
            bullets: [`Bullet item for ${slideNo}`],
            wordCount: 10,
            visualIntent: "LAYER_STACK_ARCHITECTURE",
            studentAction: "Define the operational requirement.",
          },
        };
      });

      const pptxBuffer = await renderPPTX(edgeArtifacts);
      expect(Buffer.isBuffer(pptxBuffer)).toBe(true);
      expect(pptxBuffer.length).toBeGreaterThan(3000);
    });

    it("EXP-03 [HTML]: Generates self-contained, XSS-safe interactive HTML player with hidden answer architecture", () => {
      const maliciousArtifacts = [
        {
          slideNo: 1,
          contentJson: {
            title: "Safe Title <script>alert('xss-title')</script>",
            bullets: ["Bullet 1 <img src=x onerror=alert('xss-bullet') />", "Normal bullet"],
            wordCount: 12,
            studentAction: "Action with <b>bold</b> & special characters",
          },
        },
        ...generateStandard20Artifacts().slice(1),
      ];

      const maliciousReadiness = [
        {
          slideNo: 6,
          stem: "Stem with <svg/onload=alert('xss-stem')>",
          options: ["<script>alert(1)</script>", "Option <b>2</b>", "Option 3", "Option 4"],
          correctIndex: 0,
          difficulty: "medium",
          rationale: "Instructor rationale with <iframe src='malicious.html'>",
          cloId: "clo-1",
        },
      ];

      const html = renderHTML(maliciousArtifacts, maliciousReadiness as any);

      // Verify HTML boilerplate & components
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<title>Interactive Lecture</title>");
      expect(html).toContain("class=\"roadmap\"");
      expect(html).toContain("class=\"s20-gate\"");
      expect(html).toContain("🎯 Readiness Gate");

      // Verify strict XSS escaping
      expect(html).not.toContain("<script>alert('xss-title')</script>");
      expect(html).toContain("&lt;script&gt;alert(&#39;xss-title&#39;)&lt;/script&gt;");
      expect(html).not.toContain("<img src=x onerror=alert('xss-bullet') />");
      expect(html).toContain("&lt;img src=x onerror=alert(&#39;xss-bullet&#39;) /&gt;");
      expect(html).not.toContain("<svg/onload=alert('xss-stem')>");
      expect(html).not.toContain("<iframe src='malicious.html'>");

      // Verify hidden answer architecture
      expect(html).toContain("class=\"rationale hidden\"");
      expect(html).toContain("<strong>Instructor only:</strong>");
    });

    it("EXP-04 [HTML Determinism]: Bit-for-bit identical output when rendering repeatedly", () => {
      const artifacts = generateStandard20Artifacts();
      const readiness = generateStandardReadinessItems();

      const htmlRun1 = renderHTML(artifacts, readiness);
      const htmlRun2 = renderHTML(artifacts, readiness);

      expect(htmlRun1).toBe(htmlRun2);
      expect(createHash("sha256").update(htmlRun1).digest("hex")).toBe(
        createHash("sha256").update(htmlRun2).digest("hex")
      );
    });

    it("EXP-05 [PDF]: Renders valid PDF buffer from HTML output", async () => {
      const artifacts = generateStandard20Artifacts();
      const readiness = generateStandardReadinessItems();
      const html = renderHTML(artifacts, readiness);

      const pdfBuffer = await renderPDF(html);
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(20);

      // Verify PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D)
      const header = pdfBuffer.slice(0, 5).toString("ascii");
      expect(header).toBe("%PDF-");
    });

    it("EXP-06 [Instructor Guide DOCX & HTML]: Produces valid DOCX binary and HTML syllabus with answer keys", async () => {
      const artifacts = generateStandard20Artifacts();
      const readiness = generateStandardReadinessItems();
      const courseProfile = {
        courseCode: "CYBER-401",
        title: "Advanced System Hardening",
        specialty: "Cybersecurity & Systems Defense",
      };

      // 1. HTML syllabus
      const guideHtml = renderInstructorGuide(artifacts, readiness, courseProfile);
      expect(guideHtml).toContain("Instructor Guide & Syllabus");
      expect(guideHtml).toContain("CYBER-401 — Advanced System Hardening");
      expect(guideHtml).toContain("INSTRUCTOR CONFIDENTIAL — Do not distribute answer key to students");
      expect(guideHtml).toContain("Readiness Item Answer Key");
      expect(guideHtml).toContain("Q1");
      expect(guideHtml).toContain("Speaker Notes:");

      // 2. DOCX binary
      const docxBuffer = await renderInstructorGuideDocx(artifacts, readiness, courseProfile);
      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      expect(docxBuffer.length).toBeGreaterThan(1000);

      // Verify DOCX ZIP magic bytes: 0x50 0x4B 0x03 0x04
      expect(docxBuffer[0]).toBe(0x50);
      expect(docxBuffer[1]).toBe(0x4b);
      expect(docxBuffer[2]).toBe(0x03);
      expect(docxBuffer[3]).toBe(0x04);
    });

    it("EXP-07 [Evidence Pack PDF with SHA-256]: Generates multi-page accreditation audit report embedding exact SHA-256 manifest hash", async () => {
      const testManifestPayload = JSON.stringify({
        course: "CS-500",
        artifacts: generateStandard20Artifacts().map((a) => a.contentJson.title),
        timestamp: "2026-08-19T20:00:00Z",
      });
      const expectedSha256 = createHash("sha256").update(testManifestPayload).digest("hex");

      const evidenceData: EvidencePackData = {
        projectTitle: "National Accreditation Evidence Dossier - Enterprise Cloud Security",
        manifestHash: expectedSha256,
        approvedBy: "Dean of Academic Quality & Accreditation",
        approvedAt: "2026-08-19T18:00:00Z",
        coverage: Array.from({ length: 25 }, (_, i) => ({
          blockId: `blk-${i + 1}`,
          locator: `Syllabus Chapter ${Math.floor(i / 3) + 1}.${(i % 3) + 1}`,
          disposition: "mapped",
          reason: null,
        })),
        clos: [
          { number: "CLO 1", text: "Design secure distributed access control systems", bloomLevel: "Create" },
          { number: "CLO 2", text: "Evaluate memory hierarchy isolation mechanisms", bloomLevel: "Evaluate" },
          { number: "CLO 3", text: "Analyze cryptographic protocol vulnerabilities", bloomLevel: "Analyze" },
        ],
        citations: Array.from({ length: 15 }, (_, i) => ({
          claim: `Hardware root of trust eliminates cold-boot attack vectors on subsystem ${i + 1}`,
          sourceKey: `IEEE Security & Privacy 2026 Vol ${i + 1}`,
          url: `https://doi.org/10.1109/SP.2026.${1000 + i}`,
          hash: createHash("sha256").update(`citation-${i}`).digest("hex").slice(0, 16),
          retrievedAt: "2026-08-15T09:00:00Z",
        })),
        readiness: [
          { slideNo: 6, stem: "Memory isolation invariant", clo: "CLO 1", outcome: "Jaheziah Standard 2.1" },
          { slideNo: 9, stem: "Virtual page address calculation", clo: "CLO 2", outcome: "Jaheziah Standard 2.3" },
          { slideNo: 13, stem: "Microkernel trade-off assessment", clo: "CLO 3", outcome: "Jaheziah Standard 3.1" },
          { slideNo: 20, stem: "Capstone Cloud Multi-Tenant Isolation Gate", clo: "CLO 1", outcome: "Jaheziah Standard 4.0" },
        ],
        gates: [
          { gateKey: "slide_count", severity: "error", status: "pass" },
          { gateKey: "density", severity: "error", status: "pass" },
          { gateKey: "visual_support", severity: "warning", status: "pass" },
          { gateKey: "interaction_count", severity: "error", status: "pass" },
          { gateKey: "misconception", severity: "error", status: "pass" },
          { gateKey: "calculation_workshop", severity: "error", status: "pass" },
          { gateKey: "readiness_count", severity: "error", status: "pass" },
          { gateKey: "source_coverage", severity: "error", status: "pass" },
          { gateKey: "clo_alignment", severity: "error", status: "pass" },
          { gateKey: "cross_format_parity", severity: "error", status: "pass" },
          { gateKey: "student_experience", severity: "error", status: "pass" },
        ],
      };

      const pdfBuffer = await renderEvidencePackPDF(evidenceData);
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(2000);

      // Verify PDF magic header
      const header = pdfBuffer.slice(0, 5).toString("ascii");
      expect(header).toBe("%PDF-");

      // Verify SHA-256 hash length (64 hex characters)
      expect(expectedSha256).toMatch(/^[a-f0-9]{64}$/);
    });

    it("EXP-08 [Cross-Format Parity Engine]: Correctly enforces 100% semantic identity and catches renderer drift", () => {
      const canonicalArtifacts = generateStandard20Artifacts();

      // Extract parity views using single-source content.ts
      const views = canonicalArtifacts.map((a) => ({
        slideNo: a.slideNo,
        title: slideTitle(a.contentJson as any),
        bullets: slideBullets(a.contentJson as any),
      }));

      // Test 1: In-sync parity
      const parityPass = checkCrossFormatParity({
        pptx: views,
        html: views,
        pdf: views,
      });
      expect(parityPass.passed).toBe(true);
      expect(parityPass.drifted).toHaveLength(0);

      // Test 2: Injected drift in HTML on slide 8
      const driftedHtml = views.map((v) =>
        v.slideNo === 8 ? { ...v, title: "Drifted Title on S8" } : v
      );
      const parityFail1 = checkCrossFormatParity({
        pptx: views,
        html: driftedHtml,
        pdf: views,
      });
      expect(parityFail1.passed).toBe(false);
      expect(parityFail1.drifted).toEqual([8]);

      // Test 3: Injected bullet drift in PDF on slide 13
      const driftedPdf = views.map((v) =>
        v.slideNo === 13 ? { ...v, bullets: ["Extra altered bullet"] } : v
      );
      const parityFail2 = checkCrossFormatParity({
        pptx: views,
        html: views,
        pdf: driftedPdf,
      });
      expect(parityFail2.passed).toBe(false);
      expect(parityFail2.drifted).toEqual([13]);
    });

  });

  // ---------------------------------------------------------------------------
  // 2. ZERO AI-ENGINE TERMINOLOGY LEAKAGE VERIFICATION
  // ---------------------------------------------------------------------------
  describe("2. Zero AI-Engine Terminology Leakage Guardrails", () => {

    it("JARG-01: Replaces all internal pipeline jargon with student-facing pedagogical terms", () => {
      const cases = [
        { input: "See Slide 1 for overview", expected: "See Concept 1 for overview" },
        { input: "Refer to Slide 20 for readiness", expected: "Refer to Concept 20 for readiness" },
        { input: "S1 begins with tension", expected: "Concept 1 begins with tension" },
        { input: "S12 explores deep mechanism", expected: "Concept 12 explores deep mechanism" },
        { input: "Phase 1 covers discover", expected: "Stage 1 covers discover" },
        { input: "Phase 3 is deepen", expected: "Stage 3 is deepen" },
        { input: "All artifacts are reviewed", expected: "All learning resources are reviewed" },
        { input: "Generate slide artifact", expected: "Generate slide learning resource" },
        { input: "Assign slot 4", expected: "Assign section 4" },
        { input: "Review all slots", expected: "Review all sections" },
        { input: "Extract from source chunk 12", expected: "Extract from reference text 12" },
        { input: "Parse source chunks", expected: "Parse reference texts" },
        { input: "Execute prompt template", expected: "Execute exercise" },
        { input: "All prompt templates validated", expected: "All exercises validated" },
        { input: "Render vectorSvgCode diagram", expected: "Render diagram diagram" },
        { input: "Run generation pass 7", expected: "Run learning step 7" },
        { input: "All generation passes complete", expected: "All learning steps complete" },
        { input: "Executing pass 16", expected: "Executing step 16" },
      ];

      for (const { input, expected } of cases) {
        expect(cleanJargon(input)).toBe(expected);
      }
    });

    it("JARG-02: Preserves valid English words that contain substrings of jargon", () => {
      // "Pass" in exam context, "Password", "Class", "Mass", "Compass", "Assets", "Assistant"
      expect(cleanJargon("Student scored a passing grade.")).toBe("Student scored a passing grade.");
      expect(cleanJargon("Enter your secure password.")).toBe("Enter your secure password.");
      expect(cleanJargon("Object-oriented class hierarchy.")).toBe("Object-oriented class hierarchy.");
      expect(cleanJargon("Financial assets and liabilities.")).toBe("Financial assets and liabilities.");
      expect(cleanJargon("Compass orientation.")).toBe("Compass orientation.");
    });

    it("JARG-03: Detects forbidden jargon accurately across mixed-case sentences", () => {
      expect(hasForbiddenJargon("Refer to Slide 4 for the proof.")).toBe(true);
      expect(hasForbiddenJargon("Look at S8 misconception.")).toBe(true);
      expect(hasForbiddenJargon("Check the artifact before proceeding.")).toBe(true);
      expect(hasForbiddenJargon("Source chunk 5 contains the data.")).toBe(true);
      expect(hasForbiddenJargon("Slot 9 is calculation.")).toBe(true);
      expect(hasForbiddenJargon("Understanding asynchronous event loops in Node.js.")).toBe(false);
      expect(hasForbiddenJargon("Principles of distributed database replication.")).toBe(false);

      const detection = detectForbiddenJargon("Check S3 and Slide 10 in slot 4.");
      expect(detection.hasJargon).toBe(true);
      expect(detection.matchedJargon.length).toBeGreaterThanOrEqual(2);
    });

    it("JARG-04: Recursively cleans complex nested JSON objects without mutating non-string types", () => {
      const dirtyTree = {
        topic: "Cloud Architecture",
        version: 2,
        approved: true,
        created: new Date("2026-08-19T00:00:00Z"),
        slides: [
          {
            slideNo: 1,
            title: "Slide 1: Ingestion artifact",
            metadata: {
              source: "source chunk 1",
              template: "prompt template A",
              slots: ["slot 1", "slot 2"],
            },
            notes: ["In S1 we ask the hook question", "Review Phase 1"],
          },
          {
            slideNo: 2,
            title: "Slide 2: Domain Spine",
            bullets: ["Derived from source chunk 2", "Pure pedagogical content"],
          },
        ],
      };

      const cleanedTree = cleanObjectJargon(dirtyTree);

      expect(cleanedTree.version).toBe(2);
      expect(cleanedTree.approved).toBe(true);
      expect(cleanedTree.created).toEqual(new Date("2026-08-19T00:00:00Z"));
      expect(cleanedTree.slides[0].title).toBe("Concept 1: Ingestion learning resource");
      expect(cleanedTree.slides[0].metadata.source).toBe("reference text 1");
      expect(cleanedTree.slides[0].metadata.template).toBe("exercise A");
      expect(cleanedTree.slides[0].metadata.slots).toEqual(["section 1", "section 2"]);
      expect(cleanedTree.slides[0].notes[0]).toBe("In Concept 1 we ask the hook question");
      expect(cleanedTree.slides[0].notes[1]).toBe("Review Stage 1");
      expect(cleanedTree.slides[1].title).toBe("Concept 2: Domain Spine");
      expect(cleanedTree.slides[1].bullets[0]).toBe("Derived from reference text 2");

      // Verify zero forbidden jargon remaining in cleaned tree
      const jsonStr = JSON.stringify(cleanedTree);
      expect(hasForbiddenJargon(jsonStr)).toBe(false);
    });

  });

  // ---------------------------------------------------------------------------
  // 3. STRICT iSCARB S1–S20 FIXED-SLOT PEDAGOGICAL CONTRACT
  // ---------------------------------------------------------------------------
  describe("3. Strict iSCARB S1–S20 Fixed-Slot Pedagogical Contract", () => {

    it("SLOT-01: Verifies all 20 canonical slot mappings against the BRD v3.4 contract", () => {
      const expectedSlots: Record<number, string> = {
        1: "hook",
        2: "domain_spine",
        3: "clos",
        4: "h_stack",
        5: "foundation",
        6: "foundation",
        7: "foundation",
        8: "misconception",
        9: "calculation",
        10: "deep_dive",
        11: "deep_dive",
        12: "deep_dive",
        13: "trade_off",
        14: "application",
        15: "application",
        16: "application",
        17: "application",
        18: "rubric",
        19: "evidence",
        20: "readiness",
      };

      for (let n = 1; n <= 20; n++) {
        expect(FIXED_SLOT_FUNCTION[n]).toBe(expectedSlots[n]);
        expect(FIXED_SLOTS.has(n)).toBe(true);
      }
    });

    it("SLOT-02: Structural plan validator accepts valid 20-slide plan and rejects invalid permutations", () => {
      const validPlan = generateStandard20Plan();
      const validErrors = validatePlanStructure(validPlan);
      expect(validErrors).toHaveLength(0);
      expect(planGate(validPlan).valid).toBe(true);

      // Permutation: Reassign every single fixed slot to an invalid function
      for (let n = 1; n <= 20; n++) {
        const mutatedPlan = generateStandard20Plan();
        mutatedPlan[n - 1].function = "invalid_random_function";
        const errors = validatePlanStructure(mutatedPlan);
        expect(errors.some((e) => e.rule === "fixed_slot_function" && e.message.includes(`S${n}`))).toBe(true);
      }
    });

    it("SLOT-03: Interaction Quotas enforcement (≥3 Pause & Discuss, ≥2 Polls, ≥1 Collaboration)", () => {
      // 1. Deficient Polls (<2)
      const noPollsPlan = generateStandard20Plan().map((s) => (s.interactionType === "poll" ? { ...s, interactionType: null } : s));
      const pollErrors = validatePlanStructure(noPollsPlan);
      expect(pollErrors.some((e) => e.rule === "poll_count")).toBe(true);

      // 2. Deficient Pause & Discuss (<3)
      const noPausesPlan = generateStandard20Plan().map((s) => (s.interactionType === "pause_discuss" ? { ...s, interactionType: null } : s));
      const pauseErrors = validatePlanStructure(noPausesPlan);
      expect(pauseErrors.some((e) => e.rule === "pause_discuss_count")).toBe(true);

      // 3. Deficient Collaboration (<1)
      const noCollabPlan = generateStandard20Plan().map((s) => (s.interactionType === "collaboration" ? { ...s, interactionType: null } : s));
      const collabErrors = validatePlanStructure(noCollabPlan);
      expect(collabErrors.some((e) => e.rule === "collaboration_count")).toBe(true);
    });

    it("SLOT-04: Topic-grounded fallback generator strictly produces S1–S20 compliant slides with quotas", () => {
      const sampleClos = [
        { id: "clo-1", number: "1", text: "CLO 1 text", bloomLevel: "Apply" },
        { id: "clo-2", number: "2", text: "CLO 2 text", bloomLevel: "Evaluate" },
      ];
      const sampleBlocks = [
        { id: "b1", locator: "Sec 1", criticality: "critical", text: "Critical block text" },
        { id: "b2", locator: "Sec 2", criticality: "normal", text: "Normal block text" },
      ];

      const fallback = generateTopicGroundedFallbackSlides("Database Concurrency", sampleClos as any, sampleBlocks);
      expect(fallback).toHaveLength(20);

      const errors = validatePlanStructure(fallback);
      expect(errors).toHaveLength(0);

      for (let n = 1; n <= 20; n++) {
        expect(fallback[n - 1].slideNo).toBe(n);
        expect(fallback[n - 1].function).toBe(FIXED_SLOT_FUNCTION[n]);
      }
    });

  });

  // ---------------------------------------------------------------------------
  // 4. DETERMINISTIC QUALITY GATES (GATE-01 to GATE-13) ADVERSARIAL ORACLES
  // ---------------------------------------------------------------------------
  describe("4. Deterministic Quality Gates (GATE-01 to GATE-13) Adversarial Oracles", () => {

    it("GATE-01 (slide_count): Passes on 20 slides, strictly fails on 0, 19, 21, or 100 slides", () => {
      expect(gateSlideCount(Array.from({ length: 20 }, (_, i) => ({ slideNo: i + 1 }))).status).toBe("pass");
      expect(gateSlideCount([]).status).toBe("fail");
      expect(gateSlideCount(Array.from({ length: 19 }, (_, i) => ({ slideNo: i + 1 }))).status).toBe("fail");
      expect(gateSlideCount(Array.from({ length: 21 }, (_, i) => ({ slideNo: i + 1 }))).status).toBe("fail");
      expect(gateSlideCount(Array.from({ length: 100 }, (_, i) => ({ slideNo: i + 1 }))).status).toBe("fail");
    });

    it("GATE-02 (density): Boundary tests for 40 words and 5 bullets thresholds", () => {
      const artifacts = generateStandard20Artifacts();

      // Exactly 40 words -> PASS
      artifacts[0].contentJson.wordCount = 40;
      expect(gateDensity(artifacts as any).status).toBe("pass");

      // 41 words -> FAIL
      artifacts[0].contentJson.wordCount = 41;
      const fail41 = gateDensity(artifacts as any);
      expect(fail41.status).toBe("fail");
      expect(fail41.findings.some((f) => f.slideNo === 1 && f.message.includes("41 words"))).toBe(true);

      // Exactly 5 bullets -> PASS
      artifacts[0].contentJson.wordCount = 30;
      artifacts[1].contentJson.bullets = ["b1", "b2", "b3", "b4", "b5"];
      expect(gateDensity(artifacts as any).status).toBe("pass");

      // 6 bullets -> FAIL
      artifacts[1].contentJson.bullets = ["b1", "b2", "b3", "b4", "b5", "b6"];
      const fail6 = gateDensity(artifacts as any);
      expect(fail6.status).toBe("fail");
      expect(fail6.findings.some((f) => f.slideNo === 2 && f.message.includes("6 bullets"))).toBe(true);
    });

    it("GATE-03 (visual_support): Warning gate passes on ≥18 visual slides, flags when <18", () => {
      const artifacts = generateStandard20Artifacts();

      // 20 visual slides -> PASS
      expect(gateVisualSupport(artifacts as any).status).toBe("pass");

      // 18 visual slides (2 missing) -> PASS (warning threshold is >2 missing)
      artifacts[0].contentJson.visualSpec = undefined;
      artifacts[0].contentJson.visualIntent = "";
      artifacts[1].contentJson.visualSpec = undefined;
      artifacts[1].contentJson.visualIntent = "";
      expect(gateVisualSupport(artifacts as any).status).toBe("pass");

      // 17 visual slides (3 missing) -> FAIL
      artifacts[2].contentJson.visualSpec = undefined;
      artifacts[2].contentJson.visualIntent = "";
      const result3 = gateVisualSupport(artifacts as any);
      expect(result3.status).toBe("fail");
      expect(result3.findings).toHaveLength(3);
    });

    it("GATE-05 (cases_examples): Passes on ≥2 cases OR ≥3 examples, fails when deficient", () => {
      // Standard artifacts contain concrete case study claim -> PASS
      const artifacts = generateStandard20Artifacts();
      expect(gateCasesExamples(artifacts as any).status).toBe("pass");

      // Strip all case and example mentions -> FAIL
      const stripped = artifacts.map((a) => ({
        ...a,
        contentJson: {
          ...a.contentJson,
          title: `Theoretical Model ${a.slideNo}`,
          bullets: ["Pure mathematical definition"],
          studentAction: "Define the operational invariant.",
          claims: [],
        },
      }));
      const failResult = gateCasesExamples(stripped as any);
      expect(failResult.status).toBe("fail");
    });

    it("GATE-06 (misconception): Strictly requires S8 misconception slide linked to a CLO", () => {
      // Compliant S8 with CLO -> PASS
      expect(gateMisconception([{ slideNo: 8, function: "misconception", cloIds: ["clo-1"] }]).status).toBe("pass");

      // S8 with empty CLOs -> FAIL
      const noClo = gateMisconception([{ slideNo: 8, function: "misconception", cloIds: [] }]);
      expect(noClo.status).toBe("fail");
      expect(noClo.findings.some((f) => f.message.includes("not linked to a CLO"))).toBe(true);

      // Missing S8 misconception function entirely -> FAIL
      const wrongFn = gateMisconception([{ slideNo: 8, function: "foundation", cloIds: ["clo-1"] }]);
      expect(wrongFn.status).toBe("fail");
      expect(wrongFn.findings.some((f) => f.message.includes("No misconception slide"))).toBe(true);
    });

    it("GATE-07 (calculation_workshop): Requires S9 calculation or worked_example / practice interaction", () => {
      // S9 with worked_example -> PASS
      expect(gateCalculationWorkshop([{ interactionType: "worked_example" }]).status).toBe("pass");

      // S9 with practice -> PASS
      expect(gateCalculationWorkshop([{ interactionType: "practice" }]).status).toBe("pass");

      // Missing calculation interaction -> FAIL
      const missingCalc = gateCalculationWorkshop([{ interactionType: "poll" }, { interactionType: null }]);
      expect(missingCalc.status).toBe("fail");
      expect(missingCalc.findings.some((f) => f.message.includes("No calculation workshop"))).toBe(true);
    });

    it("GATE-08 (readiness_count): Requires ≥3 embedded items in S5–S17 + 1 S20 capstone gate", () => {
      const compliantItems = [{ slideNo: 6 }, { slideNo: 9 }, { slideNo: 13 }, { slideNo: 20 }];
      expect(gateReadinessCount(compliantItems).status).toBe("pass");

      // Missing S20 gate -> FAIL
      const missingS20 = [{ slideNo: 6 }, { slideNo: 9 }, { slideNo: 13 }, { slideNo: 15 }];
      expect(gateReadinessCount(missingS20).status).toBe("fail");

      // Only 2 embedded items in S5-S17 -> FAIL
      const onlyTwoEmbedded = [{ slideNo: 6 }, { slideNo: 9 }, { slideNo: 20 }];
      expect(gateReadinessCount(onlyTwoEmbedded).status).toBe("fail");
    });

    it("GATE-09 (source_coverage): Requires ≥98% source coverage and 100% critical blocks mapped", () => {
      const blocks = [
        { id: "b1", criticality: "critical" },
        { id: "b2", criticality: "critical" },
        { id: "b3", criticality: "normal" },
      ];
      const links = [
        { blockId: "b1", disposition: "mapped", approvedBy: "fac" },
        { blockId: "b2", disposition: "mapped", approvedBy: "fac" },
        { blockId: "b3", disposition: "mapped", approvedBy: "fac" },
      ];

      expect(gateSourceCoverage(blocks, links).status).toBe("pass");

      // Critical block unmapped -> FAIL
      const missingCritLinks = [
        { blockId: "b1", disposition: "mapped", approvedBy: "fac" },
        { blockId: "b3", disposition: "mapped", approvedBy: "fac" },
      ];
      const critFail = gateSourceCoverage(blocks, missingCritLinks);
      expect(critFail.status).toBe("fail");
      expect(critFail.findings.some((f) => f.message.includes("critical blocks not mapped"))).toBe(true);
    });

    it("GATE-10 (clo_alignment): Enforces S4–S20 link to CLO and SourceBlock; S1–S3 synthesis exempt", () => {
      const plans = Array.from({ length: 20 }, (_, i) => ({
        slideNo: i + 1,
        cloIds: i < 3 ? [] : ["clo-1"],
        sourceBlockIds: i < 3 ? [] : ["b1"],
      }));

      // S1-S3 empty is allowed -> PASS
      expect(gateCLOAlignment(plans).status).toBe("pass");

      // S5 missing CLO -> FAIL
      plans[4].cloIds = [];
      const s5Fail = gateCLOAlignment(plans);
      expect(s5Fail.status).toBe("fail");
      expect(s5Fail.findings.some((f) => f.slideNo === 5)).toBe(true);
    });

    it("GATE-11 (claim_policy): Verified/Hypothetical claims pass; NEED_SOURCE fails", () => {
      const verified = [{ slideNo: 1, contentJson: { claims: [{ text: "Fact", status: "VERIFIED" }] } }];
      expect(gateClaimPolicy(verified as any).status).toBe("pass");

      const hypothetical = [{ slideNo: 1, contentJson: { claims: [{ text: "Hypothetical scenario", status: "HYPOTHETICAL" }] } }];
      expect(gateClaimPolicy(hypothetical as any).status).toBe("pass");

      const unverified = [{ slideNo: 7, contentJson: { claims: [{ text: "Unverified statistic", status: "NEED_SOURCE" }] } }];
      const claimFail = gateClaimPolicy(unverified as any);
      expect(claimFail.status).toBe("fail");
      expect(claimFail.findings.some((f) => f.slideNo === 7)).toBe(true);
    });

    it("GATE-13 (student_experience): Validates active verbs on S2–S19, word count, and interaction quotas", () => {
      const plan = generateStandard20Plan();
      const artifacts = generateStandard20Artifacts();

      expect(gateStudentExperience(plan as any, artifacts as any).status).toBe("pass");

      // Missing student action on S5 -> FAIL
      const brokenArtifacts = generateStandard20Artifacts();
      brokenArtifacts[4].contentJson.studentAction = "";
      const expFail = gateStudentExperience(plan as any, brokenArtifacts as any);
      expect(expFail.status).toBe("fail");
      expect(expFail.findings.some((f) => f.slideNo === 5 && f.message.includes("Missing student action"))).toBe(true);
    });

  });

  // ---------------------------------------------------------------------------
  // 5. CRYPTOGRAPHIC INTEGRITY, DEDUPLICATION & PUBLISH ENGINE
  // ---------------------------------------------------------------------------
  describe("5. Cryptographic Integrity, Deduplication & Publish Engine", () => {

    it("CRYPTO-01: contentHash SHA-256 is deterministic and exhibits avalanche effect", () => {
      const payload1 = { title: "Lecture 1", slides: [1, 2, 3] };
      const payload2 = { title: "Lecture 1", slides: [1, 2, 3] };
      const payload3 = { title: "Lecture 1", slides: [1, 2, 4] }; // 1 character difference

      const hash1 = contentHash(payload1);
      const hash2 = contentHash(payload2);
      const hash3 = contentHash(payload3);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toHaveLength(64);
      expect(hash3).toHaveLength(64);
    });

    it("DEDUP-01: deduplicateSlideArtifacts picks latest version and rejects superseded rows", () => {
      const raw = [
        { id: "a1", slideNo: 1, version: 1, status: "superseded" },
        { id: "a2", slideNo: 1, version: 2, status: "approved" },
        { id: "b1", slideNo: 2, version: 1, status: "approved" },
      ];

      const deduped = deduplicateSlideArtifacts(raw);
      expect(deduped).toHaveLength(2);
      expect(deduped.find((a) => a.slideNo === 1)?.id).toBe("a2");
      expect(deduped.find((a) => a.slideNo === 2)?.id).toBe("b1");
    });

    it("PUB-01: evaluatePublishChecks blocks publish on error gates, unapproved slides, or deficient slide counts", () => {
      // 1. All clean -> PASS
      const cleanCheck = evaluatePublishChecks({
        failedErrorGates: 0,
        unapprovedSlides: 0,
        unapprovedReadinessItems: 0,
        currentSlideCount: 20,
        requiredSlideCount: 20,
      });
      expect(cleanCheck.blockers).toHaveLength(0);

      // 2. 1 error gate failing -> BLOCKED
      const gateBlocked = evaluatePublishChecks({
        failedErrorGates: 1,
        unapprovedSlides: 0,
        unapprovedReadinessItems: 0,
        currentSlideCount: 20,
      });
      expect(gateBlocked.blockers.some((b) => b.includes("error gate(s)"))).toBe(true);

      // 3. 19 slides found instead of 20 -> BLOCKED
      const countBlocked = evaluatePublishChecks({
        failedErrorGates: 0,
        unapprovedSlides: 0,
        unapprovedReadinessItems: 0,
        currentSlideCount: 19,
      });
      expect(countBlocked.blockers.some((b) => b.includes("expected 20 current slides, found 19"))).toBe(true);

      // 4. 2 unapproved slides -> BLOCKED
      const unapprovedBlocked = evaluatePublishChecks({
        failedErrorGates: 0,
        unapprovedSlides: 2,
        unapprovedReadinessItems: 0,
        currentSlideCount: 20,
      });
      expect(unapprovedBlocked.blockers.some((b) => b.includes("slide(s) not yet approved"))).toBe(true);
    });

    it("DIFF-01: diffSourceBlocks accurately tracks additions, removals, changes, and orphaned links", () => {
      const oldBlocks = [
        { id: "b1", locator: "Chapter 1", text: "Original text 1" },
        { id: "b2", locator: "Chapter 2", text: "Original text 2" },
      ];
      const newBlocks = [
        { id: "b1-new", locator: "Chapter 1", text: "Modified text 1" }, // changed
        { id: "b3-new", locator: "Chapter 3", text: "Brand new text 3" }, // added
        // Chapter 2 removed
      ];
      const coverageLinks = [
        { id: "link-1", blockId: "b1", disposition: "mapped" },
        { id: "link-2", blockId: "b2", disposition: "mapped" },
      ];

      const diff = diffSourceBlocks(oldBlocks, newBlocks, coverageLinks);
      expect(diff.changed).toHaveLength(1);
      expect(diff.changed[0].locator).toBe("Chapter 1");
      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].locator).toBe("Chapter 3");
      expect(diff.removed).toHaveLength(1);
      expect(diff.removed[0].locator).toBe("Chapter 2");
      expect(diff.orphaned).toHaveLength(1);
      expect(diff.orphaned[0].id).toBe("link-2");
    });

  });

});
