/**
 * SVC-05A — Pedagogical Transformation Engine
 * ===========================================================================
 * This is the MISSING LAYER between source blocks and slide generation.
 *
 * BEFORE:
 *   Source Blocks → LLM rewrites text → Slides
 *   Problem: Source copying, Figure 8.1 references, "as shown above", truncated text
 *
 * AFTER:
 *   Source Blocks → Extract → Classify → Understand → ConceptCards → Slides
 *   Each ConceptCard has:
 *     - Simple definition (what is it?)
 *     - Why it matters (why should I care?)
 *     - Mechanism steps (how does it work?)
 *     - Analogy (what is it like?)
 *     - Worked example (where does this happen?)
 *     - Misconception (what do students get wrong?)
 *     - Student action (predict / calculate / identify)
 *     - Visual intent (what should the student see?)
 *
 * The LLM must NEVER directly write a slide from raw source text.
 * It must first build a ConceptCard, then generate the slide from that.
 */

import { chatJson, DEFAULT_AI_MODEL } from "@/lib/ai-engine";
import { db } from "@/lib/db";
import type { AnalysedBlock } from "./source-analyst";
import type { ConceptCluster } from "./source-analyst";
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConceptCard {
  id: string;
  concept: string;
  student_level: "beginner" | "intermediate" | "advanced";
  simple_definition: string;
  why_it_matters: string;
  intuition: string;
  explanation_steps: string[];
  analogy?: string;
  example?: string;
  misconception?: string;
  application?: string;
  student_question: {
    type: "predict" | "poll" | "calculate" | "identify" | "compare" | "none";
    prompt: string;
  };
  visual_intent: {
    type: string;
    learningPurpose: string;
    studentShouldNotice: string;
  };

  // Quality scores
  quality: {
    explainabilityScore: number; // 0-5: copied → applied
    copyRisk: number;            // 0-1: how likely this copies source text
    truncationFree: boolean;
  };

  // Links
  cloIds: string[];
  prerequisiteConcepts: string[];
}

// ─── Source Text Sanitization ────────────────────────────────────────────────

/**
 * Patterns that indicate source text was copied verbatim.
 * These MUST NOT appear in student-facing content.
 */
const SOURCE_COPY_PATTERNS = [
  /figure\s+\d+[\.\-]\d*/i,                    // "Figure 8.1"
  /table\s+\d+[\.\-]\d*/i,                     // "Table 3.2"
  /as\s+shown\s+(in\s+)?(the\s+)?(figure|table|diagram|image)/i,
  /as\s+described\s+(in\s+)?(the\s+)?(previous|following|next)/i,
  /the\s+following\s+(figure|table|diagram|image|section)/i,
  /see\s+(figure|table|diagram|image)\s+\d/i,
  /ref(erence|erring)?\s+to\s+(figure|table|diagram)/i,
  /on\s+page\s+\d+/i,
  /in\s+section\s+\d/i,
  /in\s+chapter\s+\d/i,
  /continued\s*$/i,
  /as\s+mentioned\s+(above|previously|earlier)/i,
  /as\s+discussed\s+(above|previously|earlier)/i,
];

/**
 * Patterns that indicate truncation / incomplete content.
 * Content ending with these MUST NOT reach students.
 */
const TRUNCATION_PATTERNS = [
  /\.\.\.\s*$/,       // ends with ...
  /…\s*$/,            // ends with …
  /,\s*$/,            // ends with dangling comma
  /\band\s*$/,        // ends with "and"
  /\bor\s*$/,         // ends with "or"
  /because\s*$/,      // ends with "because"
  /which\s*$/,        // ends with "which"
  /that\s*$/,         // ends with "that"
  /the\s+following\s*$/i,
  /:\s*$/,            // ends with colon (likely truncated list)
  /—\s*$/,            // ends with em dash
  /-\s*$/,            // ends with dash (but not at end of a sentence with proper punctuation)
];

/**
 * Textbook language that must be transformed into student-facing explanations.
 */
const TEXTBOOK_LANGUAGE_MAP: Array<[RegExp, string]> = [
  [/it\s+should\s+be\s+noted\s+that/i, ""],
  [/it\s+is\s+important\s+to\s+note\s+that/i, ""],
  [/it\s+is\s+well[\s-]known\s+that/i, ""],
  [/as\s+we\s+have\s+discussed/i, ""],
  [/in\s+this\s+section\s+we\s+will/i, ""],
  [/the\s+reader\s+should/i, ""],
  [/as\s+mentioned\s+in\s+section\s+\d+/i, ""],
  [/see\s+also/i, ""],
  [/cf\.\s*/i, ""],
  [/ibid\.\s*/i, ""],
];

// ─── Extraction & Classification ────────────────────────────────────────────

/**
 * Stage 1-3: Extract knowledge from source blocks, classify it,
 * and determine what the student must understand.
 *
 * This is a TWO-PASS process:
 *   Pass 1: Classify source blocks (what type of knowledge?)
 *   Pass 2: Build ConceptCards (how to teach it?)
 */
export async function buildConceptCards(
  projectId: string,
  clusters: ConceptCluster[],
  analysedBlocks: AnalysedBlock[],
  clos: CourseLearningOutcome[],
  courseTitle: string
): Promise<ConceptCard[]> {
  // OPTIMIZATION: Send ALL clusters in ONE LLM call instead of one per cluster.
  // This reduces N LLM calls to 1-2 calls total.
  if (clusters.length === 0) return [];

  const clusterCards: ConceptCard[] = [];

  // Batch: group clusters into chunks of 5 for manageable context
  const BATCH_SIZE = 5;
  for (let i = 0; i < clusters.length; i += BATCH_SIZE) {
    const batch = clusters.slice(i, i + BATCH_SIZE);
    const batchCards = await buildCardsForBatch(batch, analysedBlocks, clos, courseTitle);
    clusterCards.push(...batchCards);
  }

  // Step 3: Store cards in generationStateJson
  try {
    await db.lectureProject.update({
      where: { id: projectId },
      data: {
        generationStateJson: {
          conceptCards: clusterCards,
        },
      },
    });
  } catch {
    // best-effort
  }

  return clusterCards;
}

/**
 * Build ConceptCards for a batch of clusters in ONE LLM call.
 * This is the key optimization: instead of N calls, we batch clusters.
 */
async function buildCardsForBatch(
  clusters: ConceptCluster[],
  analysedBlocks: AnalysedBlock[],
  clos: CourseLearningOutcome[],
  courseTitle: string
): Promise<ConceptCard[]> {
  try {
    // Build combined source blocks for the batch
    const allBlockIds = clusters.flatMap((c) => c.blockIds);
    const allBlocks = allBlockIds
      .map((bid) => analysedBlocks.find((b) => b.id === bid))
      .filter(Boolean) as AnalysedBlock[];

    const clusterSummaries = clusters.map((c) => ({
      id: c.id,
      label: c.label,
      importance: c.importance,
      cloIds: c.cloIds,
      blockIds: c.blockIds,
    }));

    const cloText = clos.map((c) => `  ${c.number}: ${c.text}`).join("\n");
    const blockTexts = allBlocks.map((b) => `[Block: ${b.id}] (${b.locator})\n${b.text.trim().substring(0, 800)}`);

    const batchSystem = `You are the Pedagogical Transformation Engine. Build ConceptCards for ${clusters.length} concept clusters at once.

For EACH cluster, provide a ConceptCard with these 7 teaching elements:
1. simpleDefinition (what is it?)
2. whyItMatters (why should I care?)
3. mechanismSteps (how does it work?)
4. analogy (what is it like?)
5. workedExample (where does this happen?)
6. commonMisconception (what do students get wrong?)
7. studentAction (what should the student do?)

RULES:
- NEVER include figure numbers, table numbers, or page references.
- NEVER copy source text directly. Transform into student language.
- NEVER end content with "..." or incomplete sentences.
- The definition must be explainable by a first-year student.
- Every factual claim must come from the source blocks.

Return STRICT JSON: { "cards": [ { ...card1 }, { ...card2 }, ... ] }`;

    const batchUser = `Course: ${courseTitle}

CLOs:
${cloText}

Concept Clusters:
${JSON.stringify(clusterSummaries, null, 2)}

Source Blocks:
${blockTexts.join("\n\n")}

Build ConceptCards for ALL clusters above. Return STRICT JSON with a "cards" array.`;

    const result = await chatJson({
      system: batchSystem,
      user: batchUser,
      temperature: 0.2,
      model: DEFAULT_AI_MODEL,
    });

    const json = (result.json ?? {}) as Record<string, unknown>;
    const cardsArray = Array.isArray(json.cards) ? json.cards : Array.isArray(json) ? json : [];

    return (cardsArray as Record<string, unknown>[]).map((cardJson, i) => {
      const cluster = clusters[i];
      if (!cluster) return null;
      const clusterBlocks = (cluster.blockIds || [])
        .map((bid: string) => analysedBlocks.find((b) => b.id === bid))
        .filter(Boolean) as AnalysedBlock[];
      const card = normalizeCard(cardJson, cluster, clusterBlocks);
      card.quality = assessQuality(card);
      return card;
    }).filter(Boolean) as ConceptCard[];
  } catch (err) {
    console.warn(`[ConceptCard] Batch generation failed, falling back to per-cluster:`, err);
    // Fallback: generate individually
    const fallbackCards: ConceptCard[] = [];
    for (const cluster of clusters) {
      const clusterBlocks = (cluster.blockIds || [])
        .map((bid: string) => analysedBlocks.find((b) => b.id === bid))
        .filter(Boolean) as AnalysedBlock[];
      const card = await buildCardForCluster(cluster, clusterBlocks, clos, courseTitle);
      if (card) fallbackCards.push(card);
    }
    return fallbackCards;
  }
}

// ─── Per-Cluster Card Builder ───────────────────────────────────────────────

const CARD_SYSTEM = `You are the Pedagogical Transformation Engine. You convert source knowledge into a ConceptCard that a teacher can use to explain a concept to a student.

YOUR JOB IS NOT TO WRITE A SLIDE.
Your job is to UNDERSTAND the concept and PREPARE everything needed to teach it.

RULES:
1. NEVER include figure numbers, table numbers, or page references from the source.
2. NEVER copy source text directly. Transform it into student language.
3. NEVER end content with "...", "—", or incomplete sentences.
4. The simpleDefinition must be explainable by a first-year student after reading it.
5. The analogy must map EVERY part of the analogy to the concept.
6. The mechanismSteps must be a sequence where each step builds on the previous.
7. The commonMisconception must name a SPECIFIC wrong belief, not a generic one.
8. The studentAction must test MECHANISM understanding, not recall.
9. The visualIntent.studentShouldNotice must answer: "What ONE thing should the student see in this visual?"
10. Every factual claim must come from the source blocks provided.

SOURCE TEXT SANITIZATION:
Before generating any student content, mentally strip:
- "Figure 8.1:" → remove, extract the meaning
- "Table 3.2:" → remove, extract the data
- "As shown in the figure above" → remove
- "On page 124" → remove
- "In Section 5.3" → remove
- Textbook hedging language → remove

STUDENT UNDERSTANDING PIPELINE:
For each concept, answer these questions IN ORDER:
1. What is it? (simpleDefinition)
2. Why should I care? (whyItMatters)
3. How does it work? (mechanismSteps)
4. What is it like? (analogy)
5. Where does this happen? (workedExample)
6. What do students usually misunderstand? (commonMisconception)
7. What should the student do? (studentAction)
8. What should the student see? (visualIntent)`;

function buildUserPrompt(
  cluster: ConceptCluster,
  blocks: AnalysedBlock[],
  clos: CourseLearningOutcome[],
  courseTitle: string
): string {
  const blockTexts = blocks.map((b) => {
    // Pre-sanitize: flag problematic patterns
    const issues: string[] = [];
    if (/figure\s+\d/i.test(b.text)) issues.push("CONTAINS FIGURE REFERENCE");
    if (/table\s+\d/i.test(b.text)) issues.push("CONTAINS TABLE REFERENCE");
    if (/\.\.\.\s*$/.test(b.text)) issues.push("TRUNCATED ENDING");
    if (/as\s+shown/i.test(b.text)) issues.push("TEXTBOOK LANGUAGE");

    return `[Block: ${b.id}] ${b.locator ? `(${b.locator})` : ""}
${issues.length > 0 ? `⚠️ ${issues.join(", ")} — TRANSFORM THIS\n` : ""}${b.text.trim().substring(0, 1200)}`;
  });

  const cloText = clos.map((c) => `  ${c.number}: ${c.text}`).join("\n");

  return `Course: ${courseTitle}

Concept Cluster: "${cluster.label}"
Importance: ${cluster.importance}
Concept IDs: ${cluster.id}
CLO IDs: ${(cluster.cloIds ?? []).join(", ") || "none"}

CLOs:
${cloText}

Source Blocks (with warnings for problematic content):
${blockTexts.join("\n\n")}

BUILD THE CONCEPT CARD for "${cluster.label}".
Return STRICT JSON matching the schema.`;
}

const CARD_SCHEMA = `{
  "concept": "string — 2-5 word concept name",
  "importance": "critical|major|supporting",
  "studentLevel": "beginner|intermediate|advanced",
  "simpleDefinition": "string — 1-2 sentences. A first-year student must understand this after reading it. No jargon without explanation.",
  "whyItMatters": "string — 1-2 sentences. Connect to real consequences or the bigger picture.",
  "mechanismSteps": ["string — 3-5 steps. Each step builds on the previous. Use student language, not source language."],
  "analogy": "string|null — A vivid analogy where EVERY PART maps to the concept. Not generic (not 'like a car engine').",
  "workedExample": "string|null — One concrete example showing where this happens in practice.",
  "commonMisconception": "string|null — A SPECIFIC wrong belief students have. Not generic (not 'students often misunderstand'). Name the exact misconception.",
  "studentAction": {
    "type": "predict|poll|calculate|identify|compare|none",
    "prompt": "string — A scenario-based question that tests MECHANISM understanding, not recall."
  },
  "visualIntent": {
    "type": "diagram|flow|comparison|step_diagram|concept_map|graph|none",
    "learningPurpose": "string — What this visual teaches (not 'illustration of concept')",
    "studentShouldNotice": "string — The ONE thing the student should see in this visual"
  },
  "cloIds": ["string — which CLOs this concept addresses"],
  "prerequisiteConcepts": ["string — concepts that must be taught first"]
}`;

async function buildCardForCluster(
  cluster: ConceptCluster,
  blocks: AnalysedBlock[],
  clos: CourseLearningOutcome[],
  courseTitle: string
): Promise<ConceptCard | null> {
  try {
    const result = await chatJson({
      system: CARD_SYSTEM + "\n\nReturn STRICT JSON matching this schema:\n" + CARD_SCHEMA,
      user: buildUserPrompt(cluster, blocks, clos, courseTitle),
      temperature: 0.2,
      model: DEFAULT_AI_MODEL,
    });

    const json = (result.json ?? {}) as Record<string, unknown>;
    const card = normalizeCard(json, cluster, blocks);

    // Run quality checks
    card.quality = assessQuality(card);

    return card;
  } catch (err) {
    console.warn(`[ConceptCard] Failed to build card for "${cluster.label}":`, err);
    return buildFallbackCard(cluster, blocks);
  }
}

// ─── Normalization ──────────────────────────────────────────────────────────

function normalizeCard(
  json: Record<string, unknown>,
  cluster: ConceptCluster,
  blocks: AnalysedBlock[]
): ConceptCard {
  return {
    id: `card-${cluster.id}`,
    concept: typeof json.concept === "string" ? json.concept : cluster.label,
    importance: (typeof json.importance === "string" ? json.importance : cluster.importance) as ConceptCard["importance"],
    sourceBlockIds: cluster.blockIds,
    studentLevel: (typeof json.studentLevel === "string" ? json.studentLevel : "intermediate") as ConceptCard["studentLevel"],
    simpleDefinition: typeof json.simpleDefinition === "string" ? json.simpleDefinition : "",
    whyItMatters: typeof json.whyItMatters === "string" ? json.whyItMatters : "",
    mechanismSteps: Array.isArray(json.mechanismSteps) ? json.mechanismSteps.map(String) : [],
    analogy: typeof json.analogy === "string" ? json.analogy : undefined,
    workedExample: typeof json.workedExample === "string" ? json.workedExample : undefined,
    commonMisconception: typeof json.commonMisconception === "string" ? json.commonMisconception : undefined,
    studentAction: {
      type: (typeof (json.studentAction as Record<string, unknown>)?.type === "string" ? (json.studentAction as Record<string, unknown>).type : "none") as ConceptCard["studentAction"]["type"],
      prompt: typeof (json.studentAction as Record<string, unknown>)?.prompt === "string" ? (json.studentAction as Record<string, unknown>).prompt as string : "",
    },
    visualIntent: {
      type: typeof (json.visualIntent as Record<string, unknown>)?.type === "string" ? (json.visualIntent as Record<string, unknown>).type as string : "diagram",
      learningPurpose: typeof (json.visualIntent as Record<string, unknown>)?.learningPurpose === "string" ? (json.visualIntent as Record<string, unknown>).learningPurpose as string : "",
      studentShouldNotice: typeof (json.visualIntent as Record<string, unknown>)?.studentShouldNotice === "string" ? (json.visualIntent as Record<string, unknown>).studentShouldNotice as string : "",
    },
    cloIds: Array.isArray(json.cloIds) ? json.cloIds.map(String) : cluster.cloIds,
    prerequisiteConcepts: Array.isArray(json.prerequisiteConcepts) ? json.prerequisiteConcepts.map(String) : [],
    quality: { explainabilityScore: 0, copyRisk: 0, truncationFree: true },
  };
}

// ─── Quality Assessment ─────────────────────────────────────────────────────

function assessQuality(card: ConceptCard): ConceptCard["quality"] {
  let explainabilityScore = 0;
  let copyRisk = 0;
  let truncationFree = true;

  // 1. Simple definition exists
  if (card.simpleDefinition && card.simpleDefinition.length > 20) explainabilityScore += 1;

  // 2. Why it matters exists
  if (card.whyItMatters && card.whyItMatters.length > 15) explainabilityScore += 1;

  // 3. Mechanism steps exist (3+)
  if (card.mechanismSteps.length >= 3) explainabilityScore += 1;

  // 4. Analogy exists and maps to concept
  if (card.analogy && card.analogy.length > 20) explainabilityScore += 1;

  // 5. Student action exists
  if (card.studentAction.prompt && card.studentAction.type !== "none") explainabilityScore += 1;

  // Copy risk detection
  const allText = [
    card.simpleDefinition,
    card.whyItMatters,
    ...card.mechanismSteps,
    card.analogy ?? "",
    card.workedExample ?? "",
  ].join(" ");

  for (const pattern of SOURCE_COPY_PATTERNS) {
    if (pattern.test(allText)) {
      copyRisk = Math.min(1, copyRisk + 0.3);
    }
  }

  // Truncation detection
  for (const pattern of TRUNCATION_PATTERNS) {
    if (pattern.test(allText)) {
      truncationFree = false;
    }
  }

  return { explainabilityScore, copyRisk, truncationFree };
}

// ─── Fallback Card ──────────────────────────────────────────────────────────

function buildFallbackCard(
  cluster: ConceptCluster,
  blocks: AnalysedBlock[]
): ConceptCard {
  const combinedText = blocks.map((b) => b.text).join("\n").substring(0, 1500);
  return {
    id: `card-${cluster.id}`,
    concept: cluster.label,
    importance: cluster.importance as ConceptCard["importance"],
    sourceBlockIds: cluster.blockIds,
    studentLevel: "intermediate",
    simpleDefinition: combinedText.slice(0, 200),
    whyItMatters: "",
    mechanismSteps: [],
    studentAction: { type: "none", prompt: "" },
    visualIntent: { type: "diagram", learningPurpose: "", studentShouldNotice: "" },
    cloIds: cluster.cloIds,
    prerequisiteConcepts: [],
    quality: { explainabilityScore: 0, copyRisk: 0.5, truncationFree: true },
  };
}

// ─── Source Quality Gates (static validators) ───────────────────────────────

/**
 * GATE: SOURCE COPYING
 * Returns violations found in the text.
 */
export function detectSourceCopy(text: string): string[] {
  const violations: string[] = [];
  for (const pattern of SOURCE_COPY_PATTERNS) {
    const match = text.match(pattern);
    if (match) violations.push(`SOURCE_COPY: "${match[0]}"`);
  }
  return violations;
}

/**
 * GATE: TRUNCATION
 * Returns true if content is truncated.
 */
export function detectTruncation(text: string): boolean {
  for (const pattern of TRUNCATION_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

/**
 * GATE: EXPLAINABILITY
 * Checks that a concept card has all required teaching elements.
 */
export function checkExplainability(card: ConceptCard): {
  passed: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!card.simpleDefinition || card.simpleDefinition.length < 15) {
    missing.push("simpleDefinition — concept not explained");
  }
  if (!card.whyItMatters || card.whyItMatters.length < 10) {
    missing.push("whyItMatters — relevance not established");
  }
  if (card.mechanismSteps.length < 2) {
    missing.push("mechanismSteps — process not explained step-by-step");
  }
  if (!card.studentAction.prompt || card.studentAction.type === "none") {
    missing.push("studentAction — no student interaction defined");
  }

  return { passed: missing.length === 0, missing };
}

/**
 * Sanitize text for student display — strips textbook language and references.
 */
export function sanitizeForStudentDisplay(text: string): string {
  let cleaned = text;

  // Remove figure/table references
  cleaned = cleaned.replace(/\bfigure\s+\d+[\.\-]\d*[:\s]*/gi, "");
  cleaned = cleaned.replace(/\btable\s+\d+[\.\-]\d*[:\s]*/gi, "");

  // Remove textbook hedging
  for (const [pattern, replacement] of TEXTBOOK_LANGUAGE_MAP) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Remove page/section references
  cleaned = cleaned.replace(/\bsee\s+figure\s+\d+/gi, "");
  cleaned = cleaned.replace(/\bas\s+shown\s+(in\s+)?(the\s+)?(figure|table|diagram)/gi, "");
  cleaned = cleaned.replace(/\bon\s+page\s+\d+/gi, "");
  cleaned = cleaned.replace(/\bin\s+section\s+\d+/gi, "");
  cleaned = cleaned.replace(/\bin\s+chapter\s+\d+/gi, "");

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  return cleaned;
}

// ─── Get cached cards ───────────────────────────────────────────────────────

export async function getConceptCards(projectId: string): Promise<ConceptCard[]> {
  const project = await db.lectureProject.findUnique({
    where: { id: projectId },
    select: { generationStateJson: true },
  });
  const cached = (project?.generationStateJson as { conceptCards?: ConceptCard[] } | null)
    ?.conceptCards;
  return Array.isArray(cached) ? cached : [];
}
