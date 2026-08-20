import { describe, it, expect } from "vitest";
import { gateVisualUniqueness } from "../visual-uniqueness.gate";
import { gateVisualSupport } from "../visual-support.gate";
import type { VisualSpecification } from "../../../visual/types";

describe("Quality Gates: Visual Uniqueness and Support", () => {
  describe("gateVisualUniqueness (GATE-14)", () => {
    it("passes when all slides have unique concept-specific visual specifications", () => {
      const artifacts = [
        {
          slideNo: 1,
          contentJson: {
            visualSpec: {
              id: "v1",
              visualFamily: "PROCESS",
              title: "Cellular Respiration Glycolytic Pathway",
              description: "Glucose breakdown steps",
              layout: { type: "PROCESS", direction: "LR" },
              nodes: [
                { id: "n1", label: "Glucose Substrate" },
                { id: "n2", label: "Pyruvate Product" },
              ],
              connections: [{ from: "n1", to: "n2", label: "catabolism" }],
              studentFocusQuestion: "How is net ATP yielded?",
            } as VisualSpecification,
          },
        },
        {
          slideNo: 2,
          contentJson: {
            visualSpec: {
              id: "v2",
              visualFamily: "SYSTEM_ARCHITECTURE",
              title: "Mitochondrial Electron Transport System",
              description: "Inner mitochondrial membrane complexes",
              layout: { type: "SYSTEM_ARCHITECTURE", direction: "TB" },
              nodes: [
                { id: "m1", label: "Complex I NADH Dehydrogenase" },
                { id: "m2", label: "ATP Synthase Rotor" },
              ],
              connections: [{ from: "m1", to: "m2", label: "proton_gradient" }],
              studentFocusQuestion: "How does proton accumulation drive rotation?",
            } as VisualSpecification,
          },
        },
      ];

      const result = gateVisualUniqueness(artifacts);
      expect(result.gateKey).toBe("visual_uniqueness");
      expect(result.status).toBe("pass");
      expect(result.findings.length).toBe(0);
    });

    it("flags duplicate image URLs across multiple slides", () => {
      const artifacts = [
        {
          slideNo: 1,
          contentJson: {
            visualSpec: {
              imageUrl: "https://wikimedia.org/wiki/File:Photosynthesis_diagram.svg?param=1",
              title: "Photosynthesis Overview Diagram",
            },
          },
        },
        {
          slideNo: 2,
          contentJson: {
            visualSpec: {
              imageUrl: "https://wikimedia.org/wiki/File:Photosynthesis_diagram.svg?param=2",
              title: "Calvin Cycle Transformation",
            },
          },
        },
      ];

      const result = gateVisualUniqueness(artifacts);
      expect(result.findings.length).toBe(2);
      expect(result.findings[0].message).toContain("Image reused across 2 slides");
    });

    it("flags generic stock photo URLs (Unsplash, Shutterstock, Getty)", () => {
      const artifacts = [
        {
          slideNo: 1,
          contentJson: {
            visualSpec: {
              imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
              title: "Laboratory Flask Chemistry Concept",
            },
          },
        },
      ];

      const result = gateVisualUniqueness(artifacts);
      expect(result.findings.length).toBe(1);
      expect(result.findings[0].message).toContain("Generic stock image source detected");
    });

    it("flags overly generic visual titles", () => {
      const artifacts = [
        {
          slideNo: 1,
          contentJson: {
            visualSpec: {
              imageUrl: "https://example.edu/diagrams/chemistry.svg",
              title: "Chart", // < 10 characters
            },
          },
        },
      ];

      const result = gateVisualUniqueness(artifacts);
      expect(result.findings.length).toBe(1);
      expect(result.findings[0].message).toContain("Visual title is too generic");
    });

    it("flags semantic visual specification duplicates (similarity >= 0.85)", () => {
      const specA: VisualSpecification = {
        id: "vis-a",
        visualFamily: "PROCESS",
        title: "Sorting Algorithm QuickSort Partition Step",
        description: "Partitioning array around a chosen pivot element.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "q1", label: "Pivot Selection" },
          { id: "q2", label: "Lomuto Partition Traversal" },
          { id: "q3", label: "Recursive Subarray Sort" },
        ],
        connections: [
          { from: "q1", to: "q2", label: "partition" },
          { from: "q2", to: "q3", label: "recurse" },
        ],
        studentFocusQuestion: "Why does pivot choice impact worst-case time complexity?",
        pedagogicalRationale: "Illustrates divide and conquer invariance.",
      };

      const specB: VisualSpecification = {
        id: "vis-b",
        visualFamily: "PROCESS",
        title: "Sorting Algorithm QuickSort Partition Step Transformation",
        description: "Partitioning array elements around a pivot element.",
        layout: { type: "PROCESS", direction: "LR" },
        nodes: [
          { id: "q1-copy", label: "Pivot Selection" },
          { id: "q2-copy", label: "Lomuto Partition Traversal" },
          { id: "q3-copy", label: "Recursive Subarray Sort" },
        ],
        connections: [
          { from: "q1-copy", to: "q2-copy", label: "partition" },
          { from: "q2-copy", to: "q3-copy", label: "recurse" },
        ],
        studentFocusQuestion: "Why does pivot selection impact worst-case time complexity?",
        pedagogicalRationale: "Illustrates divide and conquer invariance.",
      };

      const artifacts = [
        { slideNo: 3, contentJson: { visualSpec: specA } },
        { slideNo: 7, contentJson: { visualSpec: specB } },
      ];

      const result = gateVisualUniqueness(artifacts);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings.some((f) => f.slideNo === 7 && f.message.includes("semantically duplicate"))).toBe(true);
    });
  });

  describe("gateVisualSupport (GATE-03)", () => {
    it("passes when >= 18 slides have visual support", () => {
      const artifacts = Array.from({ length: 20 }, (_, i) => ({
        slideNo: i + 1,
        contentJson: {
          visualIntent: i < 18 ? "PROCESS: Step transitions" : "",
        },
      }));

      const result = gateVisualSupport(artifacts);
      expect(result.gateKey).toBe("visual_support");
      expect(result.status).toBe("pass");
      expect(result.findings.length).toBe(2);
    });

    it("fails when > 2 slides lack visual support (< 18 supported)", () => {
      const artifacts = Array.from({ length: 20 }, (_, i) => ({
        slideNo: i + 1,
        contentJson: {
          visualIntent: i < 15 ? "DATA_FLOW: Message pipeline" : "",
        },
      }));

      const result = gateVisualSupport(artifacts);
      expect(result.status).toBe("fail");
      expect(result.findings.length).toBe(5);
    });
  });
});
