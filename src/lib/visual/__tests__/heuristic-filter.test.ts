import { describe, expect, it } from "vitest";
import {
  evaluateHeuristicFilter,
  filterCandidatesHeuristically,
} from "../heuristic-filter";
import type { CandidateImageMetadata } from "../types";

function createMockCandidate(
  overrides: Partial<CandidateImageMetadata> = {}
): CandidateImageMetadata {
  const title = overrides.title || "File:Standard_Test_Diagram.svg";
  const fileName = overrides.fileName || title.replace(/^File:/i, "");
  const cleanTitle =
    overrides.cleanTitle ||
    fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");

  return {
    id: "1001",
    title,
    fileName,
    cleanTitle,
    url: `https://upload.wikimedia.org/wikipedia/commons/1/10/${fileName}`,
    thumbUrl: `https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/${fileName}/1200px.png`,
    description: "An educational schematic vector diagram illustrating core principles.",
    categories: ["Educational diagrams", "Scientific illustrations"],
    artist: "Academic Illustrator",
    license: "CC BY-SA 4.0",
    attributionRequired: true,
    width: 1200,
    height: 900,
    aspectRatio: 1.333,
    fileSize: 45000,
    mimeType: fileName.endsWith(".svg")
      ? "image/svg+xml"
      : fileName.endsWith(".png")
      ? "image/png"
      : "image/jpeg",
    ...overrides,
  };
}

describe("Heuristic Pre-Filter Unit Tests", () => {
  describe("1. Flag and Heraldry Filtering", () => {
    it("should reject national and regional flags", () => {
      const candidate = createMockCandidate({
        title: "File:Flag_of_the_United_Kingdom.svg",
        fileName: "Flag_of_the_United_Kingdom.svg",
        cleanTitle: "Flag of the United Kingdom",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_FLAG_OR_EMBLEM");
    });

    it("should reject coats of arms and presidential seals", () => {
      const candidate = createMockCandidate({
        title: "File:Coat_of_arms_of_Saudi_Arabia.png",
        fileName: "Coat_of_arms_of_Saudi_Arabia.png",
        cleanTitle: "Coat of arms of Saudi Arabia",
        mimeType: "image/png",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_FLAG_OR_EMBLEM");
    });

    it("should reject heraldic insignia found in category tags", () => {
      const candidate = createMockCandidate({
        title: "File:National_Insignia_Emblem.svg",
        categories: ["State seals of Europe", "Vexillology symbols"],
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_FLAG_OR_EMBLEM");
    });
  });

  describe("2. Portrait, Statue and Monument Filtering", () => {
    it("should reject portraits of historical scientists or philosophers", () => {
      const candidate = createMockCandidate({
        title: "File:Portrait_of_Adam_Smith.jpg",
        fileName: "Portrait_of_Adam_Smith.jpg",
        cleanTitle: "Portrait of Adam Smith",
        mimeType: "image/jpeg",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_PORTRAIT_OR_PERSON");
    });

    it("should reject statues, busts, and monuments", () => {
      const candidate = createMockCandidate({
        title: "File:Statue_of_Isaac_Newton_in_Cambridge.jpg",
        fileName: "Statue_of_Isaac_Newton_in_Cambridge.jpg",
        cleanTitle: "Statue of Isaac Newton in Cambridge",
        mimeType: "image/jpeg",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_PORTRAIT_OR_PERSON");
    });

    it("should reject graves, tombs, and mausoleums", () => {
      const candidate = createMockCandidate({
        title: "File:Tomb_of_Galileo_Galilei.jpg",
        fileName: "Tomb_of_Galileo_Galilei.jpg",
        cleanTitle: "Tomb of Galileo Galilei",
        mimeType: "image/jpeg",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_PORTRAIT_OR_PERSON");
    });
  });

  describe("3. Currency, Banknotes, Coins, and Stamps Filtering", () => {
    it("should reject postage stamps", () => {
      const candidate = createMockCandidate({
        title: "File:Postage_stamp_of_Albert_Einstein_1966.jpg",
        fileName: "Postage_stamp_of_Albert_Einstein_1966.jpg",
        cleanTitle: "Postage stamp of Albert Einstein 1966",
        mimeType: "image/jpeg",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_CURRENCY_OR_STAMP");
    });

    it("should reject banknotes and commemorative coins", () => {
      const candidate = createMockCandidate({
        title: "File:Roman_denarius_coin_of_Julius_Caesar.jpg",
        fileName: "Roman_denarius_coin_of_Julius_Caesar.jpg",
        cleanTitle: "Roman denarius coin of Julius Caesar",
        mimeType: "image/jpeg",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_CURRENCY_OR_STAMP");
    });
  });

  describe("4. Book Covers, Scans, and Signatures", () => {
    it("should reject first edition book covers and title pages", () => {
      const candidate = createMockCandidate({
        title: "File:Principia_Mathematica_first_edition_title_page.jpg",
        fileName: "Principia_Mathematica_first_edition_title_page.jpg",
        cleanTitle: "Principia Mathematica first edition title page",
        mimeType: "image/jpeg",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_BOOK_OR_DOCUMENT_SCAN");
    });

    it("should reject historical author signatures", () => {
      const candidate = createMockCandidate({
        title: "File:Signature_of_Charles_Darwin.png",
        fileName: "Signature_of_Charles_Darwin.png",
        cleanTitle: "Signature of Charles Darwin",
        mimeType: "image/png",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_BOOK_OR_DOCUMENT_SCAN");
    });
  });

  describe("5. Decorative Fine Art and Paintings", () => {
    it("should reject oil on canvas fine paintings", () => {
      const candidate = createMockCandidate({
        title: "File:Oil_on_canvas_painting_by_Rembrandt.jpg",
        fileName: "Oil_on_canvas_painting_by_Rembrandt.jpg",
        cleanTitle: "Oil on canvas painting by Rembrandt",
        mimeType: "image/jpeg",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_DECORATIVE_ART");
    });
  });

  describe("6. MIME, Dimension, and Aspect Ratio Constraints", () => {
    it("should reject non-image MIME types such as PDF documents", () => {
      const candidate = createMockCandidate({
        title: "File:Medical_Research_Textbook.pdf",
        fileName: "Medical_Research_Textbook.pdf",
        mimeType: "application/pdf",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(false);
      expect(result.rejectionCode).toBe("REJECT_HEURISTIC_FILTER");
    });

    it("should reject extreme narrow or panoramic aspect ratios", () => {
      const narrowCandidate = createMockCandidate({
        width: 100,
        height: 1000,
        aspectRatio: 0.1, // < 0.2
      });

      const panoCandidate = createMockCandidate({
        width: 7000,
        height: 1000,
        aspectRatio: 7.0, // > 5.0
      });

      expect(evaluateHeuristicFilter(narrowCandidate).passed).toBe(false);
      expect(evaluateHeuristicFilter(panoCandidate).passed).toBe(false);
    });

    it("should reject tiny icon resolutions (< 150x150)", () => {
      const tinyCandidate = createMockCandidate({
        width: 48,
        height: 48,
        aspectRatio: 1.0,
      });

      const result = evaluateHeuristicFilter(tinyCandidate);
      expect(result.passed).toBe(false);
    });
  });

  describe("7. Acceptance of Legitimate Educational Diagrams", () => {
    it("should accept high-quality biology diagrams", () => {
      const candidate = createMockCandidate({
        title: "File:Human_heart_diagram-en.svg",
        fileName: "Human_heart_diagram-en.svg",
        cleanTitle: "Human heart diagram en",
        description: "Vector schematic detailing blood flow through the cardiac chambers and great vessels.",
        categories: ["Diagrams of human heart", "Circulatory system diagrams"],
        width: 1280,
        height: 1024,
        aspectRatio: 1.25,
        mimeType: "image/svg+xml",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(true);
      expect(result.rejectionCode).toBeUndefined();
    });

    it("should accept physics thermodynamic schematics", () => {
      const candidate = createMockCandidate({
        title: "File:Carnot_cycle_p-V_diagram.svg",
        fileName: "Carnot_cycle_p-V_diagram.svg",
        cleanTitle: "Carnot cycle p V diagram",
        description: "Pressure-Volume indicator diagram of the four-stage Carnot thermodynamic cycle.",
        categories: ["Thermodynamic diagrams", "Physics charts"],
        width: 800,
        height: 600,
        aspectRatio: 1.333,
        mimeType: "image/svg+xml",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(true);
    });

    it("should accept economics equilibrium graphs", () => {
      const candidate = createMockCandidate({
        title: "File:Supply-and-demand-equilibrium.svg",
        fileName: "Supply-and-demand-equilibrium.svg",
        cleanTitle: "Supply and demand equilibrium",
        description: "Microeconomic model graph showing supply and demand curves intersecting at equilibrium.",
        categories: ["Economics diagrams", "Market curves"],
        width: 1000,
        height: 750,
        aspectRatio: 1.333,
        mimeType: "image/svg+xml",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(true);
    });

    it("should accept computer science data structure schematics", () => {
      const candidate = createMockCandidate({
        title: "File:Binary_search_tree.svg",
        fileName: "Binary_search_tree.svg",
        cleanTitle: "Binary search tree",
        description: "Node and pointer tree hierarchy demonstrating left-less, right-greater invariant.",
        categories: ["Data structure diagrams", "Computer science trees"],
        width: 900,
        height: 600,
        aspectRatio: 1.5,
        mimeType: "image/svg+xml",
      });

      const result = evaluateHeuristicFilter(candidate);
      expect(result.passed).toBe(true);
    });
  });

  describe("8. Batch Candidate Partitioning", () => {
    it("should correctly partition a mixed candidate pool into accepted and discarded lists", () => {
      const candidates = [
        createMockCandidate({
          id: "1",
          title: "File:Human_heart_diagram.svg",
          description: "Vector diagram showing anatomical structure of human heart.",
          categories: ["Human heart diagrams", "Circulatory system"],
        }),
        createMockCandidate({
          id: "2",
          title: "File:Flag_of_France.svg",
          description: "National flag of France.",
          categories: ["Flags of France", "National flags"],
        }),
        createMockCandidate({
          id: "3",
          title: "File:Carnot_cycle_PV_chart.svg",
          description: "Pressure volume indicator chart of Carnot thermodynamic cycle.",
          categories: ["Thermodynamic diagrams", "Physics charts"],
        }),
        createMockCandidate({
          id: "4",
          title: "File:Portrait_of_Newton.jpg",
          description: "Historical portrait of Sir Isaac Newton.",
          categories: ["Portraits of scientists"],
        }),
        createMockCandidate({
          id: "5",
          title: "File:Binary_search_tree_model.svg",
          description: "Schematic diagram of binary search tree data structure.",
          categories: ["Data structure diagrams", "Computer science trees"],
        }),
        createMockCandidate({
          id: "6",
          title: "File:Stamp_of_1920.png",
          description: "Postage stamp from 1920.",
          categories: ["Postage stamps", "Philately"],
        }),
      ];

      const { accepted, discarded } = filterCandidatesHeuristically(candidates);

      expect(accepted.length).toBe(3);
      expect(discarded.length).toBe(3);
      expect(accepted.map((c) => c.id)).toEqual(["1", "3", "5"]);
      expect(discarded.map((d) => d.candidate.id)).toEqual(["2", "4", "6"]);
      expect(discarded[0].result.rejectionCode).toBe("REJECT_FLAG_OR_EMBLEM");
      expect(discarded[1].result.rejectionCode).toBe("REJECT_PORTRAIT_OR_PERSON");
      expect(discarded[2].result.rejectionCode).toBe("REJECT_CURRENCY_OR_STAMP");
    });
  });
});
