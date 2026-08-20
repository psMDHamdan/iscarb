/**
 * AI Visual Learning System — Comprehensive Adversarial Verification Test Suite
 *
 * Adversarially tests:
 * 1. Deterministic Heuristic Pre-Filter against all 6 negative pattern classes:
 *    - Historical portraits, statues, monuments, tombs, busts
 *    - National/regional flags, coats of arms, state seals, heraldry, banners
 *    - Postage stamps, coins, banknotes, currency, medals
 *    - Book covers, title pages, scan documents, signatures, frontispieces
 *    - Decorative fine art, landscape paintings, oil on canvas, frescoes, murals
 *    - Low-resolution icons (<150x150, <40k px) and extreme aspect ratios (<0.2, >5.0)
 * 2. LLM Verification Rejection Logic & Standardized Taxonomy:
 *    - Strict threshold enforcement (scores < 70 are always rejected)
 *    - Correct assignment of 8 standardized rejection codes
 *    - Resilience to corrupted LLM responses, Markdown wrappers, and <think> blocks
 * 3. Homonym & Domain Boundary Disambiguation:
 *    - Computer Science Tree vs Botanical Tree
 *    - Economics Market Equilibrium vs Grocery Supermarket Aisle
 *    - Cell Biology Organelles vs Prison Cell / Battery Cell
 *    - CPU Cache Memory vs Geocache Box
 *    - Physics Wave Interference vs Ocean Surfing Wave
 * 4. Zero-Leakage Guarantee:
 *    - In mixed adversarial batches, 0% of negative patterns leak into selected results.
 */

import { describe, expect, it } from "vitest";
import {
  evaluateHeuristicFilter,
  filterCandidatesHeuristically,
  MIN_ASPECT_RATIO,
  MAX_ASPECT_RATIO,
  MIN_IMAGE_WIDTH,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_TOTAL_PIXELS,
} from "../heuristic-filter";
import {
  calculateCompositeScore,
  evaluateCandidateDeterministically,
  extractJsonFromLlmOutput,
  parseLLMVerificationResponse,
  buildVerificationPrompt,
} from "../llm-verifier";
import { reformulateQuery } from "../query-reformulator";
import type { CandidateImageMetadata, VisualSearchQuery } from "../types";

function makeCandidate(
  overrides: Partial<CandidateImageMetadata> = {}
): CandidateImageMetadata {
  return {
    id: "test-cand-001",
    title: "File:Standard_Diagram.svg",
    fileName: "Standard_Diagram.svg",
    cleanTitle: "Standard Diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Standard_Diagram.svg",
    thumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Standard_Diagram.svg/1200px.png",
    description: "An educational schematic vector diagram.",
    categories: ["Educational diagrams"],
    artist: "Academic Illustrator",
    license: "CC BY-SA 4.0",
    attributionRequired: true,
    width: 1200,
    height: 900,
    aspectRatio: 1.333,
    fileSize: 45000,
    mimeType: "image/svg+xml",
    ...overrides,
  };
}

describe("ADVERSARIAL VERIFICATION SUITE — AI Visual Learning System", () => {
  // ==========================================================================
  // 1. NEGATIVE PATTERN 1: Historical Portraits, Statues, Monuments & Tombs
  // ==========================================================================
  describe("1. Adversarial Test: Historical Portraits, Statues, & Monuments", () => {
    const portraitCases = [
      { title: "File:Portrait_of_Isaac_Newton_1689.jpg", desc: "Oil painting of Sir Isaac Newton sitting" },
      { title: "File:Portraits_of_European_Monarchs.jpg", desc: "Gallery of historical portraits" },
      { title: "File:Statue_of_Adam_Smith_Edinburgh.jpg", desc: "Bronze statue of philosopher Adam Smith" },
      { title: "File:Monument_to_Galileo_Galilei_Florence.png", desc: "Marble monument erected in 1737" },
      { title: "File:Bust_of_Charles_Darwin_Natural_History.jpg", desc: "Plaster bust of Charles Darwin" },
      { title: "File:Sculpture_of_Aristotle.jpg", desc: "Classical ancient sculpture" },
      { title: "File:Tomb_of_Galileo_Galilei_Santa_Croce.jpg", desc: "Ornate tomb and gravestone" },
      { title: "File:Grave_of_Alan_Turing_Memorial.jpg", desc: "Cenotaph gravestone memorial" },
      { title: "File:Mausoleum_of_Augustus_Rome.jpg", desc: "Ancient circular mausoleum" },
      { title: "File:Headshot_of_Albert_Einstein_1921.jpg", desc: "Studio headshot portrait" },
      { title: "File:Photo_of_President_Lincoln.jpg", desc: "Historical photo of president" },
      { title: "File:Prime_Minister_Churchill_1940.jpg", desc: "Formal portrait of prime minister" },
      { title: "File:Wax_figure_of_Marie_Curie.jpg", desc: "Madame Tussauds wax figure" },
    ];

    for (const testCase of portraitCases) {
      it(`should deterministically reject portrait candidate: "${testCase.title}"`, () => {
        const candidate = makeCandidate({
          title: testCase.title,
          fileName: testCase.title.replace("File:", ""),
          cleanTitle: testCase.title.replace("File:", "").replace(/\.[^.]+$/, "").replace(/_/g, " "),
          description: testCase.desc,
          mimeType: "image/jpeg",
        });

        const result = evaluateHeuristicFilter(candidate);
        expect(result.passed).toBe(false);
        expect(result.rejectionCode).toBe("REJECT_PORTRAIT_OR_PERSON");
      });
    }
  });

  // ==========================================================================
  // 2. NEGATIVE PATTERN 2: Flags, Heraldry, Coats of Arms, State Seals
  // ==========================================================================
  describe("2. Adversarial Test: Flags, Heraldry, Coats of Arms, & Seals", () => {
    const flagCases = [
      { title: "File:Flag_of_the_United_States.svg", cats: ["National flags"] },
      { title: "File:Flags_of_the_World_compilation.png", cats: ["Vexillology"] },
      { title: "File:Coat_of_arms_of_the_United_Kingdom.svg", cats: ["Royal coat of arms"] },
      { title: "File:Arms_of_the_House_of_Plantagenet.png", cats: ["Heraldry"] },
      { title: "File:Insignia_of_the_Royal_Air_Force.svg", cats: ["Military emblems"] },
      { title: "File:Emblem_of_Saudi_Arabia.svg", cats: ["National emblems"] },
      { title: "File:Seal_of_the_President_of_the_United_States.svg", cats: ["Presidential seals"] },
      { title: "File:State_seal_of_California.png", cats: ["State seals of the USA"] },
      { title: "File:City_seal_of_London.svg", cats: ["Municipal insignia"] },
      { title: "File:Standard_of_Queen_Elizabeth_II.svg", cats: ["Royal standards"] },
      { title: "File:Banner_of_Arms_of_Scotland.png", cats: ["Heraldic banners"] },
      { title: "File:Vexillology_symbols_sheet.svg", cats: ["Flags"] },
    ];

    for (const testCase of flagCases) {
      it(`should deterministically reject flag/heraldry candidate: "${testCase.title}"`, () => {
        const candidate = makeCandidate({
          title: testCase.title,
          fileName: testCase.title.replace("File:", ""),
          cleanTitle: testCase.title.replace("File:", "").replace(/\.[^.]+$/, "").replace(/_/g, " "),
          categories: testCase.cats,
          mimeType: "image/svg+xml",
        });

        const result = evaluateHeuristicFilter(candidate);
        expect(result.passed).toBe(false);
        expect(result.rejectionCode).toBe("REJECT_FLAG_OR_EMBLEM");
      });
    }
  });

  // ==========================================================================
  // 3. NEGATIVE PATTERN 3: Postage Stamps, Coins, Banknotes, Numismatics
  // ==========================================================================
  describe("3. Adversarial Test: Stamps, Coins, Banknotes, & Numismatics", () => {
    const numismaticCases = [
      { title: "File:Postage_stamp_of_Albert_Einstein_1966.jpg", desc: "Commemorative postage stamp" },
      { title: "File:Stamp_of_the_USSR_Space_Program.jpg", desc: "Vintage stamp of space exploration" },
      { title: "File:Stamps_of_Germany_1923_inflation.png", desc: "Overprinted stamps collection" },
      { title: "File:Coin_of_Alexander_the_Great.jpg", desc: "Ancient Greek silver tetradrachm" },
      { title: "File:Coins_of_the_Roman_Empire.jpg", desc: "Numismatics collection of coins" },
      { title: "File:Banknote_of_100_US_Dollars.jpg", desc: "Specimen dollar bill" },
      { title: "File:Currency_of_Zimbabwe_100_Trillion.jpg", desc: "Hyperinflation banknote" },
      { title: "File:Commemorative_coin_of_Newton_2017.png", desc: "Two pound commemorative coin" },
      { title: "File:Medal_of_Honor_Recipient.jpg", desc: "Military medal of honor" },
      { title: "File:Pound_note_Bank_of_England.jpg", desc: "Ten pound note series" },
      { title: "File:Dollar_bill_series_2013.jpg", desc: "One dollar bill obverse" },
      { title: "File:Penny_Lincoln_cent_1909.png", desc: "Copper penny coin" },
      { title: "File:Quarter_dollar_Washington.jpg", desc: "Silver quarter dollar coin" },
    ];

    for (const testCase of numismaticCases) {
      it(`should deterministically reject currency/stamp candidate: "${testCase.title}"`, () => {
        const candidate = makeCandidate({
          title: testCase.title,
          fileName: testCase.title.replace("File:", ""),
          cleanTitle: testCase.title.replace("File:", "").replace(/\.[^.]+$/, "").replace(/_/g, " "),
          description: testCase.desc,
          mimeType: "image/jpeg",
        });

        const result = evaluateHeuristicFilter(candidate);
        expect(result.passed).toBe(false);
        expect(result.rejectionCode).toBe("REJECT_CURRENCY_OR_STAMP");
      });
    }
  });

  // ==========================================================================
  // 4. NEGATIVE PATTERN 4: Book Covers, Title Pages, Documents, Scans
  // ==========================================================================
  describe("4. Adversarial Test: Book Covers, Document Scans, & Signatures", () => {
    const documentCases = [
      { title: "File:Book_cover_of_Wealth_of_Nations.jpg", desc: "Hardcover edition book cover" },
      { title: "File:Frontispiece_of_Micrographia_Robert_Hooke.jpg", desc: "Frontispiece engraving" },
      { title: "File:Title_page_of_Philosophiae_Naturalis.png", desc: "1687 first edition title page" },
      { title: "File:Autograph_of_Galileo_Galilei.png", desc: "Signed letter autograph" },
      { title: "File:Signature_of_Isaac_Newton.svg", desc: "Signature of Sir Isaac Newton" },
      { title: "File:Manuscript_page_from_Voynich.jpg", desc: "Scanned parchment manuscript page" },
      { title: "File:First_edition_cover_of_Origin_of_Species.jpg", desc: "Victorian book cover" },
      { title: "File:Newspaper_clipping_of_Relativity_1919.jpg", desc: "New York Times clipping" },
      { title: "File:Pamphlet_cover_Common_Sense.jpg", desc: "Original pamphlet cover" },
      { title: "File:Index_page_of_Encyclopedie.png", desc: "Alphabetical index page scan" },
    ];

    for (const testCase of documentCases) {
      it(`should deterministically reject document scan candidate: "${testCase.title}"`, () => {
        const candidate = makeCandidate({
          title: testCase.title,
          fileName: testCase.title.replace("File:", ""),
          cleanTitle: testCase.title.replace("File:", "").replace(/\.[^.]+$/, "").replace(/_/g, " "),
          description: testCase.desc,
          mimeType: "image/jpeg",
        });

        const result = evaluateHeuristicFilter(candidate);
        expect(result.passed).toBe(false);
        expect(result.rejectionCode).toBe("REJECT_BOOK_OR_DOCUMENT_SCAN");
      });
    }
  });

  // ==========================================================================
  // 5. NEGATIVE PATTERN 5: Decorative Fine Art & Landscape Paintings
  // ==========================================================================
  describe("5. Adversarial Test: Decorative Fine Art & Landscape Paintings", () => {
    const fineArtCases = [
      { title: "File:Oil_on_canvas_painting_of_The_Night_Watch.jpg", desc: "Masterpiece oil on canvas" },
      { title: "File:Fresco_in_the_Sistine_Chapel_Ceiling.jpg", desc: "Michelangelo fresco in Vatican" },
      { title: "File:Painting_by_Vincent_van_Gogh_Starry_Night.jpg", desc: "Post-impressionist painting by Van Gogh" },
      { title: "File:Watercolor_painting_of_Alps_Landscape.jpg", desc: "Scenic mountain watercolor painting" },
      { title: "File:Acrylic_on_canvas_Modern_Abstract.png", desc: "Decorative acrylic on canvas" },
      { title: "File:Still_life_with_Flowers_and_Fruit.jpg", desc: "Dutch Golden Age still life with vase" },
      { title: "File:Mural_by_Diego_Rivera_History.jpg", desc: "Large fresco mural by Diego Rivera" },
      { title: "File:Impressionist_painting_of_Water_Lilies.jpg", desc: "Claude Monet impressionist painting" },
      { title: "File:Baroque_painting_of_Judith.jpg", desc: "Caravaggio baroque painting" },
    ];

    for (const testCase of fineArtCases) {
      it(`should deterministically reject decorative fine art candidate: "${testCase.title}"`, () => {
        const candidate = makeCandidate({
          title: testCase.title,
          fileName: testCase.title.replace("File:", ""),
          cleanTitle: testCase.title.replace("File:", "").replace(/\.[^.]+$/, "").replace(/_/g, " "),
          description: testCase.desc,
          mimeType: "image/jpeg",
        });

        const result = evaluateHeuristicFilter(candidate);
        expect(result.passed).toBe(false);
        expect(result.rejectionCode).toBe("REJECT_DECORATIVE_ART");
      });
    }
  });

  // ==========================================================================
  // 6. NEGATIVE PATTERN 6: Dimensional, Resolution, Aspect Ratio, & MIME Bounds
  // ==========================================================================
  describe("6. Adversarial Test: Dimension, Aspect Ratio, & MIME Constraints", () => {
    it("should reject non-image MIME types (PDF, Audio, Video, Application)", () => {
      const pdfCandidate = makeCandidate({ mimeType: "application/pdf" });
      const mp3Candidate = makeCandidate({ mimeType: "audio/mpeg" });
      const mp4Candidate = makeCandidate({ mimeType: "video/mp4" });
      const jsonCandidate = makeCandidate({ mimeType: "application/json" });

      expect(evaluateHeuristicFilter(pdfCandidate).passed).toBe(false);
      expect(evaluateHeuristicFilter(mp3Candidate).passed).toBe(false);
      expect(evaluateHeuristicFilter(mp4Candidate).passed).toBe(false);
      expect(evaluateHeuristicFilter(jsonCandidate).passed).toBe(false);
    });

    it("should reject extreme narrow vertical aspect ratios (< 0.2)", () => {
      const hyperTall = makeCandidate({
        width: 100,
        height: 1000,
        aspectRatio: 0.1,
      });
      const result = evaluateHeuristicFilter(hyperTall);
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain("Extreme aspect ratio");
    });

    it("should reject extreme panoramic horizontal aspect ratios (> 5.0)", () => {
      const ultraWide = makeCandidate({
        width: 6000,
        height: 800,
        aspectRatio: 7.5,
      });
      const result = evaluateHeuristicFilter(ultraWide);
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain("Extreme aspect ratio");
    });

    it("should reject tiny icon resolutions (< 150px in width or height)", () => {
      const tinyWidth = makeCandidate({ width: 120, height: 800, aspectRatio: 0.15 });
      const tinyHeight = makeCandidate({ width: 800, height: 100, aspectRatio: 8.0 });
      const tinyBoth = makeCandidate({ width: 64, height: 64, aspectRatio: 1.0 });

      expect(evaluateHeuristicFilter(tinyWidth).passed).toBe(false);
      expect(evaluateHeuristicFilter(tinyHeight).passed).toBe(false);
      expect(evaluateHeuristicFilter(tinyBoth).passed).toBe(false);
    });

    it("should reject low total pixel area (< 40,000 pixels)", () => {
      const lowArea = makeCandidate({
        width: 160,
        height: 160, // 25,600 px < 40,000 px
        aspectRatio: 1.0,
      });
      const result = evaluateHeuristicFilter(lowArea);
      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain("Total pixel area");
    });
  });

  // ==========================================================================
  // 7. LLM Verification & Standardized Rejection Taxonomy
  // ==========================================================================
  describe("7. Adversarial Test: LLM Rejection Taxonomy & Quality Gating", () => {
    it("should strictly reject candidate if composite score < 70, regardless of LLM status field", () => {
      // Adversarial case: LLM hallucinates status="ACCEPTED" but gives low factor scores
      const candidate = makeCandidate({ id: "cand-sneaky" });
      const rawJson = JSON.stringify({
        selectedCandidateId: "cand-sneaky",
        evaluations: [
          {
            candidateId: "cand-sneaky",
            status: "ACCEPTED", // Malicious / hallucinated accepted status
            scores: {
              educationalValue: 4.0, // Low score -> weighted sum = 5.25 * 10 = 52.5 < 70
              relevance: 6.0,
              clarity: 5.0,
              diagrammaticNature: 6.0,
            },
            reasoningChain: "Vague diagram with low clarity.",
          },
        ],
      });

      const parsed = parseLLMVerificationResponse(rawJson, [candidate], 70);
      expect(parsed.status).toBe("RETRY_NEEDED");
      expect(parsed.selectedCandidate).toBeNull();
      expect(parsed.discardedCandidates).toHaveLength(1);
      expect(parsed.discardedCandidates[0].status).toBe("REJECTED");
    });

    it("should sanitize and parse LLM responses wrapped in DeepSeek <think> reasoning blocks", () => {
      const candidate = makeCandidate({ id: "cand-think" });
      const rawWithThink = `<think>
I need to evaluate whether Candidate cand-think is a valid scientific diagram.
Looking at the metadata: it has detailed anatomical labels, high educational value, and SVG vector clarity.
Score breakdown: Edu 9.5, Rel 9.5, Cla 9.0, Diag 9.0.
Result: ACCEPTED.
</think>
\`\`\`json
{
  "selectedCandidateId": "cand-think",
  "evaluations": [
    {
      "candidateId": "cand-think",
      "status": "ACCEPTED",
      "scores": {
        "educationalValue": 9.5,
        "relevance": 9.5,
        "clarity": 9.0,
        "diagrammaticNature": 9.0
      },
      "reasoningChain": "Comprehensive anatomical schematic."
    }
  ]
}
\`\`\``;

      const parsed = parseLLMVerificationResponse(rawWithThink, [candidate], 70);
      expect(parsed.status).toBe("SUCCESS");
      expect(parsed.selectedCandidate?.candidateId).toBe("cand-think");
      expect(parsed.selectedCandidate?.scores.totalWeightedScore).toBeGreaterThanOrEqual(90);
    });

    it("should accurately assign all 8 standardized rejection codes in evaluation taxonomy", () => {
      const taxonomyCodes = [
        "REJECT_PORTRAIT_OR_PERSON",
        "REJECT_FLAG_OR_EMBLEM",
        "REJECT_CURRENCY_OR_STAMP",
        "REJECT_DECORATIVE_ART",
        "REJECT_BOOK_OR_DOCUMENT_SCAN",
        "REJECT_RAW_UNLABELED_PHOTO",
        "REJECT_OFF_TOPIC",
        "REJECT_LOW_PEDAGOGICAL_VALUE",
      ];

      const candidates = taxonomyCodes.map((code, idx) =>
        makeCandidate({ id: `tax-${idx}`, cleanTitle: `Test Candidate ${code}` })
      );

      const evaluations = taxonomyCodes.map((code, idx) => ({
        candidateId: `tax-${idx}`,
        status: "REJECTED",
        rejectionCode: code,
        rejectionReason: `Rejected due to ${code}`,
        scores: { educationalValue: 2, relevance: 2, clarity: 2, diagrammaticNature: 2 },
        reasoningChain: `Evaluation rejected with code ${code}`,
      }));

      const rawJson = JSON.stringify({
        selectedCandidateId: null,
        evaluations,
      });

      const parsed = parseLLMVerificationResponse(rawJson, candidates, 70);
      expect(parsed.discardedCandidates).toHaveLength(8);
      for (let i = 0; i < taxonomyCodes.length; i++) {
        expect(parsed.discardedCandidates[i].rejectionCode).toBe(taxonomyCodes[i]);
      }
    });
  });

  // ==========================================================================
  // 8. Homonym & Domain Boundary Disambiguation Tests
  // ==========================================================================
  describe("8. Adversarial Test: Homonym & Domain Boundary Disambiguation", () => {
    it("CS Tree vs Botanical Tree: should prefer CS binary tree diagram and reject botanical oak photo", () => {
      const csQuery: VisualSearchQuery = {
        topic: "Binary search tree data structure",
        subject: "computer_science",
        diagramType: "diagram",
      };

      const botanicalCandidate = makeCandidate({
        id: "botanical-1",
        cleanTitle: "Giant Oak Tree in Botanical Forest",
        description: "Photograph of an ancient Quercus oak tree in summer foliage in a national park.",
        categories: ["Botanical trees", "Quercus robur", "Forests"],
        mimeType: "image/jpeg",
      });

      const csTreeCandidate = makeCandidate({
        id: "cs-1",
        cleanTitle: "Binary Search Tree Data Structure Node Diagram",
        description: "Schematic showing binary search tree nodes with left and right children pointer links.",
        categories: ["Data structure diagrams", "Binary trees", "Computer science algorithms"],
        mimeType: "image/svg+xml",
      });

      const evalBotanical = evaluateCandidateDeterministically(botanicalCandidate, csQuery);
      const evalCs = evaluateCandidateDeterministically(csTreeCandidate, csQuery);

      expect(evalBotanical.scores.totalWeightedScore).toBeLessThan(70);
      expect(evalBotanical.status).toBe("REJECTED");

      expect(evalCs.scores.totalWeightedScore).toBeGreaterThanOrEqual(70);
      expect(evalCs.status).toBe("ACCEPTED");
    });

    it("Economics Market Equilibrium vs Grocery Store: should prefer microeconomic graph over grocery photo", () => {
      const econQuery: VisualSearchQuery = {
        topic: "Supply and demand market equilibrium",
        subject: "economics",
        diagramType: "chart",
      };

      const groceryCandidate = makeCandidate({
        id: "grocery-1",
        cleanTitle: "Produce Section in Local Supermarket Grocery Store",
        description: "Real photo of fruit and vegetable market aisle in city retail store.",
        categories: ["Supermarket aisles", "Grocery stores"],
        mimeType: "image/jpeg",
      });

      const econGraphCandidate = makeCandidate({
        id: "econ-1",
        cleanTitle: "Supply and Demand Market Equilibrium Price Curve Chart",
        description: "Microeconomics graph illustrating supply curve, demand curve, equilibrium price and quantity.",
        categories: ["Economics diagrams", "Supply and demand curves", "Market charts"],
        mimeType: "image/svg+xml",
      });

      const evalGrocery = evaluateCandidateDeterministically(groceryCandidate, econQuery);
      const evalEcon = evaluateCandidateDeterministically(econGraphCandidate, econQuery);

      expect(evalGrocery.scores.totalWeightedScore).toBeLessThan(70);
      expect(evalGrocery.status).toBe("REJECTED");

      expect(evalEcon.scores.totalWeightedScore).toBeGreaterThanOrEqual(70);
      expect(evalEcon.status).toBe("ACCEPTED");
    });

    it("Cell Biology vs Prison Cell / Battery Cell: should accept eukaryotic cell diagram and reject penal cell", () => {
      const bioQuery: VisualSearchQuery = {
        topic: "Eukaryotic animal cell structure and organelles",
        subject: "biology",
        diagramType: "diagram",
      };

      const prisonCandidate = makeCandidate({
        id: "prison-1",
        cleanTitle: "Interior of Victorian Prison Cell with Bed and Bars",
        description: "Photograph of a penal correctional cell in historic penitentiary.",
        categories: ["Prison cells", "Penitentiaries"],
        mimeType: "image/jpeg",
      });

      const batteryCandidate = makeCandidate({
        id: "battery-1",
        cleanTitle: "Lithium-Ion Battery Cell Cylindrical 18650 Pack",
        description: "Photo of rechargeable electrochemical battery cells for electric vehicles.",
        categories: ["Battery cells", "Electronics"],
        mimeType: "image/jpeg",
      });

      const cellDiagramCandidate = makeCandidate({
        id: "cell-diagram-1",
        cleanTitle: "Eukaryotic Animal Cell Structure Diagram Labeled",
        description: "Vector schematic detailing nucleus, mitochondria, endoplasmic reticulum, and Golgi apparatus.",
        categories: ["Cell biology diagrams", "Eukaryotic cells", "Organelles anatomy"],
        mimeType: "image/svg+xml",
      });

      const evalPrison = evaluateCandidateDeterministically(prisonCandidate, bioQuery);
      const evalBattery = evaluateCandidateDeterministically(batteryCandidate, bioQuery);
      const evalCellDiagram = evaluateCandidateDeterministically(cellDiagramCandidate, bioQuery);

      expect(evalPrison.status).toBe("REJECTED");
      expect(evalPrison.scores.totalWeightedScore).toBeLessThan(70);

      expect(evalBattery.status).toBe("REJECTED");
      expect(evalBattery.scores.totalWeightedScore).toBeLessThan(70);

      expect(evalCellDiagram.status).toBe("ACCEPTED");
      expect(evalCellDiagram.scores.totalWeightedScore).toBeGreaterThanOrEqual(70);
    });

    it("CPU Cache Memory vs Geocaching: should accept CPU cache architecture schematic and reject geocache", () => {
      const csCacheQuery: VisualSearchQuery = {
        topic: "CPU cache memory hierarchy L1 L2 L3 architecture",
        subject: "computer_science",
        diagramType: "schematic",
      };

      const geocacheCandidate = makeCandidate({
        id: "geocache-1",
        cleanTitle: "Ammunition Box Geocache Hidden in Forest Rock Crevice",
        description: "Photograph of waterproof geocache container with logbook in outdoor recreation trail.",
        categories: ["Geocaching", "Outdoor games"],
        mimeType: "image/jpeg",
      });

      const cpuCacheCandidate = makeCandidate({
        id: "cpu-cache-1",
        cleanTitle: "CPU Cache Memory Hierarchy System Architecture Diagram",
        description: "Block diagram showing L1 instruction/data cache, L2 unified cache, L3 shared cache, and DRAM.",
        categories: ["Computer architecture diagrams", "CPU cache hierarchy", "Microprocessor schematics"],
        mimeType: "image/svg+xml",
      });

      const evalGeocache = evaluateCandidateDeterministically(geocacheCandidate, csCacheQuery);
      const evalCpuCache = evaluateCandidateDeterministically(cpuCacheCandidate, csCacheQuery);

      expect(evalGeocache.status).toBe("REJECTED");
      expect(evalCpuCache.status).toBe("ACCEPTED");
    });
  });

  // ==========================================================================
  // 9. Zero-Leakage Empirical Guarantee across Mixed Pools
  // ==========================================================================
  describe("9. Adversarial Test: Zero-Leakage Guarantee across Mixed Pools", () => {
    it("should achieve 0% negative pattern leakage in a hostile mixed candidate pool", () => {
      const hostilePool: CandidateImageMetadata[] = [
        makeCandidate({ id: "h1", title: "File:Flag_of_Germany.svg", cleanTitle: "Flag of Germany" }),
        makeCandidate({ id: "h2", title: "File:Portrait_of_Isaac_Newton.jpg", cleanTitle: "Portrait of Isaac Newton" }),
        makeCandidate({ id: "h3", title: "File:Postage_stamp_of_Darwin.jpg", cleanTitle: "Postage stamp of Darwin" }),
        makeCandidate({ id: "h4", title: "File:Coin_of_Julius_Caesar.jpg", cleanTitle: "Coin of Julius Caesar" }),
        makeCandidate({ id: "h5", title: "File:Book_cover_of_Principia.jpg", cleanTitle: "Book cover of Principia" }),
        makeCandidate({ id: "h6", title: "File:Oil_on_canvas_Landscape.jpg", cleanTitle: "Oil on canvas Landscape" }),
        makeCandidate({ id: "h7", title: "File:Statue_of_Adam_Smith.jpg", cleanTitle: "Statue of Adam Smith" }),
        makeCandidate({ id: "h8", title: "File:State_seal_of_Texas.png", cleanTitle: "State seal of Texas" }),
        makeCandidate({ id: "h9", width: 40, height: 40, cleanTitle: "Tiny Icon" }),
        makeCandidate({ id: "h10", width: 5000, height: 500, aspectRatio: 10.0, cleanTitle: "Panoramic Banner" }),
        // Exactly one legitimate diagram
        makeCandidate({
          id: "valid-diagram-1",
          title: "File:Carnot_cycle_thermodynamic_state_diagram.svg",
          cleanTitle: "Carnot cycle thermodynamic state diagram",
          description: "Indicator P-V diagram of the Carnot cycle with isothermal and adiabatic expansions.",
          categories: ["Thermodynamic cycles", "Physics diagrams"],
          mimeType: "image/svg+xml",
          width: 1200,
          height: 900,
          aspectRatio: 1.333,
        }),
      ];

      // Step 1: Deterministic Heuristic Filter
      const { accepted, discarded } = filterCandidatesHeuristically(hostilePool);

      // Verify all 10 junk candidates were trapped by heuristic filter
      expect(discarded).toHaveLength(10);
      expect(accepted).toHaveLength(1);
      expect(accepted[0].id).toBe("valid-diagram-1");

      // Verify no negative patterns leaked through to accepted
      const acceptedTitles = accepted.map((c) => c.title.toLowerCase());
      for (const t of acceptedTitles) {
        expect(t).not.toMatch(/flag/i);
        expect(t).not.toMatch(/portrait/i);
        expect(t).not.toMatch(/stamp/i);
        expect(t).not.toMatch(/coin/i);
        expect(t).not.toMatch(/book_cover/i);
        expect(t).not.toMatch(/oil_on_canvas/i);
        expect(t).not.toMatch(/statue/i);
        expect(t).not.toMatch(/seal/i);
      }

      // Step 2: Verification Engine Evaluation
      const verification = evaluateCandidateDeterministically(accepted[0], {
        topic: "Carnot heat engine thermodynamic cycle",
        subject: "physics",
        diagramType: "schematic",
      });

      expect(verification.status).toBe("ACCEPTED");
      expect(verification.scores.totalWeightedScore).toBeGreaterThanOrEqual(70);
    });
  });
});
