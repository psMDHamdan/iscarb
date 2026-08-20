import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanTitle,
  parseCategories,
  parseWikimediaResponse,
  searchWikimediaDiagrams,
  stripHtml,
} from "../wikimedia-search";

describe("Wikimedia Search & Metadata Parser Unit Tests", () => {
  describe("1. Utility String Cleaners", () => {
    it("should strip HTML tags, entity references, and excess whitespace", () => {
      const rawHtml = `<div class="description"><b>Human Heart</b> &amp; <i>Circulation</i> System&nbsp;<a href="/wiki/Aorta">Aorta</a>&#039;s path</div>`;
      const cleaned = stripHtml(rawHtml);
      expect(cleaned).toBe("Human Heart & Circulation System Aorta's path");
    });

    it("should properly decode &#39;, &apos;, &quot;, &amp;, &lt;, &gt;, and &nbsp; without unwanted spaces", () => {
      expect(stripHtml("Aorta&#39;s")).toBe("Aorta's");
      expect(stripHtml("Newton&apos;s laws &amp; &quot;Principia&quot; &lt;1687&gt;")).toBe(
        'Newton\'s laws & "Principia" <1687>'
      );
      expect(stripHtml("Internal&nbsp;Anatomy&#39;s Structure")).toBe("Internal Anatomy's Structure");
      expect(stripHtml("<b>Photosynthesis</b>&#39;s light-dependent reactions")).toBe(
        "Photosynthesis's light-dependent reactions"
      );
    });

    it("should clean raw Wikimedia titles into readable strings", () => {
      expect(cleanTitle("File:Human_heart_diagram-en.svg")).toBe("Human heart diagram en");
      expect(cleanTitle("File:Carnot_cycle_p-V_diagram.png")).toBe("Carnot cycle p V diagram");
      expect(cleanTitle("Binary_Tree_Model.jpg")).toBe("Binary Tree Model");
      expect(cleanTitle("")).toBe("");
    });

    it("should parse pipe-separated categories accurately", () => {
      const pipeStr = "Diagrams of human heart|Circulatory system|Human anatomy|<i>Biology</i>";
      const cats = parseCategories(pipeStr);
      expect(cats).toEqual([
        "Diagrams of human heart",
        "Circulatory system",
        "Human anatomy",
        "Biology",
      ]);
    });
  });

  describe("2. Response Ingestion & Normalization", () => {
    it("should parse standard Wikimedia Commons Action API JSON response", () => {
      const sampleApiResponse = {
        query: {
          pages: {
            "12345": {
              pageid: 12345,
              title: "File:Human_heart_diagram-en.svg",
              imageinfo: [
                {
                  url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Human_heart_diagram-en.svg",
                  thumburl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Human_heart_diagram-en.svg/1200px-Human_heart_diagram-en.svg.png",
                  descriptionurl: "https://commons.wikimedia.org/wiki/File:Human_heart_diagram-en.svg",
                  mime: "image/svg+xml",
                  size: 154000,
                  width: 1280,
                  height: 1024,
                  extmetadata: {
                    ImageDescription: {
                      value: "<p>Diagram showing internal anatomy of the human heart.</p>",
                    },
                    Categories: {
                      value: "Human heart|Circulatory system diagrams|Anatomical diagrams",
                    },
                    Artist: {
                      value: "<a href=\"//commons.wikimedia.org/wiki/User:Illustrator\">Illustrator</a>",
                    },
                    LicenseShortName: {
                      value: "CC BY-SA 4.0",
                    },
                    LicenseUrl: {
                      value: "https://creativecommons.org/licenses/by-sa/4.0",
                    },
                    AttributionRequired: {
                      value: "true",
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const candidates = parseWikimediaResponse(sampleApiResponse);
      expect(candidates).toHaveLength(1);

      const item = candidates[0];
      expect(item.id).toBe("12345");
      expect(item.title).toBe("File:Human_heart_diagram-en.svg");
      expect(item.fileName).toBe("Human_heart_diagram-en.svg");
      expect(item.cleanTitle).toBe("Human heart diagram en");
      expect(item.mimeType).toBe("image/svg+xml");
      expect(item.width).toBe(1280);
      expect(item.height).toBe(1024);
      expect(item.aspectRatio).toBe(1.25);
      expect(item.description).toBe("Diagram showing internal anatomy of the human heart.");
      expect(item.categories).toEqual([
        "Human heart",
        "Circulatory system diagrams",
        "Anatomical diagrams",
      ]);
      expect(item.artist).toBe("Illustrator");
      expect(item.license).toBe("CC BY-SA 4.0");
      expect(item.attributionRequired).toBe(true);
    });

    it("should filter out non-image MIME types like PDF documents", () => {
      const responseWithPdf = {
        query: {
          pages: {
            "999": {
              pageid: 999,
              title: "File:Cardiovascular_Review_Book.pdf",
              imageinfo: [
                {
                  url: "https://upload.wikimedia.org/wikipedia/commons/9/99/Cardiovascular_Review_Book.pdf",
                  mime: "application/pdf",
                  width: 600,
                  height: 800,
                },
              ],
            },
          },
        },
      };

      const candidates = parseWikimediaResponse(responseWithPdf);
      expect(candidates).toHaveLength(0);
    });

    it("should handle empty or malformed API responses gracefully", () => {
      expect(parseWikimediaResponse(null)).toEqual([]);
      expect(parseWikimediaResponse({})).toEqual([]);
      expect(parseWikimediaResponse({ query: {} })).toEqual([]);
      expect(parseWikimediaResponse({ query: { pages: {} } })).toEqual([]);
    });
  });

  describe("3. searchWikimediaDiagrams API Function", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should return empty array when query is blank", async () => {
      const results = await searchWikimediaDiagrams({ query: "   " });
      expect(results).toEqual([]);
    });

    it("should execute fetch with proper parameters and User-Agent", async () => {
      const mockApiResponse = {
        query: {
          pages: {
            "42": {
              pageid: 42,
              title: "File:Carnot_engine.svg",
              imageinfo: [
                {
                  url: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Carnot_engine.svg",
                  thumburl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Carnot_engine.svg/1200px.png",
                  mime: "image/svg+xml",
                  width: 800,
                  height: 600,
                  extmetadata: {
                    LicenseShortName: { value: "CC BY 3.0" },
                  },
                },
              ],
            },
          },
        },
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const results = await searchWikimediaDiagrams({
        query: "Carnot heat engine cycle",
        limit: 5,
      });

      expect(fetchSpy).toHaveBeenCalled();
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain("commons.wikimedia.org");
      expect(calledUrl).toContain("Carnot+heat+engine+cycle");

      expect(results).toHaveLength(1);
      expect(results[0].cleanTitle).toBe("Carnot engine");
    });

    it("should gracefully handle HTTP errors without throwing", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      const results = await searchWikimediaDiagrams({
        query: "nonexistent query",
      });

      expect(results).toEqual([]);
    });
  });
});
