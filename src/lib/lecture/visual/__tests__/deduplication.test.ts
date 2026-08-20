import { describe, it, expect, beforeEach } from "vitest";
import {
  VisualDeduplicationRegistry,
  computeVisualSimilarity,
  MAX_VISUAL_SIMILARITY_THRESHOLD,
} from "../deduplication";
import type { VisualSpecification } from "../types";

describe("Semantic Visual Deduplication", () => {
  let registry: VisualDeduplicationRegistry;

  beforeEach(() => {
    registry = new VisualDeduplicationRegistry();
  });

  const specGlycolysis: VisualSpecification = {
    id: "spec-glycolysis-1",
    visualFamily: "PROCESS",
    title: "Glycolysis Pathway: Glucose to Pyruvate",
    description: "Ten-step enzymatic pathway converting glucose into pyruvate and generating ATP.",
    layout: { type: "PROCESS", direction: "LR" },
    nodes: [
      { id: "g-glu", label: "Glucose", type: "SUBSTRATE", description: "Initial 6-carbon hexose" },
      { id: "g-fbp", label: "Fructose 1,6-bisphosphate", type: "INTERMEDIATE", description: "Phosphorylated hexose" },
      { id: "g-pyr", label: "Pyruvate", type: "PRODUCT", description: "Terminal 3-carbon product" },
    ],
    connections: [
      { from: "g-glu", to: "g-fbp", label: "Hexokinase / PFK-1" },
      { from: "g-fbp", to: "g-pyr", label: "Aldolase / Pyruvate Kinase" },
    ],
    studentFocusQuestion: "How does allosteric inhibition of PFK-1 regulate the entire glycolytic flux?",
    pedagogicalRationale: "Illustrates key regulatory checkpoints in cellular respiration.",
  };

  const nearDuplicateGlycolysis: VisualSpecification = {
    id: "spec-glycolysis-copy",
    visualFamily: "PROCESS",
    title: "Glycolysis Biochemical Pathway: Glucose to Pyruvate Transformation",
    description: "Enzymatic pathway converting glucose into pyruvate and producing net ATP.",
    layout: { type: "PROCESS", direction: "LR" },
    nodes: [
      { id: "g-glu-2", label: "Glucose", type: "SUBSTRATE", description: "Initial 6-carbon hexose substrate" },
      { id: "g-fbp-2", label: "Fructose 1,6-bisphosphate", type: "INTERMEDIATE", description: "Phosphorylated intermediate" },
      { id: "g-pyr-2", label: "Pyruvate", type: "PRODUCT", description: "Terminal 3-carbon product" },
    ],
    connections: [
      { from: "g-glu-2", to: "g-fbp-2", label: "Hexokinase / PFK-1" },
      { from: "g-fbp-2", to: "g-pyr-2", label: "Aldolase / Pyruvate Kinase" },
    ],
    studentFocusQuestion: "How does allosteric regulation of PFK-1 alter glycolytic flux in respiration?",
    pedagogicalRationale: "Illustrates regulatory checkpoints in cellular respiration.",
  };

  const specQuantumRaft: VisualSpecification = {
    id: "spec-raft-consensus",
    visualFamily: "SYSTEM_ARCHITECTURE",
    title: "Raft Consensus Cluster Topology",
    description: "Quorum cluster architecture with Leader, Candidate, and Follower state machines.",
    layout: { type: "SYSTEM_ARCHITECTURE", direction: "TB" },
    nodes: [
      { id: "raft-ldr", label: "Leader Node", type: "COORDINATOR", description: "Heartbeat sender" },
      { id: "raft-fol1", label: "Follower Node 1", type: "REPLICA", description: "Log replication peer" },
      { id: "raft-fol2", label: "Follower Node 2", type: "REPLICA", description: "Log replication peer" },
    ],
    connections: [
      { from: "raft-ldr", to: "raft-fol1", label: "AppendEntries RPC" },
      { from: "raft-ldr", to: "raft-fol2", label: "AppendEntries RPC" },
    ],
    studentFocusQuestion: "How does the quorum size prevent split-brain during a network partition?",
    pedagogicalRationale: "Visualizes fault isolation and state synchronization.",
  };

  it("calculates high similarity (>= 0.85) between near-duplicate visual specifications", () => {
    const similarity = computeVisualSimilarity(specGlycolysis, nearDuplicateGlycolysis);
    expect(similarity).toBeGreaterThanOrEqual(MAX_VISUAL_SIMILARITY_THRESHOLD);
  });

  it("calculates low similarity (< 0.30) between distinct visual specifications across domains", () => {
    const similarity = computeVisualSimilarity(specGlycolysis, specQuantumRaft);
    expect(similarity).toBeLessThan(0.30);
  });

  it("registers distinct visuals successfully with isUnique: true", () => {
    const res1 = registry.register(specGlycolysis, 1);
    expect(res1.isUnique).toBe(true);
    expect(res1.similarityScore).toBe(0.0);

    const res2 = registry.register(specQuantumRaft, 2);
    expect(res2.isUnique).toBe(true);
    expect(res2.similarityScore).toBeLessThan(MAX_VISUAL_SIMILARITY_THRESHOLD);
    expect(registry.getRegisteredVisuals().length).toBe(2);
  });

  it("rejects near-duplicate visual specifications (>= 0.85 threshold)", () => {
    registry.register(specGlycolysis, 1);
    const dupCheck = registry.register(nearDuplicateGlycolysis, 2);

    expect(dupCheck.isUnique).toBe(false);
    expect(dupCheck.similarityScore).toBeGreaterThanOrEqual(MAX_VISUAL_SIMILARITY_THRESHOLD);
    expect(dupCheck.conflictingVisualId).toBe(specGlycolysis.id);
    expect(dupCheck.reason).toContain("exceeds maximum threshold");
  });

  it("clears registered pool cleanly", () => {
    registry.register(specGlycolysis, 1);
    expect(registry.getRegisteredVisuals().length).toBe(1);

    registry.clear();
    expect(registry.getRegisteredVisuals().length).toBe(0);

    const resAfterClear = registry.register(nearDuplicateGlycolysis, 1);
    expect(resAfterClear.isUnique).toBe(true);
  });
});
