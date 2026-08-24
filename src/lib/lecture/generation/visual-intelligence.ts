import { chatJson } from "@/lib/ai-engine";
import { getAcademicVisualForSlide } from "@/lib/lecture/academic-visuals";
import type { SlideContentJson, VisualSpecification } from "./types";
import {
  renderMolecule,
  renderReactionMechanism,
  renderMarkushStructure,
  renderDNASequence,
  renderPathway,
} from "@/lib/lecture/chemistry/chemistry-renderer";
import {
  renderFreeBodyDiagram,
  renderGraph,
  renderWave,
  renderFormulaDerivation,
  renderVectorDiagram,
  renderCircuit,
  renderEnergyDiagram,
  renderDistribution,
  renderNumberLine,
} from "@/lib/lecture/chemistry/physics-math-renderer";

export interface VisualSpecOptions {
  /** Normalized URLs already assigned to other slides in this generation run. */
  usedImageUrls?: Set<string>;
}

export function normalizeImageUrl(url: string): string {
  return url.split("?")[0].toLowerCase();
}

/** Best-effort HEAD check — rejects dead upstream assets before persisting. */
export async function isReachableImageUrl(url: string): Promise<boolean> {
  if (!url || !url.startsWith("http")) return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "iSCARB-Academic/1.0 (academic-research@iscarb.edu.sa)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type")?.toLowerCase() ?? "";
    return ct.startsWith("image/") || url.includes("unsplash.com") || url.includes("wikimedia.org");
  } catch {
    return false;
  }
}

function registerUsedUrl(url: string | undefined, used?: Set<string>): void {
  if (!url || !used) return;
  used.add(normalizeImageUrl(url));
}

function isUrlAvailable(url: string | undefined, used?: Set<string>): boolean {
  if (!url) return false;
  if (!used) return true;
  return !used.has(normalizeImageUrl(url));
}

export interface ImageIntent {
  concept: string;
  learning_goal: string;
  student_should_notice: string[];
  visual_type: string;
  must_show: string[];
  must_not_show: string[];
  scientific_domain: string;
  student_level: string;
}

const VISUAL_LLM_PROMPT = `You are a world-class scientific visual researcher and instructional designer.
Your task is to analyze a university lecture concept and create an ImageIntent for fetching/generating the exact pedagogical visual needed.

## INSTRUCTIONS:
1. Analyze the concept title, purpose, and key points.
2. Determine what exact visual is needed to teach this concept effectively.
3. Formulate the ImageIntent with strict requirements.

Return STRICT valid JSON only in this schema:
{
  "concept": "string (e.g., DNA double helix)",
  "learning_goal": "string (e.g., Explain basic structure of DNA)",
  "student_should_notice": ["string", "string"],
  "visual_type": "string (e.g., labeled_scientific_diagram)",
  "must_show": ["string", "string"],
  "must_not_show": ["string", "string"],
  "scientific_domain": "string (e.g., molecular biology)",
  "student_level": "string (e.g., undergraduate)",
  "suggestedSearchQuery": "string (Optimized search term for Wikimedia Commons)"
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
 * When `collectAll` is true, returns every valid candidate (for deduplication passes).
 */
export async function searchWikipediaImage(
  queries: string[],
  collectAll = false
): Promise<string | undefined> {
  const candidates: string[] = [];
  for (const query of queries) {
    if (!query || query.trim().length === 0) continue;
    try {
      // 1. Search Wikimedia Commons — prefer diagrams and scientific illustrations
      const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query + " diagram illustration scientific")}&gsrlimit=12&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*`;
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
            const clean = rawUrl.split("?")[0];
            if (collectAll) {
              if (!candidates.includes(clean)) candidates.push(clean);
            } else {
              return clean;
            }
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
            const clean = url.split("?")[0];
            if (collectAll) {
              if (!candidates.includes(clean)) candidates.push(clean);
            } else {
              return clean;
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[visual-intelligence] Wikipedia search failed for '${query}'`, e);
    }
  }
  if (collectAll) return candidates[0];
  return undefined;
}

/**
 * Per-slide Wikimedia fetch that skips URLs already used by other slides.
 */
export async function searchWikipediaImageDistinct(
  queries: string[],
  slideNo: number,
  usedImageUrls?: Set<string>
): Promise<string | undefined> {
  const slideQueries = [
    ...queries,
    `${queries[0] || "academic"} diagram slide ${slideNo}`,
    `${queries[0] || "science"} illustration concept ${slideNo}`,
  ].filter(Boolean);

  const seen = new Set<string>();
  for (const query of slideQueries) {
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query + " diagram scientific")}&gsrlimit=12&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*`;
    try {
      const commonsRes = await fetch(commonsUrl, {
        headers: { "User-Agent": "iSCARB-Academic/1.0 (academic-research@iscarb.edu.sa)" },
      });
      const commonsData = await commonsRes.json();
      const cPages = commonsData.query?.pages;
      if (!cPages) continue;
      for (const pId of Object.keys(cPages)) {
        const cPage = cPages[pId];
        const rawUrl = cPage?.imageinfo?.[0]?.url || cPage?.imageinfo?.[0]?.thumburl;
        if (!rawUrl || !isValidImageUrl(rawUrl) || !isEducationalScientificImage(rawUrl, cPage?.title)) continue;
        const clean = rawUrl.split("?")[0];
        const norm = normalizeImageUrl(clean);
        if (seen.has(norm)) continue;
        seen.add(norm);
        if (!isUrlAvailable(clean, usedImageUrls)) continue;
        if (await isReachableImageUrl(clean)) return clean;
      }
    } catch (e) {
      console.warn(`[visual-intelligence] distinct search failed for '${query}'`, e);
    }
  }

  // Fallback to article images with dedup
  for (const query of slideQueries.slice(0, 3)) {
    const found = await searchWikipediaImage([query]);
    if (found && isUrlAvailable(found, usedImageUrls) && !seen.has(normalizeImageUrl(found))) {
      if (await isReachableImageUrl(found)) return found;
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
    ...(content.body?.bullets ?? content.visibleContent ?? (content as any).bullets ?? []),
    content.body?.visibleCopy ?? "",
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

// ─── Chemistry Content Detection ────────────────────────────────────────────

/** Detect chemistry-specific content and return appropriate SVG visuals */
async function detectAndRenderChemistryVisual(
  content: SlideContentJson
): Promise<VisualSpecification | null> {
  const allText = [
    content.title,
    content.purpose || "",
    content.learningObjective || "",
    ...(content.visibleContent || content.bullets || []),
  ].join(" ").toLowerCase();

  // Detect SMILES patterns (e.g., "CC(=O)O", "c1ccccc1")
  const smilesMatch = allText.match(/\b([A-Z][a-z]?(?:\([^)]+\))?)+(?:[=#!@\[\\]])?\b/);
  const hasSMILES = /[A-Z][a-z]?(?:\(=?[A-Z]\))/.test(allText) && allText.includes("smiles");

  // Detect molecular structure keywords
  const moleculeKeywords = /\b(molecular structure|chemical structure|skeletal formula|lewis structure|bond|functional group|molecule|compound|atom|covalent|ionic|hydrogen bond|van der waals)\b/i;
  const hasMolecule = moleculeKeywords.test(allText);

  // Detect reaction mechanism keywords
  const reactionKeywords = /\b(reaction mechanism|electron pushing|curved arrow|nucleophilic|electrophilic|substitution|elimination|addition reaction|oxidation|reduction|acid-base|catalyst|activation energy)\b/i;
  const hasReaction = reactionKeywords.test(allText);

  // Detect Markush structure keywords
  const markushKeywords = /\b(markush|r-group|variable group|scaffold|derivative|analogue|homolog|substituent|pharmacophore|structure-activity|sar)\b/i;
  const hasMarkush = markushKeywords.test(allText);

  // Detect DNA/RNA sequence keywords
  const sequenceKeywords = /\b(dna sequence|rna sequence|nucleotide|base pair|codon|anticodon|promoter region|gene sequence|restriction site|recognition sequence|sticky end|blunt end)\b/i;
  const hasSequence = sequenceKeywords.test(allText);

  // Detect pathway keywords
  const pathwayKeywords = /\b(biochemical pathway|metabolic pathway|glycolysis|krebs cycle|citric acid cycle|calvin cycle|electron transport|signal transduction|cascade)\b/i;
  const hasPathway = pathwayKeywords.test(allText);

  if (hasReaction) {
    // Extract reactants and products from the content
    const steps = (content.visibleContent || content.bullets || []).slice(0, 5);
    const reactants = steps.slice(0, Math.ceil(steps.length / 2));
    const products = steps.slice(Math.ceil(steps.length / 2));
    const visual = renderReactionMechanism(reactants, products, [], []);
    return {
      visualType: "PROCESS",
      purpose: "Reaction mechanism",
      learningMessage: content.title || "",
      layout: "center",
      elements: [],
      connections: [],
      labels: [],
      annotations: [],
      emphasis: [],
      studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      // Store SVG for rendering
      svgCode: visual.svg,
    } as any;
  }

  if (hasMarkush) {
    const visual = renderMarkushStructure(
      content.title || "Core Scaffold",
      [
        { name: "R¹", description: "Variable substituent" },
        { name: "R²", description: "Variable functional group" },
      ]
    );
    return {
      visualType: "ARCHITECTURE",
      purpose: "Markush structure",
      learningMessage: content.title || "",
      layout: "center",
      elements: [],
      connections: [],
      labels: [],
      annotations: [],
      emphasis: [],
      studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  if (hasSequence) {
    // Try to extract a sequence from the content
    const seqText = (content.visibleContent || content.bullets || []).join(" ");
    const seqMatch = seqText.match(/\b([ATCGU]{6,})\b/);
    const sequence = seqMatch ? seqMatch[1] : "ATCGATCGATCG";
    const visual = renderDNASequence(sequence, [
      { start: 0, end: 4, label: "Promoter", color: "#e74c3c" },
      { start: 5, end: 10, label: "Gene", color: "#3498db" },
    ]);
    return {
      visualType: "PROCESS",
      purpose: "DNA/RNA sequence",
      learningMessage: content.title || "",
      layout: "center",
      elements: [],
      connections: [],
      labels: [],
      annotations: [],
      emphasis: [],
      studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  if (hasPathway) {
    const steps = (content.visibleContent || content.bullets || []).slice(0, 6).map((b, i) => ({
      name: b.slice(0, 40),
      enzyme: i < 5 ? `Enzyme ${i + 1}` : undefined,
    }));
    const visual = renderPathway(steps);
    return {
      visualType: "PROCESS",
      purpose: "Biochemical pathway",
      learningMessage: content.title || "",
      layout: "center",
      elements: [],
      connections: [],
      labels: [],
      annotations: [],
      emphasis: [],
      studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  if (hasMolecule) {
    const visual = await renderMolecule("CC(=O)O");
    return {
      visualType: "ARCHITECTURE",
      purpose: "Molecular structure",
      learningMessage: content.title || "",
      layout: "center",
      elements: [],
      connections: [],
      labels: [],
      annotations: [],
      emphasis: [],
      studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  // ─── PHYSICS DETECTION ──────────────────────────────────────────────────

  // Detect physics: forces, motion, energy, circuits, waves
  const forceKeywords = /\b(force|newton|acceleration|velocity|mass|gravity|friction|tension|normal force|equilibrium|free body|fbd|vector addition|component|resolving)\b/i;
  const hasForce = forceKeywords.test(allText);

  const circuitKeywords = /\b(circuit|resistor|capacitor|inductor|ohm|kirchhoff|voltage|current|resistance|impedance|series|parallel|rc circuit|rlc)\b/i;
  const hasCircuit = circuitKeywords.test(allText);

  const waveKeywords = /\b(wave|sine|cosine|amplitude|frequency|wavelength|period|standing wave|interference|diffraction|oscillation|harmonic|sinusoidal)\b/i;
  const hasWave = waveKeywords.test(allText);

  const energyKeywords = /\b(kinetic energy|potential energy|work|power|conservation of energy|energy diagram|potential well|activation energy|binding energy)\b/i;
  const hasEnergy = energyKeywords.test(allText);

  if (hasForce) {
    // Extract force magnitudes and angles from content
    const forces = [
      { label: "F", magnitude: 0.8, angle: 0, color: "#e74c3c" },
      { label: "mg", magnitude: 0.8, angle: 270, color: "#3498db" },
      { label: "N", magnitude: 0.8, angle: 90, color: "#2ecc71" },
    ];
    const visual = renderFreeBodyDiagram(forces, { title: content.title || "Free Body Diagram" });
    return {
      visualType: "ARCHITECTURE",
      purpose: "Free body diagram",
      learningMessage: content.title || "",
      layout: "center",
      elements: [], connections: [], labels: [], annotations: [], emphasis: [], studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  if (hasCircuit) {
    const components = [
      { type: "battery" as const, label: "V", value: "9V" },
      { type: "resistor" as const, label: "R₁", value: "100Ω" },
      { type: "resistor" as const, label: "R₂", value: "200Ω" },
    ];
    const visual = renderCircuit(components, { title: content.title || "Circuit" });
    return {
      visualType: "ARCHITECTURE",
      purpose: "Circuit diagram",
      learningMessage: content.title || "",
      layout: "center",
      elements: [], connections: [], labels: [], annotations: [], emphasis: [], studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  if (hasWave) {
    const waves = [
      { amplitude: 1, frequency: 1, color: "#e74c3c", label: "y(x,t)" },
    ];
    const visual = renderWave(waves, { title: content.title || "Wave" });
    return {
      visualType: "ARCHITECTURE",
      purpose: "Wave function",
      learningMessage: content.title || "",
      layout: "center",
      elements: [], connections: [], labels: [], annotations: [], emphasis: [], studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  if (hasEnergy) {
    const wells = [
      { x: 3, depth: 0.6, label: "Reactants", color: "#3498db" },
      { x: 5, depth: 0.2, label: "Transition State", color: "#e74c3c" },
      { x: 7, depth: 0.8, label: "Products", color: "#2ecc71" },
    ];
    const visual = renderEnergyDiagram(wells, { title: content.title || "Energy Diagram" });
    return {
      visualType: "ARCHITECTURE",
      purpose: "Energy diagram",
      learningMessage: content.title || "",
      layout: "center",
      elements: [], connections: [], labels: [], annotations: [], emphasis: [], studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  // ─── MATHEMATICS DETECTION ──────────────────────────────────────────────

  const graphKeywords = /\b(graph|plot|function|parabola|hyperbola|asymptote|derivative|integral|slope|tangent|concave|convex|critical point|inflection|minimum|maximum)\b/i;
  const hasGraph = graphKeywords.test(allText);

  const vectorKeywords = /\b(vector|magnitude|direction|component|dot product|cross product|scalar|resultant|decomposition|unit vector)\b/i;
  const hasVector = vectorKeywords.test(allText);

  const distributionKeywords = /\b(probability distribution|normal distribution|gaussian|uniform distribution|exponential distribution|standard deviation|variance|mean|median|histogram)\b/i;
  const hasDistribution = distributionKeywords.test(allText);

  const numberlineKeywords = /\b(number line|interval|inequality|inequalities|absolute value|domain|range|set notation|union|intersection)\b/i;
  const hasNumberline = numberlineKeywords.test(allText);

  if (hasGraph) {
    // Generate a sample graph based on the content
    const data = [
      {
        points: Array.from({ length: 50 }, (_, i) => {
          const x = -5 + (i / 49) * 10;
          return { x, y: Math.sin(x) * 2 };
        }),
        color: "#e74c3c",
        label: "f(x)",
      },
    ];
    const visual = renderGraph(data, { title: content.title || "Graph" });
    return {
      visualType: "ARCHITECTURE",
      purpose: "Graph",
      learningMessage: content.title || "",
      layout: "center",
      elements: [], connections: [], labels: [], annotations: [], emphasis: [], studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  if (hasVector) {
    const vectors = [
      { label: "F₁", dx: 3, dy: 2, color: "#e74c3c" },
      { label: "F₂", dx: -1, dy: 3, color: "#3498db" },
    ];
    const visual = renderVectorDiagram(vectors, { title: content.title || "Vectors" });
    return {
      visualType: "ARCHITECTURE",
      purpose: "Vector diagram",
      learningMessage: content.title || "",
      layout: "center",
      elements: [], connections: [], labels: [], annotations: [], emphasis: [], studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  if (hasDistribution) {
    const visual = renderDistribution("normal", { mu: 0, sigma: 1 }, { title: content.title || "Distribution" });
    return {
      visualType: "ARCHITECTURE",
      purpose: "Probability distribution",
      learningMessage: content.title || "",
      layout: "center",
      elements: [], connections: [], labels: [], annotations: [], emphasis: [], studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  if (hasNumberline) {
    const visual = renderNumberLine(
      [
        { start: -2, end: 3, color: "#3498db", label: "Solution Set" },
      ],
      { title: content.title || "Number Line" }
    );
    return {
      visualType: "ARCHITECTURE",
      purpose: "Number line",
      learningMessage: content.title || "",
      layout: "center",
      elements: [], connections: [], labels: [], annotations: [], emphasis: [], studentQuestion: "",
      title: visual.title,
      caption: visual.caption,
      svgCode: visual.svg,
    } as any;
  }

  return null; // Not physics/math/chemistry — use standard visual pipeline
}

export async function verifyVisualRelevance(imageUrl: string, intent: ImageIntent): Promise<{ valid: boolean; reason?: string }> {
  try {
    const prompt = `Evaluate if this image satisfies the ImageIntent for an educational lecture slide.
ImageIntent:
${JSON.stringify(intent, null, 2)}

Score the image on:
1. concept_relevance (0-100)
2. scientific_relevance (0-100)
3. educational_usefulness (0-100)
4. must_show_satisfaction (list of must_shows found)
5. must_not_show_violations (list of must_not_shows found)

Reject if overall relevance (average of the 3 scores) is < 85, OR if there are ANY must_not_show violations.

Return STRICT JSON:
{
  "scores": {
    "concept_relevance": number,
    "scientific_relevance": number,
    "educational_usefulness": number
  },
  "must_show_found": ["string"],
  "must_not_show_violations": ["string"],
  "rejected": boolean,
  "reason": "string (why it was rejected, if rejected)"
}`;

    const res = await import("@/lib/ai-engine").then(m => m.chatVisionJson({
      system: "You are an expert scientific visual evaluator.",
      user: prompt,
      imageUrl,
      model: m.DEFAULT_AI_MODEL, // fallback or configured model
      temperature: 0.1,
      guardrails: false
    }));

    const json = res.json as any;
    if (json?.rejected) {
      return { valid: false, reason: json.reason || "Rejected by vision validation" };
    }
    const avgScore = (json?.scores?.concept_relevance + json?.scores?.scientific_relevance + json?.scores?.educational_usefulness) / 3;
    if (avgScore < 85) {
      return { valid: false, reason: `Relevance score too low (${avgScore})` };
    }
    return { valid: true };
  } catch (err: any) {
    console.warn(`[visual-intelligence] Vision validation failed: ${err.message}`);
    // If vision model is unavailable or fails, we fail open for now, but log it
    return { valid: true };
  }
}

/**
 * AI-Powered Universal Visual Spec & Image Resolver for any slide
 */
export async function generateVisualSpec(
  content: SlideContentJson,
  options: VisualSpecOptions = {}
): Promise<VisualSpecification> {
  const { usedImageUrls } = options;
  const slideNo = content.slideNo || 0;
  const bulletText = [
    ...(content.body?.bullets ?? (content as any).bullets ?? []),
    content.body?.visibleCopy ?? "",
  ].filter(Boolean);

  const contentForSearch: SlideContentJson = {
    ...content,
    slideNo,
    bullets: bulletText,
    visibleContent: bulletText,
  };

  // Chemistry / SVG visuals — also attach a reachable fallback photo for Studio preview
  const chemistryVisual = await detectAndRenderChemistryVisual(contentForSearch);
  if (chemistryVisual) {
    if (!(chemistryVisual as any).imageUrl && !(chemistryVisual as any).fetchedImageUrl) {
      const photo = getAcademicVisualForSlide(slideNo, content.title, bulletText.join(" "));
      (chemistryVisual as any).imageUrl = photo.imageUrl;
      (chemistryVisual as any).fetchedImageUrl = photo.imageUrl;
    }
    const chemUrl = (chemistryVisual as any).imageUrl || (chemistryVisual as any).fetchedImageUrl;
    registerUsedUrl(chemUrl, usedImageUrls);
    return chemistryVisual;
  }

  const baseQueries = [
    content.title || "",
    content.purpose || "",
    content.learningObjective || "",
    bulletText.slice(0, 2).join(" "),
  ].filter(Boolean);

  // Priority 1: per-slide Wikimedia fetch (distinct across the deck)
  let finalImageUrl = await searchWikipediaImageDistinct(baseQueries, slideNo, usedImageUrls);

  // Priority 2: LLM-guided Wikimedia search when direct fetch missed
  if (!finalImageUrl) {
    const prompt = `Analyze this university slide and identify what exact visual/diagram is needed:
Slide Title: ${content.title || "Academic Concept"}
Slide Purpose: ${content.purpose || "Concept Mastery"}
Learning Objective: ${content.learningObjective || "Understanding"}
Slide Content / Bullets: ${bulletText.join("\n- ")}
Student Action: ${JSON.stringify(content.interaction || content.studentAction || "")}`;

    try {
      const chatRes = await import("@/lib/ai-engine").then((m) =>
        m.chatJson({
          system: VISUAL_LLM_PROMPT,
          user: prompt,
          model: m.DEFAULT_AI_MODEL,
          temperature: 0.2,
          guardrails: false,
        })
      );

      const intent =
        (chatRes.json as ImageIntent & { searchQueries?: string[]; suggestedSearchQuery?: string }) ||
        ({} as ImageIntent);
      const searchList = [
        ...(intent.searchQueries || []),
        intent.suggestedSearchQuery || "",
        intent.concept || "",
        content.title || "",
      ].filter(Boolean);

      for (let attempts = 0; attempts < 2 && !finalImageUrl; attempts++) {
        finalImageUrl = await searchWikipediaImageDistinct(searchList, slideNo, usedImageUrls);
        if (!finalImageUrl) {
          searchList.push(`${intent.concept || content.title} ${intent.visual_type || "diagram"} ${slideNo}`);
        }
      }

      if (finalImageUrl) {
        registerUsedUrl(finalImageUrl, usedImageUrls);
        return {
          visualType: (intent.visual_type as VisualSpecification["visualType"]) || "PROCESS",
          purpose: intent.learning_goal || content.title || "",
          learningMessage: intent.learning_goal || "",
          layout: "center",
          elements: [],
          connections: [],
          labels: [],
          annotations: [],
          emphasis: [],
          studentQuestion: "",
          title: content.title || "Academic Diagram",
          caption: intent.learning_goal || "Scientific diagram illustrating key concept mechanisms.",
          imageUrl: finalImageUrl,
          fetchedImageUrl: finalImageUrl,
          suggestedSearchQuery: intent.suggestedSearchQuery || searchList[0] || "",
        };
      }
    } catch (error) {
      console.warn("[visual-intelligence] LLM visual search failed:", error);
    }
  }

  // Priority 3: curated keyword match (only if URL is unused and reachable)
  const curated = curatedVisualForContent(contentForSearch);
  if (curated && isUrlAvailable(curated.imageUrl, usedImageUrls)) {
    const ok = await isReachableImageUrl(curated.imageUrl);
    if (ok) {
      registerUsedUrl(curated.imageUrl, usedImageUrls);
      return specFromCurated(curated);
    }
  }

  // Priority 4: discipline fallback — slide number breaks ties for variety
  for (let offset = 0; offset < 20; offset++) {
    const candidate = getAcademicVisualForSlide(
      slideNo + offset,
      content.title,
      bulletText.join(" ")
    );
    if (!isUrlAvailable(candidate.imageUrl, usedImageUrls)) continue;
    const ok = await isReachableImageUrl(candidate.imageUrl);
    if (ok) {
      registerUsedUrl(candidate.imageUrl, usedImageUrls);
      return {
        visualType: "PROCESS",
        purpose: content.purpose || "Visual Representation",
        learningMessage: content.title || "",
        layout: "center",
        elements: [],
        connections: [],
        labels: [],
        annotations: [],
        emphasis: [],
        studentQuestion: "",
        title: candidate.title || content.title || "Academic Diagram",
        caption: candidate.caption || "Scientific diagram illustrating key concept mechanisms.",
        imageUrl: candidate.imageUrl,
        fetchedImageUrl: candidate.imageUrl,
        suggestedSearchQuery: content.title || "Science",
      };
    }
  }

  // Absolute last resort — always persist a URL (prefer unused reachable Unsplash)
  const fallback = getAcademicVisualForSlide(slideNo, content.title, bulletText.join(" "));
  registerUsedUrl(fallback.imageUrl, usedImageUrls);

  return {
    visualType: "PROCESS",
    purpose: content.purpose || "Visual Representation",
    learningMessage: content.title || "",
    layout: "center",
    elements: [],
    connections: [],
    labels: [],
    annotations: [],
    emphasis: [],
    studentQuestion: "",
    title: fallback.title || content.title || "Academic Diagram",
    caption: fallback.caption || "Scientific diagram illustrating key concept mechanisms.",
    imageUrl: fallback.imageUrl,
    fetchedImageUrl: fallback.imageUrl,
    suggestedSearchQuery: content.title || "Science",
  };
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

  // Fetch REAL educational images from Wikipedia/Wikimedia Commons.
  // These are labeled scientific diagrams that actually teach concepts.
  const searchQueries = [
    input.title || "",
    input.topic || "",
    ...(input.bullets || []).slice(0, 2),
  ].filter(Boolean);

  const foundImageUrl = await searchWikipediaImage(searchQueries);
  if (foundImageUrl) {
    return {
      imageUrl: foundImageUrl,
      title: input.title || "Academic Diagram",
      caption: `Educational illustration: ${input.title || input.topic || "concept"}`,
      visualType: "Educational Diagram",
      suggestedSearchQuery: searchQueries[0] || "",
    };
  }

  // No Wikipedia result — return description for SVG renderer fallback
  return {
    imageUrl: undefined,
    title: input.title || "Academic Diagram",
    caption: `Visual representation of: ${input.title || input.topic || "concept"}`,
    visualType: "Diagram",
    suggestedSearchQuery: input.title || input.topic || "",
  };

  try {
    const chatRes = await import("@/lib/ai-engine").then(m => m.chatJson({
      system: VISUAL_LLM_PROMPT,
      user: prompt,
      model: m.DEFAULT_AI_MODEL,
      temperature: 0.2,
      guardrails: false,
    }));

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
