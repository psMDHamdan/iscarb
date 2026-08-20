import { describe, expect, it } from "vitest";
import {
  ClaimLedger,
  ConceptGraph,
  createSourceBlock,
  enforceZeroInvention,
  isNotSpecified,
  NOT_SPECIFIED_FALLBACK,
  scanQuantitativeFigures,
  type SourceBlock,
} from "../../lib/lecture/grounding";

describe("Milestone 1 Empirical Adversarial Challenge Suite", () => {
  const baseSources: SourceBlock[] = [
    createSourceBlock({
      locator: "sec:1#p1",
      text: "The clinical study evaluated 1500 patients and observed an 98.4% efficacy rate under 100 mW power at 37 °C.",
    }),
    createSourceBlock({
      locator: "sec:2#p1",
      text: "Published in 2017 by Vaswani et al. describing self-attention with 12-fold acceleration.",
    }),
    createSourceBlock({
      locator: "sec:3#p1",
      text: "The solution required 1200 mg of NaCl dissolved in 500 mL water yielding 10.5 mM concentration.",
    }),
  ];

  describe("Category 1: Subtle Numerical Mutations & Substring Collisions", () => {
    it("CHALLENGE 1.1: Detects distinct decimal percentage mutation (98.4% vs 98.5%)", () => {
      const scan = scanQuantitativeFigures("Observed 98.5% efficacy rate.", baseSources);
      expect(scan.passed).toBe(false);
      expect(scan.hallucinatedFigures).toContain("98.5%");
    });

    it("CHALLENGE 1.2 [VULNERABILITY]: Substring suffix collision in percentage (source: 198.5% vs claim: 98.5%)", () => {
      const src = [createSourceBlock({ locator: "doc#1", text: "The growth was 198.5% year over year." })];
      const scan = scanQuantitativeFigures("The growth was 98.5% this year.", src);
      // EMPIRICAL OBSERVATION:
      // Due to `normalizedSources.includes(normalizedMatch)` without word/digit boundary checks,
      // "198.5%" is treated as grounding "98.5%".
      const isVulnerable = scan.passed === true;
      expect(isVulnerable).toBe(true); // Demonstrates the substring collision flaw
    });

    it("CHALLENGE 1.3 [VULNERABILITY]: Substring suffix collision in cohort size (source: 1500 patients vs claim: 500 patients)", () => {
      const scan = scanQuantitativeFigures("The clinical study evaluated 500 patients.", baseSources);
      // EMPIRICAL OBSERVATION:
      // Source contains "1500 patients". Claim requests "500 patients".
      // String `.includes("500 patients")` matches inside "1500 patients", erroneously passing as grounded.
      const isVulnerable = scan.passed === true;
      expect(isVulnerable).toBe(true);
    });

    it("CHALLENGE 1.4 [VULNERABILITY]: Substring suffix collision in scientific units (source: 1200 mg vs claim: 200 mg)", () => {
      const scan = scanQuantitativeFigures("The solution required 200 mg of NaCl.", baseSources);
      // EMPIRICAL OBSERVATION:
      // "1200 mg" contains substring "200 mg", causing an ungrounded 200 mg figure to be accepted.
      const isVulnerable = scan.passed === true;
      expect(isVulnerable).toBe(true);
    });

    it("CHALLENGE 1.5 [VULNERABILITY]: Case normalization collapses unit magnitudes (100 mW milliwatts vs 100 MW megawatts)", () => {
      const scan = scanQuantitativeFigures("The system was tested under 100 MW power.", baseSources);
      // EMPIRICAL OBSERVATION:
      // `normalizeQuantitativeText` converts all text to lower-case.
      // 100 MW (10^6 W) is normalized to "100 mw" matching source "100 mW" (10^-3 W),
      // creating a 10^9 magnitude blindspot.
      const isVulnerable = scan.passed === true;
      expect(isVulnerable).toBe(true);
    });

    it("CHALLENGE 1.6 [VULNERABILITY]: SAFE_NUMBERS whitelist bypasses ungrounded scientific units (e.g. 5 kg, 24 V)", () => {
      const scan = scanQuantitativeFigures("The patient received 5 kg of morphine at 24 V.", baseSources);
      // EMPIRICAL OBSERVATION:
      // `SAFE_NUMBERS` checks digitsOnly in Set {"5", "24", ...} and only excludes percentage/multiplier/chem/perf.
      // "unit" category is NOT excluded from SAFE_NUMBERS whitelist, so fabricated "5 kg" and "24 V" are skipped from validation.
      const isVulnerable = scan.passed === true && scan.hallucinatedFigures.length === 0;
      expect(isVulnerable).toBe(true);
    });

    it("CHALLENGE 1.7 [VULNERABILITY]: SAFE_NUMBERS whitelist bypasses ungrounded cohort sizes (e.g. 20 patients)", () => {
      const scan = scanQuantitativeFigures("The trial enrolled 20 patients.", baseSources);
      // EMPIRICAL OBSERVATION:
      // "cohort_size" is not excluded from SAFE_NUMBERS whitelist. "20" is in SAFE_NUMBERS, so "20 patients" bypasses checking.
      const isVulnerable = scan.passed === true;
      expect(isVulnerable).toBe(true);
    });
  });

  describe("Category 2: Obfuscated Units, Unicode & Greek Prefixes", () => {
    it("CHALLENGE 2.1 [VULNERABILITY]: Micro sign U+00B5 (µ) vs Greek small letter Mu U+03BC (μ)", () => {
      const src = [createSourceBlock({ locator: "doc#1", text: "Dosage was 50 \u00B5g/ml." })];
      const scan = scanQuantitativeFigures("Dosage was 50 \u03BCg/ml.", src);
      // EMPIRICAL OBSERVATION:
      // `normalizeQuantitativeText` replaces `\u03BC` with `u` but does NOT replace `\u00B5` (Micro sign),
      // leading to false positive hallucination detection when source uses Unicode micro sign.
      expect(scan.passed).toBe(false); // Demonstrates false-positive rejection due to asymmetric normalization
    });

    it("CHALLENGE 2.2: Non-breaking space (\\u00A0) in measurements", () => {
      const scan = scanQuantitativeFigures("The clinical study evaluated 1500\u00A0patients.", baseSources);
      expect(scan.passed).toBe(true);
    });

    it("CHALLENGE 2.3: Detects ungrounded chemical concentration with Greek prefix (500 μM)", () => {
      const scan = scanQuantitativeFigures("The reaction used 500 μM of inhibitor.", baseSources);
      expect(scan.passed).toBe(false);
      expect(scan.hallucinatedFigures.some((f) => f.includes("500"))).toBe(true);
    });
  });

  describe("Category 3: Fabricated Citations & Format Variations", () => {
    it("CHALLENGE 3.1: Flags fabricated citation with ungrounded year: Vaswani et al., 2029", () => {
      const scan = scanQuantitativeFigures("According to Vaswani et al., 2029 self-attention is key.", baseSources);
      expect(scan.passed).toBe(false);
      expect(scan.hallucinatedFigures.some((f) => f.includes("2029"))).toBe(true);
    });

    it("CHALLENGE 3.2 [VULNERABILITY]: Parenthesized author citation format 'Author (Year)' bypasses citation regex", () => {
      const scan = scanQuantitativeFigures("According to Vaswani et al. (2017) self-attention is key.", baseSources);
      // EMPIRICAL OBSERVATION:
      // Citation regex `\b[A-Z][a-zA-Z]+(?:\s+et\s+al\.)?,?\s+(?:19\d\d|20\d\d)\b` expects comma/space before year.
      // Parenthesized `(2017)` fails citation regex; only date `2017` is scanned and grounded.
      const foundCitation = scan.foundFigures.find((f) => f.category === "citation");
      expect(foundCitation).toBeUndefined(); // Citation was not recognized as a citation entity
    });

    it("CHALLENGE 3.3 [VULNERABILITY]: Fabricated author name with grounded year classified as PEDAGOGICAL_PARAPHRASE", () => {
      const ledger = new ClaimLedger();
      const claim = "Published in 2017 by FabricatedAuthor et al. describing self-attention.";
      const res = ledger.classifyClaim(claim, baseSources);
      // EMPIRICAL OBSERVATION:
      // Because "Published in 2017 by FabricatedAuthor et al." has year in front of author,
      // citation regex does not match. High token overlap with source causes it to be classified
      // as PEDAGOGICAL_PARAPHRASE despite containing a completely fabricated author!
      expect(res.claimType).toBe("PEDAGOGICAL_PARAPHRASE");
    });
  });

  describe("Category 4: Missing Fields & isNotSpecified Edge Cases", () => {
    it("CHALLENGE 4.1: Standard missing data fallbacks", () => {
      expect(isNotSpecified("Not specified in the provided source")).toBe(true);
      expect(isNotSpecified("not specified in the provided source.")).toBe(true);
      expect(isNotSpecified("NOT SPECIFIED")).toBe(true);
      expect(isNotSpecified("N/A")).toBe(true);
      expect(isNotSpecified("unknown")).toBe(true);
      expect(isNotSpecified(null)).toBe(true);
      expect(isNotSpecified(undefined)).toBe(true);
    });

    it("CHALLENGE 4.2 [VULNERABILITY]: isNotSpecified('   ') with whitespace string returns false", () => {
      // EMPIRICAL OBSERVATION:
      // `isNotSpecified` checks `if (!text) return true;`. For `"   "`, `!text` is false.
      // `text.trim()` becomes `""` which fails equality against `NOT_SPECIFIED_FALLBACK`.
      expect(isNotSpecified("   ")).toBe(false); // Bug in isNotSpecified whitespace handling
    });

    it("CHALLENGE 4.3: enforceZeroInvention handles whitespace and fabricated numbers strictly", () => {
      const res1 = enforceZeroInvention("test", "   ", baseSources);
      expect(res1.output).toBe(NOT_SPECIFIED_FALLBACK);
      expect(res1.hasMissingDataFallback).toBe(true);

      const res2 = enforceZeroInvention("dose", "Administered 99.9% dose to 8000 participants.", baseSources);
      expect(res2.output).toBe(NOT_SPECIFIED_FALLBACK);
      expect(res2.hasMissingDataFallback).toBe(true);
      expect(res2.isClean).toBe(false);
    });
  });

  describe("Category 5: Batch Verification & Mixed True/False Claims", () => {
    it("CHALLENGE 5.1: Batch verification correctly identifies unsupported claims and fails audit report", () => {
      const ledger = new ClaimLedger();
      const claims = [
        "The clinical study evaluated 1500 patients and observed an 98.4% efficacy rate under 100 mW power at 37 °C.",
        "The solution required 1200 mg of NaCl dissolved in 500 mL water yielding 10.5 mM concentration.",
        "The trial achieved a 99.9% cure rate with 0% mortality.", // UNSUPPORTED
        "Quantum computing algorithms achieved 1000x supremacy.", // UNSUPPORTED
      ];

      const batch = ledger.verifyBatch(claims, baseSources);
      const report = ledger.generateAuditReport(batch);

      expect(batch.length).toBe(4);
      expect(report.passed).toBe(false);
      expect(report.unsupportedCount).toBe(2);
      expect(report.unsupportedClaims.length).toBe(2);
      expect(report.directlySupportedCount).toBe(2);
    });

    it("CHALLENGE 5.2: Empty batch returns passed: false", () => {
      const ledger = new ClaimLedger();
      const report = ledger.generateAuditReport([]);
      expect(report.passed).toBe(false);
      expect(report.totalClaims).toBe(0);
    });
  });

  describe("Category 6: ConceptGraph Topological & Cycle Edge Cases", () => {
    it("CHALLENGE 6.1: Detects self-loop A -> A as cyclic", () => {
      const graph = new ConceptGraph();
      graph.addConcept({
        id: "self_loop",
        name: "Self Loop",
        description: "Loops on itself",
        stage: 1,
        sourceBlockIds: [],
        prerequisites: ["self_loop"],
      });

      const validation = graph.validateDAG();
      expect(validation.isAcyclic).toBe(false);
    });

    it("CHALLENGE 6.2: Disconnected components are ordered deterministically by stage and ID", () => {
      const graph = new ConceptGraph();
      graph.addConcept({ id: "z_stage1", name: "Z", description: "", stage: 1, sourceBlockIds: [], prerequisites: [] });
      graph.addConcept({ id: "a_stage1", name: "A", description: "", stage: 1, sourceBlockIds: [], prerequisites: [] });
      graph.addConcept({ id: "b_stage2", name: "B", description: "", stage: 2, sourceBlockIds: [], prerequisites: [] });

      const order = graph.getTopologicalOrder();
      expect(order.map((c) => c.id)).toEqual(["a_stage1", "z_stage1", "b_stage2"]);
    });
  });
});
