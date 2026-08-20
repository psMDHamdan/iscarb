// src/lib/assessment/content-extraction.ts
// Content extraction pipeline for course materials (PDFs, text files)
// Extracts text, chunks semantically, and stores in CourseContent table

import "server-only";
import { db } from "@/lib/db";
import { loadPdfjs } from "@/lib/lecture/pdfjs-loader";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface CourseContentResult {
  courseId: string;
  chunks: ContentChunk[];
  clos: CourseLearningOutcomeRef[];
}

export interface ContentChunk {
  id: string;
  text: string;
  sourceFile: string;
  pageNumber?: number;
  cloTags: string[];
}

export interface CourseLearningOutcomeRef {
  id: string;
  number: string;
  text: string;
  bloomLevel: string;
}

// ─────────────────────────────────────────────────────────────
// TEXT EXTRACTION
// ─────────────────────────────────────────────────────────────

/**
 * Extract plain text from an uploaded file based on its type.
 * Uses pdfjs-dist for PDFs, plain read for text/.md files.
 */
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return extractPdfText(file);
  }

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return file.text();
  }

  // For unsupported formats, try reading as text
  try {
    return await file.text();
  } catch {
    return `[Unable to extract text from ${file.name}]`;
  }
}

/**
 * Extract text from a PDF file using pdfjs-dist.
 */
async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjs = await loadPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: Record<string, unknown>) => (item as { str: string }).str)
        .join(" ");
      pages.push(text);
    }

    return pages.join("\n\n");
  } catch (error) {
    console.error("PDF extraction failed:", error);
    // Fallback: try reading raw text
    try {
      return await file.text();
    } catch {
      return `[PDF extraction failed for ${file.name}]`;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// SEMANTIC CHUNKING
// ─────────────────────────────────────────────────────────────

/**
 * Chunk text into semantically coherent blocks, preserving sentence boundaries.
 * @param text - The text to chunk
 * @param maxTokens - Maximum tokens per chunk (~4 chars per token)
 * @param overlap - Number of overlap tokens between chunks
 */
export function semanticChunk(text: string, maxTokens: number = 800, overlap: number = 100): string[] {
  const maxChars = maxTokens * 4;
  const overlapChars = overlap * 4;

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars) {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      // Keep overlap from end of current chunk
      current = current.slice(-overlapChars);
    }
    current += sentence + " ";
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ─────────────────────────────────────────────────────────────
// EXTRACTION PIPELINE
// ─────────────────────────────────────────────────────────────

/**
 * Full extraction pipeline: extract text from files, chunk, and store.
 */
export async function extractCourseContent(
  files: File[],
  courseId: string
): Promise<CourseContentResult> {
  const chunks: ContentChunk[] = [];

  for (const file of files) {
    const text = await extractText(file);
    const fileChunks = semanticChunk(text, 800, 100);

    for (const chunkText of fileChunks) {
      chunks.push({
        id: `chunk_${courseId}_${chunks.length}`,
        text: chunkText,
        sourceFile: file.name,
        cloTags: [], // populated after CLO alignment
      });
    }
  }

  return { courseId, chunks, clos: [] };
}

/**
 * Persist extracted content chunks to the CourseContent table.
 */
export async function persistCourseContent(
  courseId: string,
  chunks: ContentChunk[],
  sourceFileName: string,
): Promise<void> {
  for (const chunk of chunks) {
    await db.courseContent.create({
      data: {
        courseId,
        chunkText: chunk.text,
        sourceFile: sourceFileName,
        chunkIndex: parseInt(chunk.id.split("_").pop() || "0"),
        cloTags: chunk.cloTags,
      },
    });
  }
}

/**
 * Tag content chunks with CLO IDs based on keyword matching.
 * A simple heuristic that checks if the chunk text contains keywords
 * from each CLO's text.
 */
export function tagChunksWithCLOs(
  chunks: ContentChunk[],
  clos: CourseLearningOutcomeRef[],
): ContentChunk[] {
  return chunks.map((chunk) => {
    const lowerChunkText = chunk.text.toLowerCase();
    const matchedCLOs = clos.filter((clo) => {
      // Extract meaningful keywords from CLO text (>4 chars)
      const keywords = clo.text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);
      // If at least 30% of keywords appear in the chunk, tag it
      const matches = keywords.filter((kw) => lowerChunkText.includes(kw));
      return keywords.length > 0 && matches.length / keywords.length >= 0.3;
    });

    return {
      ...chunk,
      cloTags: matchedCLOs.map((clo) => clo.id),
    };
  });
}
