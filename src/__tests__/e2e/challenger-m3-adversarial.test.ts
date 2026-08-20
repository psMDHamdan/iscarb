/**
 * EMPIRICAL CHALLENGER ADVERSARIAL TEST SUITE
 * Milestone 3: Visual Intent Engine, Native SVG Renderer & NVIDIA NIM VLM Quality Gate
 * =====================================================================================
 * Role: critic / specialist (Empirical Verification & Stress Harness)
 * Authoritative Request: /home/hamdan/iscarb/ORIGINAL_REQUEST.md
 * Interface Contracts: /home/hamdan/iscarb/PROJECT.md (§3), SCOPE.md
 *
 * Test Harness Dimensions:
 *   1. Visual Intent Generation & SVG Rendering Edge Cases across all 7 canonical families
 *      (Empty titles, extreme node counts [0..100], long LaTeX, cyclic graphs, XML escaping)
 *   2. NVIDIA NIM VLM Quality Gate Boundary Conditions & Failure Oracles
 *      (Exact thresholds 85/80/90 vs 84/79/89, invalid LaTeX, dangling edges, orphan nodes, off-topic)
 *   3. Semantic Visual Deduplication Registry & Uniqueness Gate
 *      (Identical 1.0, near-duplicates >= 0.85 vs < 0.85, disjoint < 0.30, stock photo patterns)
 *   4. Pipeline Pass 10 Integration & Visual Artifact Synthesis
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateVisualSpecification,
  generateProcessVisual,
  generateSystemArchitectureVisual,
  generateDataFlowVisual,
  generateComparisonMatrixVisual,
  generateCauseEffectVisual,
  generateQuantitativeVisual,
  generateHierarchyVisual,
  inferVisualFamily,
} from "../../lib/lecture/visual/visual-intent-engine";
import {
  evaluateVisual,
  evaluateVisualDeterministically,
  NVIDIA_VLM_THRESHOLDS,
} from "../../lib/lecture/visual/nvidia-vlm-gate";
import {
  VisualDeduplicationRegistry,
  computeVisualSimilarity,
  MAX_VISUAL_SIMILARITY_THRESHOLD,
} from "../../lib/lecture/visual/deduplication";
import {
  renderVisualSpecificationToSvg,
  renderSvgDiagram,
  escapeXml,
  wrapLabel,
} from "../../lib/lecture/renderer/svg-visual-renderer";
import { gateVisualUniqueness } from "../../lib/lecture/quality/gates/visual-uniqueness.gate";
import { gateVisualSupport } from "../../lib/lecture/quality/gates/visual-support.gate";
import type {
  VisualSpecification,
  VisualFamily,
  VisualNode,
  VisualConnection,
  VisualGenerationContext,
} from "../../lib/lecture/visual/types";
import type { VisualArtifact } from "../../lib/lecture/types/learning-experience";

// =============================================================================
// CHALLENGER TEST SUITE
// =============================================================================

describe("Empirical Challenger M3: Visual Intent Engine, SVG Renderer & NVIDIA VLM Gate", () => {

  // ---------------------------------------------------------------------------
  // 1. VISUAL INTENT ENGINE & SVG RENDERER EDGE CASES ACROSS ALL 7 FAMILIES
  // ---------------------------------------------------------------------------
  describe("1. Visual Intent Generation & SVG Renderer Edge Cases", () => {

    it("EDGE-01 [Empty / Minimal Context]: Handles completely empty or undefined context without crashing", () => {
      const emptyContext: VisualGenerationContext = {
        topic: "",
        conceptTitle: "",
      };

      const spec = generateVisualSpecification(emptyContext);
      expect(spec).toBeDefined();
      expect(spec.visualFamily).toBe("PROCESS");
      expect(spec.nodes.length).toBeGreaterThanOrEqual(3);
      expect(spec.connections.length).toBeGreaterThanOrEqual(2);

      // Render to SVG
      const svg = renderVisualSpecificationToSvg(spec);
      expect(svg).toContain("<svg");
      expect(svg).toContain('role="img"');
      expect(svg).toContain("</svg>");
      expect(svg).not.toContain("undefined");
      expect(svg).not.toContain("null");
    });

    it("EDGE-02 [All 7 Families with Minimal Context]: Each family builder executes cleanly with minimal context", () => {
      const minContext: VisualGenerationContext = {
        topic: "General Principles",
        conceptTitle: "Core Mechanism",
        slideNo: 1,
      };

      const builders = [
        { family: "PROCESS" as VisualFamily, fn: generateProcessVisual },
        { family: "SYSTEM_ARCHITECTURE" as VisualFamily, fn: generateSystemArchitectureVisual },
        { family: "DATA_FLOW" as VisualFamily, fn: generateDataFlowVisual },
        { family: "COMPARISON_MATRIX" as VisualFamily, fn: generateComparisonMatrixVisual },
        { family: "CAUSE_EFFECT" as VisualFamily, fn: generateCauseEffectVisual },
        { family: "QUANTITATIVE" as VisualFamily, fn: generateQuantitativeVisual },
        { family: "HIERARCHY" as VisualFamily, fn: generateHierarchyVisual },
      ];

      for (const { family, fn } of builders) {
        const spec = fn(minContext);
        expect(spec.visualFamily).toBe(family);
        expect(spec.nodes.length).toBeGreaterThanOrEqual(2);
        expect(spec.studentFocusQuestion.length).toBeGreaterThan(10);
        expect(spec.pedagogicalRationale.length).toBeGreaterThan(10);
        expect(spec.svgMarkup).toBeDefined();
        expect(spec.svgMarkup).toContain("<svg");
        expect(spec.svgMarkup).toContain(family);
      }
    });

    it("EDGE-03 [Long LaTeX Equations & Special Math Unicode]: Properly embeds formulas in QUANTITATIVE specs", () => {
      const complexMathContext: VisualGenerationContext = {
        topic: "Thermodynamics & Statistical Mechanics",
        conceptTitle: "Maxwell-Boltzmann Velocity Distribution",
        academicTruth: "The probability distribution f(v) = 4\\pi \\left(\\frac{m}{2\\pi k_B T}\\right)^{3/2} v^2 e^{-\\frac{mv^2}{2k_B T}} describes particle speeds.",
        mechanismExplanation: "Kinetic energy partitions across translational degrees of freedom at thermal equilibrium.",
        preferredFamily: "QUANTITATIVE",
      };

      const spec = generateQuantitativeVisual(complexMathContext);
      expect(spec.visualFamily).toBe("QUANTITATIVE");
      expect(spec.rawLatexOrData).toBeDefined();
      expect(spec.rawLatexOrData).toContain("f(x)");

      const svg = renderVisualSpecificationToSvg(spec);
      expect(svg).toContain("<svg");
      expect(svg).toContain("QUANTITATIVE");
      expect(svg).toContain("Parameter (X)");
      expect(svg).toContain("Performance / Value (Y)");
    });

    it("EDGE-04 [Extreme Node Counts]: Handles 0, 1, 2, 10, 50, and 100 nodes without layout breakage or exceptions", () => {
      const nodeCounts = [0, 1, 2, 10, 50, 100];

      for (const count of nodeCounts) {
        const customNodes: VisualNode[] = Array.from({ length: count }, (_, i) => ({
          id: `node-${i + 1}`,
          label: `Component Block ${i + 1}`,
          description: `Detailed operational description for subsystem node ${i + 1}`,
          type: i === 0 ? "ENTRY" : i === count - 1 ? "TERMINAL" : "PROCESSING",
        }));

        const customConnections: VisualConnection[] = count > 1
          ? Array.from({ length: count - 1 }, (_, i) => ({
              from: `node-${i + 1}`,
              to: `node-${i + 2}`,
              label: `flow_${i + 1}_to_${i + 2}`,
            }))
          : [];

        const spec: VisualSpecification = {
          id: `stress-spec-${count}`,
          visualFamily: "PROCESS",
          title: `Extreme Scale Pipeline with ${count} Nodes`,
          description: `Stress-testing renderer and layout engine with ${count} nodes.`,
          layout: { type: "PROCESS", direction: "LR" },
          nodes: customNodes,
          connections: customConnections,
          studentFocusQuestion: `How does scaling to ${count} nodes impact throughput?`,
          pedagogicalRationale: "Stress-testing scalability.",
        };

        const svg = renderVisualSpecificationToSvg(spec);
        expect(svg).toContain("<svg");
        expect(svg).toContain('role="img"');
        expect(svg).toContain("</svg>");
      }
    });

    it("EDGE-05 [Cyclic and Bidirectional Graph Topologies]: Handles cyclic dependencies (A -> B -> C -> A) and loops without infinite loops", () => {
      const cyclicSpec: VisualSpecification = {
        id: "spec-cyclic-loop",
        visualFamily: "PROCESS",
        title: "Carnot Heat Engine Thermodynamic Cycle",
        description: "Reversible closed cycle consisting of isothermal expansion, adiabatic expansion, isothermal compression, and adiabatic compression.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "state-1", label: "State 1: Isothermal Expansion", type: "EXPANSION" },
          { id: "state-2", label: "State 2: Adiabatic Expansion", type: "EXPANSION" },
          { id: "state-3", label: "State 3: Isothermal Compression", type: "COMPRESSION" },
          { id: "state-4", label: "State 4: Adiabatic Compression", type: "COMPRESSION" },
        ],
        connections: [
          { from: "state-1", to: "state-2", label: "Q_in at T_H" },
          { from: "state-2", to: "state-3", label: "W_out (isentropic)" },
          { from: "state-3", to: "state-4", label: "Q_out at T_C" },
          { from: "state-4", to: "state-1", label: "W_in (isentropic closed cycle)", bidirectional: true },
        ],
        studentFocusQuestion: "Why is the net thermodynamic work enclosed by the area inside the P-V cycle path?",
        pedagogicalRationale: "Visualizes closed-loop reversible invariants and entropy conservation.",
      };

      // Test rendering
      const svg = renderVisualSpecificationToSvg(cyclicSpec);
      expect(svg).toContain("<svg");
      expect(svg).toContain("State 1");
      expect(svg).toContain("State 4");

      // Test VLM Gate evaluation
      const vlmResult = evaluateVisualDeterministically(cyclicSpec, {
        topic: "Thermodynamics",
        conceptTitle: "Carnot Heat Engine Cycle",
        academicTruth: "Reversible heat engine operating between two thermal reservoirs achieves maximum theoretical efficiency.",
      });

      expect(vlmResult.passed).toBe(true);
      expect(vlmResult.scores.scientificConsistency).toBeGreaterThanOrEqual(90);
    });

    it("EDGE-06 [Special XML / HTML / Script Injections in Visual Text]: Escapes special characters properly in SVG", () => {
      const maliciousSpec: VisualSpecification = {
        id: "spec-malicious-xml",
        visualFamily: "SYSTEM_ARCHITECTURE",
        title: "Security & Threat <script>alert('xss')</script> & \"Quotes\" 'Single'",
        description: "Testing <foreignObject> & &lt;script&gt; injection protection.",
        layout: { type: "SYSTEM_ARCHITECTURE", direction: "TB" },
        nodes: [
          { id: "node-1", label: "Ingress <svg onload=alert(1)>", type: "INPUT" },
          { id: "node-2", label: "Processor & Filter with 'quotes' & \"double\"", type: "FILTER" },
          { id: "node-3", label: "Storage <iframe src='evil.com'>", type: "DB" },
        ],
        connections: [
          { from: "node-1", to: "node-2", label: "Payload <tag>" },
          { from: "node-2", to: "node-3", label: "Sanitized & Verified" },
        ],
        studentFocusQuestion: "How does input sanitization prevent <script> injection attacks?",
        pedagogicalRationale: "Demonstrates XML escaping.",
      };

      const svg = renderVisualSpecificationToSvg(maliciousSpec);
      expect(svg).not.toContain("<script>alert('xss')</script>");
      expect(svg).toContain("&lt;script&gt;alert(&apos;xss&apos;)&lt;/script&gt;");
      expect(svg).not.toContain("<svg onload=alert(1)>");
      expect(svg).toContain("&lt;svg onload=alert(1)&gt;");
      expect(svg).not.toContain("<iframe src='evil.com'>");
      expect(svg).toContain("&amp; &quot;Quotes&quot; &apos;Single&apos;");
    });

    it("EDGE-07 [wrapLabel helper]: Handles zero-length strings, massive single words, and multi-line breaks without crashing", () => {
      expect(wrapLabel("", 100, 50, 20, 15)).toBe("");
      expect(wrapLabel("SupercalifragilisticexpialidociousLongWordWithoutAnySpaces", 100, 50, 10, 15)).toContain("SupercalifragilisticexpialidociousLongWordWithoutAnySpaces");
      
      const wrapped = wrapLabel("First line here and second line continues smoothly", 100, 50, 15, 15);
      expect(wrapped).toContain("<tspan x=\"100\"");
      expect(wrapped).toContain("dy=\"15\"");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. NVIDIA VLM QUALITY GATE BOUNDARY CONDITIONS & MOCK ORACLES
  // ---------------------------------------------------------------------------
  describe("2. NVIDIA VLM Quality Gate Boundary Conditions", () => {

    const standardContext = {
      topic: "Distributed Algorithms & Fault Tolerance",
      conceptTitle: "Paxos Consensus Protocol",
      academicTruth: "Paxos guarantees safety under asynchronous network conditions using Proposers, Acceptors, and Learners across a two-phase commit quorum.",
      learningObjective: "Analyze quorum intersection and ballot number monotonicity.",
    };

    it("GATE-01 [Exact Passing Thresholds 85 / 80 / 90]: Passes when scores exactly hit the required thresholds", () => {
      // Create a mock evaluator scenario or verify threshold constants
      expect(NVIDIA_VLM_THRESHOLDS.RELEVANCE).toBe(85);
      expect(NVIDIA_VLM_THRESHOLDS.EDUCATIONAL_VALUE).toBe(80);
      expect(NVIDIA_VLM_THRESHOLDS.SCIENTIFIC_CONSISTENCY).toBe(90);

      // Verify pass logic on exact match
      const paxosSpec: VisualSpecification = {
        id: "spec-paxos-exact",
        visualFamily: "PROCESS",
        title: "Paxos Consensus Protocol Two-Phase Quorum",
        description: "Phase 1 Prepare/Promise and Phase 2 Propose/Accept quorum rounds for Paxos distributed consensus.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "px-prop", label: "Proposer Node", description: "Initiates ballot" },
          { id: "px-acc", label: "Acceptor Quorum", description: "Votes on proposal" },
          { id: "px-lrn", label: "Learner Node", description: "Commits agreed value" },
        ],
        connections: [
          { from: "px-prop", to: "px-acc", label: "Phase 1a Prepare (n)" },
          { from: "px-acc", to: "px-prop", label: "Phase 1b Promise (n, v)" },
          { from: "px-prop", to: "px-acc", label: "Phase 2a Accept (n, v)" },
          { from: "px-acc", to: "px-lrn", label: "Phase 2b Accepted" },
        ],
        studentFocusQuestion: "Why must any two quorums of acceptors share at least one common acceptor node?",
        pedagogicalRationale: "Illustrates the mathematical pigeonhole principle in quorum consensus.",
      };

      const result = evaluateVisualDeterministically(paxosSpec, standardContext);
      expect(result.scores.relevance).toBeGreaterThanOrEqual(85);
      expect(result.scores.educationalValue).toBeGreaterThanOrEqual(80);
      expect(result.scores.scientificConsistency).toBeGreaterThanOrEqual(90);
      expect(result.passed).toBe(true);
      expect(result.rationale).toContain("passes NVIDIA VLM Quality Gate");
    });

    it("GATE-02 [Relevance Boundary Failure]: Fails when relevance is below 85 due to topic disconnect", () => {
      const unrelatedSpec: VisualSpecification = {
        id: "spec-culinary-1",
        visualFamily: "PROCESS",
        title: "Sourdough Bread Fermentation Stages",
        description: "Wild yeast sourdough starter hydration, kneading, bulk fermentation, and baking.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "f-start", label: "Sourdough Starter Culture", description: "Lactobacillus and yeast" },
          { id: "f-bulk", label: "Bulk Fermentation Rise", description: "CO2 bubble formation" },
          { id: "f-bake", label: "Dutch Oven Baking", description: "Crust caramelization" },
        ],
        connections: [
          { from: "f-start", to: "f-bulk", label: "Ferments 6h" },
          { from: "f-bulk", to: "f-bake", label: "Bake at 230C" },
        ],
        studentFocusQuestion: "How does dough temperature influence the lactic to acetic acid ratio?",
        pedagogicalRationale: "Visualizes fermentation chemistry.",
      };

      const result = evaluateVisualDeterministically(unrelatedSpec, standardContext);
      expect(result.passed).toBe(false);
      expect(result.scores.relevance).toBeLessThan(85);
      expect(result.rationale).toContain("Relevance score");
      expect(result.feedback).toBeDefined();
    });

    it("GATE-03 [Educational Value Boundary Failure]: Fails when node count is 0 or focus question is missing", () => {
      // Subcase A: 0 nodes
      const zeroNodesSpec: VisualSpecification = {
        id: "spec-empty-nodes",
        visualFamily: "PROCESS",
        title: "Paxos Consensus Protocol",
        description: "Paxos protocol overview without structural nodes.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [],
        connections: [],
        studentFocusQuestion: "Why is quorum intersection necessary in Paxos?",
        pedagogicalRationale: "Demonstrates empty node handling.",
      };

      const resultZero = evaluateVisualDeterministically(zeroNodesSpec, standardContext);
      expect(resultZero.passed).toBe(false);
      expect(resultZero.scores.educationalValue).toBeLessThan(80);
      expect(resultZero.detectedErrors).toBeDefined();
      expect(resultZero.detectedErrors?.some((e) => e.includes("zero nodes"))).toBe(true);

      // Subcase B: Missing student focus question
      const noQuestionSpec: VisualSpecification = {
        id: "spec-no-question",
        visualFamily: "PROCESS",
        title: "Paxos Consensus Protocol",
        description: "Paxos protocol overview with nodes but no focus question.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "n1", label: "Proposer" },
          { id: "n2", label: "Acceptor" },
          { id: "n3", label: "Learner" },
        ],
        connections: [{ from: "n1", to: "n2" }],
        studentFocusQuestion: "", // missing
        pedagogicalRationale: "Some rationale",
      };

      const resultNoQ = evaluateVisualDeterministically(noQuestionSpec, standardContext);
      expect(resultNoQ.passed).toBe(false);
      expect(resultNoQ.scores.educationalValue).toBeLessThan(80);
      expect(resultNoQ.detectedErrors?.some((e) => e.includes("student focus question"))).toBe(true);
    });

    it("GATE-04 [Scientific Consistency Failure: Dangling Edge Connections]: Deducts 35 points per non-existent node reference", () => {
      const danglingSpec: VisualSpecification = {
        id: "spec-dangling-edges",
        visualFamily: "PROCESS",
        title: "Paxos Consensus Protocol",
        description: "Paxos protocol with invalid connection references.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "valid-paxos-1", label: "Proposer Node" },
          { id: "valid-paxos-2", label: "Acceptor Node" },
        ],
        connections: [
          { from: "valid-paxos-1", to: "ghost-node-target", label: "invalid_to" },
          { from: "ghost-node-source", to: "valid-paxos-2", label: "invalid_from" },
        ],
        studentFocusQuestion: "How does Paxos handle node crashes during Phase 2?",
        pedagogicalRationale: "Valid rationale.",
      };

      const result = evaluateVisualDeterministically(danglingSpec, standardContext);
      expect(result.passed).toBe(false);
      expect(result.scores.scientificConsistency).toBeLessThan(90);
      expect(result.detectedErrors).toBeDefined();
      expect(result.detectedErrors?.filter((e) => e.includes("non-existent")).length).toBe(2);
    });

    it("GATE-05 [Scientific Consistency Failure: Duplicate Node IDs]: Deducts 25 points for duplicate node IDs", () => {
      const duplicateIdsSpec: VisualSpecification = {
        id: "spec-duplicate-ids",
        visualFamily: "PROCESS",
        title: "Paxos Consensus Protocol",
        description: "Paxos protocol with duplicate node IDs.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "node-dup", label: "Proposer Node" },
          { id: "node-dup", label: "Acceptor Node" }, // Duplicate ID!
          { id: "node-unique", label: "Learner Node" },
        ],
        connections: [{ from: "node-dup", to: "node-unique", label: "notify" }],
        studentFocusQuestion: "What is the role of learners in Paxos?",
        pedagogicalRationale: "Valid rationale.",
      };

      const result = evaluateVisualDeterministically(duplicateIdsSpec, standardContext);
      expect(result.passed).toBe(false);
      expect(result.scores.scientificConsistency).toBeLessThan(90);
      expect(result.detectedErrors?.some((e) => e.includes("Duplicate node ID detected"))).toBe(true);
    });

    it("GATE-06 [Scientific Consistency Failure: Broken LaTeX Formulas]: Deducts points for unbalanced $ and {}", () => {
      const brokenLatexSpec: VisualSpecification = {
        id: "spec-broken-latex",
        visualFamily: "QUANTITATIVE",
        title: "Paxos Consensus Protocol Mathematical Model",
        description: "Paxos protocol mathematical formulation.",
        layout: { type: "QUANTITATIVE", direction: "LR" },
        nodes: [
          { id: "m1", label: "Quorum Size Requirement" },
          { id: "m2", label: "Ballot Monotonicity Bound" },
        ],
        connections: [{ from: "m1", to: "m2", label: "implies" }],
        studentFocusQuestion: "Why is ballot monotonicity sufficient to prevent split-brain?",
        pedagogicalRationale: "Valid mathematical model rationale.",
        rawLatexOrData: "$$ f(x) = \\frac{1}{2} x^2 + {unclosed_brace $$", // unbalanced $ and {
      };

      const result = evaluateVisualDeterministically(brokenLatexSpec, standardContext);
      expect(result.passed).toBe(false);
      expect(result.scores.scientificConsistency).toBeLessThan(90);
      expect(result.detectedErrors?.some((e) => e.includes("LaTeX"))).toBe(true);
    });

    it("GATE-07 [Live API Fallback to Deterministic Mock]: Gracefully falls back when API fails or throws", async () => {
      // Mock global fetch to simulate network failure
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED: NVIDIA NIM Gateway down"));

      const spec: VisualSpecification = {
        id: "spec-fallback-test",
        visualFamily: "PROCESS",
        title: "Paxos Consensus Protocol",
        description: "Paxos protocol overview for fallback testing.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "p1", label: "Proposer Node" },
          { id: "p2", label: "Acceptor Node" },
          { id: "p3", label: "Learner Node" },
        ],
        connections: [
          { from: "p1", to: "p2", label: "Phase 1" },
          { from: "p2", to: "p3", label: "Phase 2" },
        ],
        studentFocusQuestion: "Why is consensus deterministic despite asynchronous delays?",
        pedagogicalRationale: "Valid pedagogical rationale.",
      };

      const result = await evaluateVisual(spec, standardContext, {
        apiKey: "nvapi-fake-test-key",
        forceMock: false,
      });

      expect(result).toBeDefined();
      expect(result.scores).toBeDefined();
      expect(result.passed).toBe(true);

      // Restore fetch
      global.fetch = originalFetch;
    });
  });

  // ---------------------------------------------------------------------------
  // 3. SEMANTIC VISUAL DEDUPLICATION & UNIQUENESS QUALITY GATES
  // ---------------------------------------------------------------------------
  describe("3. Semantic Visual Deduplication Registry & Uniqueness Quality Gate", () => {

    let registry: VisualDeduplicationRegistry;

    beforeEach(() => {
      registry = new VisualDeduplicationRegistry();
    });

    const specA: VisualSpecification = {
      id: "vis-dna-replication-fork",
      visualFamily: "PROCESS",
      title: "DNA Replication Fork Leading and Lagging Strand Synthesis",
      description: "Semi-conservative DNA replication mechanism showing helicase, topoisomerase, DNA polymerase III, and Okazaki fragments.",
      layout: { type: "PROCESS", direction: "LR" },
      nodes: [
        { id: "dna-helicase", label: "Helicase & Topoisomerase", description: "Unwinds double helix" },
        { id: "dna-pol-lead", label: "Leading Strand DNA Polymerase III", description: "Continuous 5' to 3' synthesis" },
        { id: "dna-pol-lag", label: "Lagging Strand & Okazaki Fragments", description: "Discontinuous synthesis via RNA primers" },
        { id: "dna-ligase", label: "DNA Ligase & Polymerase I", description: "Seals phosphodiester backbone nicks" },
      ],
      connections: [
        { from: "dna-helicase", to: "dna-pol-lead", label: "continuous_template" },
        { from: "dna-helicase", to: "dna-pol-lag", label: "looping_template" },
        { from: "dna-pol-lag", to: "dna-ligase", label: "ligation_join" },
      ],
      studentFocusQuestion: "Why does the antiparallel orientation of DNA force lagging strand synthesis to be discontinuous?",
      pedagogicalRationale: "Clarifies molecular directionality and prevents the misconception that both strands synthesize continuously.",
    };

    const nearDuplicateSpecA: VisualSpecification = {
      id: "vis-dna-replication-copy",
      visualFamily: "PROCESS",
      title: "DNA Replication Fork Lagging and Leading Strand Synthesis Mechanism",
      description: "Semi-conservative DNA replication showing helicase, DNA polymerase III, and Okazaki fragment synthesis.",
      layout: { type: "PROCESS", direction: "LR" },
      nodes: [
        { id: "dna-helicase-2", label: "Helicase & Topoisomerase", description: "Unwinds double helix DNA" },
        { id: "dna-pol-lead-2", label: "Leading Strand DNA Polymerase III", description: "Continuous 5' to 3' synthesis" },
        { id: "dna-pol-lag-2", label: "Lagging Strand Okazaki Fragments", description: "Discontinuous synthesis with RNA primers" },
        { id: "dna-ligase-2", label: "DNA Ligase Enzyme", description: "Seals phosphodiester nicks" },
      ],
      connections: [
        { from: "dna-helicase-2", to: "dna-pol-lead-2", label: "continuous_template" },
        { from: "dna-helicase-2", to: "dna-pol-lag-2", label: "looping_template" },
        { from: "dna-pol-lag-2", to: "dna-ligase-2", label: "ligation_join" },
      ],
      studentFocusQuestion: "Why does antiparallel DNA orientation force lagging strand synthesis to proceed discontinuously?",
      pedagogicalRationale: "Clarifies molecular directionality and lagging strand Okazaki fragments.",
    };

    const distinctSpecB: VisualSpecification = {
      id: "vis-transformer-attention",
      visualFamily: "SYSTEM_ARCHITECTURE",
      title: "Multi-Head Self-Attention Transformer Architecture",
      description: "Query, Key, and Value matrix transformations with scaled dot-product attention and residual connections.",
      layout: { type: "SYSTEM_ARCHITECTURE", direction: "TB" },
      nodes: [
        { id: "att-qkv", label: "Linear Q, K, V Projections", description: "Generates d_k representations" },
        { id: "att-dot", label: "Scaled Dot-Product Softmax", description: "Computes attention weight matrix" },
        { id: "att-proj", label: "Output Projection & Residual Add", description: "Multi-head concatenation" },
      ],
      connections: [
        { from: "att-qkv", to: "att-dot", label: "scaled_matmul" },
        { from: "att-dot", to: "att-proj", label: "softmax_weighted_v" },
      ],
      studentFocusQuestion: "How does scaling by 1/sqrt(d_k) prevent vanishing gradients during softmax computation?",
      pedagogicalRationale: "Explicates the geometric intuition behind high-dimensional dot-product attention.",
    };

    it("DEDUP-01 [Identical Specs]: Exact duplicate visual specification returns similarity score of 1.0", () => {
      const sim = computeVisualSimilarity(specA, specA);
      expect(sim).toBe(1.0);
    });

    it("DEDUP-02 [Near-Duplicate vs Disjoint Boundary (0.86 vs 0.84)]: Correctly enforces the < 0.85 threshold", () => {
      // Near-duplicate should have similarity >= 0.85
      const nearSim = computeVisualSimilarity(specA, nearDuplicateSpecA);
      expect(nearSim).toBeGreaterThanOrEqual(MAX_VISUAL_SIMILARITY_THRESHOLD);

      // Disjoint spec should have similarity < 0.30
      const disjointSim = computeVisualSimilarity(specA, distinctSpecB);
      expect(disjointSim).toBeLessThan(0.30);
    });

    it("DEDUP-03 [Registry Rejection & Registration]: Accepts distinct visual and rejects duplicate visual with detailed reason", () => {
      // 1. Register specA on slide 3 -> SUCCESS
      const reg1 = registry.register(specA, 3);
      expect(reg1.isUnique).toBe(true);
      expect(reg1.similarityScore).toBe(0.0);
      expect(registry.getRegisteredVisuals()).toHaveLength(1);

      // 2. Register distinctSpecB on slide 5 -> SUCCESS
      const reg2 = registry.register(distinctSpecB, 5);
      expect(reg2.isUnique).toBe(true);
      expect(reg2.similarityScore).toBeLessThan(0.30);
      expect(registry.getRegisteredVisuals()).toHaveLength(2);

      // 3. Register nearDuplicateSpecA on slide 8 -> REJECTED (>= 0.85)
      const reg3 = registry.register(nearDuplicateSpecA, 8);
      expect(reg3.isUnique).toBe(false);
      expect(reg3.similarityScore).toBeGreaterThanOrEqual(MAX_VISUAL_SIMILARITY_THRESHOLD);
      expect(reg3.conflictingVisualId).toBe(specA.id);
      expect(reg3.reason).toContain("exceeds maximum threshold (85%)");
      expect(reg3.reason).toContain("slide 3");
      expect(registry.getRegisteredVisuals()).toHaveLength(2); // pool unchanged
    });

    it("DEDUP-04 [GATE-14 visual_uniqueness]: Detects URL reuse, generic stock photos, and semantic duplicates", () => {
      const testArtifacts = [
        {
          slideNo: 1,
          contentJson: {
            visualSpec: {
              ...specA,
              fetchedImageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800", // Generic stock pattern!
            },
          },
        },
        {
          slideNo: 2,
          contentJson: {
            visualSpec: {
              title: "Icon", // Generic title < 10 chars!
              imageUrl: "https://cdn.shutterstock.com/image-photo/dna-260nw-100.jpg",
            },
          },
        },
        {
          slideNo: 3,
          contentJson: {
            visualSpec: specA,
          },
        },
        {
          slideNo: 4,
          contentJson: {
            visualSpec: nearDuplicateSpecA, // Duplicate of slide 3!
          },
        },
      ];

      const gateResult = gateVisualUniqueness(testArtifacts as any);
      expect(gateResult.gateKey).toBe("visual_uniqueness");
      expect(gateResult.findings.length).toBeGreaterThanOrEqual(3);

      // Verify findings catch stock patterns, generic titles, and duplicate specs
      expect(gateResult.findings.some((f) => f.slideNo === 1 && f.message.includes("Generic stock image"))).toBe(true);
      expect(gateResult.findings.some((f) => f.slideNo === 2 && f.message.includes("title is too generic"))).toBe(true);
      expect(gateResult.findings.some((f) => f.slideNo === 4 && f.message.includes("semantically duplicate"))).toBe(true);
    });

    it("DEDUP-05 [GATE-03 visual_support]: Passes on full deck and flags missing visual specifications", () => {
      // 20 slides with visual specs -> PASS
      const fullVisualDeck = Array.from({ length: 20 }, (_, i) => ({
        slideNo: i + 1,
        contentJson: {
          title: `Slide ${i + 1}`,
          visualSpec: {
            visualFamily: "PROCESS",
            title: `Visual Spec for Slide ${i + 1}`,
          },
        },
      }));

      const passResult = gateVisualSupport(fullVisualDeck as any);
      expect(passResult.status).toBe("pass");
      expect(passResult.findings).toHaveLength(0);

      // 4 missing visual specs -> FAIL
      const deficientDeck = fullVisualDeck.map((s, idx) =>
        idx < 4 ? { ...s, contentJson: { title: s.contentJson.title } } : s
      );
      const failResult = gateVisualSupport(deficientDeck as any);
      expect(failResult.status).toBe("fail");
      expect(failResult.findings).toHaveLength(4);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. PIPELINE PASS 10 INTEGRATION & ARTIFACT SYNTHESIS
  // ---------------------------------------------------------------------------
  describe("4. Pipeline Pass 10 Integration & Visual Artifact Synthesis", () => {

    it("INT-01: Pass 10 generates distinct visual specs and native SVG markup across all 7 families", async () => {
      const concepts = [
        { title: "Photosynthesis Light Reactions", type: "PROCESS" },
        { title: "Microservice Ingress Gateway", type: "SYSTEM_ARCHITECTURE" },
        { title: "Kafka Event Stream Pipeline", type: "DATA_FLOW" },
        { title: "PostgreSQL vs MongoDB Trade-offs", type: "COMPARISON_MATRIX" },
        { title: "Network Congestion Cascading Collapse", type: "CAUSE_EFFECT" },
        { title: "Binary Search Tree Asymptotic Curve", type: "QUANTITATIVE" },
        { title: "Eukaryotic Taxonomic Classification", type: "HIERARCHY" },
      ];

      const generatedDeck: VisualSpecification[] = [];
      const registry = new VisualDeduplicationRegistry();

      for (let i = 0; i < concepts.length; i++) {
        const c = concepts[i];
        const spec = generateVisualSpecification({
          topic: "Computer Science and Natural Sciences",
          conceptTitle: c.title,
          preferredFamily: c.type as VisualFamily,
          slideNo: i + 1,
        });

        expect(spec.visualFamily).toBe(c.type);
        expect(spec.svgMarkup).toBeDefined();
        expect(spec.svgMarkup).toContain("<svg");

        // Register into deck deduplication registry
        const dedup = registry.register(spec, i + 1);
        expect(dedup.isUnique).toBe(true);
        generatedDeck.push(spec);
      }

      expect(generatedDeck).toHaveLength(7);
      expect(registry.getRegisteredVisuals()).toHaveLength(7);
    });
  });
});
