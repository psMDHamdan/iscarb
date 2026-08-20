/**
 * AI Visual Learning System — Module Public Exports
 *
 * Provides a unified entry point for educational diagram search,
 * heuristic pre-filtering, LLM verification, and self-correction pipeline services.
 */

// Core Types & Interfaces
export * from "./types";

// Wikimedia Commons Search Client & Normalizer
export {
  cleanTitle,
  DEFAULT_ALLOWED_MIME_TYPES,
  DEFAULT_USER_AGENT,
  parseCategories,
  parseWikimediaResponse,
  searchWikimediaDiagrams,
  stripHtml,
  WIKIMEDIA_COMMONS_API,
} from "./wikimedia-search";

// Deterministic Heuristic Pre-Filter
export {
  evaluateHeuristicFilter,
  filterCandidatesHeuristically,
  HEURISTIC_PATTERNS,
  MAX_ASPECT_RATIO,
  MIN_ASPECT_RATIO,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_TOTAL_PIXELS,
  MIN_IMAGE_WIDTH,
} from "./heuristic-filter";

// Query Reformulation State Machine
export {
  applyCategoryPivot,
  applyDomainSynonymSubstitution,
  applyKeywordInfusion,
  applyTaxonomicBroadening,
  getDomainSynonyms,
  getSubjectKeywords,
  reformulateQuery,
  SUBJECT_KEYWORD_TAXONOMY,
  TOPIC_DOMAIN_SYNONYMS,
} from "./query-reformulator";

// LLM Metadata Verification & Scoring Engine
export {
  buildVerificationPrompt,
  calculateCompositeScore,
  DEFAULT_CHAT_MODEL,
  DEFAULT_NVIDIA_BASE_URL,
  evaluateCandidateDeterministically,
  evaluateCandidatesWithLLM,
  extractJsonFromLlmOutput,
  MIN_COMPOSITE_THRESHOLD,
  parseLLMVerificationResponse,
} from "./llm-verifier";

// Visual Pipeline Integration Service
export {
  createFallbackDiagram,
  DEFAULT_PIPELINE_OPTIONS,
  executeBatchVisualPipeline,
  executeVisualPipeline,
} from "./visual-pipeline.service";
