/**
 * Ontology-AI Engine — bridges the ontology knowledge graph with LLM reasoning.
 * Combines SPARQL/RDF queries, vector search, and structured prompts for
 * ontology-aware AI answers with full traceability.
 */
import "server-only";

import { OntologyEngine, type OntologyClass, type ObjectProperty, type DatatypeProperty } from "@/lib/ontology/engine";
import { chatJson, type ChatResult } from "@/lib/ai-engine";
import { vectorEmbeddingsService } from "@/services/vector/vector-embeddings.service";
import { rdfClient } from "@/services/rdf/rdf-client.service";
import { moduleLogger } from "@/config/logger";

const log = moduleLogger("ontology-ai-engine");

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AiAnswer {
  answer: string;
  sources: AiSource[];
  reasoningSteps: string[];
  confidence: number;
  entities: string[];
}

export interface AiSource {
  type: "sparql" | "vector" | "sql" | "ontology";
  query: string;
  result: unknown;
  description: string;
}

export interface ReasoningGraph {
  nodes: ReasoningNode[];
  edges: ReasoningEdge[];
}

export interface ReasoningNode {
  id: string;
  label: string;
  type: "entity" | "data" | "inference" | "query" | "source";
}

export interface ReasoningEdge {
  from: string;
  to: string;
  label: string;
}

// ─── Engine ─────────────────────────────────────────────────────────────────

export class OntologyAiEngine {
  private ontology: OntologyEngine;

  constructor(ontology: OntologyEngine) {
    this.ontology = ontology;
  }

  /**
   * Answer a question using ontology-aware reasoning.
   * Pipeline: extract entities → generate SPARQL → execute → vector search → LLM.
   */
  async answerWithOntology(question: string): Promise<AiAnswer> {
    const reasoningSteps: string[] = [];
    const sources: AiSource[] = [];
    const allEntities: string[] = [];

    // Step 1: Extract entities from the question
    reasoningSteps.push("Extracting entities from question...");
    const entities = this.extractEntities(question);
    allEntities.push(...entities);
    reasoningSteps.push(`Identified ${entities.length} entity/entities: ${entities.join(", ") || "(none detected)"}`);

    // Step 2: Generate and execute SPARQL query
    reasoningSteps.push("Generating SPARQL query from ontology schema...");
    const sparqlResults = await this.executeSparqlQuery(question, entities);
    if (sparqlResults.length > 0) {
      sources.push({
        type: "sparql",
        query: this.buildSparqlQuery(entities),
        result: sparqlResults,
        description: `SPARQL query returned ${sparqlResults.length} result(s)`,
      });
      reasoningSteps.push(`SPARQL query returned ${sparqlResults.length} result(s)`);
    } else {
      reasoningSteps.push("SPARQL query returned no results — falling back to vector search");
    }

    // Step 3: Vector search for semantic matches
    reasoningSteps.push("Searching vector embeddings for semantic matches...");
    const vectorResults = await this.vectorSearch(question);
    if (vectorResults.length > 0) {
      sources.push({
        type: "vector",
        query: question,
        result: vectorResults,
        description: `Vector search returned ${vectorResults.length} result(s)`,
      });
      reasoningSteps.push(`Vector search returned ${vectorResults.length} result(s)`);
    }

    // Step 4: Pull ontology schema context
    reasoningSteps.push("Building ontology context from schema...");
    const ontologyContext = this.buildOntologyContext();
    sources.push({
      type: "ontology",
      query: "ontology-schema",
      result: {
        classes: this.ontology.classes.size,
        objectProperties: this.ontology.objectProperties.size,
        datatypeProperties: this.ontology.datatypeProperties.size,
        individuals: this.ontology.individuals.size,
      },
      description: `Ontology has ${this.ontology.classes.size} classes, ${this.ontology.objectProperties.size} object properties`,
    });

    // Step 5: Build LLM context and get answer
    reasoningSteps.push("Building context and querying LLM...");
    const context = this.buildContext(question, sparqlResults, vectorResults, ontologyContext);
    const llmResult = await this.queryLlm(question, context);

    reasoningSteps.push("Generating reasoning graph...");
    reasoningSteps.push("Answer generated with confidence assessment");

    return {
      answer: llmResult.answer,
      sources,
      reasoningSteps,
      confidence: llmResult.confidence,
      entities: allEntities,
    };
  }

  /**
   * Generate a reasoning graph from an answer for visualization.
   */
  generateReasoningGraph(answer: AiAnswer): ReasoningGraph {
    const nodes: ReasoningNode[] = [];
    const edges: ReasoningEdge[] = [];

    // Add question node
    nodes.push({ id: "question", label: "Question", type: "query" });

    // Add entity nodes
    for (const entity of answer.entities) {
      const nodeId = `entity-${entity.toLowerCase().replace(/\s+/g, "-")}`;
      nodes.push({ id: nodeId, label: entity, type: "entity" });
      edges.push({ from: "question", to: nodeId, label: "mentions" });
    }

    // Add source nodes
    for (let i = 0; i < answer.sources.length; i++) {
      const source = answer.sources[i];
      const nodeId = `source-${i}`;
      nodes.push({ id: nodeId, label: `${source.type.toUpperCase()}: ${source.description}`, type: "source" });
      edges.push({ from: "question", to: nodeId, label: "retrieved from" });
    }

    // Add reasoning step nodes
    for (let i = 0; i < answer.reasoningSteps.length; i++) {
      const nodeId = `step-${i}`;
      nodes.push({ id: nodeId, label: answer.reasoningSteps[i], type: "inference" });
      if (i === 0) {
        edges.push({ from: "question", to: nodeId, label: "triggers" });
      } else {
        edges.push({ from: `step-${i - 1}`, to: nodeId, label: "follows" });
      }
    }

    // Add answer node
    nodes.push({ id: "answer", label: answer.answer.substring(0, 80) + (answer.answer.length > 80 ? "..." : ""), type: "data" });
    if (answer.reasoningSteps.length > 0) {
      edges.push({ from: `step-${answer.reasoningSteps.length - 1}`, to: "answer", label: "produces" });
    }

    return { nodes, edges };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * NER-lite: identify ontology entity types in the question using schema awareness.
   */
  extractEntities(question: string): string[] {
    const entities: string[] = [];
    const qLower = question.toLowerCase();

    // Match against ontology class names and labels
    for (const [, cls] of this.ontology.classes) {
      const nameLower = cls.name.toLowerCase();
      const labelLower = cls.label.toLowerCase();
      if (qLower.includes(nameLower) || qLower.includes(labelLower)) {
        entities.push(cls.name);
      }
    }

    // Match against individual IDs and property names
    for (const [, ind] of this.ontology.individuals) {
      if (qLower.includes(ind.id.toLowerCase())) {
        entities.push(ind.id);
      }
    }

    // Fallback: extract capitalized multi-word patterns
    if (entities.length === 0) {
      const patterns = [
        /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,
        /\b(?:Student|Faculty|Course|Assessment|Competency|Skill|Job|Employer|Project|Research|University|Department|Program|Unit|CLO|PLO|ACA)\b/gi,
      ];
      for (const pattern of patterns) {
        const matches = question.matchAll(pattern);
        for (const match of matches) {
          entities.push(match[0]);
        }
      }
    }

    return [...new Set(entities)];
  }

  /**
   * Build a SPARQL query from entities extracted from the question.
   */
  private buildSparqlQuery(entities: string[]): string {
    if (entities.length === 0) {
      return `SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10`;
    }

    const filters = entities
      .map((e) => `CONTAINS(LCASE(STR(?s)), LCASE("${e}")) || CONTAINS(LCASE(STR(?o)), LCASE("${e}"))`)
      .join(" || ");

    return `
      SELECT ?s ?sLabel ?p ?o ?oLabel WHERE {
        ?s ?p ?o .
        OPTIONAL { ?s iscarb:hasName ?sLabel }
        OPTIONAL { ?o iscarb:hasName ?oLabel }
        FILTER(${filters})
      } LIMIT 20
    `;
  }

  /**
   * Execute a SPARQL query against the triple store.
   */
  private async executeSparqlQuery(
    question: string,
    entities: string[],
  ): Promise<Array<{ subject: string; predicate: string; object: string }>> {
    try {
      const sparql = this.buildSparqlQuery(entities);
      const result = await rdfClient.query(sparql);

      return (result?.results?.bindings || []).map((b: Record<string, { value: string }>) => ({
        subject: b.sLabel?.value || b.s?.value || "",
        predicate: (b.p?.value || "").split("/").pop() || "",
        object: b.oLabel?.value || b.o?.value || "",
      }));
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "SPARQL query failed, returning empty results");
      return [];
    }
  }

  /**
   * Vector search for semantically similar content.
   */
  private async vectorSearch(query: string): Promise<Array<{ content: string; similarity: number; entityType: string }>> {
    try {
      return await vectorEmbeddingsService.searchSimilar(query, undefined, undefined, 5);
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "Vector search failed");
      return [];
    }
  }

  /**
   * Build a string summarizing the ontology schema for LLM context.
   */
  private buildOntologyContext(): string {
    const lines: string[] = ["=== ONTOLOGY SCHEMA ==="];

    lines.push("\nClasses:");
    for (const [, cls] of this.ontology.classes) {
      const parent = cls.parentClass ? ` (extends ${cls.parentClass})` : "";
      lines.push(`  - ${cls.name} [${cls.id}]${parent}: ${cls.description || "(no description)"}`);
    }

    lines.push("\nObject Properties:");
    for (const [, prop] of this.ontology.objectProperties) {
      lines.push(`  - ${prop.name}: ${prop.domain} → ${prop.range}`);
    }

    lines.push("\nDatatype Properties:");
    for (const [, prop] of this.ontology.datatypeProperties) {
      lines.push(`  - ${prop.name} (${prop.datatype}): ${prop.domain}`);
    }

    if (this.ontology.individuals.size > 0) {
      lines.push("\nIndividuals:");
      for (const [, ind] of this.ontology.individuals) {
        lines.push(`  - ${ind.id}: instance of ${ind.classType}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Build the full context string for the LLM prompt.
   */
  private buildContext(
    question: string,
    sparqlResults: Array<{ subject: string; predicate: string; object: string }>,
    vectorResults: Array<{ content: string; similarity: number; entityType: string }>,
    ontologyContext: string,
  ): string {
    const parts: string[] = [];

    parts.push(ontologyContext);

    if (sparqlResults.length > 0) {
      parts.push("\n=== KNOWLEDGE GRAPH RESULTS ===");
      parts.push(sparqlResults.map((t) => `${t.subject} —[${t.predicate}]→ ${t.object}`).join("\n"));
    }

    if (vectorResults.length > 0) {
      parts.push("\n=== SEMANTIC SEARCH RESULTS ===");
      parts.push(vectorResults.map((r) => `[${r.entityType}] ${r.content}`).join("\n"));
    }

    return parts.join("\n\n");
  }

  /**
   * Send context + question to LLM for a structured answer.
   */
  private async queryLlm(
    question: string,
    context: string,
  ): Promise<{ answer: string; confidence: number }> {
    const systemPrompt = `You are an ontology-aware AI assistant for iSCARB, a higher education readiness platform.
You have access to an ontology schema and knowledge graph data.
Answer the user's question using ONLY the provided context.
If the context does not contain enough information, say so honestly.
Provide a confidence score (0-1) based on how well the context supports your answer.
Return STRICT JSON: { "answer": string, "confidence": number }`;

    const userMessage = `=== QUESTION ===\n${question}\n\n=== AVAILABLE CONTEXT ===\n${context}\n\nAnswer the question based on the context above. Be precise and cite specific ontology classes/properties when relevant.`;

    try {
      const result = await chatJson({
        system: systemPrompt,
        user: userMessage,
        temperature: 0.3,
      });

      const json = result.json as Record<string, unknown>;
      return {
        answer: String(json.answer || "No answer generated."),
        confidence: Math.max(0, Math.min(1, Number(json.confidence) || 0.5)),
      };
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "LLM query failed, returning fallback answer");
      return {
        answer: `Based on the ontology with ${this.ontology.classes.size} classes and ${this.ontology.objectProperties.size} object properties, I was unable to generate a complete answer. The query context has been assembled but the LLM is temporarily unavailable.`,
        confidence: 0.2,
      };
    }
  }
}
