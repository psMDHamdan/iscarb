import { describe, expect, it } from "vitest";
import {
  assessCriticality,
  chunkDocument,
  chunkHtmlElements,
  chunkPdfPages,
  chunkPptxSlides,
  cleanDocumentBoilerplate,
  ClaimLedger,
  computeSha256,
  ConceptGraph,
  createSourceBlock,
  enforceZeroInvention,
  generateDeterministicBlockId,
  isNotSpecified,
  NOT_SPECIFIED_FALLBACK,
  scanQuantitativeFigures,
  splitOversizedParagraph,
  type ConceptNode,
  type SourceBlock,
} from "../../lib/lecture/grounding";

describe("Empirical Challenger: Adversarial Stress Test Suite (M1)", () => {
  describe("1. Adversarial ConceptGraph: Cycles, Self-Loops & Complex Topologies", () => {
    it("detects self-loops (node requiring itself) and prevents topological ordering", () => {
      const graph = new ConceptGraph();
      graph.addConcept({
        id: "self_loop_node",
        name: "Self Looping Concept",
        description: "Requires itself",
        stage: 1,
        sourceBlockIds: [],
        prerequisites: ["self_loop_node"],
      });

      const validation = graph.validateDAG();
      expect(validation.isAcyclic).toBe(false);
      expect(validation.cycle).toBeDefined();
      expect(validation.cycle).toContain("self_loop_node");

      expect(() => graph.getTopologicalOrder()).toThrow(/cyclic concept graph/i);
    });

    it("detects 2-node mutual recursion (A -> B -> A)", () => {
      const graph = new ConceptGraph();
      graph.addConcept({
        id: "node_A",
        name: "A",
        description: "",
        stage: 1,
        sourceBlockIds: [],
        prerequisites: ["node_B"],
      });
      graph.addConcept({
        id: "node_B",
        name: "B",
        description: "",
        stage: 2,
        sourceBlockIds: [],
        prerequisites: ["node_A"],
      });

      const validation = graph.validateDAG();
      expect(validation.isAcyclic).toBe(false);
      expect(validation.cycle).toBeDefined();
      expect(validation.cycle?.length).toBeGreaterThanOrEqual(2);
      expect(() => graph.getTopologicalOrder()).toThrow(/cyclic/i);
    });

    it("detects a 50-node large cycle loop (N0 -> N1 -> ... -> N49 -> N0)", () => {
      const graph = new ConceptGraph();
      const nodeCount = 50;

      for (let i = 0; i < nodeCount; i++) {
        const nextId = `node_${(i + 1) % nodeCount}`;
        graph.addConcept({
          id: `node_${i}`,
          name: `Node ${i}`,
          description: `Desc ${i}`,
          stage: ((i % 7) + 1) as any,
          sourceBlockIds: [],
          prerequisites: [nextId],
        });
      }

      const validation = graph.validateDAG();
      expect(validation.isAcyclic).toBe(false);
      expect(validation.cycle).toBeDefined();
      expect(validation.cycle?.length).toBeGreaterThanOrEqual(50);
      expect(() => graph.getTopologicalOrder()).toThrow(/cyclic/i);
    });

    it("detects a figure-8 double cycle sharing a central bridge node", () => {
      // Loop 1: A -> B -> C -> A
      // Loop 2: C -> D -> E -> C
      const graph = new ConceptGraph();
      graph.addConcept({ id: "A", name: "A", description: "", stage: 1, sourceBlockIds: [], prerequisites: ["B"] });
      graph.addConcept({ id: "B", name: "B", description: "", stage: 2, sourceBlockIds: [], prerequisites: ["C"] });
      graph.addConcept({ id: "C", name: "C", description: "", stage: 3, sourceBlockIds: [], prerequisites: ["A", "D"] });
      graph.addConcept({ id: "D", name: "D", description: "", stage: 4, sourceBlockIds: [], prerequisites: ["E"] });
      graph.addConcept({ id: "E", name: "E", description: "", stage: 5, sourceBlockIds: [], prerequisites: ["C"] });

      const validation = graph.validateDAG();
      expect(validation.isAcyclic).toBe(false);
      expect(validation.cycle).toBeDefined();
      expect(() => graph.getTopologicalOrder()).toThrow(/cyclic/i);
    });

    it("detects cycles embedded in one component while another component is acyclic", () => {
      const graph = new ConceptGraph();

      // Component 1: Acyclic chain
      graph.addConcept({ id: "valid_1", name: "V1", description: "", stage: 1, sourceBlockIds: [], prerequisites: [] });
      graph.addConcept({ id: "valid_2", name: "V2", description: "", stage: 2, sourceBlockIds: [], prerequisites: ["valid_1"] });
      graph.addConcept({ id: "valid_3", name: "V3", description: "", stage: 3, sourceBlockIds: [], prerequisites: ["valid_2"] });

      // Component 2: Cyclic pair
      graph.addConcept({ id: "bad_X", name: "X", description: "", stage: 4, sourceBlockIds: [], prerequisites: ["bad_Y"] });
      graph.addConcept({ id: "bad_Y", name: "Y", description: "", stage: 5, sourceBlockIds: [], prerequisites: ["bad_X"] });

      const validation = graph.validateDAG();
      expect(validation.isAcyclic).toBe(false);
      expect(validation.cycle).toBeDefined();
      expect(() => graph.getTopologicalOrder()).toThrow(/cyclic/i);
    });

    it("safely handles transitive queries with cycles without infinite looping or stack overflow", () => {
      const graph = new ConceptGraph();
      graph.addConcept({ id: "cyc_1", name: "C1", description: "", stage: 1, sourceBlockIds: [], prerequisites: ["cyc_2"] });
      graph.addConcept({ id: "cyc_2", name: "C2", description: "", stage: 2, sourceBlockIds: [], prerequisites: ["cyc_1"] });

      // getPrerequisitesFor with recursive = true should terminate safely
      const prereqsOf1 = graph.getPrerequisitesFor("cyc_1", true);
      expect(prereqsOf1.length).toBeGreaterThan(0);
      expect(prereqsOf1.length).toBeLessThanOrEqual(2);

      // getDependentsFor with recursive = true should terminate safely
      const depsOf1 = graph.getDependentsFor("cyc_1", true);
      expect(depsOf1.length).toBeGreaterThan(0);
      expect(depsOf1.length).toBeLessThanOrEqual(2);
    });
  });

  describe("2. Adversarial ConceptGraph: Disconnected Components & Deterministic Kahn Ordering", () => {
    it("deterministically orders 10 independent disconnected DAG components by (stage ASC, id ASC)", () => {
      const graph = new ConceptGraph();

      // Create 10 components with 2 nodes each at different stages
      for (let i = 1; i <= 10; i++) {
        const rootStage = ((i % 6) + 1) as any;
        const leafStage = (rootStage + 1) as any;

        graph.addConcept({
          id: `comp_${i}_root`,
          name: `Root ${i}`,
          description: "",
          stage: rootStage,
          sourceBlockIds: [],
          prerequisites: [],
        });
        graph.addConcept({
          id: `comp_${i}_leaf`,
          name: `Leaf ${i}`,
          description: "",
          stage: leafStage,
          sourceBlockIds: [],
          prerequisites: [`comp_${i}_root`],
        });
      }

      expect(graph.getNodeCount()).toBe(20);
      expect(graph.validateDAG().isAcyclic).toBe(true);

      const order = graph.getTopologicalOrder();
      expect(order).toHaveLength(20);

      // Verify every root precedes its corresponding leaf
      for (let i = 1; i <= 10; i++) {
        const rootIdx = order.findIndex((n) => n.id === `comp_${i}_root`);
        const leafIdx = order.findIndex((n) => n.id === `comp_${i}_leaf`);
        expect(rootIdx).toBeLessThan(leafIdx);
      }

      // Verify running twice yields 100% identical deterministic output
      const order2 = graph.getTopologicalOrder();
      expect(order.map((n) => n.id)).toEqual(order2.map((n) => n.id));
    });

    it("correctly handles 100 isolated root nodes with zero prerequisites", () => {
      const graph = new ConceptGraph();
      for (let i = 0; i < 100; i++) {
        const id = `isolated_${String(i).padStart(3, "0")}`;
        const stage = ((i % 7) + 1) as any;
        graph.addConcept({
          id,
          name: `Isolated ${i}`,
          description: "",
          stage,
          sourceBlockIds: [],
          prerequisites: [],
        });
      }

      expect(graph.validateDAG().isAcyclic).toBe(true);
      const order = graph.getTopologicalOrder();
      expect(order).toHaveLength(100);

      // Should be sorted by stage ASC, then id ASC
      for (let i = 0; i < order.length - 1; i++) {
        const curr = order[i];
        const next = order[i + 1];
        if (curr.stage === next.stage) {
          expect(curr.id.localeCompare(next.id)).toBeLessThan(0);
        } else {
          expect(curr.stage).toBeLessThan(next.stage);
        }
      }
    });
  });

  describe("3. Adversarial ConceptGraph: Diamond Topologies, Lattices & Deep Chains", () => {
    it("handles a deep linear dependency chain of 200 concepts without stack overflow", () => {
      const graph = new ConceptGraph();
      const depth = 200;

      for (let i = 1; i <= depth; i++) {
        const prereqs = i === 1 ? [] : [`chain_${i - 1}`];
        graph.addConcept({
          id: `chain_${i}`,
          name: `Chain Step ${i}`,
          description: "",
          stage: (Math.min(7, Math.ceil((i / depth) * 7))) as any,
          sourceBlockIds: [],
          prerequisites: prereqs,
        });
      }

      expect(graph.getNodeCount()).toBe(depth);
      expect(graph.validateDAG().isAcyclic).toBe(true);

      const order = graph.getTopologicalOrder();
      expect(order).toHaveLength(depth);
      expect(order[0].id).toBe("chain_1");
      expect(order[depth - 1].id).toBe(`chain_${depth}`);

      // Transitive resolution for deep chain
      const transitivePrereqs = graph.getPrerequisitesFor(`chain_${depth}`, true);
      expect(transitivePrereqs).toHaveLength(depth - 1);

      const transitiveDeps = graph.getDependentsFor("chain_1", true);
      expect(transitiveDeps).toHaveLength(depth - 1);
    });

    it("handles a multi-layer 5x5 lattice DAG with intersecting cross-edges", () => {
      // 5 layers (stages 1..5), 5 nodes per layer. Each node in layer L depends on all nodes in layer L-1.
      const graph = new ConceptGraph();
      const layers = 5;
      const nodesPerLayer = 5;

      for (let l = 1; l <= layers; l++) {
        const prereqs =
          l === 1
            ? []
            : Array.from({ length: nodesPerLayer }, (_, i) => `L${l - 1}_N${i + 1}`);

        for (let n = 1; n <= nodesPerLayer; n++) {
          graph.addConcept({
            id: `L${l}_N${n}`,
            name: `Layer ${l} Node ${n}`,
            description: "",
            stage: l as any,
            sourceBlockIds: [],
            prerequisites: prereqs,
          });
        }
      }

      expect(graph.getNodeCount()).toBe(25);
      expect(graph.validateDAG().isAcyclic).toBe(true);

      const order = graph.getTopologicalOrder();
      expect(order).toHaveLength(25);

      // Verify all L1 nodes come before L2, L2 before L3, etc.
      for (let l = 1; l < layers; l++) {
        const maxLIndex = Math.max(
          ...Array.from({ length: nodesPerLayer }, (_, i) =>
            order.findIndex((x) => x.id === `L${l}_N${i + 1}`)
          )
        );
        const minNextLIndex = Math.min(
          ...Array.from({ length: nodesPerLayer }, (_, i) =>
            order.findIndex((x) => x.id === `L${l + 1}_N${i + 1}`)
          )
        );
        expect(maxLIndex).toBeLessThan(minNextLIndex);
      }

      // Check transitive resolution of bottom-most node
      const topNodePrereqs = graph.getPrerequisitesFor("L5_N1", true);
      expect(topNodePrereqs).toHaveLength(20); // 4 prior layers * 5 nodes
    });

    it("handles extreme fan-out (1 root -> 100 dependents) and fan-in (100 roots -> 1 leaf)", () => {
      const graph = new ConceptGraph();

      // Fan-out root
      graph.addConcept({ id: "root_hub", name: "Root Hub", description: "", stage: 1, sourceBlockIds: [], prerequisites: [] });
      for (let i = 1; i <= 100; i++) {
        graph.addConcept({
          id: `fanout_${i}`,
          name: `Fanout ${i}`,
          description: "",
          stage: 2,
          sourceBlockIds: [],
          prerequisites: ["root_hub"],
        });
      }

      // Fan-in leaf
      const fanoutIds = Array.from({ length: 100 }, (_, i) => `fanout_${i + 1}`);
      graph.addConcept({
        id: "sink_hub",
        name: "Sink Hub",
        description: "",
        stage: 3,
        sourceBlockIds: [],
        prerequisites: fanoutIds,
      });

      expect(graph.getNodeCount()).toBe(102);
      expect(graph.validateDAG().isAcyclic).toBe(true);

      const order = graph.getTopologicalOrder();
      expect(order).toHaveLength(102);
      expect(order[0].id).toBe("root_hub");
      expect(order[101].id).toBe("sink_hub");

      const transitiveSinkPrereqs = graph.getPrerequisitesFor("sink_hub", true);
      expect(transitiveSinkPrereqs).toHaveLength(101);
    });
  });

  describe("4. Adversarial ConceptGraph: Stage Jumping & Progression Gating", () => {
    it("handles stage jumping (Stage 5 concept directly depending on Stage 1 concept)", () => {
      const graph = new ConceptGraph();
      graph.addConcept({ id: "c_s1", name: "Basics", description: "", stage: 1, sourceBlockIds: [], prerequisites: [] });
      graph.addConcept({ id: "c_s5", name: "Advanced Application", description: "", stage: 5, sourceBlockIds: [], prerequisites: ["c_s1"] });

      expect(graph.validateDAG().isAcyclic).toBe(true);
      const order = graph.getTopologicalOrder();
      expect(order.map((c) => c.id)).toEqual(["c_s1", "c_s5"]);

      const prereqs = graph.getPrerequisitesFor("c_s5", true);
      expect(prereqs.map((c) => c.id)).toEqual(["c_s1"]);

      // Learner without c_s1 targeting stage 5 fails
      const checkFail = graph.checkStagePrerequisites(5, []);
      expect(checkFail.satisfied).toBe(false);
      expect(checkFail.missing.map((c) => c.id)).toEqual(["c_s1"]);

      // Learner with c_s1 targeting stage 5 passes
      const checkPass = graph.checkStagePrerequisites(5, ["c_s1"]);
      expect(checkPass.satisfied).toBe(true);
    });

    it("verifies multi-stage missing concepts when student skips intermediate stages", () => {
      const graph = new ConceptGraph();
      graph.addConcept({ id: "s1_a", name: "S1 A", description: "", stage: 1, sourceBlockIds: [], prerequisites: [] });
      graph.addConcept({ id: "s2_a", name: "S2 A", description: "", stage: 2, sourceBlockIds: [], prerequisites: ["s1_a"] });
      graph.addConcept({ id: "s3_a", name: "S3 A", description: "", stage: 3, sourceBlockIds: [], prerequisites: ["s2_a"] });
      graph.addConcept({ id: "s4_a", name: "S4 A", description: "", stage: 4, sourceBlockIds: [], prerequisites: ["s3_a"] });
      graph.addConcept({ id: "s5_a", name: "S5 A", description: "", stage: 5, sourceBlockIds: [], prerequisites: ["s4_a"] });

      // Student mastered s1_a and s3_a but skipped s2_a and s4_a
      const check = graph.checkStagePrerequisites(5, ["s1_a", "s3_a"]);
      expect(check.satisfied).toBe(false);
      // Stage 2 and 4 concepts are missing
      expect(check.missing.map((c) => c.id)).toEqual(["s2_a", "s4_a"]);
    });

    it("handles target stage 1 (entry stage) when student has mastered zero concepts", () => {
      const graph = new ConceptGraph();
      graph.addConcept({ id: "s1_intro", name: "Intro", description: "", stage: 1, sourceBlockIds: [], prerequisites: [] });
      graph.addConcept({ id: "s2_core", name: "Core", description: "", stage: 2, sourceBlockIds: [], prerequisites: ["s1_intro"] });

      // Entry stage 1 should be satisfied with empty mastery because no stage < 1 exists
      const check = graph.checkStagePrerequisites(1, []);
      expect(check.satisfied).toBe(true);
      expect(check.missing).toHaveLength(0);
    });

    it("handles non-existent concept ID queries gracefully without throwing", () => {
      const graph = new ConceptGraph();
      graph.addConcept({ id: "known", name: "Known", description: "", stage: 1, sourceBlockIds: [], prerequisites: [] });

      expect(graph.getPrerequisitesFor("ghost_node", false)).toEqual([]);
      expect(graph.getPrerequisitesFor("ghost_node", true)).toEqual([]);
      expect(graph.getDependentsFor("ghost_node", false)).toEqual([]);
      expect(graph.getDependentsFor("ghost_node", true)).toEqual([]);
    });
  });

  describe("5. Adversarial Document Chunker: Large Multi-Page & Pathological Inputs", () => {
    it("chunks a massive 100-page document with 500 paragraphs with high throughput", () => {
      const pages: Array<{ pageNumber: number; text: string }> = [];

      for (let p = 1; p <= 100; p++) {
        const paragraphs = [
          `Page ${p} Paragraph 1: Overview of biochemical metabolic pathways in cell biology.`,
          `Page ${p} Paragraph 2: Glycolysis converts glucose into pyruvate generating 2 ATP molecules.`,
          `Page ${p} Paragraph 3: Formula: C6H12O6 + 2 NAD+ + 2 ADP + 2 Pi -> 2 Pyruvate + 2 NADH + 2 ATP.`,
          `Page ${p} Paragraph 4: The Krebs cycle takes place inside the mitochondrial matrix under aerobic conditions.`,
          `Key Principle: Conservation of biochemical mass and charge in cellular respiration across page ${p}.`,
        ];
        pages.push({
          pageNumber: p,
          text: paragraphs.join("\n\n"),
        });
      }

      const startTime = Date.now();
      const blocks = chunkPdfPages(pages, { documentTitle: "Biochem101" });
      const elapsedMs = Date.now() - startTime;

      expect(blocks).toHaveLength(500);
      expect(elapsedMs).toBeLessThan(1000); // Must be fast (< 1s)

      // Verify deterministic locators and uniqueness
      const locators = new Set(blocks.map((b) => b.locator));
      expect(locators.size).toBe(500);

      // Verify deterministic IDs and hashes
      const ids = new Set(blocks.map((b) => b.id));
      expect(ids.size).toBe(500);

      // Verify first and last blocks
      expect(blocks[0].locator).toBe("Biochem101#page:1#p:1");
      expect(blocks[499].locator).toBe("Biochem101#page:100#p:5");
      expect(blocks[499].criticality).toBe("critical"); // "Key Principle:" prefix
    });

    it("splits massive 15,000 character paragraphs with sentence boundaries", () => {
      const sentence = "The quick brown fox jumps over the lazy dog repeatedly and efficiently. ";
      const megaParagraph = sentence.repeat(200); // ~14,400 chars

      const blocks = chunkDocument(megaParagraph, { maxChunkChars: 1000 });
      expect(blocks.length).toBeGreaterThan(10);

      for (const block of blocks) {
        expect(block.text.length).toBeLessThanOrEqual(1200);
        expect(block.locator).toMatch(/para:1#sub:\d+/);
      }
    });

    it("cleans pathological boilerplate variations (TOC, mixed case, CRLF, trailing references)", () => {
      const raw = `
Table of Contents
1. Quantum Mechanics Overview
2. Schrödinger Wave Equation

   Table   of   Contents   
Section A: Atoms
Section B: Molecules

The Schrödinger equation describes the wave function of a quantum-mechanical system.

References
1. Dirac, P. A. M. (1930). The Principles of Quantum Mechanics.
2. Feynman, R. P. (1965). Quantum Electrodynamics.
      `;

      const cleaned = cleanDocumentBoilerplate(raw);
      expect(cleaned).toContain("Schrödinger equation describes the wave function");
      expect(cleaned).not.toContain("Table of Contents");
      expect(cleaned).not.toContain("Dirac, P. A. M.");
    });

    it("handles pathological strings: zero-width spaces, null bytes, RTL unicode, and emojis", () => {
      const weirdText =
        "Photosynthesis\u200B in \0 plants 🌱 occurs at 25 °C with 90% \u200E(high) efficiency.";
      const hash1 = computeSha256(weirdText);
      const hash2 = computeSha256(weirdText.replace(/\0/g, ""));

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);

      const block = createSourceBlock({
        locator: "page:1#weird",
        text: weirdText,
      });
      expect(block.text).not.toContain("\0");
      expect(block.id).toMatch(/^sb_[a-f0-9]{16}$/);
    });

    it("handles PPTX slides with sparse, empty, or oversized tabular structures", () => {
      const slides = [
        { slideNumber: 1 }, // completely empty slide
        { slideNumber: 2, title: "   ", bullets: ["", "  ", "\t"] }, // whitespace slide
        {
          slideNumber: 3,
          title: "Complex Slide",
          bullets: ["Key Point 1", "Key Point 2"],
          tables: Array.from({ length: 20 }, (_, r) => [`Row ${r + 1}`, `Data ${r + 1}`]),
          notes: "Speaker reminder note for slide 3.",
        },
      ];

      const blocks = chunkPptxSlides(slides, { documentTitle: "LectureSlides" });
      // Slide 1 & 2 yield 0 blocks, slide 3 yields: 1 heading + 2 bullets + 20 table rows + 1 note = 24 blocks
      expect(blocks).toHaveLength(24);
      expect(blocks[0].locator).toBe("LectureSlides#slide:3#heading");
      expect(blocks[1].locator).toBe("LectureSlides#slide:3#bullet:1");
      expect(blocks[2].locator).toBe("LectureSlides#slide:3#bullet:2");
      expect(blocks[3].locator).toBe("LectureSlides#slide:3#table:1");
      expect(blocks[22].locator).toBe("LectureSlides#slide:3#table:20");
      expect(blocks[23].locator).toBe("LectureSlides#slide:3#note");
    });
  });

  describe("6. Adversarial Quantitative Scanner & Claim Ledger: Hallucination Attacks", () => {
    const testSources: SourceBlock[] = [
      createSourceBlock({
        locator: "src:1#p1",
        text: "The reaction operates at 65 °C with 12.5 mM substrate concentration yielding 88% product recovery in 200 subjects.",
      }),
      createSourceBlock({
        locator: "src:2#p1",
        text: "Transformer models demonstrate a 4-fold increase in training efficiency compared to LSTM baselines.",
      }),
      createSourceBlock({
        locator: "src:3#p1",
        text: "The study by Johnson et al., 2021 reported zero fatal adverse events across 1500 clinical trials.",
      }),
    ];

    const ledger = new ClaimLedger();

    it("intercepts fabricated percentage values and triggers UNSUPPORTED classification", () => {
      const claim = "The reaction achieves a 99.4% product recovery rate.";
      const classification = ledger.classifyClaim(claim, testSources);

      expect(classification.claimType).toBe("UNSUPPORTED");
      expect(classification.confidence).toBeLessThanOrEqual(0.1);
      expect(classification.rationale).toMatch(/ungrounded quantitative figure/i);
    });

    it("intercepts fabricated chemical concentrations and units", () => {
      const scan1 = scanQuantitativeFigures("Operates at 500 μM substrate", testSources);
      expect(scan1.passed).toBe(false);
      expect(scan1.hallucinatedFigures).toContain("500 μM");

      const scan2 = scanQuantitativeFigures("Operates at 180 °C with 450 MPa", testSources);
      expect(scan2.passed).toBe(false);
      expect(scan2.hallucinatedFigures.some((f) => f.includes("180 °C"))).toBe(true);
      expect(scan2.hallucinatedFigures.some((f) => f.includes("450 MPa"))).toBe(true);
    });

    it("intercepts fabricated multipliers and dates/citations", () => {
      const scan1 = scanQuantitativeFigures("Demonstrates an 8-fold increase", testSources);
      expect(scan1.passed).toBe(false);
      expect(scan1.hallucinatedFigures).toContain("8-fold");

      const scan2 = scanQuantitativeFigures("Published in 1999 by Vaswani et al.", testSources);
      expect(scan2.passed).toBe(false);
      expect(scan2.hallucinatedFigures.some((f) => f.includes("1999"))).toBe(true);
    });

    it("safely protects numbers inside LaTeX math environments ($...$, \\(...\\), \\([...\\))", () => {
      const mathText =
        "The polynomial is $P(x) = 99x^3 + 750x^2 - 12x + 5$ and \\[E = 500 \\times 10^6 \\text{ J}\\]";
      const scan = scanQuantitativeFigures(mathText, testSources);
      expect(scan.passed).toBe(true);
      expect(scan.hallucinatedFigures).toHaveLength(0);
    });

    it("safely protects complex chemical formulas with numeric subscripts (H2O, Fe2(SO4)3, Ca2+)", () => {
      const chemText =
        "The solution combines H2O, Ca2+, Fe3+, and C6H12O6 without releasing CO2 gas.";
      const scan = scanQuantitativeFigures(chemText, testSources);
      expect(scan.passed).toBe(true);
      expect(scan.hallucinatedFigures).toHaveLength(0);
    });

    it("enforces NOT_SPECIFIED_FALLBACK on missing, empty, or ungrounded data", () => {
      expect(isNotSpecified("Not specified in the provided source")).toBe(true);
      expect(isNotSpecified("not specified in source")).toBe(true);
      expect(isNotSpecified("N/A")).toBe(true);
      expect(isNotSpecified("unknown")).toBe(true);
      expect(isNotSpecified(null)).toBe(true);
      expect(isNotSpecified(undefined)).toBe(true);

      const resMissing = enforceZeroInvention("protocol", "Unknown", testSources);
      expect(resMissing.output).toBe(NOT_SPECIFIED_FALLBACK);
      expect(resMissing.hasMissingDataFallback).toBe(true);

      const resFabricated = enforceZeroInvention(
        "dosage",
        "Administer 850 mg/kg twice daily",
        testSources
      );
      expect(resFabricated.output).toBe(NOT_SPECIFIED_FALLBACK);
      expect(resFabricated.hasMissingDataFallback).toBe(true);
      expect(resFabricated.isClean).toBe(false);
      expect(resFabricated.fabricatedNumbers.some((n) => n.includes("850 mg/kg"))).toBe(true);
    });

    it("evaluates large batch claims and validates audit report correctness", () => {
      const claims = [
        "The reaction operates at 65 °C with 12.5 mM substrate concentration yielding 88% product recovery in 200 subjects.", // DIRECTLY_SUPPORTED
        "Transformer models demonstrate a 4-fold increase in training efficiency compared to LSTM baselines.", // DIRECTLY_SUPPORTED
        "The reaction process operates at 65 °C with 12.5 mM substrate concentration and yields 88% recovery rate.", // PEDAGOGICAL_PARAPHRASE
        "Reaction system operates with concentration yielding product.", // INFERRED
        "Fabricated claim stating 99.9% recovery across 50,000 subjects in 2030.", // UNSUPPORTED (quantitative)
        "Completely unrelated claim about lunar astrophysics and dark energy.", // UNSUPPORTED (unrelated)
      ];

      const batch = ledger.verifyBatch(claims, testSources);
      expect(batch).toHaveLength(6);

      const report = ledger.generateAuditReport(batch);
      expect(report.totalClaims).toBe(6);
      expect(report.directlySupportedCount).toBe(2);
      expect(report.paraphraseCount).toBe(1);
      expect(report.inferredCount).toBe(1);
      expect(report.unsupportedCount).toBe(2);
      expect(report.passed).toBe(false);
      expect(report.unsupportedClaims).toHaveLength(2);
    });
  });
});
