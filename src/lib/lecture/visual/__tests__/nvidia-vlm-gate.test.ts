import { describe, it, expect } from "vitest";
import {
  evaluateVisual,
  evaluateVisualDeterministically,
  NVIDIA_VLM_THRESHOLDS,
} from "../nvidia-vlm-gate";
import type { VisualSpecification } from "../types";
import type { VisualArtifact } from "../../types/learning-experience";

describe("NVIDIA NIM VLM Quality Gate", () => {
  const quantumContext = {
    topic: "Quantum Computing & Information",
    conceptTitle: "Quantum Teleportation Protocol & Entanglement",
    academicTruth: "Quantum teleportation transfers an unknown qubit state using a shared Bell state and classical communication channels.",
    learningObjective: "Analyze the state transformation steps and verify no-cloning theorem invariance.",
  };

  const validQuantumSpec: VisualSpecification = {
    id: "spec-quantum-1",
    visualFamily: "PROCESS",
    title: "Quantum Teleportation Bell State Measurement Protocol",
    description: "Multi-stage protocol transferring quantum state via Bell pair entanglement and classical communication.",
    layout: { type: "PROCESS", direction: "LR" },
    nodes: [
      { id: "q-init", label: "Initial Qubit & EPR Pair", type: "QUANTUM_STATE", description: "Entangled Bell state preparation" },
      { id: "q-bsm", label: "Bell State Measurement", type: "UNITARY_TRANSFORMATION", description: "Joint measurement projecting qubits" },
      { id: "q-class", label: "Classical Communication Channel", type: "CLASSICAL_LINK", description: "Transmission of two classical bits" },
      { id: "q-recon", label: "Unitary Reconstruction Operator", type: "RECONSTRUCTION", description: "State recovery preserving quantum state" },
    ],
    connections: [
      { from: "q-init", to: "q-bsm", label: "entangled_pair" },
      { from: "q-bsm", to: "q-class", label: "2_classical_bits" },
      { from: "q-class", to: "q-recon", label: "apply_pauli_correction" },
    ],
    studentFocusQuestion: "Why is classical communication strictly required before the recipient can reconstruct the original quantum state?",
    pedagogicalRationale: "Tracing each quantum gate and classical transmission prevents the misconception of faster-than-light communication.",
  };

  it("passes when all 3 metrics meet or exceed the strict thresholds (85/80/90)", async () => {
    const result = await evaluateVisual(validQuantumSpec, quantumContext, { forceMock: true });

    expect(result.scores.relevance).toBeGreaterThanOrEqual(NVIDIA_VLM_THRESHOLDS.RELEVANCE);
    expect(result.scores.educationalValue).toBeGreaterThanOrEqual(NVIDIA_VLM_THRESHOLDS.EDUCATIONAL_VALUE);
    expect(result.scores.scientificConsistency).toBeGreaterThanOrEqual(NVIDIA_VLM_THRESHOLDS.SCIENTIFIC_CONSISTENCY);
    expect(result.passed).toBe(true);
    expect(result.rationale).toContain("passes NVIDIA VLM Quality Gate");
  });

  it("fails relevance when the visual specification is completely off-topic", async () => {
    const offTopicSpec: VisualSpecification = {
      id: "spec-botany-1",
      visualFamily: "PROCESS",
      title: "Plant Photosynthesis Light Dependent Reactions",
      description: "Chloroplast thylakoid membrane chlorophyll photon absorption and ATP synthesis.",
      layout: { type: "PROCESS", direction: "LR" },
      nodes: [
        { id: "p1", label: "Photon Absorption", description: "Photosystem II" },
        { id: "p2", label: "Electron Transport", description: "Cytochrome b6f" },
        { id: "p3", label: "ATP Synthase", description: "Proton gradient" },
      ],
      connections: [
        { from: "p1", to: "p2", label: "electron_flow" },
        { from: "p2", to: "p3", label: "proton_motive" },
      ],
      studentFocusQuestion: "How does the proton gradient drive ATP synthesis?",
      pedagogicalRationale: "Visualizes bioenergetics of thylakoid membranes.",
    };

    const result = await evaluateVisual(offTopicSpec, quantumContext, { forceMock: true });

    expect(result.scores.relevance).toBeLessThan(NVIDIA_VLM_THRESHOLDS.RELEVANCE);
    expect(result.passed).toBe(false);
    expect(result.rationale).toContain("Relevance score");
    expect(result.feedback).toBeDefined();
  });

  it("fails educational value when visual lacks focus question and node richness", async () => {
    const superficialSpec: VisualSpecification = {
      id: "spec-shallow",
      visualFamily: "PROCESS",
      title: "Quantum Overview",
      description: "Simple overview",
      layout: { type: "PROCESS", direction: "LR" },
      nodes: [{ id: "n1", label: "Quantum State" }],
      connections: [],
      studentFocusQuestion: "",
      pedagogicalRationale: "",
    };

    const result = await evaluateVisual(superficialSpec, quantumContext, { forceMock: true });

    expect(result.scores.educationalValue).toBeLessThan(NVIDIA_VLM_THRESHOLDS.EDUCATIONAL_VALUE);
    expect(result.passed).toBe(false);
    expect(result.detectedErrors).toBeDefined();
    expect(result.detectedErrors?.some((e) => e.includes("focus question") || e.includes("nodes"))).toBe(true);
  });

  it("fails scientific consistency when connection references non-existent node ID", async () => {
    const brokenGraphSpec: VisualSpecification = {
      ...validQuantumSpec,
      id: "spec-broken-graph",
      connections: [
        { from: "q-init", to: "non-existent-node-id", label: "dangling_edge" },
        { from: "another-ghost-node", to: "q-recon", label: "invalid_source" },
      ],
    };

    const result = await evaluateVisual(brokenGraphSpec, quantumContext, { forceMock: true });

    expect(result.scores.scientificConsistency).toBeLessThan(NVIDIA_VLM_THRESHOLDS.SCIENTIFIC_CONSISTENCY);
    expect(result.passed).toBe(false);
    expect(result.detectedErrors).toBeDefined();
    expect(result.detectedErrors?.some((e) => e.includes("non-existent"))).toBe(true);
  });

  it("evaluates VisualArtifact models with full fidelity", async () => {
    const visualArtifact: VisualArtifact = {
      id: "art-101",
      experienceId: "exp-test-1",
      conceptBlockId: "block-quant-1",
      visualType: "PROCESS",
      title: "Quantum Teleportation Entanglement Protocol",
      purpose: "Explicate EPR Bell pair state projection and reconstruction.",
      learningMessage: "Demonstrates quantum teleportation state transfer.",
      specificationJson: {
        layout: "HORIZONTAL_FLOW",
        elements: [
          { id: "el-1", label: "EPR Pair Source", type: "SOURCE", x: 100, y: 150 },
          { id: "el-2", label: "Bell State Analyzer", type: "OPERATOR", x: 400, y: 150 },
          { id: "el-3", label: "Pauli Transformation Unit", type: "RECEIVER", x: 700, y: 150 },
        ],
        connections: [
          { from: "el-1", to: "el-2", label: "entangled_qubits" },
          { from: "el-2", to: "el-3", label: "classical_feedforward" },
        ],
        labels: ["EPR Source", "Bell Analyzer", "Pauli Operator"],
        annotations: ["Unitary transformation guarantees state fidelity."],
        studentFocusQuestion: "What happens to the target state if the classical feedforward signal is lost in transit?",
      },
      assetSourceTier: "NATIVE_SVG",
      sourcePriority: 5,
      altText: "Quantum teleportation diagram",
      orderIndex: 1,
      createdAt: new Date(),
    };

    const result = await evaluateVisual(visualArtifact, quantumContext, { forceMock: true });
    expect(result.passed).toBe(true);
    expect(result.scores.relevance).toBeGreaterThanOrEqual(85);
    expect(result.scores.educationalValue).toBeGreaterThanOrEqual(80);
    expect(result.scores.scientificConsistency).toBeGreaterThanOrEqual(90);
  });

  it("evaluates deterministically and identically across multiple runs", () => {
    const run1 = evaluateVisualDeterministically(validQuantumSpec, quantumContext);
    const run2 = evaluateVisualDeterministically(validQuantumSpec, quantumContext);

    expect(run1.scores).toEqual(run2.scores);
    expect(run1.passed).toBe(run2.passed);
    expect(run1.rationale).toBe(run2.rationale);
  });
});
