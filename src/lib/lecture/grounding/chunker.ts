import {
  createSourceBlock,
  assessCriticality,
} from "./source-block";
import type { ChunkOptions, SourceBlock } from "./types";

const CRITICAL_SHORT_RE =
  /^(CLO|Formula|Definition|Theorem|Objective|Key Law|Grading|Exam)/i;

/**
 * Strips common boilerplate sections (e.g. Table of Contents, References)
 * and normalizes whitespace in raw document text.
 */
export function cleanDocumentBoilerplate(text: string): string {
  if (!text) return "";

  return text
    .replace(/\bTable\s+of\s+Contents\b[\s\S]*?(?=\n\s*\n[A-Z0-9])/gi, "")
    .replace(/\bReferences\s*\n[\s\S]*$/gi, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Splits an oversized text block into sentence-bounded sub-chunks under maxChunkChars.
 */
export function splitOversizedParagraph(
  text: string,
  maxChars: number
): string[] {
  const sentences =
    text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (
      currentChunk.length + trimmedSentence.length + 1 > maxChars &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk = currentChunk
        ? `${currentChunk} ${trimmedSentence}`
        : trimmedSentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Chunks raw document text into addressable SourceBlocks with deterministic locators.
 */
export function chunkDocument(
  documentText: string,
  options?: ChunkOptions
): SourceBlock[] {
  const maxChars = options?.maxChunkChars ?? 1200;
  const minChars = options?.minChunkChars ?? 10;
  const prefix = options?.documentTitle ? `${options.documentTitle}#` : "";

  const cleaned = cleanDocumentBoilerplate(documentText);
  if (!cleaned) return [];

  const rawParagraphs = cleaned
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const blocks: SourceBlock[] = [];

  rawParagraphs.forEach((para, pIdx) => {
    const trimmed = para.trim();

    // Preserve critical short blocks, skip noise
    if (trimmed.length < minChars && !CRITICAL_SHORT_RE.test(trimmed)) {
      return;
    }

    if (trimmed.length > maxChars) {
      const subChunks = splitOversizedParagraph(trimmed, maxChars);
      subChunks.forEach((sub, subIdx) => {
        const locator = `${prefix}para:${pIdx + 1}#sub:${subIdx + 1}`;
        blocks.push(
          createSourceBlock({
            locator,
            text: sub,
            criticality: assessCriticality(sub),
            metadata: {
              paragraphIndex: pIdx + 1,
              subIndex: subIdx + 1,
              documentTitle: options?.documentTitle,
              documentType: options?.documentType ?? "text",
            },
          })
        );
      });
    } else {
      const locator = `${prefix}para:${pIdx + 1}`;
      blocks.push(
        createSourceBlock({
          locator,
          text: trimmed,
          criticality: assessCriticality(trimmed),
          metadata: {
            paragraphIndex: pIdx + 1,
            documentTitle: options?.documentTitle,
            documentType: options?.documentType ?? "text",
          },
        })
      );
    }
  });

  return blocks;
}

/**
 * Chunks multi-page PDF text with per-page and per-paragraph locators.
 */
export function chunkPdfPages(
  pages: Array<{ pageNumber: number; text: string }>,
  options?: ChunkOptions
): SourceBlock[] {
  const blocks: SourceBlock[] = [];
  const minChars = options?.minChunkChars ?? 10;
  const maxChars = options?.maxChunkChars ?? 1200;
  const prefix = options?.documentTitle ? `${options.documentTitle}#` : "";

  for (const page of pages) {
    const cleaned = cleanDocumentBoilerplate(page.text);
    if (!cleaned) continue;

    const paragraphs = cleaned
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    paragraphs.forEach((para, pIdx) => {
      if (para.length < minChars && !CRITICAL_SHORT_RE.test(para)) {
        return;
      }

      if (para.length > maxChars) {
        const subChunks = splitOversizedParagraph(para, maxChars);
        subChunks.forEach((sub, subIdx) => {
          const locator = `${prefix}page:${page.pageNumber}#p:${pIdx + 1}#sub:${subIdx + 1}`;
          blocks.push(
            createSourceBlock({
              locator,
              text: sub,
              criticality: assessCriticality(sub),
              metadata: {
                pageNumber: page.pageNumber,
                paragraphIndex: pIdx + 1,
                subIndex: subIdx + 1,
                documentType: "pdf",
              },
            })
          );
        });
      } else {
        const locator = `${prefix}page:${page.pageNumber}#p:${pIdx + 1}`;
        blocks.push(
          createSourceBlock({
            locator,
            text: para,
            criticality: assessCriticality(para),
            metadata: {
              pageNumber: page.pageNumber,
              paragraphIndex: pIdx + 1,
              documentType: "pdf",
            },
          })
        );
      }
    });
  }

  return blocks;
}

/**
 * Chunks presentation slides (PPTX) with structural locators (heading, bullets, tables, notes).
 */
export function chunkPptxSlides(
  slides: Array<{
    slideNumber: number;
    title?: string;
    bullets?: string[];
    tables?: string[][];
    notes?: string;
  }>,
  options?: ChunkOptions
): SourceBlock[] {
  const blocks: SourceBlock[] = [];
  const prefix = options?.documentTitle ? `${options.documentTitle}#` : "";

  for (const slide of slides) {
    const sNo = slide.slideNumber;

    if (slide.title?.trim()) {
      blocks.push(
        createSourceBlock({
          locator: `${prefix}slide:${sNo}#heading`,
          text: slide.title.trim(),
          criticality: "critical",
          metadata: { slideNumber: sNo, elementType: "heading", documentType: "pptx" },
        })
      );
    }

    if (slide.bullets && slide.bullets.length > 0) {
      slide.bullets.forEach((bullet, bIdx) => {
        const trimmed = bullet.trim();
        if (!trimmed) return;
        blocks.push(
          createSourceBlock({
            locator: `${prefix}slide:${sNo}#bullet:${bIdx + 1}`,
            text: trimmed,
            criticality: assessCriticality(trimmed),
            metadata: { slideNumber: sNo, elementType: "bullet", bulletIndex: bIdx + 1, documentType: "pptx" },
          })
        );
      });
    }

    if (slide.tables && slide.tables.length > 0) {
      slide.tables.forEach((row, rIdx) => {
        const rowText = row.filter(Boolean).join(" | ").trim();
        if (!rowText) return;
        blocks.push(
          createSourceBlock({
            locator: `${prefix}slide:${sNo}#table:${rIdx + 1}`,
            text: rowText,
            criticality: "critical",
            metadata: { slideNumber: sNo, elementType: "table", rowIndex: rIdx + 1, documentType: "pptx" },
          })
        );
      });
    }

    if (slide.notes?.trim()) {
      blocks.push(
        createSourceBlock({
          locator: `${prefix}slide:${sNo}#note`,
          text: slide.notes.trim(),
          criticality: assessCriticality(slide.notes),
          metadata: { slideNumber: sNo, elementType: "note", documentType: "pptx" },
        })
      );
    }
  }

  return blocks;
}

/**
 * Chunks structured HTML elements.
 */
export function chunkHtmlElements(
  elements: Array<{ tag: string; text: string }>,
  options?: ChunkOptions
): SourceBlock[] {
  const blocks: SourceBlock[] = [];
  const prefix = options?.documentTitle ? `${options.documentTitle}#` : "";
  const minChars = options?.minChunkChars ?? 10;

  elements.forEach((elem, idx) => {
    const trimmed = elem.text.trim();
    if (trimmed.length < minChars && !CRITICAL_SHORT_RE.test(trimmed)) return;

    const blockType = /h[1-6]/i.test(elem.tag) ? "heading" : elem.tag === "table" ? "table" : "element";
    const criticality = assessCriticality(trimmed, blockType);

    blocks.push(
      createSourceBlock({
        locator: `${prefix}element:${idx + 1}#${elem.tag}`,
        text: trimmed,
        criticality,
        metadata: {
          elementIndex: idx + 1,
          tag: elem.tag,
          documentType: "html",
        },
      })
    );
  });

  return blocks;
}
