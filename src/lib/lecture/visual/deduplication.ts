/**
 * Semantic Visual Deduplication Registry
 * =======================================
 * Tracks and evaluates visual specifications across a lecture deck or course module
 * to prevent repetitive diagram templates, duplicate node structures, and generic stock visuals.
 *
 * Enforces a strict pairwise similarity threshold of < 0.85 across visual titles,
 * node topologies, connection graphs, and student focus questions.
 */

import type { VisualArtifact } from "../types/learning-experience";
import type {
  VisualSpecification,
  VisualDeduplicationResult,
  VisualNode,
  VisualConnection,
} from "./types";

export const MAX_VISUAL_SIMILARITY_THRESHOLD = 0.85;

// ---------------------------------------------------------------------------
// Normalization & Feature Extraction
// ---------------------------------------------------------------------------

interface VisualFeatures {
  id: string;
  family: string;
  title: string;
  description: string;
  titleTokens: Set<string>;
  descTokens: Set<string>;
  nodes: VisualNode[];
  connections: VisualConnection[];
  nodeLabels: string[];
  nodeLabelTokens: Set<string>;
  connectionSignatures: Set<string>;
  questionTokens: Set<string>;
  rawSpec: VisualSpecification;
}

function tokenize(text?: string): string[] {
  if (!text) return [];
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with",
    "by", "about", "is", "are", "was", "were", "of", "as", "it", "its", "diagram",
    "visual", "illustration", "schematic", "figure", "how", "what", "why", "step",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));
}

function diceCoefficient<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 1.0;
  if (a.size === 0 || b.size === 0) return 0.0;

  let intersection = 0;
  a.forEach((item) => {
    if (b.has(item)) intersection++;
  });

  return (2 * intersection) / (a.size + b.size);
}

function extractFeatures(visual: VisualSpecification | VisualArtifact): VisualFeatures {
  let spec: VisualSpecification;
  let title = "";
  let description = "";

  if ("specificationJson" in visual) {
    const art = visual as VisualArtifact;
    const rawSpec: Partial<VisualSpecification> & Record<string, any> = (art.specificationJson as any) || {};
    title = art.title || rawSpec.title || "";
    description = art.learningMessage || art.purpose || rawSpec.description || "";
    spec = {
      id: art.id || rawSpec.id || "vis-art",
      visualFamily: art.visualType || rawSpec.visualFamily || "PROCESS",
      title,
      description,
      layout: typeof rawSpec.layout === "object" ? rawSpec.layout : { type: String(rawSpec.layout || "PROCESS") },
      nodes: (rawSpec.nodes && rawSpec.nodes.length > 0)
        ? rawSpec.nodes
        : (rawSpec.elements || []).map((e: any) => ({ id: e.id, label: e.label, type: e.type })),
      connections: (rawSpec.connections || []).map((c: any) => ({
        from: c.from,
        to: c.to,
        label: c.label,
        relationType: c.relationType || c.style,
      })),
      studentFocusQuestion: rawSpec.studentFocusQuestion || "",
      pedagogicalRationale: rawSpec.pedagogicalRationale || art.purpose || "",
    };
  } else {
    spec = visual as VisualSpecification;
    title = spec.title || "";
    description = spec.description || "";
  }

  const nodes: VisualNode[] = (spec.nodes && spec.nodes.length > 0)
    ? spec.nodes
    : (spec.elements || []);
  const connections: VisualConnection[] = spec.connections || [];

  const nodeMap = new Map<string, string>();
  nodes.forEach((n) => {
    nodeMap.set(n.id, (n.label || "").toLowerCase().trim());
  });

  const nodeLabels = nodes.map((n) => (n.label || "").toLowerCase().trim()).filter(Boolean);
  const nodeLabelTokens = new Set(nodes.flatMap((n) => tokenize(`${n.label} ${n.description || ""}`)));

  // Build connection signatures based on node labels rather than internal ephemeral IDs
  const connectionSignatures = new Set(
    connections.map((c) => {
      const fromLabel = nodeMap.get(c.from) || c.from.toLowerCase();
      const toLabel = nodeMap.get(c.to) || c.to.toLowerCase();
      const connLabel = (c.label || "").toLowerCase().trim();
      return `${fromLabel} -> ${toLabel} [${connLabel}]`;
    })
  );

  return {
    id: spec.id,
    family: spec.visualFamily || "PROCESS",
    title,
    description,
    titleTokens: new Set(tokenize(title)),
    descTokens: new Set(tokenize(description)),
    nodes,
    connections,
    nodeLabels,
    nodeLabelTokens,
    connectionSignatures,
    questionTokens: new Set(tokenize(spec.studentFocusQuestion)),
    rawSpec: spec,
  };
}

// ---------------------------------------------------------------------------
// Pairwise Similarity Calculation
// ---------------------------------------------------------------------------

export function computeVisualSimilarity(
  a: VisualSpecification | VisualArtifact,
  b: VisualSpecification | VisualArtifact
): number {
  const featA = extractFeatures(a);
  const featB = extractFeatures(b);

  // Exact ID match is identity
  if (featA.id && featB.id && featA.id === featB.id) {
    return 1.0;
  }

  // 1. Title & Description Token Similarity (30%)
  const titleDice = diceCoefficient(featA.titleTokens, featB.titleTokens);
  const descDice = diceCoefficient(featA.descTokens, featB.descTokens);
  const titleDescSim = titleDice * 0.7 + descDice * 0.3;

  // 2. Node Structure & Label Similarity (30%)
  const nodeTokenDice = diceCoefficient(featA.nodeLabelTokens, featB.nodeLabelTokens);
  let directLabelMatch = 0;
  const setLabelsA = new Set(featA.nodeLabels);
  const setLabelsB = new Set(featB.nodeLabels);
  setLabelsA.forEach((label) => {
    if (setLabelsB.has(label)) {
      directLabelMatch++;
    } else {
      setLabelsB.forEach((bLabel) => {
        if (label.includes(bLabel) || bLabel.includes(label)) {
          directLabelMatch += 0.75;
        }
      });
    }
  });
  const labelOverlap = (2 * directLabelMatch) / Math.max(1, setLabelsA.size + setLabelsB.size);
  const nodeSim = Math.max(nodeTokenDice, labelOverlap);

  // 3. Connection Topology & Edge Similarity (20%)
  let connSim = 0;
  if (featA.connectionSignatures.size === 0 && featB.connectionSignatures.size === 0) {
    connSim = nodeSim;
  } else {
    connSim = diceCoefficient(featA.connectionSignatures, featB.connectionSignatures);
    // If exact signature match was lower, check label overlap between connections
    if (connSim < 0.5 && featA.connections && featB.connections) {
      const connLabelsA = new Set(tokenize(featA.connections.map((c) => c.label).join(" ")));
      const connLabelsB = new Set(tokenize(featB.connections.map((c) => c.label).join(" ")));
      const connLabelsDice = diceCoefficient(connLabelsA, connLabelsB);
      connSim = Math.max(connSim, connLabelsDice * nodeSim);
    }
  }

  // 4. Student Focus Question Similarity (15%)
  const questionSim = diceCoefficient(featA.questionTokens, featB.questionTokens);

  // 5. Visual Family Alignment (5%)
  const familySim = featA.family === featB.family ? 1.0 : 0.0;

  const totalWeighted =
    titleDescSim * 0.30 +
    nodeSim * 0.30 +
    connSim * 0.20 +
    questionSim * 0.15 +
    familySim * 0.05;

  return Number(Math.min(1.0, Math.max(0.0, totalWeighted)).toFixed(4));
}

// ---------------------------------------------------------------------------
// Visual Deduplication Registry Class
// ---------------------------------------------------------------------------

export class VisualDeduplicationRegistry {
  private pool: Array<{
    features: VisualFeatures;
    slideNo?: number;
  }> = [];

  /**
   * Register a visual into the deck registry.
   * Rejects if pairwise similarity with any existing visual is >= 0.85.
   */
  public register(
    visual: VisualSpecification | VisualArtifact,
    slideNo?: number
  ): VisualDeduplicationResult {
    const check = this.checkSimilarity(visual);
    if (!check.isUnique) {
      return check;
    }

    const features = extractFeatures(visual);
    this.pool.push({ features, slideNo });

    return {
      isUnique: true,
      similarityScore: check.similarityScore,
    };
  }

  /**
   * Evaluate if a visual is unique against the currently registered pool.
   */
  public checkSimilarity(
    visual: VisualSpecification | VisualArtifact
  ): VisualDeduplicationResult {
    if (this.pool.length === 0) {
      return {
        isUnique: true,
        similarityScore: 0.0,
      };
    }

    let maxSim = 0.0;
    let conflictId: string | undefined;
    let conflictSlide: number | undefined;

    for (const entry of this.pool) {
      const sim = computeVisualSimilarity(visual, entry.features.rawSpec);
      if (sim > maxSim) {
        maxSim = sim;
        conflictId = entry.features.id;
        conflictSlide = entry.slideNo;
      }
    }

    const isUnique = maxSim < MAX_VISUAL_SIMILARITY_THRESHOLD;

    return {
      isUnique,
      similarityScore: maxSim,
      conflictingVisualId: isUnique ? undefined : conflictId,
      reason: isUnique
        ? undefined
        : `Semantic visual similarity (${(maxSim * 100).toFixed(1)}%) exceeds maximum threshold (${(MAX_VISUAL_SIMILARITY_THRESHOLD * 100).toFixed(0)}%) with visual "${conflictId}"${conflictSlide ? ` on slide ${conflictSlide}` : ""} — semantically duplicate visual.`,
    };
  }

  /**
   * Return all currently registered visual specifications.
   */
  public getRegisteredVisuals(): Array<{ visual: VisualSpecification; slideNo?: number }> {
    return this.pool.map((entry) => ({
      visual: entry.features.rawSpec,
      slideNo: entry.slideNo,
    }));
  }

  /**
   * Compute pairwise similarity between two arbitrary visuals.
   */
  public computeSimilarity(
    a: VisualSpecification | VisualArtifact,
    b: VisualSpecification | VisualArtifact
  ): number {
    return computeVisualSimilarity(a, b);
  }

  /**
   * Clear all registered visuals.
   */
  public clear(): void {
    this.pool = [];
  }
}
