import { describe, it, expect } from "vitest";
import {
  DistractorMisconceptionTypeEnum,
  validateDistractorIntegrity,
  MisconceptionAlertLayerSchema,
  ReadinessElementSchema,
} from "@/lib/lecture/pedagogy";

describe("4-Tier Distractor Misconception Modeling & Assessment Integrity", () => {
  describe("1. Distractor Misconception Taxonomy", () => {
    it("DIST-01: Validates the 4 canonical misconception categories", () => {
      const validTypes = [
        "OVER_GENERALIZATION",
        "REVERSE_CAUSALITY",
        "EDGE_CASE_NEGLECT",
        "CONFUSION_OF_TERMS",
      ];

      for (const type of validTypes) {
        expect(DistractorMisconceptionTypeEnum.parse(type)).toBe(type);
      }

      expect(() => DistractorMisconceptionTypeEnum.parse("RANDOM_GUESS")).toThrow();
      expect(() => DistractorMisconceptionTypeEnum.parse("TYPO")).toThrow();
    });
  });

  describe("2. Assessment MCQ Distractor Integrity Validator", () => {
    it("DIST-02: Passes when MCQ has 1 correct answer and 3 distinct distractor types", () => {
      const validOptions = [
        {
          id: "A",
          text: "Total entropy of an isolated system never decreases in spontaneous processes.",
          isCorrect: true,
        },
        {
          id: "B",
          text: "Entropy must increase everywhere in every sub-region of an open system.",
          isCorrect: false,
          misconceptionKey: "OVER_GENERALIZATION",
          misconceptionExplanation: "Overgeneralizes isolated system rule to open subsystems.",
        },
        {
          id: "C",
          text: "Spontaneous heat flows from cold to hot reservoirs without external work.",
          isCorrect: false,
          misconceptionKey: "REVERSE_CAUSALITY",
          misconceptionExplanation: "Inverts the natural direction of heat transfer.",
        },
        {
          id: "D",
          text: "Entropy and internal energy represent the exact same thermodynamic property.",
          isCorrect: false,
          misconceptionKey: "CONFUSION_OF_TERMS",
          misconceptionExplanation: "Conflates energy quantity with dispersal state multiplicity.",
        },
      ];

      const validation = validateDistractorIntegrity(validOptions);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it("DIST-03: Fails when distractors have fewer than 3 distinct misconception types (diagnostic blind spot)", () => {
      const repetitiveDistractorOptions = [
        {
          id: "A",
          text: "Serializability is the highest isolation level.",
          isCorrect: true,
        },
        {
          id: "B",
          text: "Serializable isolation is always required for all applications.",
          isCorrect: false,
          misconceptionKey: "OVER_GENERALIZATION",
        },
        {
          id: "C",
          text: "Serializable isolation eliminates all performance overheads.",
          isCorrect: false,
          misconceptionKey: "OVER_GENERALIZATION",
        },
        {
          id: "D",
          text: "Serializable isolation applies universally without locking.",
          isCorrect: false,
          misconceptionKey: "OVER_GENERALIZATION",
        },
      ];

      const validation = validateDistractorIntegrity(repetitiveDistractorOptions);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes("at least 3 distinct misconception types"))).toBe(true);
    });

    it("DIST-04: Fails when options length is not 4 or missing expected IDs (A, B, C, D)", () => {
      const threeOptions = [
        { id: "A", text: "Option A", isCorrect: true },
        { id: "B", text: "Option B", isCorrect: false, misconceptionKey: "OVER_GENERALIZATION" },
        { id: "C", text: "Option C", isCorrect: false, misconceptionKey: "REVERSE_CAUSALITY" },
      ];

      const val1 = validateDistractorIntegrity(threeOptions);
      expect(val1.valid).toBe(false);
      expect(val1.errors.some((e) => e.includes("Expected exactly 4 options"))).toBe(true);
      expect(val1.errors.some((e) => e.includes("Missing option ID 'D'"))).toBe(true);
    });

    it("DIST-05: Fails when multiple options or zero options are marked isCorrect: true", () => {
      const twoCorrect = [
        { id: "A", text: "Option A", isCorrect: true },
        { id: "B", text: "Option B", isCorrect: true },
        { id: "C", text: "Option C", isCorrect: false, misconceptionKey: "REVERSE_CAUSALITY" },
        { id: "D", text: "Option D", isCorrect: false, misconceptionKey: "CONFUSION_OF_TERMS" },
      ];

      const val = validateDistractorIntegrity(twoCorrect);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes("must have exactly 1 correct answer"))).toBe(true);
    });

    it("DIST-06: Fails when distractors lack a misconceptionKey or have empty text", () => {
      const missingKey = [
        { id: "A", text: "Correct Statement", isCorrect: true },
        { id: "B", text: "", isCorrect: false, misconceptionKey: "OVER_GENERALIZATION" }, // empty text
        { id: "C", text: "Wrong Option C", isCorrect: false }, // missing misconceptionKey
        { id: "D", text: "Wrong Option D", isCorrect: false, misconceptionKey: "CONFUSION_OF_TERMS" },
      ];

      const val = validateDistractorIntegrity(missingKey);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes("empty text"))).toBe(true);
      expect(val.errors.some((e) => e.includes("missing a misconceptionKey"))).toBe(true);
    });
  });

  describe("3. Schema Integration with Layer 5 and Readiness Elements", () => {
    it("DIST-07: Validates MisconceptionAlertLayerSchema with diagnostic distractors", () => {
      const alertLayer = {
        alertMessage: "Common student errors in calculating equilibrium constants.",
        misconceptions: [
          {
            commonBelief: "Concentration of pure solids and liquids should be included in K_eq.",
            distractorType: "OVER_GENERALIZATION" as const,
            whyIncorrect: "Activity of pure solids and liquids is constant (unity = 1).",
            refutationEvidence: "Thermodynamic activity definitions set pure phase activity to 1.",
            correction: "Omit pure solids and liquids from the equilibrium expression.",
            repairStrategy: "Identify phase states (s, l, g, aq) before writing equilibrium quotients.",
          },
        ],
        diagnosticDistractors: [
          { id: "A" as const, text: "K_eq = [C]^c [D]^d / ([A]^a [B]^b) for aqueous and gas species only.", isCorrect: true },
          { id: "B" as const, text: "Include solid CaCO3 concentration in the denominator.", isCorrect: false, misconceptionKey: "OVER_GENERALIZATION" as const },
          { id: "C" as const, text: "Invert reactants and products in the numerator/denominator ratio.", isCorrect: false, misconceptionKey: "REVERSE_CAUSALITY" as const },
          { id: "D" as const, text: "Equilibrium constant K_eq changes with initial starting concentrations.", isCorrect: false, misconceptionKey: "CONFUSION_OF_TERMS" as const },
        ],
        instructorRationale: "Option A is correct: pure solids and liquids have activity 1 and are excluded from K_eq.",
      };

      const parsed = MisconceptionAlertLayerSchema.parse(alertLayer);
      expect(parsed.diagnosticDistractors.length).toBe(4);
      expect(parsed.misconceptions[0].distractorType).toBe("OVER_GENERALIZATION");
    });
  });
});
