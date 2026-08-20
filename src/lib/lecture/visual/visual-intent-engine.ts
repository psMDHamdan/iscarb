/**
 * Structured Visual Intent Engine
 * ================================
 * Generates domain-grounded, structured visual specifications across all 7
 * canonical visual families (Process, System Architecture, Data Flow,
 * Comparison Matrix, Cause & Effect, Quantitative, Hierarchy).
 *
 * Provides vector SVG synthesis, student focus question formulation,
 * and pedagogical rationale for deep STEM/Business learning.
 */

import type {
  VisualSpecification,
  VisualFamily,
  VisualNode,
  VisualConnection,
  VisualGenerationContext,
} from "./types";
import { renderVisualSpecificationToSvg } from "../renderer/svg-visual-renderer";

// ---------------------------------------------------------------------------
// Family Inference Heuristics
// ---------------------------------------------------------------------------

const KEYWORD_RULES: Array<{ family: VisualFamily; regex: RegExp }> = [
  {
    family: "COMPARISON_MATRIX",
    regex:
      /\b(vs\.?|versus|compare|comparison|trade-?off|tradeoff|pros and cons|matrix|difference|benchmark|alternative|contrast|table)\b/i,
  },
  {
    family: "CAUSE_EFFECT",
    regex:
      /\b(cause|effect|impact|result|consequence|trigger|lead to|culminate|root cause|failure mode|cascade|feedback loop|perturbation)\b/i,
  },
  {
    family: "QUANTITATIVE",
    regex:
      /\b(curve|distribution|rate|complexity|function|formula|o\(n\)|o\(log|threshold|axis|plot|parameter|sensitivity|derivative|equation|metric|quantity|percentage)\b/i,
  },
  {
    family: "DATA_FLOW",
    regex:
      /\b(data flow|stream|pipeline|packet|message queue|ingest|sink|payload|channel|bus|event stream|etl|transform|socket)\b/i,
  },
  {
    family: "HIERARCHY",
    regex:
      /\b(hierarchy|taxonomy|tree|class hierarchy|inheritance|subclass|dag|organization|parent-child|branch|ast|phylogeny)\b/i,
  },
  {
    family: "SYSTEM_ARCHITECTURE",
    regex:
      /\b(architecture|subsystem|client-server|microservice|database|tier|api gateway|distributed system|infrastructure|layer|monolith|hardware|cluster|node network)\b/i,
  },
  {
    family: "PROCESS",
    regex:
      /\b(process|step|phase|cycle|reaction|algorithm|transition|state machine|pathway|protocol|sequence|workflow)\b/i,
  },
];

export function inferVisualFamily(context: VisualGenerationContext): VisualFamily {
  if (context.preferredFamily) {
    return context.preferredFamily;
  }

  const combinedText = [
    context.conceptTitle,
    context.topic,
    context.academicTruth,
    context.mechanismExplanation,
    context.intuitionMentalModel,
  ]
    .filter(Boolean)
    .join(" ");

  for (const rule of KEYWORD_RULES) {
    if (rule.regex.test(combinedText)) {
      return rule.family;
    }
  }

  return "PROCESS";
}

// ---------------------------------------------------------------------------
// Text Parsing & Extraction Helpers
// ---------------------------------------------------------------------------

function extractKeyPhrases(text?: string): string[] {
  if (!text) return [];
  // Split by clauses, commas, semicolons, arrows, or periods
  const parts = text
    .split(/[,;\n.→|]|(?:\s+and\s+)|\s+then\s+|\s+to\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3 && s.length < 60);

  return parts.slice(0, 6);
}

// ---------------------------------------------------------------------------
// Family-Specific Specification Builders
// ---------------------------------------------------------------------------

export function generateProcessVisual(context: VisualGenerationContext): VisualSpecification {
  const title = context.conceptTitle;
  const id = `proc-${(context.slideNo || 1)}-${Math.random().toString(36).substring(2, 7)}`;
  const phrases = extractKeyPhrases(context.mechanismExplanation || context.academicTruth);

  const nodes: VisualNode[] = [
    {
      id: "step-1",
      label: phrases[0] || `Initial ${title} State`,
      type: "INPUT_STATE",
      description: "Pre-condition and parameter initialization",
      x: 100,
      y: 150,
    },
    {
      id: "step-2",
      label: phrases[1] || `Core ${title} Mechanism`,
      type: "TRANSFORMATION_OPERATOR",
      description: "Invariant execution and computational transition",
      x: 350,
      y: 150,
    },
    {
      id: "step-3",
      label: phrases[2] || `Final Verified State`,
      type: "OUTPUT_STATE",
      description: "Post-condition guarantee and deterministic outcome",
      x: 600,
      y: 150,
    },
  ];

  if (phrases.length > 3) {
    nodes.push({
      id: "step-4",
      label: phrases[3] || `Terminal Invariant`,
      type: "TERMINAL_STATE",
      description: "System stabilization",
      x: 750,
      y: 150,
    });
  }

  const connections: VisualConnection[] = nodes.slice(0, -1).map((n, i) => ({
    from: n.id,
    to: nodes[i + 1].id,
    label: `Stage ${i + 1} → ${i + 2}`,
    relationType: "SEQUENTIAL_TRANSITION",
    bidirectional: false,
  }));

  const spec: VisualSpecification = {
    id,
    visualType: "PROCESS",
    visualFamily: "PROCESS",
    title: `Sequential Dynamics: ${title}`,
    description: `Multi-stage state transition diagram illustrating the operational pipeline of ${title}.`,
    layout: {
      type: "PROCESS",
      direction: "LR",
    },
    nodes,
    connections,
    studentFocusQuestion: `What specific invariant is preserved when transitioning from ${nodes[0].label} to ${nodes[1].label}?`,
    pedagogicalRationale: `A step-by-step process diagram reduces cognitive load by decoupling state transitions and making dynamic invariants explicit.`,
    elements: nodes,
    labels: nodes.map((n) => n.label),
    annotations: [`State progression guarantees invariant maintenance throughout ${title}.`],
  };

  spec.svgMarkup = renderVisualSpecificationToSvg(spec, { slideNo: context.slideNo });
  return spec;
}

export function generateSystemArchitectureVisual(context: VisualGenerationContext): VisualSpecification {
  const title = context.conceptTitle;
  const id = `arch-${(context.slideNo || 1)}-${Math.random().toString(36).substring(2, 7)}`;
  const phrases = extractKeyPhrases(context.academicTruth || context.mechanismExplanation);

  const nodes: VisualNode[] = [
    {
      id: "comp-client",
      label: phrases[0] || "Client Interface / Ingress",
      type: "CLIENT_BOUNDARY",
      description: "Entry portal dispatching protocol requests",
    },
    {
      id: "comp-service",
      label: phrases[1] || `${title} Core Engine`,
      type: "SERVICE_LAYER",
      description: "Encapsulates business rules and domain invariants",
    },
    {
      id: "comp-persistence",
      label: phrases[2] || "Storage & Ledger Subsystem",
      type: "STORAGE_TIER",
      description: "State persistence and transactional recovery",
    },
  ];

  const connections: VisualConnection[] = [
    {
      from: "comp-client",
      to: "comp-service",
      label: "gRPC / API Request",
      relationType: "SYNCHRONOUS_CALL",
      bidirectional: false,
    },
    {
      from: "comp-service",
      to: "comp-persistence",
      label: "ACID Commit / Query",
      relationType: "STATE_PERSISTENCE",
      bidirectional: true,
    },
  ];

  const spec: VisualSpecification = {
    id,
    visualType: "SYSTEM_ARCHITECTURE",
    visualFamily: "SYSTEM_ARCHITECTURE",
    title: `System Architecture: ${title}`,
    description: `Tiered architectural topology detailing component boundaries, protocol interfaces, and data isolation for ${title}.`,
    layout: {
      type: "SYSTEM_ARCHITECTURE",
      direction: "TB",
    },
    nodes,
    connections,
    studentFocusQuestion: `How does isolating ${nodes[1].label} from ${nodes[0].label} prevent cascading failures across the system?`,
    pedagogicalRationale: `Visualizing structural boundaries and interface boundaries fosters architectural mental models and component decoupling comprehension.`,
    elements: nodes,
    labels: nodes.map((n) => n.label),
    annotations: [`Tiered boundaries isolate faults and ensure scalable concurrency.`],
  };

  spec.svgMarkup = renderVisualSpecificationToSvg(spec, { slideNo: context.slideNo });
  return spec;
}

export function generateDataFlowVisual(context: VisualGenerationContext): VisualSpecification {
  const title = context.conceptTitle;
  const id = `flow-${(context.slideNo || 1)}-${Math.random().toString(36).substring(2, 7)}`;
  const phrases = extractKeyPhrases(context.mechanismExplanation || context.academicTruth);

  const nodes: VisualNode[] = [
    {
      id: "flow-src",
      label: phrases[0] || "Data Ingestion Source",
      type: "STREAM_SOURCE",
      description: "Raw events and input stream generation",
    },
    {
      id: "flow-xform",
      label: phrases[1] || `${title} Transformer`,
      type: "PROCESSING_NODE",
      description: "Stream filter, enrichment, and normalization",
    },
    {
      id: "flow-sink",
      label: phrases[2] || "Target Analytics Sink",
      type: "STREAM_SINK",
      description: "Materialized view and downstream subscriber",
    },
  ];

  const connections: VisualConnection[] = [
    {
      from: "flow-src",
      to: "flow-xform",
      label: "raw_stream",
      relationType: "STREAM_PIPELINE",
    },
    {
      from: "flow-xform",
      to: "flow-sink",
      label: "verified_payload",
      relationType: "FILTERED_EMIT",
    },
  ];

  const spec: VisualSpecification = {
    id,
    visualType: "DATA_FLOW",
    visualFamily: "DATA_FLOW",
    title: `Data Flow Pipeline: ${title}`,
    description: `Asynchronous data transmission and transformation pipeline mapping message flow through ${title}.`,
    layout: {
      type: "DATA_FLOW",
      direction: "LR",
    },
    nodes,
    connections,
    studentFocusQuestion: `If the throughput at ${nodes[1].label} drops, where will backpressure accumulate in this pipeline?`,
    pedagogicalRationale: `A data flow diagram tracks packet transformation and highlights bottlenecks, backpressure, and data lineage.`,
    elements: nodes,
    labels: nodes.map((n) => n.label),
    annotations: [`Continuous streaming preserves temporal ordering and throughput.`],
  };

  spec.svgMarkup = renderVisualSpecificationToSvg(spec, { slideNo: context.slideNo });
  return spec;
}

export function generateComparisonMatrixVisual(context: VisualGenerationContext): VisualSpecification {
  const title = context.conceptTitle;
  const id = `matrix-${(context.slideNo || 1)}-${Math.random().toString(36).substring(2, 7)}`;

  const nodes: VisualNode[] = [
    {
      id: "mat-col1",
      label: `${title} (Optimized Approach)`,
      type: "OPTIMAL_APPROACH",
      description: "Guaranteed invariant and minimal complexity",
      metadata: {
        complexity: "O(1) Constant",
        memory: "O(1) Bounded",
        faultTolerance: "High (Fault-Tolerant)",
      },
    },
    {
      id: "mat-col2",
      label: "Baseline / Naive Approach",
      type: "BASELINE_APPROACH",
      description: "Unbuffered traversal with higher latency",
      metadata: {
        complexity: "O(N) Linear",
        memory: "O(N) Unbounded",
        faultTolerance: "Low (Fragile)",
      },
    },
  ];

  const connections: VisualConnection[] = [
    {
      from: "mat-col1",
      to: "mat-col2",
      label: "Performance Differential",
      relationType: "TRADE_OFF_COMPARISON",
      bidirectional: true,
    },
  ];

  const spec: VisualSpecification = {
    id,
    visualType: "COMPARISON_MATRIX",
    visualFamily: "COMPARISON_MATRIX",
    title: `Comparative Analysis: ${title}`,
    description: `Systematic multi-attribute trade-off matrix contrasting ${title} against conventional baselines.`,
    layout: {
      type: "COMPARISON_MATRIX",
      direction: "GRID",
    },
    nodes,
    connections,
    studentFocusQuestion: `Under what extreme operating conditions would the trade-offs of ${nodes[0].label} favor an alternative approach?`,
    pedagogicalRationale: `Juxtaposing trade-off dimensions in a matrix sharpens critical discrimination and engineering decision-making.`,
    elements: nodes,
    labels: nodes.map((n) => n.label),
    annotations: [`Comparative matrix illustrates efficiency gains and trade-off frontiers.`],
  };

  spec.svgMarkup = renderVisualSpecificationToSvg(spec, { slideNo: context.slideNo });
  return spec;
}

export function generateCauseEffectVisual(context: VisualGenerationContext): VisualSpecification {
  const title = context.conceptTitle;
  const id = `ce-${(context.slideNo || 1)}-${Math.random().toString(36).substring(2, 7)}`;
  const phrases = extractKeyPhrases(context.mechanismExplanation || context.academicTruth);

  const nodes: VisualNode[] = [
    {
      id: "ce-cause",
      label: phrases[0] || `Initial Trigger in ${title}`,
      type: "ROOT_CAUSE",
      description: "Exogenous perturbation or state boundary event",
    },
    {
      id: "ce-mech",
      label: phrases[1] || `${title} Mediator Mechanism`,
      type: "MEDIATOR_PATHWAY",
      description: "Internal propagation mechanism and dynamic reaction",
    },
    {
      id: "ce-eff1",
      label: phrases[2] || "Observable System Metric Shift",
      type: "DIRECT_OUTCOME",
      description: "Immediate deterministic effect",
    },
    {
      id: "ce-eff2",
      label: phrases[3] || "Equilibrium Stabilization",
      type: "SYSTEM_EQUILIBRIUM",
      description: "Downstream systemic stabilization",
    },
  ];

  const connections: VisualConnection[] = [
    {
      from: "ce-cause",
      to: "ce-mech",
      label: "Triggers",
      relationType: "CAUSAL_ACTIVATION",
    },
    {
      from: "ce-mech",
      to: "ce-eff1",
      label: "Drives",
      relationType: "DETERMINISTIC_IMPACT",
    },
    {
      from: "ce-mech",
      to: "ce-eff2",
      label: "Stabilizes",
      relationType: "EQUILIBRIUM_CONVERGENCE",
    },
  ];

  const spec: VisualSpecification = {
    id,
    visualType: "CAUSE_EFFECT",
    visualFamily: "CAUSE_EFFECT",
    title: `Causal Mechanism: ${title}`,
    description: `Causal pathway tracing root triggers through the core mechanism of ${title} to systemic outcomes.`,
    layout: {
      type: "CAUSE_EFFECT",
      direction: "LR",
    },
    nodes,
    connections,
    studentFocusQuestion: `If the mediating mechanism in ${nodes[1].label} is blocked, how do the downstream outcomes change?`,
    pedagogicalRationale: `Causal diagrams illuminate hidden chain reactions, disambiguating correlation from causal mechanisms.`,
    elements: nodes,
    labels: nodes.map((n) => n.label),
    annotations: [`Direct causal pathways connect trigger conditions to observable states.`],
  };

  spec.svgMarkup = renderVisualSpecificationToSvg(spec, { slideNo: context.slideNo });
  return spec;
}

export function generateQuantitativeVisual(context: VisualGenerationContext): VisualSpecification {
  const title = context.conceptTitle;
  const id = `quant-${(context.slideNo || 1)}-${Math.random().toString(36).substring(2, 7)}`;

  const nodes: VisualNode[] = [
    {
      id: "q-opt",
      label: `Optimal Operating Point (${title})`,
      type: "OPTIMAL_COORDINATE",
      description: "Point of maximal efficiency and invariant balance",
    },
    {
      id: "q-bound",
      label: "Asymptotic Stability Bound",
      type: "STABILITY_BOUNDARY",
      description: "Upper threshold where non-linear degradation begins",
    },
  ];

  const connections: VisualConnection[] = [
    {
      from: "q-opt",
      to: "q-bound",
      label: "Stability Margin",
      relationType: "PARAMETER_RANGE",
    },
  ];

  const spec: VisualSpecification = {
    id,
    visualType: "QUANTITATIVE",
    visualFamily: "QUANTITATIVE",
    title: `Quantitative Dynamics: ${title}`,
    description: `Mathematical coordinate plot exhibiting parameter sensitivity, inflection thresholds, and operating envelopes for ${title}.`,
    layout: {
      type: "QUANTITATIVE",
      direction: "LR",
    },
    nodes,
    connections,
    studentFocusQuestion: `How does operating beyond the inflection point at ${nodes[0].label} alter system scaling and stability?`,
    pedagogicalRationale: `Quantitative curves anchor theoretical formulas in visual parameter envelopes and rate dynamics.`,
    rawLatexOrData: `f(x) = \\frac{L}{1 + e^{-k(x - x_0)}}`,
    elements: nodes,
    labels: nodes.map((n) => n.label),
    annotations: [`Asymptotic curve models non-linear transition dynamics.`],
  };

  spec.svgMarkup = renderVisualSpecificationToSvg(spec, { slideNo: context.slideNo });
  return spec;
}

export function generateHierarchyVisual(context: VisualGenerationContext): VisualSpecification {
  const title = context.conceptTitle;
  const id = `hier-${(context.slideNo || 1)}-${Math.random().toString(36).substring(2, 7)}`;
  const phrases = extractKeyPhrases(context.academicTruth || context.mechanismExplanation);

  const nodes: VisualNode[] = [
    {
      id: "hier-root",
      label: `${title} Domain Root`,
      type: "ROOT_CLASSIFICATION",
      description: "Foundational taxonomy root encapsulating core axioms",
    },
    {
      id: "hier-sub1",
      label: phrases[0] || "Primary Sub-Classification A",
      type: "INTERMEDIATE_CATEGORY",
      description: "Specialized branch enforcing structural invariants",
    },
    {
      id: "hier-sub2",
      label: phrases[1] || "Primary Sub-Classification B",
      type: "INTERMEDIATE_CATEGORY",
      description: "Alternative branch exhibiting complementary behaviors",
    },
    {
      id: "hier-leaf1",
      label: phrases[2] || "Concrete Implementation α",
      type: "LEAF_SPECIALIZATION",
      description: "Concrete instance implementing leaf behavior",
    },
  ];

  const connections: VisualConnection[] = [
    {
      from: "hier-root",
      to: "hier-sub1",
      label: "categorizes",
      relationType: "TAXONOMY_INHERITANCE",
    },
    {
      from: "hier-root",
      to: "hier-sub2",
      label: "categorizes",
      relationType: "TAXONOMY_INHERITANCE",
    },
    {
      from: "hier-sub1",
      to: "hier-leaf1",
      label: "instantiates",
      relationType: "LEAF_INSTANTIATION",
    },
  ];

  const spec: VisualSpecification = {
    id,
    visualType: "HIERARCHY",
    visualFamily: "HIERARCHY",
    title: `Taxonomy Hierarchy: ${title}`,
    description: `Directed taxonomic hierarchy exhibiting classification trees, inheritance relationships, and specialization categories for ${title}.`,
    layout: {
      type: "HIERARCHY",
      direction: "TB",
    },
    nodes,
    connections,
    studentFocusQuestion: `What behavioral constraints are inherited by ${nodes[3]?.label || nodes[1].label} from ${nodes[0].label}?`,
    pedagogicalRationale: `Hierarchical classification establishes clear inheritance, scope boundaries, and taxonomic relationships.`,
    elements: nodes,
    labels: nodes.map((n) => n.label),
    annotations: [`Taxonomy DAG enforces strict subtype substitutability.`],
  };

  spec.svgMarkup = renderVisualSpecificationToSvg(spec, { slideNo: context.slideNo });
  return spec;
}

// ---------------------------------------------------------------------------
// Master Generation Entry Point
// ---------------------------------------------------------------------------

export function generateVisualSpecification(context: VisualGenerationContext): VisualSpecification {
  const family = inferVisualFamily(context);

  switch (family) {
    case "SYSTEM_ARCHITECTURE":
      return generateSystemArchitectureVisual(context);
    case "DATA_FLOW":
      return generateDataFlowVisual(context);
    case "COMPARISON_MATRIX":
      return generateComparisonMatrixVisual(context);
    case "CAUSE_EFFECT":
      return generateCauseEffectVisual(context);
    case "QUANTITATIVE":
      return generateQuantitativeVisual(context);
    case "HIERARCHY":
      return generateHierarchyVisual(context);
    case "PROCESS":
    default:
      return generateProcessVisual(context);
  }
}
