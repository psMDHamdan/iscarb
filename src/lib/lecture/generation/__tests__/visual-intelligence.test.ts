import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateVisualSpec, aiFindAcademicImage } from "../visual-intelligence";
import { composeSlide } from "../slide-composer";
import type { SlideContentJson } from "../types";

// Shared mock spies (hoisted so both the mocks and the assertions see them)
const hoisted = vi.hoisted(() => ({
  chatJson: vi.fn(),
  searchWikipediaImage: vi.fn(),
}));

// Mock the AI engine. chatJson is called with an options object
// ({system, user, ...}) in visual-intelligence but positionally in
// slide-composer, so the mock normalizes both call styles.
vi.mock("@/lib/ai-engine", () => ({
  chatJson: hoisted.chatJson,
}));

// Silence real Wikipedia fetches in the fallback path (searchWikipediaImage
// is called internally by generateVisualSpec, so we stub global fetch).
vi.mock("@/lib/lecture/academic-visuals", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/lecture/academic-visuals")>();
  return {
    ...actual,
    getAcademicVisualForSlide: vi.fn((_no: number, title?: string, content?: string) => {
      const text = `${title || ""} ${content || ""}`.toLowerCase();
      // Fake a keyword match only for content mentioning "protein folding"
      if (text.includes("protein") && text.includes("fold")) {
        return {
          id: "match-protein-folding",
          discipline: "life_sciences_medicine" as const,
          topic: "Protein Folding & Structure",
          title: "Protein Folding & Structure",
          caption: "Curated protein folding caption.",
          imageUrl: "https://images.unsplash.com/curated-protein-folding",
          tags: ["protein"],
          visualType: "3D Molecular Model",
        };
      }
      return {
        id: `discipline-general-${_no}`,
        discipline: "general" as const,
        topic: "General",
        title: "General",
        caption: "General caption.",
        imageUrl: "https://images.unsplash.com/general-fallback",
        tags: ["general"],
        visualType: "Academic Visual",
      };
    }),
  };
});

function makeSlide(overrides: Partial<SlideContentJson> = {}): SlideContentJson {
  return {
    slideNo: 8,
    title: "Smart Grid Analytics",
    purpose: "Show data flow",
    learningObjective: "Understand the pipeline",
    visibleContent: ["IoT sensors", "Data lake", "Spark", "Models", "Control"],
    speakerNotes: "",
    conceptIds: [],
    sourceBlockIds: [],
    cloIds: [],
    bloomLevel: "apply",
    interaction: {},
    visualIntent: "A diagram of data flow",
    examples: [],
    misconception: {},
    assessment: {},
    citations: [],
    claims: [],
    wordCount: 15,
    ...overrides,
  };
}

describe("Visual Intelligence Pipeline", () => {
  beforeEach(() => {
    hoisted.chatJson.mockReset().mockImplementation(async (...args: unknown[]) => {
      const first = args[0] as { system?: string; user?: string } | undefined;
      const system = typeof first === "object" && first !== null ? first.system : (args[2] as string);
      if (system && system.includes("world-class scientific visual researcher")) {
        const json = {
          visualType: "PROCESS",
          purpose: "Explain measurement to decision",
          learningMessage: "Value comes from decisions",
          layout: "horizontal",
          elements: [
             { id: "s1", label: "Sensors" },
             { id: "s2", label: "Gateway" }
          ],
          connections: [["s1", "s2"]],
          labels: [],
          annotations: [],
          emphasis: [],
          studentQuestion: "What happens next?"
        };
        return { content: "", json, latencyMs: 0, model: "mock", guarded: true };
      }
      if (system && system.includes("PPTX SLIDE COMPOSER")) {
        const json = {
          compositionLayout: "Layout 3 — Process",
          textBlocks: [
            { role: "headline", text: "From measurement to decision" },
            { role: "subtext", text: "Data has value only when the pipeline turns measurements into decisions." }
          ],
          visualPlacement: "center",
          speakerNotes: "Explain the transition."
        };
        // composeSlide reads the returned object directly (composition.compositionLayout)
        return { ...json, json, content: "", latencyMs: 0, model: "mock", guarded: true };
      }
      return { content: "", json: {}, latencyMs: 0, model: "mock", guarded: true };
    });
    hoisted.searchWikipediaImage.mockReset().mockResolvedValue(
      "https://upload.wikimedia.org/wikipedia/commons/test-diagram.png"
    );
    // Stub network: Wikipedia/Wikimedia APIs return empty results so the
    // fallback path falls through deterministically (no real network).
    global.fetch = vi.fn(async () => ({ json: async () => ({ query: {} }) }) as Response);
  });

  it("uses the curated concept-matched visual directly (fast path, no LLM call)", async () => {
    const slide = makeSlide({ title: "Protein Folding", visibleContent: ["amino acid", "polypeptide folds into 3D shape"] });
    const spec = await generateVisualSpec(slide);
    expect(hoisted.chatJson).not.toHaveBeenCalled();
    expect(hoisted.searchWikipediaImage).not.toHaveBeenCalled();
    expect(spec.imageUrl).toBe("https://images.unsplash.com/curated-protein-folding");
    expect(spec.fetchedImageUrl).toBe("https://images.unsplash.com/curated-protein-folding");
    expect(spec.title).toBe("Protein Folding & Structure");
  });

  it("falls through to the LLM visual engine for non-curated slides", async () => {
    const mockSlide = makeSlide();
    const spec = await generateVisualSpec(mockSlide);
    expect(hoisted.chatJson).toHaveBeenCalled();
    expect(spec.visualType).toBe("PROCESS");

    mockSlide.visualSpec = spec;
    const composed = await composeSlide(mockSlide);
    expect(composed.compositionLayout).toBe("Layout 3 — Process");
    expect(composed.visibleContent.length).toBe(2);
    expect(composed.visibleContent[0]).toBe("From measurement to decision");
  });

  it("aiFindAcademicImage returns local visual info without external URLs", async () => {
    const result = await aiFindAcademicImage({
      title: "Protein Folding",
      bullets: ["folds into native conformation"],
      slideNo: 5,
    });
    // LOCAL-FIRST: no external image URL, no LLM call
    expect(result.imageUrl).toBeUndefined();
    expect(result.title).toBe("Protein Folding");
    expect(result.visualType).toBe("Diagram");
  });
});
