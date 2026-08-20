/**
 * Topic-Only Generation & Autonomous Web Research — Core Type Definitions
 * =======================================================================
 * Defines query parameters, article structures, synthesized pedagogical sections,
 * Bloom's taxonomy learning outcomes, and compiled master source documents.
 */

export type PedagogicalStage =
  | "DISCOVER"    // Stage 1: Foundations & Axioms
  | "UNDERSTAND"  // Stage 2: Mathematical / Formal Formulation
  | "EXPLORE"     // Stage 3: Mechanisms & Principles
  | "PRACTICE"    // Stage 4: Empirical Applications & Case Studies
  | "APPLY"       // Stage 5: Diagnostic Problem Solving & Worked Derivations
  | "CHALLENGE"   // Stage 6: Misconceptions, Boundary Conditions & Pitfalls
  | "MASTER";     // Stage 7: Advanced Frontiers & Course Learning Outcomes

export type BloomLevel =
  | "remember"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";

export type Criticality = "critical" | "important" | "supporting";

export interface TopicResearchQuery {
  topic?: string;
  discipline?: string;
  targetAudience?: string; // e.g. "Undergraduate Students", "Graduate Researchers"
  languagePolicy?: "en" | "ar" | "bilingual";
  depth?: "standard" | "comprehensive" | "advanced";
  topicDescription?: string;
}

export interface TopicResearchOptions extends TopicResearchQuery {
  apiKey?: string;
  baseUrl?: string;
  aiModel?: string;
  timeoutMs?: number;
  maxArticles?: number;
  preferOffline?: boolean;
}

export interface WikipediaSearchResult {
  title: string;
  pageId: number;
  snippet: string;
  wordCount: number;
  timestamp?: string;
}

export interface RawSection {
  heading: string;
  level: number;
  content: string;
}

export interface WikipediaArticleExtract {
  title: string;
  pageId: number;
  extract: string;
  url: string;
  isDisambiguation: boolean;
  sections: RawSection[];
  categories: string[];
}

export interface SourcedArticle {
  source: "wikipedia" | "arxiv" | "open_academic" | "curated_fallback";
  title: string;
  url: string;
  summary: string;
  fullExtract: string;
  sections: RawSection[];
  license?: string;
}

export interface CourseLearningOutcome {
  number: string; // e.g. "CLO-1"
  text: string;
  bloomLevel: BloomLevel;
}

export interface SynthesizedSection {
  sectionNumber: number;
  title: string;
  pedagogicalStage: PedagogicalStage;
  content: string;
  equations: string[]; // Formatted LaTeX strings ($...$ and $$...$$)
  criticality: Criticality;
  sha256Hash: string;
  tokenCount: number;
  wordCount: number;
}

export interface TopicCitation {
  sourceTitle: string;
  url: string;
  license: string;
  retrievedAt: string;
}

export interface CompiledTopicSourceDocument {
  id: string;
  topic: string;
  title: string;
  summary: string;
  discipline: string;
  targetAudience: string;
  fullMarkdownText: string;
  sections: SynthesizedSection[];
  suggestedClos: CourseLearningOutcome[];
  equationsCount: number;
  totalWordCount: number;
  totalTokenEstimate: number;
  citations: TopicCitation[];
  generatedAt: string;
}
