/**
 * Lecture Ingestion — shared types.
 * ===========================================================================
 * RawBlock is the intermediate representation produced by the parsers and
 * consumed by source-block-builder.ts. The optional `image` buffer is used
 * by the OCR fallback when a page/slide yields less than 50 characters.
 */
export type BlockType = "text" | "image" | "table" | "note" | "heading";

export interface RawBlock {
  /** "slide:8", "page:14", "para:3", "element:7" — always `type:number`. */
  locator: string;
  type: BlockType;
  text: string;
  parentLocator?: string;
  /** Raster image for OCR candidates (not persisted). */
  image?: Buffer;
  /** True when the block text was produced by the OCR fallback. */
  ocrExtracted?: boolean;
}

export type DocumentType = "pdf" | "pptx" | "docx" | "html";
