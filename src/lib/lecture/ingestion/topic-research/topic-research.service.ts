/**
 * Topic Research Service Coordinator
 * ==================================
 * High-level orchestration service for topic-only autonomous research:
 * 1. Queries Wikipedia and open academic sources for topic articles
 * 2. Synthesizes material into 7 pedagogical stages with LaTeX formulas & Bloom CLOs
 * 3. Computes SHA-256 chunk hashes, token counts, and semantic criticality
 * 4. Converts to pipeline SourceChunk[] and database LectureSourceBlock representations.
 */

import type { SourceChunk } from "../../generation/pipeline/pipeline-context";
import { AcademicRetriever } from "./academic-retriever";
import { TopicSynthesizer } from "./topic-synthesizer";
import type {
  CompiledTopicSourceDocument,
  TopicResearchOptions,
} from "./types";

export class TopicResearchService {
  /**
   * Compiles an autonomous educational source document for a given topic name.
   */
  static async compileSourceDocument(
    topic: string,
    options?: TopicResearchOptions
  ): Promise<CompiledTopicSourceDocument> {
    const retriever = new AcademicRetriever({
      preferOffline: options?.preferOffline,
      timeoutMs: options?.timeoutMs,
    });

    const synthesizer = new TopicSynthesizer({
      apiKey: options?.apiKey,
      baseUrl: options?.baseUrl,
      aiModel: options?.aiModel,
      timeoutMs: options?.timeoutMs,
    });

    // 1. Retrieve articles from Wikipedia & academic repositories
    const articles = await retriever.retrieveArticles(topic, options);

    // 2. Synthesize structured academic document across 7 pedagogical stages
    const compiledDocument = await synthesizer.synthesizeDocument(
      topic,
      articles,
      options
    );

    return compiledDocument;
  }

  /**
   * Converts a compiled topic source document into pipeline SourceChunk[] array.
   */
  static toSourceChunks(
    compiledDoc: CompiledTopicSourceDocument
  ): SourceChunk[] {
    return compiledDoc.sections.map((sec, idx) => ({
      id: `chunk-${compiledDoc.id}-${idx + 1}`,
      sourceDocumentId: compiledDoc.id,
      locator: `${compiledDoc.title}, Section ${sec.sectionNumber}: ${sec.title}`,
      text: sec.content,
      tokenCount: sec.tokenCount,
      criticality: sec.criticality,
      sha256Hash: sec.sha256Hash,
    }));
  }

  /**
   * Ensures topic source blocks are generated and persisted in the database for a lecture project.
   */
  static async ensureTopicBlocks(
    projectId: string,
    topic: string,
    options?: TopicResearchOptions
  ): Promise<SourceChunk[]> {
    try {
      const { db } = await import("@/lib/db");
      if (db?.lectureSourceBlock) {
        const existingBlocks = await db.lectureSourceBlock.findMany({
          where: { projectId },
        });

        if (existingBlocks && existingBlocks.length > 0) {
          return existingBlocks.map((b: any, idx: number) => ({
            id: b.id || `chunk-${projectId}-${idx + 1}`,
            sourceDocumentId: b.documentId || `doc-${projectId}`,
            locator: b.locator || `Block ${idx + 1}`,
            text: b.text,
            tokenCount: Math.max(1, Math.round((b.text?.length || 0) / 4)),
            criticality: (b.criticality === "critical" ? "critical" : b.criticality === "normal" ? "important" : "supporting") as "critical" | "important" | "supporting",
            sha256Hash: b.id || "",
          }));
        }

        const compiledDoc = await this.compileSourceDocument(topic, options);
        const sourceChunks = this.toSourceChunks(compiledDoc);

        const sourceDoc = await db.lectureSourceDocument.create({
          data: {
            projectId,
            type: "web_research",
            originalName: `${topic}.md`,
            storageKey: `topic-research/${projectId}/${compiledDoc.id}.md`,
            hash: compiledDoc.id,
            parseStatus: "done",
          },
        });

        await db.lectureSourceBlock.createMany({
          data: compiledDoc.sections.map((sec) => ({
            projectId,
            documentId: sourceDoc.id,
            locator: `Section ${sec.sectionNumber}: ${sec.title}`,
            type: "text",
            text: sec.content,
            criticality: sec.criticality === "critical" ? "critical" : sec.criticality === "important" ? "normal" : "low",
            status: "unresolved",
          })),
        });

        return sourceChunks;
      }
    } catch {
      // In standalone script / offline CLI without active DB connection, compile in-memory
    }

    const compiledDoc = await this.compileSourceDocument(topic, options);
    return this.toSourceChunks(compiledDoc);
  }
}
