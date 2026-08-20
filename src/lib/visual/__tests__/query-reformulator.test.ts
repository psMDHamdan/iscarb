import { describe, expect, it } from "vitest";
import {
  applyCategoryPivot,
  applyDomainSynonymSubstitution,
  applyKeywordInfusion,
  applyTaxonomicBroadening,
  getDomainSynonyms,
  getSubjectKeywords,
  reformulateQuery,
} from "../query-reformulator";
import type { VisualSearchQuery } from "../types";

describe("Query Reformulator State Machine Unit Tests", () => {
  describe("1. Strategy 1: Keyword Modifier Infusion", () => {
    it("should infuse diagrammatic modifiers into topic query", () => {
      const query: VisualSearchQuery = {
        topic: "Photosynthesis light reactions",
        subject: "biology",
        diagramType: "schematic",
      };

      const result = applyKeywordInfusion(query, 0);
      expect(result).toContain("Photosynthesis light reactions");
      expect(result).toContain("labeled");
      expect(result).toContain("schematic");
      expect(result).toContain("vector");
    });
  });

  describe("2. Strategy 2: Domain Synonym Substitution across 5 Subjects", () => {
    it("should retrieve domain synonyms for Biology topics", () => {
      const query: VisualSearchQuery = {
        topic: "human heart circulatory system",
        subject: "biology",
      };

      const synonyms = getDomainSynonyms(query.topic, query.subject);
      expect(synonyms.length).toBeGreaterThan(0);
      expect(synonyms.some((s) => s.toLowerCase().includes("cardiovascular") || s.toLowerCase().includes("circulation"))).toBe(true);

      const reformulated = applyDomainSynonymSubstitution(query, 0);
      expect(reformulated).toBeTruthy();
    });

    it("should retrieve domain synonyms for Physics topics", () => {
      const query: VisualSearchQuery = {
        topic: "carnot heat engine thermodynamic cycle",
        subject: "physics",
      };

      const synonyms = getDomainSynonyms(query.topic, query.subject);
      expect(synonyms.length).toBeGreaterThan(0);
      expect(synonyms.some((s) => s.toLowerCase().includes("carnot") && s.toLowerCase().includes("diagram"))).toBe(true);
    });

    it("should retrieve domain synonyms for Economics topics", () => {
      const query: VisualSearchQuery = {
        topic: "supply and demand market equilibrium",
        subject: "economics",
      };

      const synonyms = getDomainSynonyms(query.topic, query.subject);
      expect(synonyms.length).toBeGreaterThan(0);
      expect(synonyms.some((s) => s.toLowerCase().includes("supply") && s.toLowerCase().includes("curve"))).toBe(true);
    });

    it("should retrieve domain synonyms for Computer Science topics", () => {
      const query: VisualSearchQuery = {
        topic: "binary search tree data structure",
        subject: "computer_science",
      };

      const synonyms = getDomainSynonyms(query.topic, query.subject);
      expect(synonyms.length).toBeGreaterThan(0);
      expect(synonyms.some((s) => s.toLowerCase().includes("node") || s.toLowerCase().includes("tree"))).toBe(true);
    });

    it("should retrieve domain synonyms for History topics", () => {
      const query: VisualSearchQuery = {
        topic: "silk road ancient trade routes",
        subject: "history",
      };

      const synonyms = getDomainSynonyms(query.topic, query.subject);
      expect(synonyms.length).toBeGreaterThan(0);
      expect(synonyms.some((s) => s.toLowerCase().includes("map") || s.toLowerCase().includes("trade"))).toBe(true);
    });
  });

  describe("3. Strategy 3: Taxonomic Broadening", () => {
    it("should drop restrictive qualifiers and extract core noun phrases", () => {
      const query: VisualSearchQuery = {
        topic: "The complete and detailed overview of human heart blood circulation in modern medicine",
        subject: "biology",
      };

      const broadened = applyTaxonomicBroadening(query);
      expect(broadened.length).toBeLessThan(query.topic.length);
      expect(broadened).toContain("diagram");
      expect(broadened).not.toContain("complete and detailed overview");
    });
  });

  describe("4. Strategy 4: Category Search Pivot", () => {
    it("should generate category search syntax", () => {
      const query: VisualSearchQuery = {
        topic: "Thermodynamics",
        subject: "physics",
      };

      const categorySyntax = applyCategoryPivot(query);
      expect(categorySyntax).toContain('incategory:"Diagrams of Thermodynamics"');
    });
  });

  describe("5. Reformulator State Machine Sequence & Deduplication", () => {
    it("should transition strategies sequentially from Attempt 1 to Attempt 4", () => {
      const query: VisualSearchQuery = {
        topic: "Binary search tree",
        subject: "computer_science",
      };

      const attempt1 = reformulateQuery(query, 1, []);
      expect(attempt1.strategy).toBe("KEYWORD_MODIFIER_INFUSION");

      const attempt2 = reformulateQuery(query, 2, [attempt1.newQuery]);
      expect(attempt2.strategy).toBe("DOMAIN_SYNONYM_SUBSTITUTION");

      const attempt3 = reformulateQuery(query, 3, [attempt1.newQuery, attempt2.newQuery]);
      expect(attempt3.strategy).toBe("TAXONOMIC_BROADENING");

      const attempt4 = reformulateQuery(query, 4, [
        attempt1.newQuery,
        attempt2.newQuery,
        attempt3.newQuery,
      ]);
      expect(attempt4.strategy).toBe("CATEGORY_SEARCH_PIVOT");
    });

    it("should never return a query that has already been attempted (deduplication)", () => {
      const query: VisualSearchQuery = {
        topic: "Binary search tree",
        subject: "computer_science",
      };

      const infusedQuery = applyKeywordInfusion(query, 0);
      const previous = [infusedQuery];

      const result = reformulateQuery(query, 1, previous);
      expect(result.newQuery.toLowerCase().trim()).not.toBe(infusedQuery.toLowerCase().trim());
    });
  });

  describe("6. Subject Keywords Taxonomy", () => {
    it("should provide subject-specific keywords for all educational domains", () => {
      const bioKeywords = getSubjectKeywords("biology");
      expect(bioKeywords.length).toBeGreaterThan(0);
      expect(bioKeywords.some((k) => k.includes("anatomical") || k.includes("pathway"))).toBe(true);

      const physKeywords = getSubjectKeywords("physics");
      expect(physKeywords.some((k) => k.includes("vector") || k.includes("circuit"))).toBe(true);

      const mathKeywords = getSubjectKeywords("mathematics");
      expect(mathKeywords.some((k) => k.includes("geometric") || k.includes("graph"))).toBe(true);
    });
  });
});
