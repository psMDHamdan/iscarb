/**
 * Milestone 3: Challenger 2 Empirical Adversarial Stress Test Suite
 * =================================================================
 * Validates:
 * 1. SVG Rendering across all 7 families: XML well-formedness, viewBox dimensions,
 *    role="img", accessible text/labels, injection safety (no raw HTML/scripts).
 * 2. gateVisualUniqueness: Duplicate URLs, stock photo URLs, generic titles,
 *    duplicate visual specifications, edge cases.
 * 3. Pass 10 Visuals pipeline execution: complete schemas on VisualArtifact and
 *    specificationJson, vector SVG code generation, block linking.
 * 4. NVIDIA NIM VLM Quality Gate: threshold enforcement, graph validation, LaTeX syntax.
 */

import { describe, it, expect } from "vitest";
import {
  generateVisualSpecification,
  generateProcessVisual,
  generateSystemArchitectureVisual,
  generateDataFlowVisual,
  generateComparisonMatrixVisual,
  generateCauseEffectVisual,
  generateQuantitativeVisual,
  generateHierarchyVisual,
} from "../../lib/lecture/visual/visual-intent-engine";
import {
  renderVisualSpecificationToSvg,
  renderSvgDiagram,
  escapeXml,
} from "../../lib/lecture/renderer/svg-visual-renderer";
import {
  CANONICAL_VISUAL_FAMILIES,
  type VisualSpecification,
  type VisualFamily,
} from "../../lib/lecture/visual/types";
import { gateVisualUniqueness } from "../../lib/lecture/quality/gates/visual-uniqueness.gate";
import {
  VisualDeduplicationRegistry,
  computeVisualSimilarity,
  MAX_VISUAL_SIMILARITY_THRESHOLD,
} from "../../lib/lecture/visual/deduplication";
import { pass10Visuals } from "../../lib/lecture/generation/pipeline/passes/pass10-visuals";
import type { PipelineContext } from "../../lib/lecture/generation/pipeline/pipeline-context";
import {
  evaluateVisual,
  evaluateVisualDeterministically,
  NVIDIA_VLM_THRESHOLDS,
} from "../../lib/lecture/visual/nvidia-vlm-gate";
import type { ElaboratedBlock, VisualArtifact } from "../../lib/lecture/types/learning-experience";

// XML Well-Formedness Check Helper
function validateXmlWellFormedness(xmlString: string): { isValid: boolean; error?: string } {
  if (!xmlString.startsWith("<svg") || !xmlString.endsWith("</svg>")) {
    return { isValid: false, error: "Root element must start with <svg and end with </svg>" };
  }

  const tagStack: string[] = [];
  const tagRegex = /<\/?([a-zA-Z0-9_-]+)(?:\s+[^>]*?)?(\/?)>/g;
  let match: RegExpExecArray | null;

  // List of self-closing XML / SVG tags (tags that never have closing tags when self-closed)
  const selfClosingVoidTags = new Set(["path", "circle", "rect", "line", "polygon", "stop", "use", "image"]);

  while ((match = tagRegex.exec(xmlString)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    const isSelfClosing = match[2] === "/" || fullTag.endsWith("/>");
    const isClosingTag = fullTag.startsWith("</");

    // Skip XML comments and CDATA
    if (tagName.startsWith("!") || tagName.startsWith("?")) {
      continue;
    }

    if (isClosingTag) {
      const lastTag = tagStack.pop();
      if (lastTag !== tagName) {
        return { isValid: false, error: `Mismatched closing tag </${tagName}>, expected </${lastTag}>` };
      }
    } else if (!isSelfClosing && !selfClosingVoidTags.has(tagName)) {
      tagStack.push(tagName);
    }
  }

  if (tagStack.length > 0) {
    return { isValid: false, error: `Unclosed tags remaining: ${tagStack.join(", ")}` };
  }

  return { isValid: true };
}

describe("Milestone 3 — Challenger 2 Empirical Test Suite", () => {

  // =========================================================================
  // 1. SVG RENDERING ACROSS ALL 7 FAMILIES & INJECTION SAFETY
  // =========================================================================
  describe("1. SVG Rendering Across All 7 Families & Injection Safety", () => {

    const testContexts: Array<{ family: VisualFamily; context: any }> = [
      {
        family: "PROCESS",
        context: {
          topic: "Operating Systems",
          conceptTitle: "Process State Lifecycle Transition",
          academicTruth: "Processes transition between Ready, Running, and Blocked states via scheduler dispatches and I/O interrupts.",
          mechanismExplanation: "Ready state dispatches to Running, I/O waits in Blocked, and completion triggers Terminated.",
          slideNo: 1,
        },
      },
      {
        family: "SYSTEM_ARCHITECTURE",
        context: {
          topic: "Cloud Computing",
          conceptTitle: "Three-Tier High Availability Microservice Cluster",
          academicTruth: "Architecture separates Ingress Load Balancers, Application Service Pods, and Distributed Storage Engines.",
          mechanismExplanation: "Client HTTPS traffic routes through Gateway to stateless Services backed by Raft replicated storage.",
          slideNo: 2,
        },
      },
      {
        family: "DATA_FLOW",
        context: {
          topic: "Distributed Systems",
          conceptTitle: "Asynchronous Event Stream Ingestion Pipeline",
          academicTruth: "Sensors publish raw telemetry to Kafka topic partitions, processed by Flink streaming jobs, and sunk to ClickHouse.",
          mechanismExplanation: "Continuous sliding window aggregations filter anomalies before committing to analytical storage.",
          slideNo: 3,
        },
      },
      {
        family: "COMPARISON_MATRIX",
        context: {
          topic: "Algorithms",
          conceptTitle: "Hash Map vs Balanced Binary Search Tree",
          academicTruth: "Hash tables offer O(1) expected lookup but O(N) worst-case, while Red-Black trees guarantee strict O(log N).",
          mechanismExplanation: "Trade-offs contrast memory locality, collision handling, and ordered iteration capabilities.",
          slideNo: 4,
        },
      },
      {
        family: "CAUSE_EFFECT",
        context: {
          topic: "Network Reliability",
          conceptTitle: "TCP Congestion Collapse and Tail-Drop Cascades",
          academicTruth: "Buffer overflow triggers massive packet drops, causing simultaneous TCP timeouts and throughput collapse.",
          mechanismExplanation: "Queue saturation leads to packet discard, triggering global synchronization and sender back-off.",
          slideNo: 5,
        },
      },
      {
        family: "QUANTITATIVE",
        context: {
          topic: "Machine Learning",
          conceptTitle: "Learning Rate Scheduling and Loss Gradient Convergence",
          academicTruth: "Cosine annealing decay balances rapid initial gradient descent with fine-grained parameter stabilization.",
          mechanismExplanation: "Initial high learning rate escapes saddle points while exponential decay prevents oscillations near local minima.",
          slideNo: 6,
        },
      },
      {
        family: "HIERARCHY",
        context: {
          topic: "Software Architecture",
          conceptTitle: "Abstract Syntax Tree Grammar Taxonomy",
          academicTruth: "Compilation AST decomposes program root into statement lists, expression nodes, and literal token leaves.",
          mechanismExplanation: "Recursive descent parser builds hierarchical expression trees evaluating operator precedence.",
          slideNo: 7,
        },
      },
    ];

    it("renders valid, well-formed XML SVG across all 7 canonical families", () => {
      for (const { family, context } of testContexts) {
        const spec = generateVisualSpecification({ ...context, preferredFamily: family });
        expect(spec.visualFamily).toBe(family);
        expect(spec.svgMarkup).toBeDefined();

        const svg = spec.svgMarkup!;

        // 1. Root <svg> element with correct XML attributes
        expect(svg).toMatch(/^<svg\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
        expect(svg).toMatch(/<\/svg>$/);
        expect(svg).toContain('role="img"');

        // 2. ViewBox attributes match dimensions (800x450 by default)
        expect(svg).toContain('viewBox="0 0 800 450"');
        expect(svg).toContain('width="800"');
        expect(svg).toContain('height="450"');

        // 3. Accessibility metadata: title, desc, and aria-labelledby
        expect(svg).toContain(`vis-title-${spec.id}`);
        expect(svg).toContain(`vis-desc-${spec.id}`);
        expect(svg).toContain(`aria-labelledby="vis-title-${spec.id} vis-desc-${spec.id}"`);
        expect(svg).toContain(`<title id="vis-title-${spec.id}">`);
        expect(svg).toContain(`<desc id="vis-desc-${spec.id}">`);

        // 4. Focus question banner in footer
        expect(svg).toContain("Focus Question:");
        expect(svg).toContain(spec.studentFocusQuestion.slice(0, 40));

        // 5. XML Well-formedness check
        const xmlCheck = validateXmlWellFormedness(svg);
        expect(xmlCheck.isValid, `Family ${family} produced invalid XML: ${xmlCheck.error}`).toBe(true);
      }
    });

    it("renders custom dimensions accurately in viewBox and dimensions", () => {
      const spec = generateProcessVisual({
        topic: "Test",
        conceptTitle: "Custom Dimensions Test",
        slideNo: 99,
      });

      const customSvg = renderVisualSpecificationToSvg(spec, {
        width: 1024,
        height: 576,
        slideNo: 99,
      });

      expect(customSvg).toContain('width="1024"');
      expect(customSvg).toContain('height="576"');
      expect(customSvg).toContain('viewBox="0 0 1024 576"');
      expect(customSvg).toContain('role="img"');

      const xmlCheck = validateXmlWellFormedness(customSvg);
      expect(xmlCheck.isValid).toBe(true);
    });

    it("sanitizes malicious script tags and HTML injection attacks across all input fields", () => {
      const maliciousContext = {
        topic: "Security Invariants",
        conceptTitle: "Malicious <script>alert('pwn-title')</script> and <img src=x onerror=alert('xss')> Node",
        academicTruth: "Payload <svg/onload=alert('truth')> testing & unescaped quotes \" ' and <tags>.",
        mechanismExplanation: "Injected <iframe src='http://evil.com'></iframe> and &amp; &lt; entities.",
        slideNo: 1,
      };

      const spec = generateProcessVisual(maliciousContext);
      const svg = spec.svgMarkup!;

      // Verify no raw executable script or unescaped HTML tags exist
      expect(svg).not.toContain("<script>");
      expect(svg).not.toContain("</script>");
      expect(svg).not.toContain("<img src=x");
      expect(svg).not.toContain("<svg/onload");
      expect(svg).not.toContain("<iframe");
      expect(svg).not.toContain("</iframe>");

      // Verify characters were properly XML-escaped
      expect(svg).toContain("&lt;script&gt;");
      expect(svg).toContain("&lt;img src=x");
      expect(svg).toContain("&lt;iframe");

      // Verify the resulting SVG remains well-formed XML despite injection attempts
      const xmlCheck = validateXmlWellFormedness(svg);
      expect(xmlCheck.isValid, `Injection test produced malformed XML: ${xmlCheck.error}`).toBe(true);
    });

    it("handles extreme text edge cases (unicode, Arabic RTL, very long strings, special math symbols)", () => {
      const unicodeContext = {
        topic: "Quantum Field Theory & Entropy",
        conceptTitle: "Schrödinger Equation & Boltzmann Entropy: H = -∑ pᵢ ln pᵢ ∀i ∈ ℝ⁺",
        academicTruth: "دوال الحالة الديناميكية الحرارية والتحولات الطاقية في الأنظمة المغلقة.",
        mechanismExplanation: "A".repeat(500), // very long single-word text
        slideNo: 1,
      };

      const spec = generateVisualSpecification({
        ...unicodeContext,
        preferredFamily: "QUANTITATIVE",
      });

      expect(spec.svgMarkup).toBeDefined();
      expect(spec.svgMarkup).toContain("Schrödinger Equation");
      expect(spec.svgMarkup).toContain("role=\"img\"");

      const xmlCheck = validateXmlWellFormedness(spec.svgMarkup!);
      expect(xmlCheck.isValid).toBe(true);
    });
  });

  // =========================================================================
  // 2. GATE VISUAL UNIQUENESS EMPIRICAL VERIFICATION
  // =========================================================================
  describe("2. gateVisualUniqueness (GATE-14) Verification", () => {

    it("passes when all slides have distinct, concept-specific visual specifications", () => {
      const artifacts = [
        {
          slideNo: 1,
          contentJson: {
            visualSpec: generateProcessVisual({
              topic: "Compilers",
              conceptTitle: "Lexical Analysis & Tokenization",
              slideNo: 1,
            }),
          },
        },
        {
          slideNo: 2,
          contentJson: {
            visualSpec: generateSystemArchitectureVisual({
              topic: "Compilers",
              conceptTitle: "LLVM Intermediate Representation Architecture",
              slideNo: 2,
            }),
          },
        },
        {
          slideNo: 3,
          contentJson: {
            visualSpec: generateDataFlowVisual({
              topic: "Compilers",
              conceptTitle: "Register Allocation Data Flow Graph",
              slideNo: 3,
            }),
          },
        },
      ];

      const result = gateVisualUniqueness(artifacts);
      expect(result.gateKey).toBe("visual_uniqueness");
      expect(result.status).toBe("pass");
      expect(result.findings).toHaveLength(0);
    });

    it("detects and flags duplicate image URLs across multiple slides (with and without query params)", () => {
      const artifacts = [
        {
          slideNo: 1,
          contentJson: {
            visualSpec: {
              imageUrl: "https://iscarb.edu.sa/visuals/diagram-a.svg?session=101",
              title: "Cellular Respiration Overview",
            },
          },
        },
        {
          slideNo: 3,
          contentJson: {
            visualSpec: {
              imageUrl: "https://iscarb.edu.sa/visuals/diagram-a.svg?session=202",
              title: "Citric Acid Cycle Detail",
            },
          },
        },
        {
          slideNo: 5,
          contentJson: {
            visualSpec: {
              imageUrl: "https://iscarb.edu.sa/visuals/diagram-b.svg",
              title: "Oxidative Phosphorylation",
            },
          },
        },
      ];

      const result = gateVisualUniqueness(artifacts);
      expect(result.findings.length).toBe(2);
      expect(result.findings.some((f) => f.slideNo === 1 && f.message.includes("Image reused across 2 slides (1, 3)"))).toBe(true);
      expect(result.findings.some((f) => f.slideNo === 3 && f.message.includes("Image reused across 2 slides (1, 3)"))).toBe(true);
    });

    it("detects and flags all generic stock photo provider patterns", () => {
      const stockUrls = [
        { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80", provider: "Unsplash" },
        { url: "https://www.shutterstock.com/image-photo/futuristic-technology-concept-123456", provider: "Shutterstock" },
        { url: "https://media.gettyimages.com/id/139284729/vector/dna-helix.jpg", provider: "Getty" },
        { url: "https://www.istockphoto.com/vector/chemical-beaker-gm12345", provider: "iStock" },
        { url: "https://stock.adobe.com/images/business-handshake/2849102", provider: "Adobe Stock" },
        { url: "https://www.clipart.com/download/microscope-drawing.png", provider: "Clipart" },
      ];

      stockUrls.forEach((stock, idx) => {
        const artifacts = [
          {
            slideNo: idx + 1,
            contentJson: {
              visualSpec: {
                imageUrl: stock.url,
                title: `Valid Scientific Diagram Title For Slide ${idx + 1}`,
              },
            },
          },
        ];

        const result = gateVisualUniqueness(artifacts);
        expect(
          result.findings.some((f) => f.message.includes("Generic stock image source detected")),
          `Failed to detect generic stock URL for ${stock.provider}`
        ).toBe(true);
      });
    });

    it("flags overly generic visual titles (< 10 chars) when URL is present", () => {
      const artifacts = [
        {
          slideNo: 1,
          contentJson: {
            visualSpec: {
              imageUrl: "https://example.edu/diagram.png",
              title: "Diagram", // 7 chars
            },
          },
        },
        {
          slideNo: 2,
          contentJson: {
            visualSpec: {
              imageUrl: "https://example.edu/flowchart.png",
              title: "Flow", // 4 chars
            },
          },
        },
      ];

      const result = gateVisualUniqueness(artifacts);
      expect(result.findings.some((f) => f.slideNo === 1 && f.message.includes("Visual title is too generic"))).toBe(true);
      expect(result.findings.some((f) => f.slideNo === 2 && f.message.includes("Visual title is too generic"))).toBe(true);
    });

    it("flags semantic duplicate visual specifications with similarity >= 0.85", () => {
      const specOriginal = generateProcessVisual({
        topic: "Cryptography",
        conceptTitle: "Diffie-Hellman Key Exchange",
        academicTruth: "Alice and Bob establish a shared secret key over an insecure channel using modular exponentiation.",
        mechanismExplanation: "Prime modulus selection, public key computation, and shared secret derivation.",
        slideNo: 2,
      });

      const specDuplicate: VisualSpecification = {
        ...specOriginal,
        id: "dh-copy",
        title: "Sequential Dynamics: Diffie-Hellman Key Exchange Transformation",
        description: "Multi-stage state transition diagram illustrating the operational pipeline of Diffie-Hellman Key Exchange.",
        layout: specOriginal.layout,
        nodes: specOriginal.nodes.map((n) => ({ ...n })),
        connections: specOriginal.connections.map((c) => ({ ...c })),
        studentFocusQuestion: specOriginal.studentFocusQuestion,
        pedagogicalRationale: specOriginal.pedagogicalRationale,
      };

      const artifacts = [
        { slideNo: 2, contentJson: { visualSpec: specOriginal } },
        { slideNo: 8, contentJson: { visualSpec: specDuplicate } },
      ];

      const result = gateVisualUniqueness(artifacts);
      expect(result.findings.some((f) => f.slideNo === 8 && f.message.includes("semantically duplicate"))).toBe(true);
    });

    it("handles empty or malformed slide artifacts without crashing", () => {
      const edgeArtifacts = [
        { slideNo: 1, contentJson: {} },
        { slideNo: 2, contentJson: { visualSpec: null } },
        { slideNo: 3, contentJson: { visualSpec: undefined } },
        { slideNo: 4, contentJson: { visualSpec: "invalid-string" as any } },
      ];

      const result = gateVisualUniqueness(edgeArtifacts);
      expect(result.status).toBe("pass");
      expect(result.findings).toHaveLength(0);
    });
  });

  // =========================================================================
  // 3. PASS 10 VISUALS PIPELINE EXECUTION & COMPLETE SCHEMA VERIFICATION
  // =========================================================================
  describe("3. Pass 10 Visuals Pipeline Execution & Complete Schemas", () => {

    function createSampleElaboratedBlocks(count: number): ElaboratedBlock[] {
      const topics = [
        { title: "Raft Leader Election", truth: "Raft elects a single leader via majority heartbeat votes.", mech: "Followers transition to Candidate on timeout and broadcast RequestVote RPCs." },
        { title: "Distributed Key-Value Store", truth: "Consistent hashing distributes keys across node rings.", mech: "Virtual nodes prevent hash hotspot skew during cluster rebalancing." },
        { title: "Event Streaming Architecture", truth: "Kafka partitions enable horizontal publish-subscribe scaling.", mech: "Consumer groups track partition offsets to maintain parallel ordering." },
        { title: "ACID vs BASE Trade-offs", truth: "CAP theorem mandates choosing between consistency and availability.", mech: "Eventual consistency trades strict linearizability for low-latency partitions." },
        { title: "Byzantine Fault Tolerance", truth: "PBFT tolerates up to (N-1)/3 malicious traitor nodes.", mech: "Three-phase Pre-Prepare, Prepare, and Commit message exchanges verify consensus." },
        { title: "Microservice Ingress Gateway", truth: "API gateway decouples external clients from internal services.", mech: "Reverse proxy performs JWT authentication and rate-limiting." },
        { title: "Cache Coherence Invariants", truth: "MESI protocol coordinates L1/L2 caches via bus snooping.", mech: "Modified, Exclusive, Shared, and Invalid states maintain write serialization." },
      ];

      return Array.from({ length: count }, (_, i) => {
        const item = topics[i % topics.length];
        return {
          id: `block-${i + 1}`,
          experienceId: "exp-pipeline-test",
          title: item.title,
          slug: `concept-${i + 1}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          academicTruth: item.truth,
          intuitionMentalModel: `Mental model for ${item.title}`,
          mechanismExplanation: item.mech,
          realWorldTransfer: `Industrial application of ${item.title}`,
          misconceptionAlert: `Common misconception regarding ${item.title}`,
          orderIndex: i + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
    }

    it("executes Pass 10 on pipeline context and produces complete, valid VisualArtifacts", async () => {
      const blocks = createSampleElaboratedBlocks(7);
      const ctx: PipelineContext = {
        projectId: "proj-m3-verification",
        title: "Advanced Distributed Systems",
        topicDescription: "Principles and implementations of distributed consensus and replication.",
        elaboratedBlocks: blocks,
        visuals: [],
      };

      const resultCtx = await pass10Visuals.execute(ctx);

      expect(resultCtx.visuals).toBeDefined();
      expect(resultCtx.visuals?.length).toBe(7);

      // Verify each visual artifact conforms to the complete schema
      resultCtx.visuals?.forEach((visual: VisualArtifact, idx: number) => {
        const expectedBlock = blocks[idx];

        // 1. Core VisualArtifact fields
        expect(visual.id).toBe(`vis-art-${idx + 1}`);
        expect(visual.experienceId).toBe(ctx.projectId);
        expect(visual.conceptBlockId).toBe(expectedBlock.id);
        expect(CANONICAL_VISUAL_FAMILIES).toContain(visual.visualType);
        expect(visual.title.length).toBeGreaterThan(5);
        expect(visual.purpose.length).toBeGreaterThan(10);
        expect(visual.learningMessage.length).toBeGreaterThan(10);

        // 2. Native SVG properties
        expect(visual.assetSourceTier).toBe("NATIVE_SVG");
        expect(visual.sourcePriority).toBe(5);
        expect(visual.vectorSvgCode).toBeDefined();
        expect(visual.vectorSvgCode).toContain("<svg");
        expect(visual.vectorSvgCode).toContain('role="img"');
        expect(visual.vectorSvgCode).toContain("</svg>");

        // 3. Attribution and License
        expect(visual.licenseType).toBe("CREATIVE_COMMONS");
        expect(visual.attributionText).toContain("CC-BY-4.0");
        expect(visual.attribution).toBeDefined();
        expect(visual.attribution?.license).toBe("CC-BY-4.0");
        expect(visual.attribution?.domain).toBe("iscarb.edu.sa");

        // 4. Alt text & Order
        expect(visual.altText).toContain(expectedBlock.title);
        expect(visual.orderIndex).toBe(idx + 1);

        // 5. Block linkage
        expect(expectedBlock.visualId).toBe(visual.id);

        // 6. Specification JSON schema completeness
        const specJson = visual.specificationJson as any;
        expect(specJson).toBeDefined();
        expect(specJson.id).toBeDefined();
        expect(CANONICAL_VISUAL_FAMILIES).toContain(specJson.visualFamily);
        expect(specJson.nodes.length).toBeGreaterThanOrEqual(2);
        expect(specJson.connections).toBeDefined();
        expect(specJson.studentFocusQuestion.length).toBeGreaterThan(10);
        expect(specJson.pedagogicalRationale.length).toBeGreaterThan(10);
        expect(specJson.elements.length).toBe(specJson.nodes.length);
        expect(specJson.labels.length).toBe(specJson.nodes.length);

        // 7. XML Validation of SVG Markup
        const xmlCheck = validateXmlWellFormedness(visual.vectorSvgCode!);
        expect(xmlCheck.isValid, `Block ${idx + 1} SVG is malformed: ${xmlCheck.error}`).toBe(true);
      });
    });

    it("rotates through all 7 visual families across 7 or more blocks in Pass 10", async () => {
      const blocks = createSampleElaboratedBlocks(14); // 2 full cycles of 7 families
      const ctx: PipelineContext = {
        projectId: "proj-cycle-test",
        title: "Comprehensive Curriculum",
        elaboratedBlocks: blocks,
      };

      const result = await pass10Visuals.execute(ctx);
      expect(result.visuals?.length).toBe(14);

      const observedFamilies = new Set(result.visuals?.map((v) => v.visualType));
      expect(observedFamilies.size).toBe(7);

      for (const family of CANONICAL_VISUAL_FAMILIES) {
        expect(observedFamilies.has(family), `Missing family in pipeline output: ${family}`).toBe(true);
      }
    });

    it("executes cleanly when context has zero elaborated blocks", async () => {
      const ctx: PipelineContext = {
        projectId: "proj-empty",
        title: "Empty Project",
        elaboratedBlocks: [],
      };

      const result = await pass10Visuals.execute(ctx);
      expect(result.visuals).toBeDefined();
      expect(result.visuals?.length).toBe(0);
    });
  });

  // =========================================================================
  // 4. NVIDIA NIM VLM QUALITY GATE BOUNDARY & ERROR TESTS
  // =========================================================================
  describe("4. NVIDIA NIM VLM Quality Gate Boundary & Error Tests", () => {

    const baseContext = {
      topic: "Relational Database Management Systems",
      conceptTitle: "Two-Phase Locking (2PL) Concurrency Control Protocol",
      academicTruth: "Strict 2PL guarantees serializability and prevents cascading aborts by holding exclusive locks until transaction commit.",
      learningObjective: "Understand the growing and shrinking lock phases and deadlock detection mechanisms.",
    };

    it("verifies exact metric thresholds: Relevance >= 85, Educational >= 80, Consistency >= 90", () => {
      expect(NVIDIA_VLM_THRESHOLDS.RELEVANCE).toBe(85);
      expect(NVIDIA_VLM_THRESHOLDS.EDUCATIONAL_VALUE).toBe(80);
      expect(NVIDIA_VLM_THRESHOLDS.SCIENTIFIC_CONSISTENCY).toBe(90);
    });

    it("passes a fully coherent visual specification deterministically", () => {
      const spec: VisualSpecification = {
        id: "vis-2pl",
        visualFamily: "PROCESS",
        title: "Two-Phase Locking Protocol State Transition",
        description: "Growing phase acquiring locks and shrinking phase releasing locks at transaction commit.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "p1", label: "Growing Phase", description: "Acquires locks without releasing any" },
          { id: "p2", label: "Lock Point", description: "Maximum concurrency barrier" },
          { id: "p3", label: "Shrinking Phase", description: "Releases locks after commit" },
        ],
        connections: [
          { from: "p1", to: "p2", label: "acquire_lock" },
          { from: "p2", to: "p3", label: "commit_release" },
        ],
        studentFocusQuestion: "How does the shrinking phase guarantee serializability of conflicting transactions?",
        pedagogicalRationale: "Delineating the lock point clarifies why no new locks may be acquired once release begins.",
      };

      const result = evaluateVisualDeterministically(spec, baseContext);
      expect(result.scores.relevance).toBeGreaterThanOrEqual(85);
      expect(result.scores.educationalValue).toBeGreaterThanOrEqual(80);
      expect(result.scores.scientificConsistency).toBeGreaterThanOrEqual(90);
      expect(result.passed).toBe(true);
      expect(result.detectedErrors).toBeUndefined();
    });

    it("penalizes duplicate node IDs in scientific consistency", () => {
      const dupNodeSpec: VisualSpecification = {
        id: "vis-dup-nodes",
        visualFamily: "PROCESS",
        title: "Two-Phase Locking Protocol",
        description: "Transaction locking protocol",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "node-1", label: "Growing Phase" },
          { id: "node-1", label: "Duplicate ID Phase" }, // duplicate ID
          { id: "node-2", label: "Shrinking Phase" },
        ],
        connections: [
          { from: "node-1", to: "node-2", label: "transition" },
        ],
        studentFocusQuestion: "Why is serializability guaranteed?",
        pedagogicalRationale: "Pedagogical explanation.",
      };

      const result = evaluateVisualDeterministically(dupNodeSpec, baseContext);
      expect(result.scores.scientificConsistency).toBeLessThan(90);
      expect(result.passed).toBe(false);
      expect(result.detectedErrors?.some((e) => e.includes("Duplicate node ID"))).toBe(true);
    });

    it("penalizes unbalanced LaTeX syntax in rawLatexOrData", () => {
      const badLatexSpec: VisualSpecification = {
        id: "vis-bad-latex",
        visualFamily: "QUANTITATIVE",
        title: "Two-Phase Locking Throughput Curve",
        description: "Throughput degradation under high transaction lock contention.",
        layout: { type: "QUANTITATIVE", direction: "LR" },
        nodes: [
          { id: "q1", label: "Optimal Concurrency Limit" },
          { id: "q2", label: "Thrashing State Boundary" },
        ],
        connections: [
          { from: "q1", to: "q2", label: "contention_margin" },
        ],
        studentFocusQuestion: "Where does lock thrashing trigger performance collapse?",
        pedagogicalRationale: "Demonstrates non-linear degradation.",
        rawLatexOrData: "T(x) = \\frac{N}{1 + e^{-k(x - x_0)} $ unbalanced_dollar", // unbalanced dollar & braces
      };

      const result = evaluateVisualDeterministically(badLatexSpec, baseContext);
      expect(result.scores.scientificConsistency).toBeLessThan(90);
      expect(result.passed).toBe(false);
      expect(result.detectedErrors?.some((e) => e.includes("LaTeX"))).toBe(true);
    });

    it("evaluates live API network fallback gracefully without throwing", async () => {
      const spec = generateProcessVisual({
        topic: "Operating Systems",
        conceptTitle: "Process Scheduler",
        slideNo: 1,
      });

      // Point to a non-existent port to test network fallback
      const result = await evaluateVisual(
        spec,
        {
          topic: "Operating Systems",
          conceptTitle: "Process Scheduler",
          academicTruth: "Scheduler transitions processes between ready and running queues.",
        },
        {
          apiKey: "test-fake-key",
          baseUrl: "http://127.0.0.1:54321/invalid",
          timeoutMs: 500,
        }
      );

      expect(result).toBeDefined();
      expect(result.scores).toBeDefined();
      expect(typeof result.passed).toBe("boolean");
      expect(result.scores.relevance).toBeGreaterThanOrEqual(80);
    });
  });

  // =========================================================================
  // 5. MULTI-DOMAIN STEM & BUSINESS SYNTHESIS & GATE STATUS ESCALATION
  // =========================================================================
  describe("5. Multi-Domain STEM & Business Synthesis & Gate Status Escalation", () => {

    it("synthesizes valid visual specifications across all STEM & Business disciplines in Pass 10", async () => {
      const multiDisciplinaryBlocks: ElaboratedBlock[] = [
        // Mathematics
        {
          id: "blk-math",
          experienceId: "exp-multi",
          title: "Fourier Transform Frequency Decomposition",
          slug: "fourier-transform",
          academicTruth: "Continuous Fourier transform decomposes time-domain signals into continuous frequency spectra.",
          mechanismExplanation: "Integration against complex exponentials yields frequency magnitude and phase.",
          orderIndex: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Physics
        {
          id: "blk-phys",
          experienceId: "exp-multi",
          title: "Carnot Heat Engine Thermodynamic Cycle",
          slug: "carnot-cycle",
          academicTruth: "Carnot cycle achieves theoretical maximum efficiency between two thermal reservoirs.",
          mechanismExplanation: "Isothermal expansion, adiabatic expansion, isothermal compression, adiabatic compression.",
          orderIndex: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Chemistry
        {
          id: "blk-chem",
          experienceId: "exp-multi",
          title: "Enzyme Catalysis Michaelis-Menten Kinetics",
          slug: "michaelis-menten",
          academicTruth: "Reaction rate plateaus at Vmax as substrate saturation fills enzyme active sites.",
          mechanismExplanation: "Enzyme-substrate complex formation reaches steady-state equilibrium.",
          orderIndex: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Biology & Medicine
        {
          id: "blk-bio",
          experienceId: "exp-multi",
          title: "Neuron Action Potential Voltage-Gated Ion Dynamics",
          slug: "action-potential",
          academicTruth: "Sodium influx depolarizes membrane, followed by potassium efflux repolarization.",
          mechanismExplanation: "Threshold potential opens voltage-gated Na+ channels in an all-or-none response.",
          orderIndex: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Engineering
        {
          id: "blk-eng",
          experienceId: "exp-multi",
          title: "PID Controller Feedback Loop Dynamics",
          slug: "pid-controller",
          academicTruth: "Proportional, integral, and derivative terms minimize steady-state error and overshoot.",
          mechanismExplanation: "Error signal multiplies proportional gain, accumulated error integrates, and rate of change differentiates.",
          orderIndex: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Business / Finance
        {
          id: "blk-bus",
          experienceId: "exp-multi",
          title: "Discounted Cash Flow (DCF) Valuation Model",
          slug: "dcf-valuation",
          academicTruth: "Enterprise value equals the present sum of projected free cash flows discounted by WACC.",
          mechanismExplanation: "Terminal value calculation combines Gordon Growth Model with explicit forecast period.",
          orderIndex: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const ctx: PipelineContext = {
        projectId: "proj-stem-business",
        title: "Interdisciplinary STEM & Business Showcase",
        elaboratedBlocks: multiDisciplinaryBlocks,
      };

      const res = await pass10Visuals.execute(ctx);
      expect(res.visuals?.length).toBe(6);

      res.visuals?.forEach((v, idx) => {
        expect(v.vectorSvgCode).toBeDefined();
        expect(v.specificationJson).toBeDefined();
        expect((v.specificationJson as any).nodes.length).toBeGreaterThanOrEqual(2);
        const xmlCheck = validateXmlWellFormedness(v.vectorSvgCode!);
        expect(xmlCheck.isValid, `Discipline item ${idx + 1} SVG is malformed: ${xmlCheck.error}`).toBe(true);
      });
    });

    it("escalates gateVisualUniqueness status from 'pass' to 'warn' (1-4 findings) to 'fail' (>4 findings)", () => {
      // 1. Zero findings -> status 'pass' (with genuinely distinct domain topics)
      const domainTopics = [
        { topic: "Quantum Mechanics", conceptTitle: "Wave Function Superposition Collapse" },
        { topic: "Organic Chemistry", conceptTitle: "Electrophilic Aromatic Substitution" },
        { topic: "Macroeconomics", conceptTitle: "Central Bank Monetary Policy Transmission" },
      ];
      const passArtifacts = domainTopics.map((dt, i) => ({
        slideNo: i + 1,
        contentJson: {
          visualSpec: generateProcessVisual({ topic: dt.topic, conceptTitle: dt.conceptTitle, slideNo: i + 1 }),
        },
      }));
      const passResult = gateVisualUniqueness(passArtifacts);
      expect(passResult.status).toBe("pass");
      expect(passResult.findings.length).toBe(0);

      // 2. 1 to 4 findings -> status 'warn'
      const warnArtifacts = [
        { slideNo: 1, contentJson: { visualSpec: { imageUrl: "https://example.com/dup.svg", title: "Visual 1 with Good Length" } } },
        { slideNo: 2, contentJson: { visualSpec: { imageUrl: "https://example.com/dup.svg", title: "Visual 2 with Good Length" } } },
      ];
      const warnResult = gateVisualUniqueness(warnArtifacts);
      expect(warnResult.status).toBe("warn");
      expect(warnResult.findings.length).toBe(3);

      // 3. More than 4 findings -> status 'fail'
      const failArtifacts = [
        { slideNo: 1, contentJson: { visualSpec: { imageUrl: "https://images.unsplash.com/photo-1", title: "Short" } } },
        { slideNo: 2, contentJson: { visualSpec: { imageUrl: "https://images.unsplash.com/photo-2", title: "Short" } } },
        { slideNo: 3, contentJson: { visualSpec: { imageUrl: "https://images.unsplash.com/photo-3", title: "Short" } } },
      ];
      // 3 stock URLs (3 findings) + 3 generic titles (3 findings) = 6 findings total (>4)
      const failResult = gateVisualUniqueness(failArtifacts);
      expect(failResult.status).toBe("fail");
      expect(failResult.findings.length).toBeGreaterThan(4);
    });

    it("escapes attribute quotes and angle brackets in SVG text attributes", () => {
      const maliciousAttrText = 'Test "quote" & \'apos\' <tag> in label';
      const escaped = escapeXml(maliciousAttrText);

      expect(escaped).toContain("&quot;");
      expect(escaped).toContain("&apos;");
      expect(escaped).toContain("&amp;");
      expect(escaped).toContain("&lt;");
      expect(escaped).toContain("&gt;");
      expect(escaped).not.toContain('"quote"');
      expect(escaped).not.toContain("<tag>");
    });
  });

});
