/**
 * Lecture Ingestion — PPTX parser (JSZip + cheerio).
 * ===========================================================================
 * Unzips the .pptx OOXML package and walks `ppt/slides/slideN.xml`. Each slide
 * becomes one or more RawBlocks:
 *   - title placeholder text  → type "heading", locator `slide:N`
 *   - body paragraph text     → type "text"
 *   - table cells             → type "table"
 *   - notes slide text        → type "note" (locator `slide:N#note`)
 *
 * Slides with very little text (image-heavy) are passed to the OCR fallback
 * if they reference a raster image in `ppt/media/`.
 */
import JSZip from "jszip";
import * as cheerio from "cheerio";
import type { RawBlock } from "../types";
import { applyOcrFallback } from "./ocr-fallback";

const OCR_TEXT_MIN_CHARS = 50;
const NS = {
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
};

export async function parsePptx(buffer: Buffer): Promise<RawBlock[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slideEntries = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => slideNo(a) - slideNo(b));

  const blocks: RawBlock[] = [];
  for (const entry of slideEntries) {
    const no = slideNo(entry);
    const xml = await zip.file(entry)!.async("string");
    const blocksForSlide = await parseSlide(xml, no, zip);
    blocks.push(...blocksForSlide);
  }

  // Fall back to slide layout ordering via notes/images if no slides found.
  if (blocks.length === 0) {
    throw new Error("No slides found in the PPTX file");
  }
  return blocks;
}

function slideNo(entry: string): number {
  const m = entry.match(/slide(\d+)\.xml$/);
  return m ? parseInt(m[1], 10) : 0;
}

async function parseSlide(xml: string, no: number, zip: JSZip): Promise<RawBlock[]> {
  const $ = cheerio.load(xml, { xmlMode: true });
  const slideBlocks: RawBlock[] = [];

  // --- Title ---
  const titleText = extractTitle($);
  if (titleText) {
    slideBlocks.push({ locator: `slide:${no}`, type: "heading", text: titleText });
  }

  // --- Body paragraphs (text runs) ---
  const bodyText = extractBodyText($);
  if (bodyText) {
    slideBlocks.push({ locator: `slide:${no}`, type: "text", text: bodyText });
  }

  // --- Tables ---
  $("a\\:tbl").each((_i, el) => {
    const rows = $(el).find("a\\:tr").length;
    const cells = $(el).find("a\\:tc").text().replace(/\s+/g, " ").trim();
    if (cells) {
      slideBlocks.push({
        locator: `slide:${no}`,
        type: "table",
        text: `[table: ${rows} rows] ${cells}`,
      });
    }
  });

  // --- Speaker notes ---
  const notesXml = await getNotesXml(zip, no);
  if (notesXml) {
    const $notes = cheerio.load(notesXml, { xmlMode: true });
    const noteText = $notes("a\\:t").map((_i, el) => $(el).text()).get().join(" ").replace(/\s+/g, " ").trim();
    if (noteText) {
      slideBlocks.push({ locator: `slide:${no}`, type: "note", text: noteText });
    }
  }

  // --- OCR fallback for image-heavy slides ---
  if (slideBlocks.every((b) => b.text.length < OCR_TEXT_MIN_CHARS)) {
    const image = await getSlideImage(zip, no);
    if (image) {
      const target = slideBlocks[0] ?? { locator: `slide:${no}`, type: "text" as const, text: "" };
      const ocrBlock = await applyOcrFallback({ ...target, image });
      return [ocrBlock];
    }
  }

  // Ensure at least one block per slide (title may be empty → empty text).
  if (slideBlocks.length === 0) {
    slideBlocks.push({ locator: `slide:${no}`, type: "text", text: "" });
  }
  return slideBlocks;
}

function extractTitle($: cheerio.CheerioAPI): string {
  const ph = $("p\\:nvSpPr p\\:ph");
  const titlePh = ph.filter((_i, el) => {
    const type = $(el).attr("type");
    return type === "title" || type === "ctrTitle";
  });
  const text = titlePh.length
    ? $(titlePh.closest("p\\:sp")).find("a\\:t").map((_i, el) => $(el).text()).get().join(" ").replace(/\s+/g, " ").trim()
    : "";
  return text;
}

function extractBodyText($: cheerio.CheerioAPI): string {
  const paragraphs = $("p\\:sp")
    .map((_i, el) => {
      const $el = $(el);
      // Skip the title placeholder (already emitted).
      const ph = $el.find("p\\:nvSpPr p\\:ph").first().attr("type");
      if (ph === "title" || ph === "ctrTitle") return "";
      const paraText = $el
        .find("a\\:p")
        .map((_j, p) => $(p).find("a\\:t").map((_k, t) => $(t).text()).get().join(""))
        .get()
        .filter((t) => t.trim())
        .join("\n");
      return paraText.trim();
    })
    .get()
    .filter((t) => t.length);
  return paragraphs.join("\n\n").replace(/[ \t]+/g, " ").trim();
}

async function getNotesXml(zip: JSZip, no: number): Promise<string | null> {
  const entry = zip.file(`ppt/notesSlides/notesSlide${no}.xml`);
  if (!entry) return null;
  return entry.async("string");
}

async function getSlideImage(zip: JSZip, no: number): Promise<Buffer | undefined> {
  // Resolve r:embed from slide rels → media part.
  const relsEntry = zip.file(`ppt/slides/_rels/slide${no}.xml.rels`);
  if (!relsEntry) return undefined;
  const relsXml = await relsEntry.async("string");
  const $rels = cheerio.load(relsXml, { xmlMode: true });
  let imagePath: string | undefined;
  $rels("Relationship").each((_i, el) => {
    const type = $rels(el).attr("Type") || "";
    if (type.endsWith("/image") || type.endsWith("/image/jpeg") || type.endsWith("/image/png")) {
      const target = $rels(el).attr("Target");
      if (target) imagePath = `ppt/slides/${target}`.replace(/\/+/, "/").replace(/^ppt\/slides\/\.\.\//, "ppt/");
    }
  });
  if (!imagePath) return undefined;
  const entry = zip.file(imagePath);
  if (!entry) return undefined;
  return entry.async("nodebuffer") as Promise<Buffer>;
}
