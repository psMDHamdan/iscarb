import { describe, it, expect } from "vitest";
import {
  cleanJargon,
  cleanseJargon,
  hasForbiddenJargon,
  detectForbiddenJargon,
  cleanObjectJargon,
  validateZeroJargon,
  tokenizeMarkdown,
  LABEL_PREFIXES,
  FORBIDDEN_JARGON_PATTERNS,
} from "@/lib/lecture/projections/utils/jargon-cleaner";

describe("Zero Jargon Leakage Engine & AST Markdown Sanitizer", () => {
  describe("1. AST Markdown Tokenizer & Code/Math Preservation", () => {
    it("AST-01: Protects fenced Python code blocks from term replacement", () => {
      const codeInput = "```python\ndef calculate_slide(slot_idx, pass_num):\n    # This artifact computes score\n    return slot_idx + pass_num\n```";
      const cleaned = cleanJargon(codeInput);
      expect(cleaned).toBe(codeInput);
    });

    it("AST-02: Protects inline code tokens from replacement", () => {
      const inlineInput = "Execute the function `process_slide_artifact(slot_id)` in the pipeline.";
      const cleaned = cleanJargon(inlineInput);
      expect(cleaned).toContain("`process_slide_artifact(slot_id)`");
    });

    it("AST-03: Protects block LaTeX math ($$...$$ and \\[...\\]) from corruption", () => {
      const blockMath1 = "$$S_1 = \\sum_{i=1}^n x_i \\text{ where } \\text{Phase } \\alpha = \\beta$$";
      const cleaned1 = cleanJargon(blockMath1);
      expect(cleaned1).toBe(blockMath1);

      const blockMath2 = "\\[\\text{Slot}_k = \\int_0^1 f(t) dt\\]";
      const cleaned2 = cleanJargon(blockMath2);
      expect(cleaned2).toBe(blockMath2);
    });

    it("AST-04: Protects inline LaTeX math ($...$ and \\(...\\))", () => {
      const inlineMath = "The sum is given by $S_1 + S_2 = S_3$ where \\(k \\in \\text{Phase}_1\\).";
      const cleaned = cleanJargon(inlineMath);
      expect(cleaned).toContain("$S_1 + S_2 = S_3$");
      expect(cleaned).toContain("\\(k \\in \\text{Phase}_1\\)");
    });

    it("AST-05: Disambiguates monetary currencies from LaTeX math", () => {
      const currencyText = "The total capital expenditure was $500M with expected returns from $50 to $100 per unit.";
      const cleaned = cleanJargon(currencyText);
      expect(cleaned).toBe("The total capital expenditure was $500M with expected returns from $50 to $100 per unit.");
    });
  });

  describe("2. Markdown-Wrapped Prefix Stripper", () => {
    it("STRIP-01: Strips bold-wrapped prefixes without leaving stray asterisks", () => {
      const cases = [
        {
          input: "**Problem Context:** When servers crash, state is lost.",
          expected: "When servers crash, state is lost.",
        },
        {
          input: "**Mental Model:** A balance scale maintaining equal weights on both pans.",
          expected: "A balance scale maintaining equal weights on both pans.",
        },
        {
          input: "**Core Principle:** Invariants must be preserved under concurrency.",
          expected: "Invariants must be preserved under concurrency.",
        },
        {
          input: "**Bloom Level: Apply** Calculate the Gibbs free energy.",
          expected: "Calculate the Gibbs free energy.",
        },
        {
          input: "**Academic Truth:** The Second Law states that entropy never decreases.",
          expected: "The Second Law states that entropy never decreases.",
        },
        {
          input: "**Misconception Alert:** Adding heat does not always raise temperature.",
          expected: "Adding heat does not always raise temperature.",
        },
        {
          input: "**Readiness Gate:** Test mastery before final progression.",
          expected: "Test mastery before final progression.",
        },
        {
          input: "**Layer 1 (Academic Truth):** Formal theorem of serializability.",
          expected: "Formal theorem of serializability.",
        },
        {
          input: "**Layer 3 (Mechanism):** Lock manager coordinates mutexes.",
          expected: "Lock manager coordinates mutexes.",
        },
      ];

      for (const { input, expected } of cases) {
        expect(cleanJargon(input)).toBe(expected);
      }
    });

    it("STRIP-02: Strips markdown header prefixes (###, ##, #)", () => {
      expect(cleanJargon("### Mental Model: Analogous Balance")).toBe("### Analogous Balance");
      expect(cleanJargon("## Problem Context: Distributed Latency")).toBe("## Distributed Latency");
      expect(cleanJargon("# Core Concept: Consensus Protocols")).toBe("# Consensus Protocols");
    });

    it("STRIP-03: Strips prefixes inside markdown lists while preserving list bullets", () => {
      const listInput = "- **Mental Model:** A lock and key mechanism fits enzyme active sites.\n- **Core Principle:** Transition state activation energy is lowered.";
      const cleaned = cleanJargon(listInput);
      expect(cleaned).toBe("- A lock and key mechanism fits enzyme active sites.\n- Transition state activation energy is lowered.");
    });

    it("STRIP-04: Handles multi-line markdown documents with mixed prefixes", () => {
      const markdownDoc = `
### Academic Truth: Conservation of Momentum
- **Key Requirement:** Total momentum in an isolated system is constant.
- **Mental Model:** Billiard balls colliding on a frictionless table.
- **Application Context:** Rocket propulsion via expelled exhaust mass.
      `.trim();

      const cleaned = cleanJargon(markdownDoc);
      expect(cleaned).not.toContain("Academic Truth:");
      expect(cleaned).not.toContain("Key Requirement:");
      expect(cleaned).not.toContain("Mental Model:");
      expect(cleaned).not.toContain("Application Context:");
      expect(cleaned).toContain("### Conservation of Momentum");
      expect(cleaned).toContain("- Total momentum in an isolated system is constant.");
    });
  });

  describe("3. Pipeline Vocabulary Normalization & Safe Word Preservation", () => {
    it("VOCAB-01: Replaces pipeline jargon with correct singular and plural pedagogical terms", () => {
      expect(cleanJargon("Review this slide artifact")).toBe("Review this slide learning resource");
      expect(cleanJargon("Review all slide artifacts")).toBe("Review all slide learning resources");
      expect(cleanJargon("Parse the source chunk")).toBe("Parse the reference text");
      expect(cleanJargon("Parse all source chunks")).toBe("Parse all reference texts");
      expect(cleanJargon("Execute the prompt template")).toBe("Execute the exercise");
      expect(cleanJargon("Execute all prompt templates")).toBe("Execute all exercises");
      expect(cleanJargon("Assign this slot")).toBe("Assign this section");
      expect(cleanJargon("Assign all slots")).toBe("Assign all sections");
      expect(cleanJargon("Run generation pass 3")).toBe("Run learning step 3");
      expect(cleanJargon("Run all generation passes")).toBe("Run all learning steps");
      expect(cleanJargon("Executing pass 12")).toBe("Executing step 12");
      expect(cleanJargon("Inspect Slide 4")).toBe("Inspect Concept 4");
      expect(cleanJargon("Refer to S15")).toBe("Refer to Concept 15");
      expect(cleanJargon("Phase 2 deepens knowledge")).toBe("Stage 2 deepens knowledge");
    });

    it("VOCAB-02: Preserves valid English words containing jargon substrings", () => {
      expect(cleanJargon("Student scored a passing grade on password security in class.")).toBe(
        "Student scored a passing grade on password security in class."
      );
      expect(cleanJargon("Asset management and compass orientation.")).toBe(
        "Asset management and compass orientation."
      );
      expect(cleanJargon("Classify the passengers into groups.")).toBe(
        "Classify the passengers into groups."
      );
    });

    it("VOCAB-03: Eliminates backend system identifiers", () => {
      const textWithInternals = "Using the iSCARB Framework with H-Stack Architecture and Learning Compiler on QStash with Redis.";
      const cleaned = cleanJargon(textWithInternals);
      expect(hasForbiddenJargon(cleaned)).toBe(false);
      expect(cleaned).not.toContain("iSCARB");
      expect(cleaned).not.toContain("H-Stack");
      expect(cleaned).not.toContain("Learning Compiler");
    });
  });

  describe("4. Deep Object Traversal & Non-String Preservation", () => {
    it("TRAV-01: Recursively sanitizes nested objects and arrays without mutating Date, Buffer, or numbers", () => {
      const dirtyObject = {
        title: "Slide 1: Ingestion artifact",
        timestamp: new Date("2026-08-20T00:00:00Z"),
        score: 95.5,
        isActive: true,
        bufferData: Buffer.from("test-binary"),
        nested: {
          items: [
            "Source chunk 1 contains data",
            "Refer to S5 for mechanism",
          ],
          deepMeta: {
            prompt: "Execute prompt template 2",
            pass: "Executing pass 7",
          },
        },
      };

      const cleaned = cleanObjectJargon(dirtyObject);
      expect(cleaned.title).toBe("Concept 1: Ingestion learning resource");
      expect(cleaned.timestamp).toEqual(new Date("2026-08-20T00:00:00Z"));
      expect(cleaned.score).toBe(95.5);
      expect(cleaned.isActive).toBe(true);
      expect(Buffer.isBuffer(cleaned.bufferData)).toBe(true);
      expect(cleaned.nested.items[0]).toBe("reference text 1 contains data");
      expect(cleaned.nested.items[1]).toBe("Refer to Concept 5 for mechanism");
      expect(cleaned.nested.deepMeta.prompt).toBe("Execute exercise 2");
      expect(cleaned.nested.deepMeta.pass).toBe("Executing step 7");

      expect(hasForbiddenJargon(JSON.stringify(cleaned))).toBe(false);
    });

    it("TRAV-02: Handles null, undefined, and primitives gracefully", () => {
      expect(cleanObjectJargon(null)).toBe(null);
      expect(cleanObjectJargon(undefined)).toBe(undefined);
      expect(cleanObjectJargon(123)).toBe(123);
      expect(cleanObjectJargon(true)).toBe(true);
    });
  });

  describe("5. Validation Contract: validateZeroJargon", () => {
    it("VAL-01: Returns valid: true on clean objects", () => {
      const cleanData = {
        title: "Thermodynamics of Heat Engines",
        concepts: [
          {
            name: "Carnot Efficiency",
            description: "Maximum theoretical efficiency between two thermal reservoirs.",
            formula: "$\\eta = 1 - \\frac{T_C}{T_H}$",
          },
        ],
      };

      const result = validateZeroJargon(cleanData);
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it("VAL-02: Detects and reports exact locations and matched patterns for leaked jargon", () => {
      const dirtyData = {
        course: "Computer Science",
        slides: [
          {
            title: "Slide 3: Cache Invalidation",
            bullets: [
              "Mental Model: Mailbox delivery queue",
              "Bloom Level: Apply to distributed systems",
              "Derived from source chunk 12",
            ],
          },
        ],
      };

      const result = validateZeroJargon(dirtyData);
      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(4);

      const paths = result.violations.map((v) => v.location);
      expect(paths.some((p) => p.includes("slides[0].title"))).toBe(true);
      expect(paths.some((p) => p.includes("slides[0].bullets[0]"))).toBe(true);
      expect(paths.some((p) => p.includes("slides[0].bullets[1]"))).toBe(true);
      expect(paths.some((p) => p.includes("slides[0].bullets[2]"))).toBe(true);
    });
  });
});
