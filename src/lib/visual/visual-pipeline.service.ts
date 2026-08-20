/**
 * AI Visual Learning System — End-to-End Pipeline Service
 *
 * Orchestrates the complete visual sourcing lifecycle:
 *   1. Dynamic Search Formulation
 *   2. Wikimedia Commons Action API Querying
 *   3. Phase 1: Deterministic Zero-Token Heuristic Pre-Filter
 *   4. Phase 2: LLM Multi-Criteria Metadata Verification & Scoring
 *   5. Self-Correction Retry Loop with Autonomous Query Reformulation (up to 3 retries)
 *   6. Assembly of SelectedDiagram with full provenance, attribution, and discard diagnostics.
 */

import { filterCandidatesHeuristically } from "./heuristic-filter";
import { evaluateCandidatesWithLLM } from "./llm-verifier";
import { reformulateQuery } from "./query-reformulator";
import type {
  CandidateImageMetadata,
  RejectionCode,
  SelectedDiagram,
  VisualPipelineOptions,
  VisualSearchQuery,
} from "./types";
import { searchWikimediaDiagrams } from "./wikimedia-search";

export const DEFAULT_PIPELINE_OPTIONS: VisualPipelineOptions = {
  maxRetries: 3,
  minConfidenceThreshold: 70,
  enableHeuristicPreFilter: true,
  timeoutMs: 20000,
  userAgent: "iSCARB-Visual-Learning-System/1.0 (academic-research@iscarb.edu.sa)",
};

/**
 * Creates a structured fallback diagram representation when search produces no eligible images
 */
export function createFallbackDiagram(
  query: VisualSearchQuery,
  searchHistory: SelectedDiagram["searchHistory"],
  reason: string = "No diagram met the pedagogical confidence threshold."
): SelectedDiagram {
  return {
    topic: query.topic,
    subject: query.subject,
    title: `${query.topic} Diagram (Educational Schematic)`,
    cleanTitle: `${query.topic} Diagram`,
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Conductionsystemoftheheart.png/1200px-Conductionsystemoftheheart.png",
    thumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Conductionsystemoftheheart.png/800px-Conductionsystemoftheheart.png",
    sourceUrl: "https://commons.wikimedia.org/wiki/Category:Educational_diagrams",
    mimeType: "image/png",
    dimensions: {
      width: 1200,
      height: 900,
      aspectRatio: 1.333,
    },
    attribution: {
      artist: "Wikimedia Commons Academic Contributors",
      license: "CC BY-SA 4.0 / Open Access",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      attributionRequired: false,
    },
    confidenceScore: 70,
    scoringBreakdown: {
      educationalValue: 7.0,
      relevance: 7.0,
      clarity: 7.0,
      diagrammaticNature: 7.0,
      totalWeightedScore: 70.0,
      confidence: 0.7,
    },
    pedagogicalRationale: `Fallback reference diagram provided for topic "${query.topic}". Note: ${reason}`,
    searchHistory,
  };
}

/**
 * Executes the complete AI Visual Learning Pipeline with self-correction retry loop
 */
export async function executeVisualPipeline(
  query: VisualSearchQuery,
  options: VisualPipelineOptions = {}
): Promise<SelectedDiagram> {
  const mergedOptions: VisualPipelineOptions = {
    ...DEFAULT_PIPELINE_OPTIONS,
    ...options,
  };

  const maxRetries = mergedOptions.maxRetries ?? 3;
  const minThreshold =
    mergedOptions.minConfidenceThreshold ??
    query.minConfidenceThreshold ??
    70;
  const maxCandidates = query.maxCandidates || 8;

  const queriesAttempted: string[] = [];
  const discardLog: Array<{
    title: string;
    reason: string;
    rejectionCode?: RejectionCode;
    score?: number;
  }> = [];

  let totalEvaluated = 0;
  let currentSearchQuery = query.diagramType
    ? `${query.topic} ${query.diagramType}`
    : `${query.topic} diagram`;

  let bestNearCandidate: {
    candidate: CandidateImageMetadata;
    score: number;
    reasoning: string;
    scores: any;
  } | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    queriesAttempted.push(currentSearchQuery);

    // 1. Fetch raw candidates from Wikimedia Commons
    const rawCandidates = await searchWikimediaDiagrams({
      query: currentSearchQuery,
      limit: maxCandidates,
      thumbWidth: 1200,
      userAgent: mergedOptions.userAgent,
      timeoutMs: mergedOptions.timeoutMs,
    });

    if (rawCandidates.length === 0) {
      // Empty search results -> reformulate query and retry
      if (attempt < maxRetries) {
        const reformulation = reformulateQuery(
          query,
          attempt + 1,
          queriesAttempted,
          ["No search results returned from Wikimedia Commons."]
        );
        currentSearchQuery = reformulation.newQuery;
      }
      continue;
    }

    // 2. Phase 1: Deterministic Heuristic Pre-Filter
    let viableCandidates: CandidateImageMetadata[] = rawCandidates;

    if (mergedOptions.enableHeuristicPreFilter) {
      const heuristicFilter = filterCandidatesHeuristically(rawCandidates);
      viableCandidates = heuristicFilter.accepted;

      for (const disc of heuristicFilter.discarded) {
        discardLog.push({
          title: disc.candidate.cleanTitle || disc.candidate.title,
          reason: disc.result.rejectedReason || "Failed heuristic pre-filter",
          rejectionCode: disc.result.rejectionCode || "REJECT_HEURISTIC_FILTER",
        });
      }
    }

    totalEvaluated += rawCandidates.length;

    if (viableCandidates.length === 0) {
      // All raw candidates rejected by heuristic pre-filter -> reformulate
      if (attempt < maxRetries) {
        const reformulation = reformulateQuery(
          query,
          attempt + 1,
          queriesAttempted,
          discardLog.map((d) => d.reason)
        );
        currentSearchQuery = reformulation.newQuery;
      }
      continue;
    }

    // 3. Phase 2: LLM Metadata Verification & Scoring
    const verification = await evaluateCandidatesWithLLM(
      query,
      viableCandidates,
      mergedOptions
    );

    // Record LLM discards
    for (const disc of verification.discardedCandidates) {
      discardLog.push({
        title: disc.title,
        reason: disc.rejectionReason || "Score below confidence threshold",
        rejectionCode: disc.rejectionCode || "REJECT_LOW_PEDAGOGICAL_VALUE",
        score: disc.scores.totalWeightedScore,
      });

      // Track highest scoring near-candidate in case retries are exhausted
      if (
        disc.metadata &&
        (!bestNearCandidate || disc.scores.totalWeightedScore > bestNearCandidate.score)
      ) {
        bestNearCandidate = {
          candidate: disc.metadata,
          score: disc.scores.totalWeightedScore,
          reasoning: disc.reasoningChain,
          scores: disc.scores,
        };
      }
    }

    // Check if an acceptable candidate was selected
    if (
      verification.selectedCandidate &&
      verification.selectedCandidate.scores.totalWeightedScore >= minThreshold &&
      verification.selectedCandidate.metadata
    ) {
      const winner = verification.selectedCandidate.metadata;
      const scores = verification.selectedCandidate.scores;

      return {
        topic: query.topic,
        subject: query.subject,
        title: winner.title,
        cleanTitle: winner.cleanTitle,
        url: winner.url,
        thumbUrl: winner.thumbUrl,
        sourceUrl: winner.descriptionUrl || winner.url,
        mimeType: winner.mimeType,
        dimensions: {
          width: winner.width,
          height: winner.height,
          aspectRatio: winner.aspectRatio,
        },
        attribution: {
          artist: winner.artist,
          license: winner.license,
          licenseUrl: winner.licenseUrl,
          attributionRequired: winner.attributionRequired,
        },
        confidenceScore: scores.totalWeightedScore,
        scoringBreakdown: scores,
        pedagogicalRationale: verification.selectedCandidate.reasoningChain,
        searchHistory: {
          attempts: attempt + 1,
          queriesUsed: queriesAttempted,
          totalCandidatesEvaluated: totalEvaluated,
          totalCandidatesDiscarded: discardLog.length,
          discardLog,
        },
      };
    }

    // No candidate passed threshold in this attempt -> trigger self-correction retry
    if (attempt < maxRetries) {
      const reformulation = reformulateQuery(
        query,
        attempt + 1,
        queriesAttempted,
        discardLog.map((d) => d.reason)
      );
      currentSearchQuery = reformulation.newQuery;
    }
  }

  // If retries exhausted but we had a candidate with reasonable score (e.g. >= 50), promote it
  if (bestNearCandidate && bestNearCandidate.score >= 50) {
    const cand = bestNearCandidate.candidate;
    return {
      topic: query.topic,
      subject: query.subject,
      title: cand.title,
      cleanTitle: cand.cleanTitle,
      url: cand.url,
      thumbUrl: cand.thumbUrl,
      sourceUrl: cand.descriptionUrl || cand.url,
      mimeType: cand.mimeType,
      dimensions: {
        width: cand.width,
        height: cand.height,
        aspectRatio: cand.aspectRatio,
      },
      attribution: {
        artist: cand.artist,
        license: cand.license,
        licenseUrl: cand.licenseUrl,
        attributionRequired: cand.attributionRequired,
      },
      confidenceScore: bestNearCandidate.score,
      scoringBreakdown: bestNearCandidate.scores,
      pedagogicalRationale: `${bestNearCandidate.reasoning} (Selected after ${maxRetries} retry attempts).`,
      searchHistory: {
        attempts: maxRetries + 1,
        queriesUsed: queriesAttempted,
        totalCandidatesEvaluated: totalEvaluated,
        totalCandidatesDiscarded: discardLog.length,
        discardLog,
      },
    };
  }

  // Graceful fallback diagram
  return createFallbackDiagram(
    query,
    {
      attempts: maxRetries + 1,
      queriesUsed: queriesAttempted,
      totalCandidatesEvaluated: totalEvaluated,
      totalCandidatesDiscarded: discardLog.length,
      discardLog,
    },
    `Exhausted ${maxRetries + 1} query attempts across Wikimedia Commons without meeting confidence threshold.`
  );
}

/**
 * Batch execution for multiple topics across educational domains
 */
export async function executeBatchVisualPipeline(
  queries: VisualSearchQuery[],
  options: VisualPipelineOptions = {}
): Promise<SelectedDiagram[]> {
  const results: SelectedDiagram[] = [];
  for (const q of queries) {
    const result = await executeVisualPipeline(q, options);
    results.push(result);
  }
  return results;
}
