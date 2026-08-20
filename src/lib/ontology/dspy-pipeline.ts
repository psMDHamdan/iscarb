/**
 * DSPy-style RAG Pipeline — structured retrieve → reason → respond → reflect
 * chain for ontology-aware question answering with full traceability.
 */
import "server-only";

import { OntologyEngine } from "@/lib/ontology/engine";
import { OntologyAiEngine, type AiSource } from "@/lib/ontology/ai-engine";
import { chatJson, chatText } from "@/lib/ai-engine";
import { vectorEmbeddingsService } from "@/services/vector/vector-embeddings.service";
import { rdfClient } from "@/services/rdf/rdf-client.service";
import { db } from "@/lib/db";
import { moduleLogger } from "@/config/logger";

const log = moduleLogger("dspy-pipeline");

/** Escape special characters in SPARQL string literals to prevent injection */
function escapeSparqlString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContextChunk {
  content: string;
  source: "sparql" | "vector" | "sql" | "ontology";
  relevance: number;
  metadata?: Record<string, unknown>;
}

export interface ReasoningResult {
  steps: string[];
  intermediateConclusion: string;
  confidenceBeforeReflection: number;
  entitiesReferenced: string[];
  sourcesUsed: string[];
}

export interface ReflectionResult {
  score: number;
  gaps: string[];
  suggestions: string[];
  isAcceptable: boolean;
}

export interface PipelineResult {
  answer: string;
  reasoning: ReasoningResult;
  reflection: ReflectionResult;
  sources: AiSource[];
  trace: TraceStep[];
}

export interface TraceStep {
  step: number;
  name: string;
  input: string;
  output: string;
  durationMs: number;
  status: "success" | "partial" | "failed";
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

export class OntologyRagPipeline {
  private engine: OntologyAiEngine;
  private ontology: OntologyEngine;

  constructor(ontology: OntologyEngine) {
    this.ontology = ontology;
    this.engine = new OntologyAiEngine(ontology);
  }

  /**
   * Execute the full RAG pipeline: retrieve → reason → respond → reflect.
   */
  async run(question: string): Promise<PipelineResult> {
    const trace: TraceStep[] = [];
    let stepNum = 0;

    // Phase 1: Retrieve
    const retrieveStart = Date.now();
    const contextChunks = await this.retrieve(question);
    trace.push({
      step: ++stepNum,
      name: "retrieve",
      input: question,
      output: `Retrieved ${contextChunks.length} context chunks (${contextChunks.map((c) => c.source).join(", ")})`,
      durationMs: Date.now() - retrieveStart,
      status: contextChunks.length > 0 ? "success" : "partial",
    });

    // Phase 2: Reason
    const reasonStart = Date.now();
    const reasoning = await this.reason(question, contextChunks);
    trace.push({
      step: ++stepNum,
      name: "reason",
      input: `${contextChunks.length} context chunks`,
      output: reasoning.intermediateConclusion,
      durationMs: Date.now() - reasonStart,
      status: "success",
    });

    // Phase 3: Respond
    const respondStart = Date.now();
    const answer = await this.respond(question, reasoning);
    trace.push({
      step: ++stepNum,
      name: "respond",
      input: reasoning.intermediateConclusion,
      output: answer.substring(0, 200) + (answer.length > 200 ? "..." : ""),
      durationMs: Date.now() - respondStart,
      status: "success",
    });

    // Phase 4: Reflect
    const reflectStart = Date.now();
    const reflection = await this.reflect(question, answer);
    trace.push({
      step: ++stepNum,
      name: "reflect",
      input: answer.substring(0, 200),
      output: `Score: ${reflection.score}/10, Acceptable: ${reflection.isAcceptable}`,
      durationMs: Date.now() - reflectStart,
      status: reflection.isAcceptable ? "success" : "partial",
    });

    // Build sources list
    const sources: AiSource[] = contextChunks.map((chunk) => ({
      type: chunk.source,
      query: question,
      result: chunk.content,
      description: `Chunk from ${chunk.source} (relevance: ${chunk.relevance.toFixed(2)})`,
    }));

    return { answer, reasoning, reflection, sources, trace };
  }

  /**
   * Hybrid retrieval: SQL + RDF + Vector.
   */
  async retrieve(question: string): Promise<ContextChunk[]> {
    const chunks: ContextChunk[] = [];
    const entities = this.engine.extractEntities(question);

    // 1. Ontology schema context
    const ontologyChunks = this.retrieveFromOntology(entities);
    chunks.push(...ontologyChunks);

    // 2. SPARQL/KG retrieval
    const kgChunks = await this.retrieveFromKnowledgeGraph(question, entities);
    chunks.push(...kgChunks);

    // 3. Vector retrieval
    const vectorChunks = await this.retrieveFromVector(question);
    chunks.push(...vectorChunks);

    // 4. SQL/DB retrieval
    const sqlChunks = await this.retrieveFromDatabase(question);
    chunks.push(...sqlChunks);

    // Sort by relevance and cap at 10
    return chunks.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
  }

  /**
   * Chain-of-thought reasoning over retrieved context.
   */
  async reason(question: string, context: ContextChunk[]): Promise<ReasoningResult> {
    const steps: string[] = [];
    const sourcesUsed: string[] = [...new Set(context.map((c) => c.source))];

    steps.push(`Analyzed ${context.length} context chunks from sources: ${sourcesUsed.join(", ")}`);

    const entitiesReferenced = this.engine.extractEntities(question);
    if (entitiesReferenced.length > 0) {
      steps.push(`Referenced ontology entities: ${entitiesReferenced.join(", ")}`);
    }

    const kgChunks = context.filter((c) => c.source === "sparql");
    if (kgChunks.length > 0) {
      steps.push(`Found ${kgChunks.length} knowledge graph triple(s) relevant to the question`);
    }

    const vectorChunks = context.filter((c) => c.source === "vector");
    if (vectorChunks.length > 0) {
      steps.push(`Found ${vectorChunks.length} semantically similar document(s)`);
    }

    // Build context summary for intermediate reasoning
    const contextSummary = context.map((c) => `[${c.source}] ${c.content}`).join("\n\n");

    try {
      const result = await chatJson({
        system: `You are a reasoning engine. Given the question and context, perform chain-of-thought reasoning.
Break down the reasoning into clear steps. Provide an intermediate conclusion.
Return STRICT JSON: { "steps": [string], "conclusion": string, "confidence": number }`,
        user: `Question: ${question}\n\nContext:\n${contextSummary}\n\nReason step by step.`,
        temperature: 0.2,
      });

      const json = result.json as Record<string, unknown>;
      const llmSteps = Array.isArray(json.steps) ? (json.steps as string[]) : [];
      steps.push(...llmSteps);

      return {
        steps,
        intermediateConclusion: String(json.conclusion || "Unable to derive conclusion"),
        confidenceBeforeReflection: Math.max(0, Math.min(1, Number(json.confidence) || 0.5)),
        entitiesReferenced,
        sourcesUsed,
      };
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "LLM reasoning failed, using heuristic");
      steps.push("LLM reasoning unavailable — using heuristic analysis");
      return {
        steps,
        intermediateConclusion: `Based on ${context.length} context pieces from ${sourcesUsed.join("/")} sources, the question relates to: ${entitiesReferenced.join(", ") || "general ontology query"}.`,
        confidenceBeforeReflection: 0.3,
        entitiesReferenced,
        sourcesUsed,
      };
    }
  }

  /**
   * Generate the final answer from reasoning result.
   */
  async respond(question: string, reasoning: ReasoningResult): Promise<string> {
    try {
      const result = await chatText({
        system: `You are an ontology-aware AI assistant for iSCARB. Provide a clear, concise answer based on the reasoning below.
Ground your answer in the ontology and knowledge graph. Cite specific classes/properties when relevant.
If the reasoning confidence is low, acknowledge the uncertainty.`,
        user: `Question: ${question}\n\nReasoning Steps:\n${reasoning.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nIntermediate Conclusion: ${reasoning.intermediateConclusion}\n\nProvide the final answer.`,
        temperature: 0.4,
      });

      return result.content || "Unable to generate answer.";
    } catch {
      return reasoning.intermediateConclusion;
    }
  }

  /**
   * Self-evaluation: reflect on the answer quality.
   */
  async reflect(question: string, answer: string): Promise<ReflectionResult> {
    try {
      const result = await chatJson({
        system: `You are a self-reflection module. Evaluate the quality of the given answer to the question.
Score 0-10. Identify gaps and suggest improvements.
Return STRICT JSON: { "score": number, "gaps": [string], "suggestions": [string], "acceptable": boolean }`,
        user: `Question: ${question}\n\nAnswer: ${answer}\n\nEvaluate the answer quality.`,
        temperature: 0.1,
      });

      const json = result.json as Record<string, unknown>;
      const score = Math.max(0, Math.min(10, Number(json.score) || 5));
      return {
        score,
        gaps: Array.isArray(json.gaps) ? (json.gaps as string[]) : [],
        suggestions: Array.isArray(json.suggestions) ? (json.suggestions as string[]) : [],
        isAcceptable: score >= 6 || Boolean(json.acceptable),
      };
    } catch {
      return { score: 5, gaps: ["Reflection unavailable"], suggestions: [], isAcceptable: true };
    }
  }

  // ─── Private retrieval helpers ──────────────────────────────────────────

  private retrieveFromOntology(entities: string[]): ContextChunk[] {
    const chunks: ContextChunk[] = [];

    for (const entity of entities) {
      const entityLower = entity.toLowerCase();

      // Match classes
      for (const [, cls] of this.ontology.classes) {
        if (cls.name.toLowerCase().includes(entityLower) || cls.label.toLowerCase().includes(entityLower)) {
          chunks.push({
            content: `Class: ${cls.name} (${cls.id}) — ${cls.description || "no description"}. Parent: ${cls.parentClass || "none"}. Properties: ${cls.restrictions.length} restrictions.`,
            source: "ontology",
            relevance: 0.9,
            metadata: { classId: cls.id, type: "class" },
          });
        }
      }

      // Match object properties
      for (const [, prop] of this.ontology.objectProperties) {
        if (prop.name.toLowerCase().includes(entityLower)) {
          chunks.push({
            content: `Property: ${prop.name} — ${prop.domain} → ${prop.range}. Characteristics: ${prop.characteristics.join(", ") || "none"}.`,
            source: "ontology",
            relevance: 0.7,
            metadata: { propertyId: prop.id, type: "objectProperty" },
          });
        }
      }

      // Match datatype properties
      for (const [, prop] of this.ontology.datatypeProperties) {
        if (prop.name.toLowerCase().includes(entityLower)) {
          chunks.push({
            content: `Datatype Property: ${prop.name} (${prop.datatype}) on ${prop.domain}. Required: ${prop.required}.`,
            source: "ontology",
            relevance: 0.7,
            metadata: { propertyId: prop.id, type: "datatypeProperty" },
          });
        }
      }
    }

    return chunks;
  }

  private async retrieveFromKnowledgeGraph(
    question: string,
    entities: string[],
  ): Promise<ContextChunk[]> {
    try {
      const searchTerms = question.split(/\s+/).filter((w) => w.length > 3);
      if (searchTerms.length === 0) return [];

      const sparql = `
        SELECT ?s ?sLabel ?p ?o ?oLabel WHERE {
          ?s ?p ?o .
          OPTIONAL { ?s iscarb:hasName ?sLabel }
          OPTIONAL { ?o iscarb:hasName ?oLabel }
          FILTER(${searchTerms.map((t) => `CONTAINS(LCASE(COALESCE(?sLabel, "")), LCASE("${escapeSparqlString(t)}")) || CONTAINS(LCASE(COALESCE(?oLabel, "")), LCASE("${escapeSparqlString(t)}"))`).join(" || ")})
        } LIMIT 10
      `;

      const result = await rdfClient.query(sparql);
      const bindings = result?.results?.bindings || [];

      return bindings.map((b: Record<string, { value: string }>) => ({
        content: `${b.sLabel?.value || b.s?.value || "?"} —[${(b.p?.value || "").split("/").pop()}]→ ${b.oLabel?.value || b.o?.value || "?"}`,
        source: "sparql" as const,
        relevance: 0.8,
        metadata: { subject: b.s?.value, predicate: b.p?.value, object: b.o?.value },
      }));
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "KG retrieval failed");
      return [];
    }
  }

  private async retrieveFromVector(query: string): Promise<ContextChunk[]> {
    try {
      const results = await vectorEmbeddingsService.searchSimilar(query, undefined, undefined, 5);
      return results.map((r) => ({
        content: `[${r.entityType}] ${r.content}`,
        source: "vector" as const,
        relevance: r.similarity,
        metadata: { entityType: r.entityType, entityId: r.entityId },
      }));
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "Vector retrieval failed");
      return [];
    }
  }

  private async retrieveFromDatabase(query: string): Promise<ContextChunk[]> {
    try {
      const searchTerms = query.split(/\s+/).filter((w) => w.length > 3);
      if (searchTerms.length === 0) return [];

      const articles = await db.knowledgeBaseArticle.findMany({
        where: {
          OR: searchTerms.map((term) => ({
            OR: [
              { title: { contains: term, mode: "insensitive" } },
              { content: { contains: term, mode: "insensitive" } },
            ],
          })),
        },
        take: 3,
        select: { id: true, title: true, content: true },
      });

      return articles.map((a) => ({
        content: `[KB] ${a.title}: ${(a.content || "").substring(0, 300)}`,
        source: "sql" as const,
        relevance: 0.6,
        metadata: { articleId: a.id },
      }));
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "SQL retrieval failed");
      return [];
    }
  }
}

// ─── Explainable Pipeline wrapper ───────────────────────────────────────────

export class ExplainablePipeline {
  private pipeline: OntologyRagPipeline;

  constructor(ontology: OntologyEngine) {
    this.pipeline = new OntologyRagPipeline(ontology);
  }

  /**
   * Run the pipeline and return results with full traceability.
   */
  async runWithTrace(question: string): Promise<PipelineResult> {
    return this.pipeline.run(question);
  }

  /**
   * Get only the retrieval results (for debugging).
   */
  async debugRetrieve(question: string): Promise<ContextChunk[]> {
    return this.pipeline.retrieve(question);
  }

  /**
   * Get only the reasoning result (for debugging).
   */
  async debugReason(question: string, context: ContextChunk[]): Promise<ReasoningResult> {
    return this.pipeline.reason(question, context);
  }
}
