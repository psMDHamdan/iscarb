/**
 * Lecture Ingestion — HTML parser (cheerio).
 * ===========================================================================
 * Walks the document in order and maps semantic elements to blocks:
 *   h1..h6 → heading, p → text, li → text, table → table, blockquote → note,
 *   img → image. Locators are 1-based element indices.
 */
import * as cheerio from "cheerio";
import type { RawBlock } from "../types";

const SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,table,blockquote,img";

export function parseHtml(html: string): RawBlock[] {
  const $ = cheerio.load(html);
  const blocks: RawBlock[] = [];
  let n = 0;

  $(SELECTOR).each((_i, el) => {
    n++;
    const tag = el.tagName.toLowerCase();
    const $el = $(el);
    const locator = `element:${n}`;

    if (tag === "img") {
      const alt = $el.attr("alt") || "";
      blocks.push({ locator, type: "image", text: alt ? `[image: ${alt}]` : "[image]" });
      return;
    }
    if (/^h[1-6]$/.test(tag)) {
      blocks.push({ locator, type: "heading", text: $el.text().replace(/\s+/g, " ").trim() });
      return;
    }
    if (tag === "table") {
      blocks.push({ locator, type: "table", text: $el.text().replace(/\s+/g, " ").trim() });
      return;
    }
    if (tag === "blockquote") {
      blocks.push({ locator, type: "note", text: $el.text().replace(/\s+/g, " ").trim() });
      return;
    }
    blocks.push({ locator, type: "text", text: $el.text().replace(/\s+/g, " ").trim() });
  });

  if (blocks.length === 0) {
    throw new Error("No parseable content found in the HTML file");
  }
  return blocks;
}
