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
  inferVisualFamily,
} from "../visual-intent-engine";
import { CANONICAL_VISUAL_FAMILIES } from "../types";
import { renderVisualSpecificationToSvg, renderSvgDiagram } from "../../renderer/svg-visual-renderer";

describe("Visual Intent Engine", () => {
  const sampleContext = {
    topic: "Distributed Consensus Protocols",
    conceptTitle: "Raft Leader Election & Log Replication",
    academicTruth: "Raft achieves consensus by electing a distinguished leader who manages the replicated log across cluster nodes.",
    intuitionMentalModel: "Think of Raft as a parliamentary election where a majority vote is required to pass laws.",
    mechanismExplanation: "Followers transition to Candidate upon heartbeat timeout, request votes, obtain majority, and become Leader.",
    realWorldTransfer: "Used in etcd, Kubernetes control plane, and distributed databases.",
    misconceptionAlert: "A split brain cannot occur in Raft because two majorities cannot exist simultaneously in an odd-numbered quorum.",
    discipline: "Computer Science",
  };

  describe("Canonical 7 Visual Families Generation", () => {
    it("generates a valid PROCESS specification with sequential transitions", () => {
      const spec = generateProcessVisual({ ...sampleContext, slideNo: 1 });
      expect(spec.visualFamily).toBe("PROCESS");
      expect(spec.title).toContain("Raft Leader Election");
      expect(spec.layout.type).toBe("PROCESS");
      expect(spec.layout.direction).toBe("LR");
      expect(spec.nodes.length).toBeGreaterThanOrEqual(3);
      expect(spec.connections.length).toBeGreaterThanOrEqual(2);
      expect(spec.studentFocusQuestion).toContain("invariant");
      expect(spec.pedagogicalRationale.length).toBeGreaterThan(20);
      expect(spec.svgMarkup).toBeDefined();
      expect(spec.svgMarkup).toContain("<svg");
      expect(spec.svgMarkup).toContain('role="img"');
    });

    it("generates a valid SYSTEM_ARCHITECTURE specification with tiered boundaries", () => {
      const spec = generateSystemArchitectureVisual({ ...sampleContext, slideNo: 2 });
      expect(spec.visualFamily).toBe("SYSTEM_ARCHITECTURE");
      expect(spec.layout.direction).toBe("TB");
      expect(spec.nodes.length).toBeGreaterThanOrEqual(3);
      expect(spec.connections.length).toBeGreaterThanOrEqual(2);
      expect(spec.studentFocusQuestion.length).toBeGreaterThan(15);
      expect(spec.svgMarkup).toContain("SYSTEM_ARCHITECTURE");
    });

    it("generates a valid DATA_FLOW specification with stream pipeline", () => {
      const spec = generateDataFlowVisual({ ...sampleContext, slideNo: 3 });
      expect(spec.visualFamily).toBe("DATA_FLOW");
      expect(spec.layout.direction).toBe("LR");
      expect(spec.nodes.length).toBeGreaterThanOrEqual(3);
      expect(spec.connections.length).toBeGreaterThanOrEqual(2);
      expect(spec.studentFocusQuestion).toContain("backpressure");
      expect(spec.svgMarkup).toContain("DATA_FLOW");
    });

    it("generates a valid COMPARISON_MATRIX specification with trade-off dimensions", () => {
      const spec = generateComparisonMatrixVisual({ ...sampleContext, slideNo: 4 });
      expect(spec.visualFamily).toBe("COMPARISON_MATRIX");
      expect(spec.layout.direction).toBe("GRID");
      expect(spec.nodes.length).toBeGreaterThanOrEqual(2);
      expect(spec.nodes[0].metadata?.complexity).toBeDefined();
      expect(spec.studentFocusQuestion).toContain("trade-offs");
      expect(spec.svgMarkup).toContain("COMPARISON_MATRIX");
    });

    it("generates a valid CAUSE_EFFECT specification with root cause and outcomes", () => {
      const spec = generateCauseEffectVisual({ ...sampleContext, slideNo: 5 });
      expect(spec.visualFamily).toBe("CAUSE_EFFECT");
      expect(spec.layout.direction).toBe("LR");
      expect(spec.nodes.length).toBeGreaterThanOrEqual(3);
      expect(spec.connections.length).toBeGreaterThanOrEqual(2);
      expect(spec.studentFocusQuestion).toContain("outcomes");
      expect(spec.svgMarkup).toContain("CAUSE_EFFECT");
    });

    it("generates a valid QUANTITATIVE specification with coordinate envelopes and LaTeX", () => {
      const spec = generateQuantitativeVisual({ ...sampleContext, slideNo: 6 });
      expect(spec.visualFamily).toBe("QUANTITATIVE");
      expect(spec.layout.direction).toBe("LR");
      expect(spec.nodes.length).toBeGreaterThanOrEqual(2);
      expect(spec.rawLatexOrData).toBeDefined();
      expect(spec.studentFocusQuestion).toContain("inflection point");
      expect(spec.svgMarkup).toContain("QUANTITATIVE");
    });

    it("generates a valid HIERARCHY specification with taxonomic tree DAG", () => {
      const spec = generateHierarchyVisual({ ...sampleContext, slideNo: 7 });
      expect(spec.visualFamily).toBe("HIERARCHY");
      expect(spec.layout.direction).toBe("TB");
      expect(spec.nodes.length).toBeGreaterThanOrEqual(3);
      expect(spec.connections.length).toBeGreaterThanOrEqual(2);
      expect(spec.studentFocusQuestion).toContain("inherited");
      expect(spec.svgMarkup).toContain("HIERARCHY");
    });
  });

  describe("Automatic Visual Family Inference", () => {
    it("infers SYSTEM_ARCHITECTURE from architectural subsystem terms", () => {
      const family = inferVisualFamily({
        topic: "Cloud Computing",
        conceptTitle: "Microservice API Gateway Architecture and Database Tiering",
      });
      expect(family).toBe("SYSTEM_ARCHITECTURE");
    });

    it("infers DATA_FLOW from stream and pipeline terms", () => {
      const family = inferVisualFamily({
        topic: "Event-Driven Systems",
        conceptTitle: "Kafka Message Queue Ingestion Stream Pipeline",
      });
      expect(family).toBe("DATA_FLOW");
    });

    it("infers COMPARISON_MATRIX from trade-off and versus terms", () => {
      const family = inferVisualFamily({
        topic: "Database Systems",
        conceptTitle: "SQL vs NoSQL: ACID Guarantees and Benchmark Trade-offs",
      });
      expect(family).toBe("COMPARISON_MATRIX");
    });

    it("infers CAUSE_EFFECT from causal failure mode terms", () => {
      const family = inferVisualFamily({
        topic: "Reliability Engineering",
        conceptTitle: "Root Cause Cascading Failure Modes and Equilibrium Recovery",
      });
      expect(family).toBe("CAUSE_EFFECT");
    });

    it("infers QUANTITATIVE from complexity and rate curves", () => {
      const family = inferVisualFamily({
        topic: "Algorithms",
        conceptTitle: "Asymptotic Complexity Bounds and O(N log N) Distribution Rate",
      });
      expect(family).toBe("QUANTITATIVE");
    });

    it("infers HIERARCHY from taxonomy and tree inheritance terms", () => {
      const family = inferVisualFamily({
        topic: "Object-Oriented Design",
        conceptTitle: "Class Hierarchy Taxonomy and Tree Inheritance DAG",
      });
      expect(family).toBe("HIERARCHY");
    });

    it("infers PROCESS as default for cyclical step pathways", () => {
      const family = inferVisualFamily({
        topic: "Biochemistry",
        conceptTitle: "Citric Acid Cycle Step Reaction Pathway",
      });
      expect(family).toBe("PROCESS");
    });
  });

  describe("Master Generator & SVG Renderer", () => {
    it("generates every canonical visual family through master generator", () => {
      for (const family of CANONICAL_VISUAL_FAMILIES) {
        const spec = generateVisualSpecification({
          ...sampleContext,
          preferredFamily: family,
          slideNo: 10,
        });
        expect(spec.visualFamily).toBe(family);
        expect(spec.nodes.length).toBeGreaterThanOrEqual(2);
        expect(spec.svgMarkup).toBeDefined();

        const rendered = renderVisualSpecificationToSvg(spec, { width: 800, height: 450 });
        expect(rendered).toContain('role="img"');
        expect(rendered).toContain("<svg");
        expect(rendered).toContain("</svg>");
        expect(rendered).toContain(family);
      }
    });

    it("renders legacy intents through renderSvgDiagram backwards compatibility", () => {
      const svgHub = renderSvgDiagram("HUB_SPOKE", ["Core", "Sat1", "Sat2"], 1);
      expect(svgHub).toBeDefined();
      expect(svgHub).toContain("HUB_SPOKE");

      const svgMatrix = renderSvgDiagram("MATRIX", ["Q1", "Q2", "Q3", "Q4"], 2);
      expect(svgMatrix).toBeDefined();
      expect(svgMatrix).toContain("MATRIX");

      const svgProcess = renderSvgDiagram("PROCESS", ["Step 1", "Step 2", "Step 3"], 3);
      expect(svgProcess).toBeDefined();
      expect(svgProcess).toContain("PROCESS");
    });

    it("returns null for unsupported visual intent strings", () => {
      const result = renderSvgDiagram("UNSUPPORTED_RANDOM_INTENT", ["A", "B"], 1);
      expect(result).toBeNull();
    });
  });
});
