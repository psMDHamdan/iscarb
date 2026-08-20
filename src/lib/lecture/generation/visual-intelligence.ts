import { chatJson } from "@/lib/ai-engine";
import { getAcademicVisualForSlide } from "@/lib/lecture/academic-visuals";
import type { SlideContentJson, VisualSpecification } from "./types";

const VISUAL_LLM_PROMPT = `You are a world-class scientific visual researcher, university instructional designer, and scientific illustrator.
Your task is to analyze ANY university lecture concept (Physics, Mathematics, Computer Science, Biology, Chemistry, Medicine, Engineering, Economics, etc.) and identify the EXACT pedagogical scientific visual needed for students to master this concept.

## INSTRUCTIONS:
1. Analyze the concept title, discipline, and key points.
2. Determine what exact visual/diagram/chart is needed to teach this concept effectively.
3. Formulate 3 distinct search terms optimized for Wikimedia Commons (which has the best scientific diagrams):
   - Query 1: Specific scientific term + diagram type (e.g. "enzymatic catalysis mechanism diagram", "CRISPR Cas9 PAM recognition schematic", "Newtonian mechanics free body diagram", "Boolean logic gate circuit diagram")
   - Query 2: Standard academic term + illustration (e.g. "photosynthesis thylakoid membrane illustration", "Krebs cycle metabolic pathway", "wave interference pattern", "neural network architecture")
   - Query 3: Core scientific concept (e.g. "DNA replication fork", "organic chemistry reaction mechanism", "electromagnetic wave propagation", "probability distribution")
4. Provide a clear pedagogical title for the diagram.
5. Provide a 1-2 sentence caption explaining what the student is seeing and how it works.
6. Identify visual type: "Diagram" | "Simulation" | "Telescope Observation" | "Vector Field" | "Architecture" | "Flowchart" | "Molecular Model" | "Pathway" | "Force Diagram".

Return STRICT valid JSON only in this schema:
{
  "searchQueries": ["query1", "query2", "query3"],
  "title": "Pedagogical Title",
  "caption": "1-2 sentence caption explaining what students should observe.",
  "visualType": "Diagram",
  "suggestedSearchQuery": "Best single search term"
}`;

const BAD_IMAGE_PATTERNS = [
  /flag/i,
  /seal/i,
  /coat_of_arms/i,
  /poster/i,
  /stamp/i,
  /coin/i,
  /medal/i,
  /logo/i,
  /emblem/i,
  /tomb/i,
  /statue/i,
  /portrait/i,
  /signature/i,
  /location_map/i,
  /oklahoma/i,
  /texas/i,
  /california/i,
  /county/i,
  // Non-educational stock patterns
  /business_meeting/i,
  /stock_photo/i,
  /shutterstock/i,
  /getty/i,
  /clipart/i,
  /cartoon/i,
  /clip_art/i,
  /emoji/i,
  /meme/i,
  // Photo-irrelevant for STEM
  /food_recipe/i,
  /fashion_model/i,
  /travel_destination/i,
  /real_estate/i,
];

const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
const BLOCKED_EXTENSIONS = [".pdf", ".djvu", ".ogg", ".webm", ".ogv", ".svg", ".mp4"];

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().split("?")[0];
  // Reject blocked formats
  if (BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;
  // Accept known image formats
  if (ALLOWED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
  // Unsplash/Wikimedia thumb URLs without extension are fine
  if (lower.includes("unsplash.com") || lower.includes("/thumb/")) return true;
  return false;
}

function isEducationalScientificImage(url: string, title?: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const lowerTitle = (title || "").toLowerCase();
  for (const pat of BAD_IMAGE_PATTERNS) {
    if (pat.test(lowerUrl) || pat.test(lowerTitle)) return false;
  }
  return true;
}

/**
 * Searches Wikipedia and Wikimedia API for high-resolution educational images matching queries.
 */
export async function searchWikipediaImage(queries: string[]): Promise<string | undefined> {
  for (const query of queries) {
    if (!query || query.trim().length === 0) continue;
    try {
      // 1. Search Wikimedia Commons — prefer diagrams and scientific illustrations
      const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query + ' diagram illustration scientific')}&gsrlimit=8&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*`;
      const commonsRes = await fetch(commonsUrl, {
        headers: { "User-Agent": "iSCARB-Academic/1.0 (academic-research@iscarb.edu.sa)" },
      });
      const commonsData = await commonsRes.json();
      const cPages = commonsData.query?.pages;
      if (cPages) {
        for (const pId of Object.keys(cPages)) {
          const cPage = cPages[pId];
          const rawUrl = cPage?.imageinfo?.[0]?.url || cPage?.imageinfo?.[0]?.thumburl;
          if (
            rawUrl &&
            isValidImageUrl(rawUrl) &&
            isEducationalScientificImage(rawUrl, cPage?.title)
          ) {
            // Strip tracking params for clean URL
            return rawUrl.split("?")[0];
          }
        }
      }

      // 2. Search Wikipedia articles
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`,
        { headers: { "User-Agent": "iSCARB-Academic/1.0 (academic-research@iscarb.edu.sa)" } }
      );
      const searchData = await searchRes.json();
      const articles = searchData.query?.search || [];

      for (const article of articles.slice(0, 4)) {
        if (!article.title || !isEducationalScientificImage("", article.title)) continue;

        const imageRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original|thumbnail&pithumbsize=1200&titles=${encodeURIComponent(article.title)}&origin=*`,
          { headers: { "User-Agent": "iSCARB-Academic/1.0 (academic-research@iscarb.edu.sa)" } }
        );
        const imageData = await imageRes.json();
        const pages = imageData.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          const page = pages[pageId];
          const url = page?.original?.source || page?.thumbnail?.source;
          if (
            url &&
            isValidImageUrl(url) &&
            isEducationalScientificImage(url, page?.title)
          ) {
            return url.split("?")[0];
          }
        }
      }
    } catch (e) {
      console.warn(`[visual-intelligence] Wikipedia search failed for '${query}'`, e);
    }
  }
  return undefined;
}

/**
 * Strong curated match? The curated registry (`academic-visuals.ts`) maps
 * topic keywords to hand-picked, concept-accurate images. When it returns a
 * keyword hit (id starts with "match-") we use it directly — it is both
 * faster (no LLM + Wikipedia round-trip) and far more relevant than a
 * scrape that often returns unrelated stock photos. A "discipline-" id is
 * only a generic fallback, so the online search still runs in that case.
 */
function curatedVisualForContent(content: SlideContentJson) {
  const slideText = [
    content.title || "",
    content.purpose || "",
    content.learningObjective || "",
    ...(content.visibleContent || content.bullets || []),
  ].join(" ");
  const curated = getAcademicVisualForSlide(content.slideNo || 0, content.title, slideText);
  return curated.id.startsWith("match-") ? curated : null;
}

function specFromCurated(curated: NonNullable<ReturnType<typeof curatedVisualForContent>>): VisualSpecification {
  return {
    visualType: curated.visualType || "Diagram",
    title: curated.title,
    caption: curated.caption,
    imageUrl: curated.imageUrl,
    fetchedImageUrl: curated.imageUrl,
    suggestedSearchQuery: curated.topic,
  };
}

/**
 * AI-Powered Universal Visual Spec & Image Resolver for any slide
 */
export async function generateVisualSpec(content: SlideContentJson): Promise<VisualSpecification> {
  const prompt = `Analyze this university slide and identify what exact visual/diagram is needed:
Slide Title: ${content.title || "Academic Concept"}
Slide Purpose: ${content.purpose || "Concept Mastery"}
Learning Objective: ${content.learningObjective || "Understanding"}
Slide Content / Bullets: ${(content.visibleContent || content.bullets || []).join("\n- ")}
Student Action: ${JSON.stringify(content.interaction || content.studentAction || "")}`;

  // Fast path — curated concept-matched image wins over the online scrape.
  const curated = curatedVisualForContent(content);
  if (curated) {
    return specFromCurated(curated);
  }

  try {
    const chatRes = await chatJson({
      system: VISUAL_LLM_PROMPT,
      user: prompt,
      model: "gpt-4o",
      temperature: 0.2,
      guardrails: false,
    });

    const spec = (chatRes.json as VisualSpecification & { searchQueries?: string[] }) || {};

    const searchList = [
      ...(spec.searchQueries || []),
      spec.suggestedSearchQuery || "",
      content.title || "",
    ].filter(Boolean);

    const foundImageUrl = await searchWikipediaImage(searchList);
    if (foundImageUrl) {
      spec.fetchedImageUrl = foundImageUrl;
      spec.imageUrl = foundImageUrl;
    } else {
      // No online result — use the curated discipline fallback so the slide
      // never ships with a missing/blank image.
      const fallback = getAcademicVisualForSlide(
        content.slideNo || 0,
        content.title,
        [content.purpose || "", ...(content.visibleContent || content.bullets || [])].join(" ")
      );
      spec.fetchedImageUrl = fallback.imageUrl;
      spec.imageUrl = fallback.imageUrl;
      if (!spec.title) spec.title = fallback.title;
      if (!spec.caption) spec.caption = fallback.caption;
    }

    return {
      visualType: spec.visualType || "Diagram",
      title: spec.title || content.title || "Academic Diagram",
      caption: spec.caption || spec.learningMessage || "Scientific diagram illustrating key concept mechanisms.",
      imageUrl: spec.imageUrl,
      fetchedImageUrl: spec.fetchedImageUrl,
      suggestedSearchQuery: spec.suggestedSearchQuery || searchList[0] || "",
    };
  } catch (error) {
    console.error("[visual-intelligence] LLM visual generation failed, returning fallback spec", error);
    return {
      visualType: "DIAGRAM",
      title: content.title || "Academic Diagram",
      purpose: content.purpose || "Visual Representation",
      learningMessage: content.title || "",
      suggestedSearchQuery: content.title || "Science",
    };
  }
}

/**
 * Standalone AI Image Finder: Analyzes what visual is needed, queries the internet, and returns real image
 */
export async function aiFindAcademicImage(input: {
  title?: string;
  topic?: string;
  bullets?: string[];
  purpose?: string;
  slideNo?: number;
}) {
  const prompt = `Slide Title: ${input.title || ""}
Topic/Subject: ${input.topic || ""}
Purpose: ${input.purpose || ""}
Content Summary: ${(input.bullets || []).join(" ")}`;

  // Fast path — curated concept-matched image wins over the online scrape.
  const curated = getAcademicVisualForSlide(
    input.slideNo || 0,
    input.title || input.topic || "",
    [input.purpose || "", input.topic || "", ...(input.bullets || [])].join(" ")
  );
  if (curated.id.startsWith("match-")) {
    return {
      imageUrl: curated.imageUrl,
      title: curated.title,
      caption: curated.caption,
      visualType: curated.visualType || "Diagram",
      suggestedSearchQuery: curated.topic,
    };
  }

  try {
    const chatRes = await chatJson({
      system: VISUAL_LLM_PROMPT,
      user: prompt,
      model: "gpt-4o",
      temperature: 0.2,
      guardrails: false,
    });

    const spec = (chatRes.json as VisualSpecification & { searchQueries?: string[] }) || {};

    const searchList = [
      ...(spec.searchQueries || []),
      spec.suggestedSearchQuery || "",
      input.title || "",
      input.topic || "",
    ].filter(Boolean);

    const foundImageUrl = await searchWikipediaImage(searchList);

    return {
      imageUrl: foundImageUrl || curated.imageUrl,
      title: spec.title || input.title || curated.title || "Academic Model",
      caption: spec.caption || spec.learningMessage || curated.caption || "Scientific diagram illustrating key concept mechanisms.",
      visualType: spec.visualType || curated.visualType || "Diagram",
      suggestedSearchQuery: spec.suggestedSearchQuery || searchList[0] || "",
    };
  } catch (err) {
    console.error("[aiFindAcademicImage] LLM error:", err);
    return {
      imageUrl: curated.imageUrl,
      title: input.title || curated.title || "Academic Model",
      caption: curated.caption || "Scientific diagram illustrating key concept mechanisms.",
      visualType: "Diagram",
      suggestedSearchQuery: input.title || "",
    };
  }
}
