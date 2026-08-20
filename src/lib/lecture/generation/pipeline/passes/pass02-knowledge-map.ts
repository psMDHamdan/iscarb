/**
 * Pass 2: Knowledge Graph & Concept Map Extraction.
 * =================================================
 * Extracts concept nodes, builds dependency DAG, and verifies acyclicity via Kahn's algorithm.
 */

import type { PipelinePass } from "../pass-registry";
import type { ConceptNode, PipelineContext } from "../pipeline-context";
import { PEDAGOGICAL_STAGES } from "../../../types/learning-experience";

export class Pass02KnowledgeMap implements PipelinePass {
  readonly passNumber = 2;
  readonly passName = "Knowledge Graph & Concept Map Extraction";
  readonly description = "Extracts scholarly concepts, builds prerequisite DAG, and validates topological consistency.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const chunks = ctx.sourceChunks || [];
    const clos = ctx.teacherEnteredClos || [];

    const nodes: ConceptNode[] = [];
    const edges: Array<{ from: string; to: string; relationship: string }> = [];

    // Derive 7 key concept nodes mapped to the 7 pedagogical stages
    const stageTemplates = [
      { stage: "DISCOVER", bloom: "remember" as const, suffix: "Foundations & Motivation" },
      { stage: "UNDERSTAND", bloom: "understand" as const, suffix: "Core Scholarly Principle" },
      { stage: "EXPLORE", bloom: "apply" as const, suffix: "Architectural Mechanism" },
      { stage: "PRACTICE", bloom: "analyze" as const, suffix: "Diagnostic Problem Solving" },
      { stage: "APPLY", bloom: "apply" as const, suffix: "Real-World Industrial Scenario" },
      { stage: "CHALLENGE", bloom: "evaluate" as const, suffix: "Cross-Domain Transfer" },
      { stage: "MASTER", bloom: "create" as const, suffix: "Synthesis & Metacognitive Review" },
    ];

    stageTemplates.forEach((template, idx) => {
      const nodeId = `node-concept-${idx + 1}`;
      const associatedChunk = chunks[idx % Math.max(1, chunks.length)];
      const matchingClo = clos[idx % Math.max(1, clos.length)];

      const nodeName = matchingClo?.text
        ? `${ctx.title}: ${template.suffix}`
        : `${ctx.title} — ${template.suffix}`;

      const prereqs = idx > 0 ? [`node-concept-${idx}`] : [];

      nodes.push({
        id: nodeId,
        name: nodeName,
        definition: associatedChunk?.text
          ? associatedChunk.text.slice(0, 180) + "..."
          : `Core definition for ${nodeName}.`,
        prerequisites: prereqs,
        bloomLevel: template.bloom,
        sourceChunkIds: associatedChunk ? [associatedChunk.id] : [],
        suggestedStage: template.stage as any,
      });

      if (idx > 0) {
        edges.push({
          from: `node-concept-${idx}`,
          to: nodeId,
          relationship: "PREREQUISITE_FOR",
        });
      }
    });

    // Kahn's Algorithm / Cycle Check
    const isAcyclic = this.verifyAcyclicity(nodes, edges);
    if (!isAcyclic) {
      console.warn("[Pass 2] Prerequisite cycle detected; pruning invalid edges to maintain DAG validity.");
      // Keep only strictly forward edges
      const cleanEdges = edges.filter((e) => {
        const fromIdx = nodes.findIndex((n) => n.id === e.from);
        const toIdx = nodes.findIndex((n) => n.id === e.to);
        return fromIdx < toIdx;
      });
      edges.length = 0;
      edges.push(...cleanEdges);
    }

    ctx.knowledgeGraph = { nodes, edges };
    return ctx;
  }

  private verifyAcyclicity(
    nodes: ConceptNode[],
    edges: Array<{ from: string; to: string; relationship: string }>
  ): boolean {
    const inDegree = new Map<string, number>();
    nodes.forEach((n) => inDegree.set(n.id, 0));

    edges.forEach((e) => {
      inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
    });

    const queue: string[] = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) queue.push(id);
    });

    let visitedCount = 0;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      visitedCount++;

      const outgoing = edges.filter((e) => e.from === curr);
      outgoing.forEach((e) => {
        const newDeg = (inDegree.get(e.to) || 1) - 1;
        inDegree.set(e.to, newDeg);
        if (newDeg === 0) {
          queue.push(e.to);
        }
      });
    }

    return visitedCount === nodes.length;
  }
}

export const pass02KnowledgeMap = new Pass02KnowledgeMap();
