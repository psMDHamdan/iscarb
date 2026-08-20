/**
 * Wikipedia & Open Academic API Fetcher
 * =====================================
 * Programmatically queries Wikipedia MediaWiki Action API for autonomous topic research:
 * - Performs search queries (`action=query&list=search`)
 * - Extracts plain text and category metadata (`prop=extracts|categories|info&explaintext=1`)
 * - Identifies disambiguation pages and resolves canonical target articles
 * - Parses sections, strips citations/boilerplate, and formats structured article objects.
 */

import type {
  RawSection,
  WikipediaArticleExtract,
  WikipediaSearchResult,
} from "./types";

export const DEFAULT_USER_AGENT =
  "iSCARB-Academic/1.0 (academic-research@iscarb.edu.sa)";
export const DEFAULT_WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";

const NOISY_SECTIONS = new Set([
  "see also",
  "references",
  "external links",
  "further reading",
  "notes",
  "bibliography",
  "sources",
  "footnotes",
  "works cited",
  "citations",
  "gallery",
  "media",
]);

/**
 * Strips citation superscripts and formatting artifacts from MediaWiki extract text,
 * converting MediaWiki math formulas {\displaystyle ...} into standard LaTeX $...$
 */
export function cleanExtractText(text: string): string {
  if (!text) return "";
  return text
    .replace(/(?:\n\s*)*\{\\displaystyle\s*([\s\S]*?)\}/g, (_, eq) => ` $${eq.trim()}$ `)
    .replace(/\[\d+\]/g, "")
    .replace(/\[citation needed\]/gi, "")
    .replace(/\[note\s*\d+\]/gi, "")
    .replace(/\[edit\]/gi, "")
    .replace(/\[clarification needed\]/gi, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Parses MediaWiki plaintext sections formatted with == Heading == markers.
 */
export function parseSectionsFromExtract(fullText: string, articleTitle: string): RawSection[] {
  const sections: RawSection[] = [];
  const lines = fullText.split("\n");

  let currentHeading = "Overview";
  let currentLevel = 2;
  let currentLines: string[] = [];

  const flushCurrent = () => {
    const rawContent = currentLines.join("\n").trim();
    const cleaned = cleanExtractText(rawContent);
    const headingLower = currentHeading.toLowerCase().trim();

    if (cleaned.length > 0 && !NOISY_SECTIONS.has(headingLower)) {
      sections.push({
        heading: currentHeading === "Overview" ? `${articleTitle} Overview` : currentHeading,
        level: currentLevel,
        content: cleaned,
      });
    }
    currentLines = [];
  };

  const headerRegex = /^(={2,5})\s*([^=]+?)\s*\1\s*$/;

  for (const line of lines) {
    const match = line.match(headerRegex);
    if (match) {
      flushCurrent();
      const equalsCount = match[1].length;
      currentLevel = equalsCount;
      currentHeading = match[2].trim();
    } else {
      currentLines.push(line);
    }
  }

  flushCurrent();

  // If no sections were demarcated, wrap all text in single overview section
  if (sections.length === 0 && fullText.trim().length > 0) {
    sections.push({
      heading: `${articleTitle} Overview`,
      level: 2,
      content: cleanExtractText(fullText),
    });
  }

  return sections;
}

export class WikipediaFetcher {
  private readonly apiEndpoint: string;
  private readonly userAgent: string;
  private readonly timeoutMs: number;

  constructor(options?: {
    apiEndpoint?: string;
    userAgent?: string;
    timeoutMs?: number;
  }) {
    this.apiEndpoint = options?.apiEndpoint || DEFAULT_WIKIPEDIA_API;
    this.userAgent = options?.userAgent || DEFAULT_USER_AGENT;
    this.timeoutMs = options?.timeoutMs || 12000;
  }

  /**
   * Searches Wikipedia for articles matching query string.
   */
  async searchArticles(query: string, limit = 5): Promise<WikipediaSearchResult[]> {
    const url = new URL(this.apiEndpoint);
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", query);
    url.searchParams.set("srlimit", String(Math.max(1, Math.min(20, limit))));
    url.searchParams.set("utf8", "1");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const rawResults = data?.query?.search || [];

      const NON_ACADEMIC_PATTERNS = [
        /\(journal\)/i,
        /\(magazine\)/i,
        /\(film\)/i,
        /\(song\)/i,
        /\(album\)/i,
        /\(soundtrack\)/i,
        /\(band\)/i,
        /\(tv series\)/i,
        /\(television series\)/i,
        /\(novel\)/i,
        /\(play\)/i,
        /\(comic\)/i,
        /\(franchise\)/i,
        /\(character\)/i,
        /\(actor\)/i,
        /\(musician\)/i,
        /\(season\s*\d*\)/i,
        /\(episode\)/i,
        /\(disambiguation\)/i,
      ];

      const ENTERTAINMENT_SNIPPET_PATTERNS = [
        /\banimated (?:television |tv )?series\b/i,
        /\btelevision series\b/i,
        /\bvideo game\b/i,
        /\bfilm directed by\b/i,
        /\bstarring\b/i,
        /\bamerican sitcom\b/i,
        /\bmusic video\b/i,
        /\brecord label\b/i,
        /\bcomic book series\b/i,
      ];

      return rawResults
        .filter((r: any) => {
          const t = r.title || "";
          const snippet = r.snippet || "";
          if (
            t.startsWith("File:") ||
            t.startsWith("Category:") ||
            t.startsWith("Portal:") ||
            t.startsWith("Help:") ||
            t.startsWith("Template:") ||
            t.startsWith("Draft:") ||
            t.startsWith("User:") ||
            t.startsWith("Wikipedia:")
          ) {
            return false;
          }
          if (NON_ACADEMIC_PATTERNS.some((p) => p.test(t.trim()))) {
            return false;
          }
          if (ENTERTAINMENT_SNIPPET_PATTERNS.some((p) => p.test(snippet))) {
            return false;
          }
          return true;
        })
        .map((r: any) => ({
          title: r.title,
          pageId: r.pageid,
          snippet: (r.snippet || "").replace(/<[^>]+>/g, ""),
          wordCount: r.wordcount || 0,
          timestamp: r.timestamp,
        }));
    } catch {
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetches full plaintext extract and metadata for a specific article title.
   */
  async fetchArticleExtract(title: string): Promise<WikipediaArticleExtract | null> {
    const url = new URL(this.apiEndpoint);
    url.searchParams.set("action", "query");
    url.searchParams.set("prop", "extracts|categories|info");
    url.searchParams.set("inprop", "url");
    url.searchParams.set("explaintext", "1");
    url.searchParams.set("titles", title);
    url.searchParams.set("cllimit", "50");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const pages = data?.query?.pages;
      if (!pages) return null;

      const pageId = Object.keys(pages)[0];
      if (pageId === "-1" || !pages[pageId]) return null;

      const pageData = pages[pageId];
      const rawExtract = pageData.extract || "";
      const categories: string[] = (pageData.categories || []).map((c: any) => c.title || "");
      const fullUrl = pageData.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

      // Check if page is disambiguation
      const isDisambiguation =
        title.toLowerCase().includes("(disambiguation)") ||
        categories.some((cat) =>
          cat.toLowerCase().includes("disambiguation pages")
        ) ||
        /^(?:.+)\s+(?:may refer to|can refer to|refers to):/i.test(rawExtract.slice(0, 250));

      const sections = parseSectionsFromExtract(rawExtract, pageData.title || title);

      return {
        title: pageData.title || title,
        pageId: pageData.pageid || Number(pageId),
        extract: cleanExtractText(rawExtract),
        url: fullUrl,
        isDisambiguation,
        sections,
        categories,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Resolves links from a disambiguation page to find the most suitable academic candidate.
   */
  async resolveDisambiguation(title: string, disciplineHint?: string): Promise<string | null> {
    const url = new URL(this.apiEndpoint);
    url.searchParams.set("action", "query");
    url.searchParams.set("prop", "links");
    url.searchParams.set("titles", title);
    url.searchParams.set("plnamespace", "0");
    url.searchParams.set("pllimit", "50");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) return null;
      const data = await response.json();
      const pages = data?.query?.pages;
      if (!pages) return null;

      const pageId = Object.keys(pages)[0];
      const links: Array<{ title: string }> = pages[pageId]?.links || [];

      if (links.length === 0) return null;

      // Domain keywords map for semantic disambiguation resolution
      const domainKeywordsMap: Record<string, string[]> = {
        chemistry: [
          "element", "chemistry", "chemical", "compound", "reaction", "molecule",
          "metal", "acid", "base", "substance", "solution", "organic", "inorganic",
          "biochemistry", "catalysis", "polymer", "periodic", "matter", "atom"
        ],
        physics: [
          "physics", "physical", "mechanics", "quantum", "particle", "dynamics",
          "thermodynamics", "optics", "electromagnetism", "relativity", "gravity",
          "energy", "force", "field", "wave", "matter", "radiation", "astronomy",
          "planet", "astrophysics", "plasma", "nuclear", "state of matter"
        ],
        mathematics: [
          "mathematics", "math", "algebra", "matrix", "calculus", "geometry",
          "topology", "equation", "vector", "space", "theorem", "function",
          "differential", "integral", "arithmetic", "probability", "statistics",
          "graph theory", "logic", "number", "polynomial", "linear"
        ],
        "computer science": [
          "computer science", "computing", "algorithm", "data structure",
          "artificial intelligence", "machine learning", "deep learning",
          "neural network", "programming", "software", "network", "transformer",
          "graph", "architecture", "database", "model", "automaton", "language model"
        ],
        biology: [
          "biology", "biological", "cell", "gene", "protein", "organism",
          "molecular", "dna", "rna", "genetics", "physiology", "enzyme",
          "tissue", "organ", "species", "botany", "zoology", "microbiology", "cellular"
        ],
        engineering: [
          "engineering", "device", "technology", "circuit", "system",
          "mechanics", "fluid", "material", "control", "signal",
          "electronics", "electrical", "mechanical"
        ],
      };

      const hintLower = (disciplineHint || "").toLowerCase().trim();
      let activeKeywords: string[] = [];

      if (hintLower) {
        activeKeywords.push(hintLower);
        for (const [discKey, kws] of Object.entries(domainKeywordsMap)) {
          if (hintLower.includes(discKey) || discKey.includes(hintLower)) {
            activeKeywords.push(...kws);
          }
        }
      }

      const scoredLinks = links.map((l) => {
        const linkTitle = l.title.trim();
        const tLower = linkTitle.toLowerCase();
        let score = 0;

        if (tLower.includes("disambiguation") || tLower.includes("list of")) {
          return { title: linkTitle, score: -1000 };
        }

        if (
          tLower.includes("(film)") ||
          tLower.includes("(song)") ||
          tLower.includes("(album)") ||
          tLower.includes("(band)") ||
          tLower.includes("(novel)") ||
          tLower.includes("(journal)") ||
          tLower.includes("(magazine)") ||
          tLower.includes("(tv series)") ||
          tLower.includes("(play)") ||
          tLower.includes("(musician)") ||
          tLower.includes("(actor)") ||
          tLower.includes("(character)")
        ) {
          score -= 100;
        }

        if (hintLower && tLower.includes(hintLower)) {
          score += 100;
        }

        for (const kw of activeKeywords) {
          if (tLower.includes(kw)) {
            score += 40;
          }
        }

        // Academic parenthetical boosts
        if (
          tLower.includes("(science)") ||
          tLower.includes("(mathematics)") ||
          tLower.includes("(physics)") ||
          tLower.includes("(chemistry)") ||
          tLower.includes("(biology)") ||
          tLower.includes("(computer science)") ||
          tLower.includes("(element)") ||
          tLower.includes("(machine learning model)") ||
          tLower.includes("(deep learning)")
        ) {
          score += 80;
        }

        return { title: linkTitle, score };
      });

      scoredLinks.sort((a, b) => b.score - a.score);

      const bestCandidate = scoredLinks.find((item) => item.score > 0);
      if (bestCandidate) return bestCandidate.title;

      const fallbackLink = scoredLinks.find((item) => item.score >= 0);
      return fallbackLink ? fallbackLink.title : links[0]?.title || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
