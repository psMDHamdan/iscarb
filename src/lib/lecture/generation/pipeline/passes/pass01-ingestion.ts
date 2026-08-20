/**
 * Pass 1: Ingestion & Document Tokenization.
 * ==========================================
 * Cleans boilerplate, performs semantic chunking, and computes SHA-256 chunk hashes.
 * Supports autonomous web research for topic-only generation.
 */

import { createHash } from "crypto";
import { TopicResearchService } from "../../../ingestion/topic-research";
import type { PipelinePass } from "../pass-registry";
import type { PipelineContext, SourceChunk } from "../pipeline-context";

export class Pass01Ingestion implements PipelinePass {
  readonly passNumber = 1;
  readonly passName = "Ingestion & Document Tokenization";
  readonly description = "Cleans source documents, splits into semantic chunks, and computes SHA-256 integrity hashes.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const hasRealDocuments =
      ctx.rawSourceDocuments &&
      ctx.rawSourceDocuments.length > 0 &&
      ctx.rawSourceDocuments.some(
        (d) => d.text && d.text.trim().length > 150
      );

    // If no real documents are provided, perform autonomous topic research
    if (!hasRealDocuments && ctx.title) {
      try {
        const compiledDoc = await TopicResearchService.compileSourceDocument(
          ctx.title,
          {
            discipline: ctx.targetAudience,
            languagePolicy: ctx.languagePolicy,
            topicDescription: ctx.topicDescription,
          }
        );

        ctx.rawSourceDocuments = [
          {
            id: compiledDoc.id,
            title: compiledDoc.title,
            text: compiledDoc.fullMarkdownText,
          },
        ];

        ctx.sourceChunks = TopicResearchService.toSourceChunks(compiledDoc);
        return ctx;
      } catch {
        // Fall through to baseline chunking on unexpected research error
      }
    }

    const rawDocs = ctx.rawSourceDocuments && ctx.rawSourceDocuments.length > 0
      ? ctx.rawSourceDocuments
      : [
          {
            id: `doc-${ctx.projectId}`,
            title: ctx.title,
            text: `${ctx.title}: ${ctx.topicDescription}. Key principles, theorems, and mechanisms for ${ctx.targetAudience}.`,
          },
        ];

    const sourceChunks: SourceChunk[] = [];

    rawDocs.forEach((doc, docIdx) => {
      // 1. Clean boilerplate (TOC, references, excessive whitespace)
      const cleanedText = doc.text
        .replace(/\bTable\s+of\s+Contents\b[\s\S]*?(?=\n\s*\n\w)/gi, "")
        .replace(/\bReferences\b[\s\S]*$/gi, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // 2. Sentence-based chunking (~300-800 tokens or paragraphs)
      const paragraphs = cleanedText.split(/\n\n+/).filter((p) => p.trim().length > 0);

      paragraphs.forEach((para, pIdx) => {
        const chunkText = para.trim();
        const tokenEstimate = Math.max(1, Math.round(chunkText.length / 4));
        const sha256Hash = createHash("sha256").update(chunkText).digest("hex");

        sourceChunks.push({
          id: `chunk-${docIdx + 1}-${pIdx + 1}`,
          sourceDocumentId: doc.id,
          locator: `${doc.title}, Section ${pIdx + 1}`,
          text: chunkText,
          tokenCount: tokenEstimate,
          criticality: pIdx === 0 ? "critical" : pIdx <= 3 ? "important" : "supporting",
          sha256Hash,
        });
      });
    });

    ctx.sourceChunks = sourceChunks;
    return ctx;
  }
}

export const pass01Ingestion = new Pass01Ingestion();
