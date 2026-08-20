/**
 * Ontology-linked AI Memory System — stores facts, preferences, and reasoning
 * traces linked to ontology entities via RDF triples.
 */
import "server-only";

import { OntologyEngine } from "@/lib/ontology/engine";
import { db } from "@/lib/db";
import { vectorEmbeddingsService } from "@/services/vector/vector-embeddings.service";
import { moduleLogger } from "@/config/logger";

const log = moduleLogger("ontology-ai-memory");

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MemoryEntry {
  id: string;
  entity: string;
  fact: string;
  confidence: number;
  accessCount: number;
  createdAt: Date;
  lastAccessedAt: Date;
  metadata?: Record<string, unknown>;
  links: MemoryLink[];
}

export interface MemoryLink {
  targetEntity: string;
  relation: string;
}

export interface ReasoningTrace {
  entity: string;
  memories: MemoryEntry[];
  linkedEntities: string[];
  reasoningPath: string[];
}

// ─── Memory Store ───────────────────────────────────────────────────────────

export class OntologyMemory {
  private ontology: OntologyEngine;
  private memoryCache: Map<string, MemoryEntry[]> = new Map();

  constructor(ontology: OntologyEngine) {
    this.ontology = ontology;
  }

  /**
   * Store a fact linked to an ontology entity.
   */
  async remember(entity: string, fact: string, confidence: number, metadata?: Record<string, unknown>): Promise<string> {
    // Validate entity exists in ontology
    const entityExists = this.ontology.classes.has(entity) ||
      this.ontology.individuals.has(entity) ||
      [...this.ontology.datatypeProperties.values()].some((p) => p.name === entity);

    if (!entityExists) {
      log.warn({ entity }, "Entity not found in ontology — storing with generic link");
    }

    // Insert into DB
    const result = await db.$executeRaw`
      INSERT INTO "AiMemory" ("id", "userId", "category", "content", "importance", "metadata", "createdAt", "lastAccessedAt")
      VALUES (
        gen_random_uuid(),
        'ontology-system',
        'fact',
        ${`[${entity}] ${fact}`},
        ${Math.max(0, Math.min(1, confidence))},
        ${JSON.stringify({ entity, ontologyLinked: entityExists, ...metadata })}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING "id"
    `;

    const id = String((result as unknown as { id: string }[])?.[0]?.id || crypto.randomUUID());

    // Generate embedding for semantic recall
    try {
      await vectorEmbeddingsService.upsertEmbedding(
        "AiMemory",
        id,
        `[${entity}] ${fact}`,
        undefined,
        { entity, category: "fact" },
      );
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "Failed to generate embedding for memory");
    }

    // Update cache
    const cached = this.memoryCache.get(entity) || [];
    cached.push({
      id,
      entity,
      fact,
      confidence,
      accessCount: 0,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      metadata,
      links: [],
    });
    this.memoryCache.set(entity, cached);

    log.debug({ entity, fact: fact.substring(0, 50) }, "Stored memory");
    return id;
  }

  /**
   * Recall memories relevant to a query.
   */
  async recall(query: string, limit = 10): Promise<MemoryEntry[]> {
    // 1. Try vector-based semantic search
    try {
      const vectorResults = await vectorEmbeddingsService.searchSimilar(
        query,
        "AiMemory",
        undefined,
        limit,
      );

      if (vectorResults.length > 0) {
        const memoryIds = vectorResults.map((r) => r.entityId);
        const memories = await db.$queryRaw<Record<string, unknown>[]>`
          SELECT "id", "content", "importance", "metadata", "createdAt", "lastAccessedAt"
          FROM "AiMemory"
          WHERE "id" IN (${memoryIds.join(",")})
        `;

        // Update access timestamps
        await db.$executeRaw`
          UPDATE "AiMemory"
          SET "lastAccessedAt" = NOW()
          WHERE "id" IN (${memoryIds.join(",")})
        `;

        return memories.map((m) => this.parseMemoryEntry(m));
      }
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "Vector recall failed, falling back to text search");
    }

    // 2. Fallback: text-based search
    try {
      const memories = await db.$queryRaw<Record<string, unknown>[]>`
        SELECT "id", "content", "importance", "metadata", "createdAt", "lastAccessedAt"
        FROM "AiMemory"
        WHERE "content" ILIKE ${`%${query}%`}
        ORDER BY "importance" DESC, "lastAccessedAt" DESC
        LIMIT ${limit}
      `;
      return memories.map((m) => this.parseMemoryEntry(m));
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "Text recall failed");
      return [];
    }
  }

  /**
   * Forget (delete) a memory by ID.
   */
  async forget(entryId: string): Promise<boolean> {
    try {
      // Remove from vector store
      await vectorEmbeddingsService.removeDocument("AiMemory", entryId);

      // Remove from DB
      await db.$executeRaw`DELETE FROM "AiMemory" WHERE "id" = ${entryId}`;

      // Remove from cache
      for (const [entity, memories] of this.memoryCache) {
        const idx = memories.findIndex((m) => m.id === entryId);
        if (idx !== -1) {
          memories.splice(idx, 1);
          if (memories.length === 0) this.memoryCache.delete(entity);
          break;
        }
      }

      log.debug({ entryId }, "Forgot memory");
      return true;
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error), entryId }, "Failed to forget memory");
      return false;
    }
  }

  /**
   * Consolidate: merge similar memories and decay low-confidence ones.
   */
  async consolidate(): Promise<{ merged: number; decayed: number; removed: number }> {
    let merged = 0;
    let decayed = 0;
    let removed = 0;

    // Decay old, low-access memories
    try {
      const decayedCount = await db.$executeRaw`
        UPDATE "AiMemory"
        SET "importance" = GREATEST("importance" * 0.9, 0.05)
        WHERE "lastAccessedAt" < NOW() - INTERVAL '60 days'
          AND "importance" > 0.05
      `;
      decayed = Number(decayedCount);
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "Decay failed");
    }

    // Remove memories with very low importance
    try {
      const removedCount = await db.$executeRaw`
        DELETE FROM "AiMemory"
        WHERE "importance" < 0.05
          AND "lastAccessedAt" < NOW() - INTERVAL '90 days'
      `;
      removed = Number(removedCount);
    } catch (error) {
      log.warn({ error: error instanceof Error ? error.message : String(error) }, "Cleanup failed");
    }

    // Clear cache after consolidation
    this.memoryCache.clear();

    log.info({ merged, decayed, removed }, "Memory consolidation complete");
    return { merged, decayed, removed };
  }

  /**
   * Get a reasoning trace for an entity — all memories linked to it.
   */
  async getReasoningTrace(entity: string): Promise<ReasoningTrace> {
    const memories = await this.recall(entity, 20);
    const entityMemories = memories.filter(
      (m) => m.entity === entity || m.fact.toLowerCase().includes(entity.toLowerCase()),
    );

    // Find linked entities from the ontology
    const linkedEntities: string[] = [];
    const reasoningPath: string[] = [];

    // Check if entity is a class and find related individuals/properties
    const cls = this.ontology.classes.get(entity);
    if (cls) {
      reasoningPath.push(`Entity "${entity}" is an ontology class`);

      if (cls.parentClass) {
        linkedEntities.push(cls.parentClass);
        reasoningPath.push(`Extends parent class: ${cls.parentClass}`);
      }

      // Find properties on this class
      for (const [, prop] of this.ontology.objectProperties) {
        if (prop.domain === entity) {
          linkedEntities.push(prop.range);
          reasoningPath.push(`Object property "${prop.name}" links to ${prop.range}`);
        }
      }

      // Find individuals of this class
      for (const [, ind] of this.ontology.individuals) {
        if (ind.classType === entity) {
          linkedEntities.push(ind.id);
          reasoningPath.push(`Individual "${ind.id}" is an instance of ${entity}`);
        }
      }
    }

    reasoningPath.push(`Found ${entityMemories.length} memories linked to "${entity}"`);

    return {
      entity,
      memories: entityMemories,
      linkedEntities: [...new Set(linkedEntities)],
      reasoningPath,
    };
  }

  /**
   * List all stored memories.
   */
  async listAll(limit = 50): Promise<MemoryEntry[]> {
    try {
      const memories = await db.$queryRaw<Record<string, unknown>[]>`
        SELECT "id", "content", "importance", "metadata", "createdAt", "lastAccessedAt"
        FROM "AiMemory"
        WHERE "category" = 'fact'
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;
      return memories.map((m) => this.parseMemoryEntry(m));
    } catch {
      return [];
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private parseMemoryEntry(row: Record<string, unknown>): MemoryEntry {
    const content = String(row.content || "");
    const meta = (row.metadata as Record<string, unknown>) || {};

    // Extract entity from "[EntityName] fact" format
    const entityMatch = content.match(/^\[([^\]]+)\]\s*/);
    const entity = entityMatch ? entityMatch[1] : String(meta.entity || "unknown");
    const fact = entityMatch ? content.substring(entityMatch[0].length) : content;

    return {
      id: String(row.id),
      entity,
      fact,
      confidence: Number(row.importance) || 0.5,
      accessCount: 0,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
      lastAccessedAt: row.lastAccessedAt instanceof Date ? row.lastAccessedAt : new Date(row.lastAccessedAt),
      metadata: meta,
      links: [],
    };
  }
}
