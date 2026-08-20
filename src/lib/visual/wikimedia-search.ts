/**
 * AI Visual Learning System — Wikimedia Commons API Search & Metadata Ingestor
 *
 * Programmatically queries Wikimedia Commons Action API using search generators,
 * extracts rich structural and textual metadata, strips HTML entities,
 * extracts multilang descriptions and licenses, and normalizes candidate image records.
 */

import type {
  CandidateImageMetadata,
  DiagramSearchOptions,
} from "./types";

export const WIKIMEDIA_COMMONS_API = "https://commons.wikimedia.org/w/api.php";
export const DEFAULT_USER_AGENT =
  "iSCARB-Visual-Learning-System/1.0 (academic-research@iscarb.edu.sa)";

export const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

/**
 * Strips HTML tags, entity references, and excessive whitespace from metadata fields
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?(?:p|div|br|hr|h[1-6]|li|tr|table|ul|ol|blockquote|section|article|header|footer)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#039;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return "";
      }
    })
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCharCode(Number(code));
      } catch {
        return "";
      }
    })
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .replace(/\s+([',.?!;:])/g, "$1")
    .trim();
}

/**
 * Generates a clean human-readable title from Wikimedia file name
 */
export function cleanTitle(rawTitle: string): string {
  if (!rawTitle) return "";
  return rawTitle
    .replace(/^File:/i, "")
    .replace(/\.(svg|png|jpg|jpeg|webp|gif|tiff|pdf)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses pipe-separated categories or array into clean string array
 */
export function parseCategories(categoriesVal: unknown): string[] {
  if (!categoriesVal) return [];
  if (Array.isArray(categoriesVal)) {
    return categoriesVal
      .map((c) => (typeof c === "string" ? stripHtml(c) : ""))
      .filter(Boolean);
  }
  if (typeof categoriesVal === "string") {
    return categoriesVal
      .split("|")
      .map((c) => stripHtml(c))
      .filter((c) => c.length > 0);
  }
  return [];
}

/**
 * Parses a raw Wikimedia Commons JSON API response into normalized CandidateImageMetadata array
 */
export function parseWikimediaResponse(
  data: unknown,
  allowedMimeTypes: string[] = DEFAULT_ALLOWED_MIME_TYPES
): CandidateImageMetadata[] {
  if (!data || typeof data !== "object") return [];
  const queryObj = (data as { query?: { pages?: Record<string, any> } }).query;
  const pages = queryObj?.pages;
  if (!pages || typeof pages !== "object") return [];

  const candidates: CandidateImageMetadata[] = [];

  for (const pageId of Object.keys(pages)) {
    const page = pages[pageId];
    if (!page || !page.imageinfo || !Array.isArray(page.imageinfo) || page.imageinfo.length === 0) {
      continue;
    }

    const info = page.imageinfo[0];
    if (!info) continue;

    const mime = (info.mime || "").toLowerCase().trim();

    // MIME type filtering (strictly discard PDFs, audio, video, etc.)
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mime)) {
      continue;
    }

    const extmeta = info.extmetadata || {};

    // Description extraction
    const rawDesc =
      extmeta.ImageDescription?.value ||
      extmeta.ObjectName?.value ||
      extmeta.Headline?.value ||
      "";
    const cleanDesc = stripHtml(typeof rawDesc === "string" ? rawDesc : JSON.stringify(rawDesc));

    // Author / Artist extraction
    const rawArtist =
      extmeta.Artist?.value ||
      extmeta.Credit?.value ||
      extmeta.Author?.value ||
      "Wikimedia Commons Contributor";
    const cleanArtist = stripHtml(typeof rawArtist === "string" ? rawArtist : "");

    // License extraction
    const license =
      extmeta.LicenseShortName?.value ||
      extmeta.License?.value ||
      extmeta.UsageTerms?.value ||
      "Public domain / Creative Commons";
    const licenseUrl = extmeta.LicenseUrl?.value || undefined;
    const attributionRequired =
      extmeta.AttributionRequired?.value === "true" ||
      extmeta.AttributionRequired?.value === true;

    // Dimensions
    const width = Number(info.width) || 0;
    const height = Number(info.height) || 0;
    const aspectRatio =
      height > 0 ? Number((width / height).toFixed(3)) : 1.0;

    // Categories
    const categories = parseCategories(extmeta.Categories?.value);

    // Title and URLs
    const rawTitle = page.title || `File:Image_${pageId}`;
    const fileName = rawTitle.replace(/^File:/i, "");
    const cleanedTitle = cleanTitle(rawTitle);
    const canonicalUrl = info.url || "";
    const thumbUrl = info.thumburl || canonicalUrl;
    const descriptionUrl =
      info.descriptionurl ||
      `https://commons.wikimedia.org/wiki/${encodeURIComponent(rawTitle.replace(/ /g, "_"))}`;

    if (!canonicalUrl) continue;

    candidates.push({
      id: String(page.pageid || pageId),
      title: rawTitle,
      fileName,
      cleanTitle: cleanedTitle,
      url: canonicalUrl,
      thumbUrl,
      descriptionUrl,
      description: cleanDesc,
      categories,
      artist: cleanArtist || "Wikimedia Commons Contributor",
      license: String(license),
      licenseUrl: licenseUrl ? String(licenseUrl) : undefined,
      attributionRequired,
      width,
      height,
      aspectRatio,
      fileSize: Number(info.size) || undefined,
      mimeType: mime,
    });
  }

  return candidates;
}

/**
 * Executes a search query against Wikimedia Commons Action API
 */
export async function searchWikimediaDiagrams(
  options: DiagramSearchOptions
): Promise<CandidateImageMetadata[]> {
  const {
    query,
    limit = 8,
    thumbWidth = 1200,
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    userAgent = DEFAULT_USER_AGENT,
    timeoutMs = 15000,
  } = options;

  if (!query || query.trim() === "") {
    return [];
  }

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrnamespace: "6", // Namespace 6: File
    gsrsearch: query.trim(),
    gsrlimit: Math.min(Math.max(1, limit), 20).toString(),
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata|dimensions",
    iiurlwidth: thumbWidth.toString(),
    iiextmetadatamultilang: "1",
    format: "json",
    origin: "*",
  });

  const url = `${WIKIMEDIA_COMMONS_API}?${params.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(
        `Wikimedia Commons API warning: HTTP ${response.status} ${response.statusText}`
      );
      return [];
    }

    const json = await response.json();
    return parseWikimediaResponse(json, allowedMimeTypes);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.warn(`Wikimedia search timed out after ${timeoutMs}ms for query "${query}"`);
    } else {
      console.warn(`Wikimedia search failed for query "${query}":`, error?.message || error);
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
