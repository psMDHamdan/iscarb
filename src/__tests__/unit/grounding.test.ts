import { describe, expect, it } from "vitest";
import {
  assessCriticality,
  chunkDocument,
  chunkHtmlElements,
  chunkPdfPages,
  chunkPptxSlides,
  ClaimLedger,
  computeSha256,
  ConceptGraph,
  createSourceBlock,
  enforceZeroInvention,
  generateDeterministicBlockId,
  NOT_SPECIFIED_FALLBACK,
  scanQuantitativeFigures,
  type ConceptNode,
  type SourceBlock,
} from "../../lib/lecture/grounding";

describe("Milestone 1: Source Grounding, Concept Graph & Zero Invention Engine", () => {
  describe("1. Addressable Source Blocks & Fingerprinting", () => {
    it("computes deterministic SHA-256 fingerprint matching standard crypto hex", () => {
      const text = "Photosynthesis occurs primarily in chloroplasts.";
      const hash1 = computeSha256(text);
      const hash2 = computeSha256(text);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("normalizes text variations (CRLF, trailing spaces, null bytes) to identical SHA-256", () => {
      const base = "Deep learning architectures utilize backpropagation.";
      const crlf = "Deep learning architectures  utilize backpropagation.\r\n";
      const withNull = "Deep learning architectures\0 utilize backpropagation.  ";

      const hashBase = computeSha256(base);
      const hashCrlf = computeSha256(crlf);
      const hashNull = computeSha256(withNull);

      expect(hashCrlf).toBe(hashBase);
      expect(hashNull).toBe(hashBase);
    });

    it("generates deterministic block IDs with sb_ prefix and 16 hex chars", () => {
      const locator = "page:3#p2";
      const hash = computeSha256("Cellular respiration produces ATP.");
      const blockId1 = generateDeterministicBlockId(locator, hash);
      const blockId2 = generateDeterministicBlockId(locator, hash);

      expect(blockId1).toBe(blockId2);
      expect(blockId1).toMatch(/^sb_[a-f0-9]{16}$/);
    });

    it("creates a fully formed SourceBlock with correct properties", () => {
      const block = createSourceBlock({
        locator: "slide:4#bullet:2",
        text: "Formula: E = mc^2",
        metadata: { slideNo: 4 },
      });

      expect(block.id).toMatch(/^sb_[a-f0-9]{16}$/);
      expect(block.locator).toBe("slide:4#bullet:2");
      expect(block.text).toBe("Formula: E = mc^2");
      expect(block.criticality).toBe("critical");
      expect(block.sha256Hash).toHaveLength(64);
      expect(block.metadata?.slideNo).toBe(4);
    });

    describe("Criticality Assessment", () => {
      it("classifies prefixes like CLO, Definition, Theorem, Formula as critical", () => {
        expect(assessCriticality("CLO 1: Design robust distributed systems")).toBe("critical");
        expect(assessCriticality("Learning Outcome: Understand gradient descent")).toBe("critical");
        expect(assessCriticality("Definition: Entropy is the measure of disorder")).toBe("critical");
        expect(assessCriticality("Theorem: Pythagorean theorem states a^2 + b^2 = c^2")).toBe("critical");
        expect(assessCriticality("Formula: F = ma")).toBe("critical");
        expect(assessCriticality("Key Principle: Conservation of energy")).toBe("critical");
      });

      it("classifies administrative keywords (exam, grading, deadline, mandatory) as critical", () => {
        expect(assessCriticality("Final exam will cover chapters 1 through 7.")).toBe("critical");
        expect(assessCriticality("Assignment deadline is next Friday at 5 PM.")).toBe("critical");
        expect(assessCriticality("Grading weight: 40% project, 60% tests.")).toBe("critical");
        expect(assessCriticality("Attendance is mandatory for all lab sessions.")).toBe("critical");
      });

      it("classifies structural elements like headings and tables as critical", () => {
        expect(assessCriticality("Module 1: Introduction", "heading")).toBe("critical");
        expect(assessCriticality("Quarterly Revenue Metrics", "table")).toBe("critical");
      });

      it("classifies examples, illustrations, and short fragments as low criticality", () => {
        expect(assessCriticality("For example, consider a red car moving at 60 mph.")).toBe("low");
        expect(assessCriticality("Figure 2.1: Diagram of a mitochondrion.")).toBe("low");
        expect(assessCriticality("Footnote: See appendix for raw dataset.")).toBe("low");
        expect(assessCriticality("42")).toBe("low");
        expect(assessCriticality("Short note")).toBe("low");
      });

      it("classifies standard explanatory text as normal criticality", () => {
        expect(
          assessCriticality(
            "Mitochondria are double-membrane-bound organelle found in most eukaryotic organisms."
          )
        ).toBe("normal");
      });
    });
  });

  describe("2. Document Chunker", () => {
    it("chunks raw multi-paragraph document into SourceBlocks with para locators", () => {
      const doc = `
# Section 1: Overview
The human circulatory system is responsible for the transport of blood, oxygen, and nutrients throughout the body.

The heart acts as a muscular pump featuring four distinct chambers: two atria and two ventricles.
      `;

      const blocks = chunkDocument(doc, { documentTitle: "Bio101" });
      expect(blocks.length).toBe(2);
      expect(blocks[0].locator).toBe("Bio101#para:1");
      expect(blocks[0].text).toContain("human circulatory system");
      expect(blocks[1].locator).toBe("Bio101#para:2");
      expect(blocks[1].text).toContain("muscular pump");
    });

    it("strips Table of Contents and References boilerplate before chunking", () => {
      const doc = `
Table of Contents
1. Introduction
2. Methods

The core methodology involves randomized controlled trial protocols.

References
1. Smith et al., 2020.
      `;

      const blocks = chunkDocument(doc);
      expect(blocks.length).toBe(1);
      expect(blocks[0].text).toContain("randomized controlled trial");
      expect(blocks.some((b) => b.text.includes("Table of Contents"))).toBe(false);
      expect(blocks.some((b) => b.text.includes("Smith et al., 2020"))).toBe(false);
    });

    it("splits oversized paragraphs into sentence-bounded sub-chunks", () => {
      const sentence1 = "The quick brown fox jumps over the lazy dog repeatedly. ";
      const sentence2 = "Pack my box with five dozen liquor jugs quickly. ";
      const sentence3 = "How vexingly quick daft zebras jump over low fences. ";
      const oversized = (sentence1 + sentence2 + sentence3).repeat(4);

      const blocks = chunkDocument(oversized, { maxChunkChars: 120 });
      expect(blocks.length).toBeGreaterThan(1);
      expect(blocks[0].locator).toMatch(/para:1#sub:1/);
      expect(blocks[1].locator).toMatch(/para:1#sub:2/);
      // Ensure sub-chunks respect character limit
      for (const block of blocks) {
        expect(block.text.length).toBeLessThanOrEqual(200);
      }
    });

    it("chunks PDF pages with page and paragraph hierarchical locators", () => {
      const pages = [
        { pageNumber: 1, text: "Page 1 intro.\n\nPage 1 body paragraph." },
        { pageNumber: 2, text: "Page 2 detailed analysis.\n\nPage 2 conclusion." },
      ];

      const blocks = chunkPdfPages(pages, { documentTitle: "LecturePDF" });
      expect(blocks.length).toBe(4);
      expect(blocks[0].locator).toBe("LecturePDF#page:1#p:1");
      expect(blocks[1].locator).toBe("LecturePDF#page:1#p:2");
      expect(blocks[2].locator).toBe("LecturePDF#page:2#p:1");
      expect(blocks[3].locator).toBe("LecturePDF#page:2#p:2");
    });

    it("chunks PPTX slides with structural element locators", () => {
      const slides = [
        {
          slideNumber: 1,
          title: "Introduction to Operating Systems",
          bullets: ["Process scheduling", "Memory management"],
          tables: [["Algorithm", "Throughput"], ["Round Robin", "High"]],
          notes: "Remind students about assignment deadline.",
        },
      ];

      const blocks = chunkPptxSlides(slides, { documentTitle: "OS_Deck" });
      expect(blocks.length).toBe(6);
      expect(blocks[0].locator).toBe("OS_Deck#slide:1#heading");
      expect(blocks[0].criticality).toBe("critical");
      expect(blocks[1].locator).toBe("OS_Deck#slide:1#bullet:1");
      expect(blocks[2].locator).toBe("OS_Deck#slide:1#bullet:2");
      expect(blocks[3].locator).toBe("OS_Deck#slide:1#table:1");
      expect(blocks[4].locator).toBe("OS_Deck#slide:1#table:2");
      expect(blocks[5].locator).toBe("OS_Deck#slide:1#note");
    });

    it("chunks HTML elements with tag-based locators", () => {
      const elements = [
        { tag: "h1", text: "Thermodynamics Core Principles" },
        { tag: "p", text: "Energy cannot be created or destroyed, only transformed." },
      ];

      const blocks = chunkHtmlElements(elements);
      expect(blocks.length).toBe(2);
      expect(blocks[0].locator).toBe("element:1#h1");
      expect(blocks[0].criticality).toBe("critical");
      expect(blocks[1].locator).toBe("element:2#p");
    });
  });

  describe("3. Concept Graph & Prerequisite DAG", () => {
    it("validates an acyclic 7-stage concept graph", () => {
      const graph = new ConceptGraph();

      const c1: ConceptNode = {
        id: "c1_hook",
        name: "Discovery Hook",
        description: "Intuition behind neural nets",
        stage: 1,
        sourceBlockIds: ["sb_1"],
        prerequisites: [],
      };
      const c2: ConceptNode = {
        id: "c2_perceptron",
        name: "Single Perceptron",
        description: "Mathematical formulation of a perceptron",
        stage: 2,
        sourceBlockIds: ["sb_2"],
        prerequisites: ["c1_hook"],
      };
      const c3: ConceptNode = {
        id: "c3_mlp",
        name: "Multilayer Perceptron",
        description: "Feedforward architectures and activation functions",
        stage: 3,
        sourceBlockIds: ["sb_3"],
        prerequisites: ["c2_perceptron"],
      };
      const c4: ConceptNode = {
        id: "c4_backprop",
        name: "Backpropagation",
        description: "Chain rule gradient calculations",
        stage: 4,
        sourceBlockIds: ["sb_4"],
        prerequisites: ["c3_mlp"],
      };

      graph.addConcept(c1);
      graph.addConcept(c2);
      graph.addConcept(c3);
      graph.addConcept(c4);

      const validation = graph.validateDAG();
      expect(validation.isAcyclic).toBe(true);
      expect(validation.cycle).toBeUndefined();
    });

    it("detects direct and indirect cycles with 3-color DFS and extracts cycle path", () => {
      const graph = new ConceptGraph();

      graph.addConcept({
        id: "node_A",
        name: "Concept A",
        description: "Desc A",
        stage: 2,
        sourceBlockIds: [],
        prerequisites: ["node_C"], // cycle: A -> C -> B -> A
      });
      graph.addConcept({
        id: "node_B",
        name: "Concept B",
        description: "Desc B",
        stage: 3,
        sourceBlockIds: [],
        prerequisites: ["node_A"],
      });
      graph.addConcept({
        id: "node_C",
        name: "Concept C",
        description: "Desc C",
        stage: 4,
        sourceBlockIds: [],
        prerequisites: ["node_B"],
      });

      const validation = graph.validateDAG();
      expect(validation.isAcyclic).toBe(false);
      expect(validation.cycle).toBeDefined();
      expect(validation.cycle?.length).toBeGreaterThanOrEqual(3);
    });

    it("throws error when attempting topological order on a cyclic graph", () => {
      const graph = new ConceptGraph();
      graph.addConcept({
        id: "x1",
        name: "X1",
        description: "X1",
        stage: 1,
        sourceBlockIds: [],
        prerequisites: ["x2"],
      });
      graph.addConcept({
        id: "x2",
        name: "X2",
        description: "X2",
        stage: 2,
        sourceBlockIds: [],
        prerequisites: ["x1"],
      });

      expect(() => graph.getTopologicalOrder()).toThrow(/cyclic concept graph/i);
    });

    it("computes deterministic Kahn topological order respecting prerequisite dependencies", () => {
      const graph = new ConceptGraph();

      // Add out of order
      graph.addConcept({
        id: "c_master",
        name: "System Mastery",
        description: "Stage 7 Capstone",
        stage: 7,
        sourceBlockIds: [],
        prerequisites: ["c_practice"],
      });
      graph.addConcept({
        id: "c_practice",
        name: "Practice Problems",
        description: "Stage 4 Practice",
        stage: 4,
        sourceBlockIds: [],
        prerequisites: ["c_understand"],
      });
      graph.addConcept({
        id: "c_discover",
        name: "Discovery Hook",
        description: "Stage 1 Hook",
        stage: 1,
        sourceBlockIds: [],
        prerequisites: [],
      });
      graph.addConcept({
        id: "c_understand",
        name: "Core Principle",
        description: "Stage 2 Theory",
        stage: 2,
        sourceBlockIds: [],
        prerequisites: ["c_discover"],
      });

      const order = graph.getTopologicalOrder();
      expect(order.map((n) => n.id)).toEqual([
        "c_discover",
        "c_understand",
        "c_practice",
        "c_master",
      ]);
    });

    it("resolves direct and transitive prerequisites accurately", () => {
      const graph = new ConceptGraph();
      graph.addConcept({ id: "L1", name: "L1", description: "L1", stage: 1, sourceBlockIds: [], prerequisites: [] });
      graph.addConcept({ id: "L2", name: "L2", description: "L2", stage: 2, sourceBlockIds: [], prerequisites: ["L1"] });
      graph.addConcept({ id: "L3", name: "L3", description: "L3", stage: 3, sourceBlockIds: [], prerequisites: ["L2"] });
      graph.addConcept({ id: "L4", name: "L4", description: "L4", stage: 4, sourceBlockIds: [], prerequisites: ["L3"] });

      const directOfL4 = graph.getPrerequisitesFor("L4", false);
      expect(directOfL4.map((c) => c.id)).toEqual(["L3"]);

      const transitiveOfL4 = graph.getPrerequisitesFor("L4", true);
      const transitiveIds = new Set(transitiveOfL4.map((c) => c.id));
      expect(transitiveIds).toEqual(new Set(["L1", "L2", "L3"]));
    });

    it("enforces stage progression and prerequisite satisfaction check", () => {
      const graph = new ConceptGraph();
      graph.addConcept({ id: "c1", name: "C1", description: "", stage: 1, sourceBlockIds: [], prerequisites: [] });
      graph.addConcept({ id: "c2", name: "C2", description: "", stage: 2, sourceBlockIds: [], prerequisites: ["c1"] });
      graph.addConcept({ id: "c3", name: "C3", description: "", stage: 3, sourceBlockIds: [], prerequisites: ["c2"] });
      graph.addConcept({ id: "c4", name: "C4", description: "", stage: 4, sourceBlockIds: [], prerequisites: ["c3"] });

      // Student has only mastered stage 1 & 2 concepts, targeting stage 4
      const checkFail = graph.checkStagePrerequisites(4, ["c1", "c2"]);
      expect(checkFail.satisfied).toBe(false);
      expect(checkFail.missing.map((c) => c.id)).toEqual(["c3"]);

      // Student mastered c1, c2, c3
      const checkPass = graph.checkStagePrerequisites(4, ["c1", "c2", "c3"]);
      expect(checkPass.satisfied).toBe(true);
      expect(checkPass.missing).toHaveLength(0);
    });

    it("rejects invalid learning stages outside 1..7", () => {
      const graph = new ConceptGraph();
      expect(() =>
        graph.addConcept({
          id: "invalid_stage",
          name: "Invalid",
          description: "",
          stage: 8 as any,
          sourceBlockIds: [],
          prerequisites: [],
        })
      ).toThrow(/Invalid learning stage/);
    });
  });

  describe("4. 4-Tier Claim Ledger Taxonomy & Verification", () => {
    const sampleSources: SourceBlock[] = [
      createSourceBlock({
        locator: "page:1#p1",
        text: "The systolic blood pressure in healthy adults is typically between 90 and 120 mmHg.",
      }),
      createSourceBlock({
        locator: "page:2#p3",
        text: "Mitochondria produce cellular adenosine triphosphate through oxidative phosphorylation.",
      }),
      createSourceBlock({
        locator: "page:4#p1",
        text: "Transformer neural networks use self-attention mechanisms to process tokens in parallel.",
      }),
    ];

    const ledger = new ClaimLedger();

    it("classifies verbatim source statements as DIRECTLY_SUPPORTED with confidence >= 0.90", () => {
      const result = ledger.classifyClaim(
        "The systolic blood pressure in healthy adults is typically between 90 and 120 mmHg.",
        sampleSources
      );

      expect(result.claimType).toBe("DIRECTLY_SUPPORTED");
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.sourceBlockId).toBe(sampleSources[0].id);
      expect(result.sha256Hash).toBe(sampleSources[0].sha256Hash);
      expect(result.matchedExcerpt).toBeDefined();
    });

    it("classifies conceptual paraphrases as PEDAGOGICAL_PARAPHRASE with confidence in [0.70, 0.89]", () => {
      const result = ledger.classifyClaim(
        "Mitochondria generate cellular energy currency adenosine triphosphate through oxidative phosphorylation processes.",
        sampleSources
      );

      expect(result.claimType).toBe("PEDAGOGICAL_PARAPHRASE");
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.confidence).toBeLessThan(0.9);
      expect(result.sourceBlockId).toBe(sampleSources[1].id);
      expect(result.sha256Hash).toBe(sampleSources[1].sha256Hash);
    });

    it("classifies logical deductions as INFERRED with confidence in [0.50, 0.69]", () => {
      const result = ledger.classifyClaim(
        "Self-attention architectures in transformer networks replace sequential recurrence for parallel token evaluation.",
        sampleSources
      );

      expect(result.claimType).toBe("INFERRED");
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.sourceBlockId).toBe(sampleSources[2].id);
    });

    it("classifies ungrounded or fabricated statistical claims as UNSUPPORTED with low confidence", () => {
      const result = ledger.classifyClaim(
        "Systolic blood pressure reaches 185 mmHg under normal resting conditions.",
        sampleSources
      );

      expect(result.claimType).toBe("UNSUPPORTED");
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.rationale).toMatch(/ungrounded quantitative figure/i);
    });

    it("classifies completely unrelated claims as UNSUPPORTED", () => {
      const result = ledger.classifyClaim(
        "The quantum entanglement of superconducting qubits exhibits high fidelity.",
        sampleSources
      );

      expect(result.claimType).toBe("UNSUPPORTED");
      expect(result.confidence).toBe(0.0);
    });

    it("handles batch verification and generates structured audit reports", () => {
      const claims = [
        "The systolic blood pressure in healthy adults is typically between 90 and 120 mmHg.",
        "Mitochondria produce cellular adenosine triphosphate through oxidative phosphorylation.",
        "The quantum entanglement of superconducting qubits exhibits high fidelity.",
      ];

      const batchResults = ledger.verifyBatch(claims, sampleSources);
      expect(batchResults.length).toBe(3);

      const report = ledger.generateAuditReport(batchResults);
      expect(report.directlySupportedCount).toBe(2);
      expect(report.unsupportedCount).toBe(1);
      expect(report.totalClaims).toBe(3);
      expect(report.passed).toBe(false);
      expect(report.unsupportedClaims.length).toBe(1);
    });
  });

  describe("5. Zero Invention Strict Rule & Quantitative Scanner", () => {
    const sources: SourceBlock[] = [
      createSourceBlock({
        locator: "sec:1#p1",
        text: "The clinical trial enrolled 500 patients and observed an 85% recovery rate at 37 °C.",
      }),
      createSourceBlock({
        locator: "sec:2#p1",
        text: "The reaction yields 10 mM concentration with a 3-fold increase in catalytic efficiency.",
      }),
      createSourceBlock({
        locator: "sec:3#p1",
        text: "Published in 2017 by Vaswani et al. describing self-attention.",
      }),
    ];

    it("defines the exact verbatim fallback constant NOT_SPECIFIED_FALLBACK", () => {
      expect(NOT_SPECIFIED_FALLBACK).toBe("Not specified in the provided source");
    });

    describe("enforceZeroInvention", () => {
      it("returns NOT_SPECIFIED_FALLBACK when requested data is null, undefined, or empty", () => {
        const resNull = enforceZeroInvention("clinicalDose", null, sources);
        expect(resNull.output).toBe("Not specified in the provided source");
        expect(resNull.hasMissingDataFallback).toBe(true);
        expect(resNull.isClean).toBe(true);

        const resEmpty = enforceZeroInvention("mechanism", "   ", sources);
        expect(resEmpty.output).toBe("Not specified in the provided source");
        expect(resEmpty.hasMissingDataFallback).toBe(true);
      });

      it("returns NOT_SPECIFIED_FALLBACK when sources array is empty", () => {
        const res = enforceZeroInvention("stat", "Achieved 95% accuracy", []);
        expect(res.output).toBe("Not specified in the provided source");
        expect(res.hasMissingDataFallback).toBe(true);
      });

      it("returns original text when quantitative data is grounded in sources", () => {
        const validText = "The trial observed an 85% recovery rate across 500 patients.";
        const res = enforceZeroInvention("results", validText, sources);

        expect(res.output).toBe(validText);
        expect(res.hasMissingDataFallback).toBe(false);
        expect(res.isClean).toBe(true);
        expect(res.fabricatedNumbers).toHaveLength(0);
      });

      it("intercepts fabricated figures and enforces fallback with flagged fabricated tokens", () => {
        const fabricatedText = "The trial observed a 99.8% recovery rate across 12000 patients.";
        const res = enforceZeroInvention("results", fabricatedText, sources);

        expect(res.output).toBe("Not specified in the provided source");
        expect(res.hasMissingDataFallback).toBe(true);
        expect(res.isClean).toBe(false);
        expect(res.fabricatedNumbers.length).toBeGreaterThan(0);
        expect(res.fabricatedNumbers.some((f) => f.includes("99.8%"))).toBe(true);
      });
    });

    describe("scanQuantitativeFigures across 9 Categories", () => {
      it("scans percentages (grounded vs ungrounded)", () => {
        const scanGrounded = scanQuantitativeFigures("Observed 85% rate", sources);
        expect(scanGrounded.passed).toBe(true);

        const scanHallucinated = scanQuantitativeFigures("Observed 98.5% rate", sources);
        expect(scanHallucinated.passed).toBe(false);
        expect(scanHallucinated.hallucinatedFigures).toContain("98.5%");
      });

      it("scans multipliers and ratios", () => {
        const scanGrounded = scanQuantitativeFigures("A 3-fold increase was recorded", sources);
        expect(scanGrounded.passed).toBe(true);

        const scanHallucinated = scanQuantitativeFigures("A 10-fold increase was recorded", sources);
        expect(scanHallucinated.passed).toBe(false);
        expect(scanHallucinated.hallucinatedFigures).toContain("10-fold");
      });

      it("scans scientific units (temperature, length, mass, frequency)", () => {
        const scanGrounded = scanQuantitativeFigures("Maintained at 37 °C", sources);
        expect(scanGrounded.passed).toBe(true);

        const scanHallucinated = scanQuantitativeFigures("Operating at 4.5 GHz and 150 °C", sources);
        expect(scanHallucinated.passed).toBe(false);
        expect(scanHallucinated.hallucinatedFigures.some((h) => h.includes("4.5 GHz"))).toBe(true);
      });

      it("scans cohort and study sample sizes", () => {
        const scanGrounded = scanQuantitativeFigures("Evaluated in 500 patients", sources);
        expect(scanGrounded.passed).toBe(true);

        const scanHallucinated = scanQuantitativeFigures("Evaluated in 2500 participants", sources);
        expect(scanHallucinated.passed).toBe(false);
        expect(scanHallucinated.hallucinatedFigures.some((h) => h.includes("2500 participants"))).toBe(true);
      });

      it("scans dates and citations", () => {
        const scanGrounded = scanQuantitativeFigures("Published in 2017 by Vaswani et al.", sources);
        expect(scanGrounded.passed).toBe(true);

        const scanHallucinated = scanQuantitativeFigures("Discovered in 1984 by Peterson et al.", sources);
        expect(scanHallucinated.passed).toBe(false);
        expect(scanHallucinated.hallucinatedFigures.some((h) => h.includes("1984"))).toBe(true);
      });

      it("scans chemical concentrations and stoichiometric figures", () => {
        const scanGrounded = scanQuantitativeFigures("Yielding 10 mM concentration", sources);
        expect(scanGrounded.passed).toBe(true);

        const scanHallucinated = scanQuantitativeFigures("Yielding 500 μM concentration", sources);
        expect(scanHallucinated.passed).toBe(false);
        expect(scanHallucinated.hallucinatedFigures.some((h) => h.includes("500 μM"))).toBe(true);
      });

      it("whitelists safe pedagogical counting integers without false positives", () => {
        const scan = scanQuantitativeFigures(
          "We will explore 3 core principles across Step 1 and Step 2.",
          sources
        );
        expect(scan.passed).toBe(true);
        expect(scan.hallucinatedFigures).toHaveLength(0);
      });

      it("excludes numbers inside LaTeX mathematical formulas from hallucination flags", () => {
        const mathText = "The quadratic solution is given by $f(x) = 2x^2 + 5x - 3$.";
        const scan = scanQuantitativeFigures(mathText, sources);
        expect(scan.passed).toBe(true);
        expect(scan.hallucinatedFigures).toHaveLength(0);
      });

      it("excludes subscript digits in chemical formulas from hallucination flags", () => {
        const chemText = "The reaction produces H2O, CO2, and C6H12O6 in the presence of Ca2+.";
        const scan = scanQuantitativeFigures(chemText, sources);
        expect(scan.passed).toBe(true);
        expect(scan.hallucinatedFigures).toHaveLength(0);
      });

      it("handles complex paragraphs with multiple mixed grounded and hallucinated figures", () => {
        const mixedText =
          "The trial with 500 patients reported 85% efficacy, but the unverified follow-up claimed 99.4% success at 120 °C.";
        const scan = scanQuantitativeFigures(mixedText, sources);
        expect(scan.passed).toBe(false);
        expect(scan.hallucinatedFigures.some((h) => h.includes("99.4%"))).toBe(true);
        expect(scan.hallucinatedFigures.some((h) => h.includes("120 °C"))).toBe(true);
        // Grounded 500 patients and 85% should be recognized as grounded
        const grounded500 = scan.foundFigures.find((f) => f.rawMatch.includes("500"));
        expect(grounded500?.isGrounded).toBe(true);
      });
    });

    describe("6. Complex Graph Topologies & Edge Cases", () => {
      it("resolves diamond prerequisite dependencies deterministically", () => {
        // A -> B, A -> C, B -> D, C -> D
        const graph = new ConceptGraph();
        graph.addConcept({ id: "A", name: "A", description: "", stage: 1, sourceBlockIds: [], prerequisites: [] });
        graph.addConcept({ id: "B", name: "B", description: "", stage: 2, sourceBlockIds: [], prerequisites: ["A"] });
        graph.addConcept({ id: "C", name: "C", description: "", stage: 2, sourceBlockIds: [], prerequisites: ["A"] });
        graph.addConcept({ id: "D", name: "D", description: "", stage: 3, sourceBlockIds: [], prerequisites: ["B", "C"] });

        expect(graph.validateDAG().isAcyclic).toBe(true);
        const order = graph.getTopologicalOrder().map((n) => n.id);
        expect(order[0]).toBe("A");
        expect(order.slice(1, 3)).toEqual(["B", "C"]);
        expect(order[3]).toBe("D");

        const depsOfA = graph.getDependentsFor("A", true).map((n) => n.id);
        expect(new Set(depsOfA)).toEqual(new Set(["B", "C", "D"]));
      });

      it("handles concept lookup and stage filtering helper methods", () => {
        const graph = new ConceptGraph();
        graph.addConcept({ id: "s1_node", name: "S1", description: "Stage 1", stage: 1, sourceBlockIds: ["b1"], prerequisites: [] });
        graph.addConcept({ id: "s2_node", name: "S2", description: "Stage 2", stage: 2, sourceBlockIds: ["b2"], prerequisites: ["s1_node"] });

        expect(graph.getConcept("s1_node")?.name).toBe("S1");
        expect(graph.getConcept("nonexistent")).toBeUndefined();
        expect(graph.getConceptsByStage(1)).toHaveLength(1);
        expect(graph.getConceptsByStage(5)).toHaveLength(0);
        expect(graph.getNodeCount()).toBe(2);

        graph.clear();
        expect(graph.getNodeCount()).toBe(0);
      });
    });
  });
});

