import type {
  ConceptNode,
  DAGValidationResult,
  LearningStage,
  StagePrerequisitesResult,
} from "./types";

/**
 * Concept Graph & Pedagogical Prerequisite DAG.
 * Supports cycle detection via 3-color DFS, deterministic Kahn's topological sort,
 * transitive dependency resolution, and learning stage gating across 7 stages.
 */
export class ConceptGraph {
  private nodes = new Map<string, ConceptNode>();
  private prerequisitesMap = new Map<string, Set<string>>(); // conceptId -> Set of prerequisiteIds
  private dependentsMap = new Map<string, Set<string>>(); // conceptId -> Set of dependentIds

  /**
   * Adds or updates a concept node in the DAG.
   */
  addConcept(concept: ConceptNode): void {
    if (concept.stage < 1 || concept.stage > 7) {
      throw new Error(
        `Invalid learning stage: ${concept.stage}. Must be between 1 and 7.`
      );
    }

    const clonedNode: ConceptNode = {
      ...concept,
      sourceBlockIds: [...(concept.sourceBlockIds || [])],
      prerequisites: [...(concept.prerequisites || [])],
    };

    this.nodes.set(clonedNode.id, clonedNode);

    if (!this.prerequisitesMap.has(clonedNode.id)) {
      this.prerequisitesMap.set(clonedNode.id, new Set());
    }
    if (!this.dependentsMap.has(clonedNode.id)) {
      this.dependentsMap.set(clonedNode.id, new Set());
    }

    for (const prereqId of clonedNode.prerequisites) {
      this.addPrerequisite(clonedNode.id, prereqId);
    }
  }

  /**
   * Registers a directed prerequisite relationship (conceptId requires prerequisiteId).
   */
  addPrerequisite(conceptId: string, prerequisiteId: string): void {
    if (!this.prerequisitesMap.has(conceptId)) {
      this.prerequisitesMap.set(conceptId, new Set());
    }
    if (!this.dependentsMap.has(prerequisiteId)) {
      this.dependentsMap.set(prerequisiteId, new Set());
    }

    this.prerequisitesMap.get(conceptId)!.add(prerequisiteId);
    this.dependentsMap.get(prerequisiteId)!.add(conceptId);

    const node = this.nodes.get(conceptId);
    if (node && !node.prerequisites.includes(prerequisiteId)) {
      node.prerequisites.push(prerequisiteId);
    }
  }

  /**
   * Validates if the concept graph is a valid Directed Acyclic Graph (DAG).
   * Uses 3-Color DFS to locate and reconstruct back-edge cycle paths.
   */
  validateDAG(): DAGValidationResult {
    const visited = new Map<string, number>(); // 0: WHITE, 1: GRAY, 2: BLACK
    const parent = new Map<string, string>();
    let cyclePath: string[] | undefined;

    const dfs = (nodeId: string): boolean => {
      visited.set(nodeId, 1); // GRAY (active in current DFS stack)
      const prereqs = Array.from(this.prerequisitesMap.get(nodeId) || []);

      for (const pId of prereqs) {
        // Skip edges pointing to unregistered nodes in cycle check
        if (!this.nodes.has(pId)) continue;

        const color = visited.get(pId) || 0;
        if (color === 1) {
          // Back-edge detected! Reconstruct the cycle path
          const path: string[] = [pId, nodeId];
          let curr = nodeId;
          while (curr && curr !== pId) {
            curr = parent.get(curr)!;
            if (curr && !path.includes(curr)) {
              path.push(curr);
            } else {
              break;
            }
          }
          path.push(pId);
          cyclePath = path.reverse();
          return false;
        }

        if (color === 0) {
          parent.set(pId, nodeId);
          if (!dfs(pId)) {
            return false;
          }
        }
      }

      visited.set(nodeId, 2); // BLACK (fully explored)
      return true;
    };

    for (const nodeId of Array.from(this.nodes.keys())) {
      if ((visited.get(nodeId) || 0) === 0) {
        if (!dfs(nodeId)) {
          return { isAcyclic: false, cycle: cyclePath };
        }
      }
    }

    return { isAcyclic: true };
  }

  /**
   * Computes a deterministic topological ordering using Kahn's algorithm.
   * Prerequisites are guaranteed to appear before dependent concepts.
   */
  getTopologicalOrder(): ConceptNode[] {
    const validation = this.validateDAG();
    if (!validation.isAcyclic) {
      throw new Error(
        `Cannot compute topological order on cyclic concept graph. Cycle detected: ${validation.cycle?.join(" -> ")}`
      );
    }

    // In prerequisite graph: node in-degree = number of unsatisfied registered prerequisites
    const inDegree = new Map<string, number>();
    for (const [id, node] of Array.from(this.nodes.entries())) {
      const prereqs = Array.from(this.prerequisitesMap.get(id) || []);
      let validCount = 0;
      for (const pId of prereqs) {
        if (this.nodes.has(pId)) {
          validCount++;
        }
      }
      inDegree.set(id, validCount);
    }

    // Queue nodes with 0 prerequisites
    const queue: string[] = [];
    for (const [id, deg] of Array.from(inDegree.entries())) {
      if (deg === 0) {
        queue.push(id);
      }
    }

    // Deterministic initial queue sort: (stage ASC, id ASC)
    queue.sort((a, b) => {
      const nodeA = this.nodes.get(a)!;
      const nodeB = this.nodes.get(b)!;
      return nodeA.stage - nodeB.stage || nodeA.id.localeCompare(nodeB.id);
    });

    const result: ConceptNode[] = [];

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const currNode = this.nodes.get(currId)!;
      result.push(currNode);

      const dependents = Array.from(this.dependentsMap.get(currId) || []);
      const nextCandidates: string[] = [];

      for (const depId of dependents) {
        if (!this.nodes.has(depId)) continue;
        const currentDeg = inDegree.get(depId) || 1;
        const newDeg = currentDeg - 1;
        inDegree.set(depId, newDeg);

        if (newDeg === 0) {
          nextCandidates.push(depId);
        }
      }

      // Sort newly unblocked candidates deterministically
      nextCandidates.sort((a, b) => {
        const nodeA = this.nodes.get(a)!;
        const nodeB = this.nodes.get(b)!;
        return nodeA.stage - nodeB.stage || nodeA.id.localeCompare(nodeB.id);
      });

      queue.push(...nextCandidates);
    }

    if (result.length !== this.nodes.size) {
      throw new Error("Topological sort failed to resolve all registered nodes.");
    }

    return result;
  }

  /**
   * Retrieves prerequisites for a given concept.
   * If recursive is true, traverses the entire prerequisite ancestor closure.
   */
  getPrerequisitesFor(conceptId: string, recursive = false): ConceptNode[] {
    if (!this.nodes.has(conceptId)) {
      return [];
    }

    if (!recursive) {
      const directPrereqIds = Array.from(this.prerequisitesMap.get(conceptId) || []);
      return directPrereqIds
        .map((id) => this.nodes.get(id)!)
        .filter(Boolean);
    }

    const visited = new Set<string>();
    const queue = Array.from(this.prerequisitesMap.get(conceptId) || []);

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const nextPrereqs = Array.from(this.prerequisitesMap.get(id) || []);
      for (const nextId of nextPrereqs) {
        if (!visited.has(nextId)) {
          queue.push(nextId);
        }
      }
    }

    return Array.from(visited)
      .map((id) => this.nodes.get(id)!)
      .filter(Boolean);
  }

  /**
   * Retrieves direct or transitive dependent concepts that require this concept.
   */
  getDependentsFor(conceptId: string, recursive = false): ConceptNode[] {
    if (!this.nodes.has(conceptId)) {
      return [];
    }

    if (!recursive) {
      const directDepIds = Array.from(this.dependentsMap.get(conceptId) || []);
      return directDepIds
        .map((id) => this.nodes.get(id)!)
        .filter(Boolean);
    }

    const visited = new Set<string>();
    const queue = Array.from(this.dependentsMap.get(conceptId) || []);

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const nextDeps = Array.from(this.dependentsMap.get(id) || []);
      for (const nextId of nextDeps) {
        if (!visited.has(nextId)) {
          queue.push(nextId);
        }
      }
    }

    return Array.from(visited)
      .map((id) => this.nodes.get(id)!)
      .filter(Boolean);
  }

  /**
   * Verifies if a learner who mastered masteredConceptIds has satisfied all prerequisites
   * required to enter targetStage (stages 1..7).
   */
  checkStagePrerequisites(
    targetStage: LearningStage,
    masteredConceptIds: string[]
  ): StagePrerequisitesResult {
    const masteredSet = new Set(masteredConceptIds);
    const requiredConceptsMap = new Map<string, ConceptNode>();

    // 1. All concepts from earlier stages (< targetStage) must be mastered
    for (const concept of Array.from(this.nodes.values())) {
      if (concept.stage < targetStage) {
        requiredConceptsMap.set(concept.id, concept);
      }
    }

    // 2. All transitive prerequisites of concepts in targetStage must be mastered
    for (const concept of Array.from(this.nodes.values())) {
      if (concept.stage === targetStage) {
        const prereqs = this.getPrerequisitesFor(concept.id, true);
        for (const p of prereqs) {
          requiredConceptsMap.set(p.id, p);
        }
      }
    }

    const requiredConcepts = Array.from(requiredConceptsMap.values());
    const missing = requiredConcepts.filter((c) => !masteredSet.has(c.id));

    // Sort missing deterministically by (stage ASC, id ASC)
    missing.sort((a, b) => a.stage - b.stage || a.id.localeCompare(b.id));

    return {
      satisfied: missing.length === 0,
      missing,
    };
  }

  /**
   * Retrieves a concept node by ID.
   */
  getConcept(id: string): ConceptNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Returns all concept nodes registered in the graph.
   */
  getAllConcepts(): ConceptNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Returns concepts belonging to a specific learning stage.
   */
  getConceptsByStage(stage: LearningStage): ConceptNode[] {
    return Array.from(this.nodes.values()).filter((c) => c.stage === stage);
  }

  /**
   * Total number of concept nodes.
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Clears the graph.
   */
  clear(): void {
    this.nodes.clear();
    this.prerequisitesMap.clear();
    this.dependentsMap.clear();
  }
}
