import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CandidateImageMetadata, VisualSearchQuery } from "../types";
import {
  createFallbackDiagram,
  executeBatchVisualPipeline,
  executeVisualPipeline,
} from "../visual-pipeline.service";
import * as wikimediaSearch from "../wikimedia-search";

describe("Visual Pipeline Service Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock global fetch by default to prevent any live network requests during tests
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);

      // Mock LLM chat completions endpoint
      if (urlStr.includes("chat/completions")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    selectedCandidateId: "102",
                    evaluations: [
                      {
                        candidateId: "102",
                        status: "ACCEPTED",
                        scores: {
                          educationalValue: 9.0,
                          relevance: 9.0,
                          clarity: 8.5,
                          diagrammaticNature: 8.5,
                        },
                        reasoningChain:
                          "High pedagogical value anatomical vector diagram of human heart circulation.",
                      },
                    ],
                  }),
                },
              },
            ],
          }),
        } as Response;
      }

      // Mock Wikimedia Commons Action API
      if (urlStr.includes("commons.wikimedia.org") || urlStr.includes("api.php")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            query: {
              pages: {
                "102": {
                  pageid: 102,
                  title: "File:Human_heart_diagram-en.svg",
                  imageinfo: [
                    {
                      url: "https://upload.wikimedia.org/heart.svg",
                      thumburl: "https://upload.wikimedia.org/heart-thumb.png",
                      mime: "image/svg+xml",
                      width: 1280,
                      height: 1024,
                      extmetadata: {
                        ImageDescription: {
                          value: "Human heart blood circulation diagram",
                        },
                        Categories: {
                          value: "Human heart diagrams|Circulatory system",
                        },
                        LicenseShortName: { value: "CC BY-SA 4.0" },
                      },
                    },
                  ],
                },
              },
            },
          }),
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({}),
      } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should execute end-to-end pipeline and return SelectedDiagram on first attempt", async () => {
    const mockCandidates: CandidateImageMetadata[] = [
      {
        id: "101",
        title: "File:Flag_of_Europe.svg",
        fileName: "Flag_of_Europe.svg",
        cleanTitle: "Flag of Europe",
        url: "https://upload.wikimedia.org/flag.svg",
        thumbUrl: "https://upload.wikimedia.org/flag-thumb.png",
        description: "Official flag",
        categories: ["Flags"],
        artist: "Illustrator",
        license: "CC0",
        attributionRequired: false,
        mimeType: "image/svg+xml",
        width: 1000,
        height: 600,
        aspectRatio: 1.66,
      },
      {
        id: "102",
        title: "File:Human_heart_diagram-en.svg",
        fileName: "Human_heart_diagram-en.svg",
        cleanTitle: "Human heart diagram en",
        url: "https://upload.wikimedia.org/heart.svg",
        thumbUrl: "https://upload.wikimedia.org/heart-thumb.png",
        description: "Labeled anatomical diagram of the human heart circulation.",
        categories: ["Human heart diagrams", "Circulatory system"],
        artist: "Medical Illustrator",
        license: "CC BY-SA 4.0",
        attributionRequired: true,
        mimeType: "image/svg+xml",
        width: 1280,
        height: 1024,
        aspectRatio: 1.25,
      },
    ];

    vi.spyOn(wikimediaSearch, "searchWikimediaDiagrams").mockResolvedValueOnce(
      mockCandidates
    );

    const query: VisualSearchQuery = {
      topic: "Human heart blood circulation",
      subject: "biology",
    };

    const diagram = await executeVisualPipeline(query);

    expect(diagram).toBeDefined();
    expect(diagram.cleanTitle).toBe("Human heart diagram en");
    expect(diagram.confidenceScore).toBeGreaterThanOrEqual(70);
    expect(diagram.searchHistory.attempts).toBe(1);
    expect(diagram.searchHistory.totalCandidatesEvaluated).toBe(2);
    expect(diagram.searchHistory.discardLog.length).toBeGreaterThanOrEqual(1);
  });

  it("should trigger query reformulation retry loop when first search yields empty or filtered candidates", async () => {
    const emptySearch = vi
      .spyOn(wikimediaSearch, "searchWikimediaDiagrams")
      .mockResolvedValueOnce([]) // Attempt 0 returns empty
      .mockResolvedValueOnce([
        {
          id: "202",
          title: "File:Carnot_cycle_p-V_diagram.svg",
          fileName: "Carnot_cycle_p-V_diagram.svg",
          cleanTitle: "Carnot cycle p V diagram",
          url: "https://upload.wikimedia.org/carnot.svg",
          thumbUrl: "https://upload.wikimedia.org/carnot-thumb.png",
          description: "Thermodynamic state cycle diagram of Carnot heat engine.",
          categories: ["Thermodynamic cycles"],
          artist: "Physicist",
          license: "CC BY-SA 4.0",
          attributionRequired: true,
          mimeType: "image/svg+xml",
          width: 800,
          height: 600,
          aspectRatio: 1.333,
        },
      ]); // Attempt 1 returns valid diagram

    // Mock fetch for Carnot cycle response in attempt 2
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("chat/completions")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    selectedCandidateId: "202",
                    evaluations: [
                      {
                        candidateId: "202",
                        status: "ACCEPTED",
                        scores: {
                          educationalValue: 9.0,
                          relevance: 9.5,
                          clarity: 8.5,
                          diagrammaticNature: 9.0,
                        },
                        reasoningChain:
                          "Accurate thermodynamic p-V state cycle diagram.",
                      },
                    ],
                  }),
                },
              },
            ],
          }),
        } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    const query: VisualSearchQuery = {
      topic: "Carnot heat engine thermodynamic cycle",
      subject: "physics",
    };

    const diagram = await executeVisualPipeline(query, { maxRetries: 2 });

    expect(emptySearch).toHaveBeenCalledTimes(2);
    expect(diagram.cleanTitle).toBe("Carnot cycle p V diagram");
    expect(diagram.searchHistory.attempts).toBe(2);
    expect(diagram.searchHistory.queriesUsed).toHaveLength(2);
  });

  it("should produce structured fallback diagram when retries are exhausted", () => {
    const query: VisualSearchQuery = {
      topic: "Obscure Unknown Mechanism",
      subject: "general",
    };

    const fallback = createFallbackDiagram(query, {
      attempts: 4,
      queriesUsed: ["Query 1", "Query 2", "Query 3", "Query 4"],
      totalCandidatesEvaluated: 0,
      totalCandidatesDiscarded: 0,
      discardLog: [],
    });

    expect(fallback.topic).toBe("Obscure Unknown Mechanism");
    expect(fallback.confidenceScore).toBe(70);
    expect(fallback.searchHistory.attempts).toBe(4);
  });

  it("should execute batch visual pipeline across multiple queries", async () => {
    vi.spyOn(wikimediaSearch, "searchWikimediaDiagrams").mockResolvedValue([
      {
        id: "301",
        title: "File:Generic_Diagram.svg",
        fileName: "Generic_Diagram.svg",
        cleanTitle: "Generic Diagram",
        url: "https://upload.wikimedia.org/gen.svg",
        thumbUrl: "https://upload.wikimedia.org/gen-thumb.png",
        description: "Labeled diagram schematic illustration.",
        categories: ["Diagrams"],
        artist: "Illustrator",
        license: "CC BY-SA 4.0",
        attributionRequired: false,
        mimeType: "image/svg+xml",
        width: 800,
        height: 600,
        aspectRatio: 1.333,
      },
    ]);

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("chat/completions")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    selectedCandidateId: "301",
                    evaluations: [
                      {
                        candidateId: "301",
                        status: "ACCEPTED",
                        scores: {
                          educationalValue: 8.0,
                          relevance: 8.0,
                          clarity: 8.0,
                          diagrammaticNature: 8.0,
                        },
                        reasoningChain: "Suitable educational diagram.",
                      },
                    ],
                  }),
                },
              },
            ],
          }),
        } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    const queries: VisualSearchQuery[] = [
      { topic: "Topic 1", subject: "biology" },
      { topic: "Topic 2", subject: "physics" },
    ];

    const results = await executeBatchVisualPipeline(queries);
    expect(results).toHaveLength(2);
    expect(results[0].topic).toBe("Topic 1");
    expect(results[1].topic).toBe("Topic 2");
  });
});
