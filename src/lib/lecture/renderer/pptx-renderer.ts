/**
 * PPTX Renderer (TASK-08 §B).
 * ===========================================================================
 * Renders approved SlideArtifact JSON into a .pptx buffer using pptxgenjs.
 * ZTM-on-iSCARB visual rules (FR-021 §3.3): dark background, high-contrast
 * white text, max 5 bullets at ≥24pt, progress bar, orange student-action
 * box, RTL for Arabic. Instructor notes go to slide notes — never the slide.
 *
 * Deterministic: no LLM, no DB. Output depends only on the artifacts + theme.
 */
import PptxGenJS from "pptxgenjs";
import type { SlideContentJson } from "../generation/types";
import { slideTitle, slideBullets, slideAction } from "./content";
import { ZTM_THEME, type ZtmThemeName } from "./ztm-theme";
import { getAcademicVisualForSlide } from "../academic-visuals";
import { stripLatexToReadable } from "./math-utils";
import { getLectureFile } from "../storage";
import { resolveSlideImageUrl } from "../visual-image";

// ZTM Accent Colors (Updated to match Studio Design)
const ACCENT_CYAN = "0F7B8A";
const ACCENT_GOLD = "0E6C3C";
const FUTURE_GRAY = "E2E8F0";

const TOTAL_SLIDES = 20;

async function resolveImageDataForPptx(content: SlideContentJson, slideNo: number): Promise<string | null> {
  const fallback = getAcademicVisualForSlide(
    slideNo,
    content.title,
    (content.body?.bullets || []).join(" ")
  );
  const url = resolveSlideImageUrl(content.visualSpec as any, fallback.imageUrl);
  if (!url) return null;

  const storageKey = (content.visualSpec as any)?.facultyUploadedStorageKey as string | undefined;
  if (storageKey) {
    try {
      const buf = await getLectureFile(storageKey);
      const lower = storageKey.toLowerCase();
      const mime = lower.endsWith(".png")
        ? "image/png"
        : lower.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch {
      /* fall through */
    }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url; // pptxgenjs can fetch remote paths
  }

  return null;
}

export interface RenderableSlide {
  slideNo: number;
  contentJson: unknown;
}

export async function renderPPTX(
  artifacts: RenderableSlide[],
  theme: ZtmThemeName = "ztm"
): Promise<Buffer> {
  const t = ZTM_THEME;
  const PptxConstructor = typeof PptxGenJS === "function" ? PptxGenJS : (PptxGenJS as any).default || PptxGenJS;
  const pptx = new PptxConstructor();
  pptx.defineLayout({ name: "WIDE", width: t.slideWidth, height: t.slideHeight });
  pptx.layout = "WIDE";
  pptx.author = "iSCARB Lecture System";
  pptx.subject = "Lecture package";

  const ordered = [...artifacts].sort((a, b) => a.slideNo - b.slideNo);

  for (const artifact of ordered) {
    const content = (artifact.contentJson ?? {}) as unknown as SlideContentJson;

    // ZTM Master Layout Mapping
    let masterName = "ZTM_Foundation";
    const fn = (content as any).function?.toLowerCase();

    if (fn === "hook" || artifact.slideNo === 1) masterName = "ZTM_Hook";
    else if (fn === "spine" || artifact.slideNo === 2) masterName = "ZTM_Spine";
    else if (fn === "clos" || artifact.slideNo === 3) masterName = "ZTM_CLOs";
    else if (fn === "hstack" || artifact.slideNo === 4) masterName = "ZTM_HStack";
    else if (fn === "worked_example" || artifact.slideNo === 9) masterName = "ZTM_WorkedExample";
    else if (fn === "rubric" || artifact.slideNo === 18) masterName = "ZTM_Rubric";
    else if (fn === "evidence" || artifact.slideNo === 19) masterName = "ZTM_Evidence";
    else if (fn === "gate" || artifact.slideNo === 20) masterName = "ZTM_Gate";
    else if (artifact.slideNo >= 10 && artifact.slideNo <= 13) masterName = "ZTM_DeepDive";
    else if (artifact.slideNo >= 14 && artifact.slideNo <= 17) masterName = "ZTM_Application";

    const slide = pptx.addSlide({ masterName });
    slide.background = { color: "FFFFFF" };

    const title = stripLatexToReadable(slideTitle(content));
    const bullets = slideBullets(content).map(stripLatexToReadable);
    const action = slideAction(content);
    const rtl = Boolean(content.textAr?.title || content.textAr?.bullets?.length);

    // 1. Top Bar Badges (Studio Header 1:1)
    slide.addShape("roundRect", {
      x: 0.5, y: 0.25, w: 2.8, h: 0.35, fill: { color: "065F46" }, rectRadius: 0.1
    });
    slide.addText(`Concept ${artifact.slideNo} / ${TOTAL_SLIDES}`, {
      x: 0.5, y: 0.25, w: 2.8, h: 0.35, fontSize: 8, bold: true, color: "FFFFFF", align: "center", fontFace: t.fontEnglish
    });

    const wordCount = title.split(/\s+/).length + bullets.reduce((n, b) => n + b.split(/\s+/).length, 0);
    slide.addShape("roundRect", {
      x: 8.7, y: 0.25, w: 0.8, h: 0.35, fill: { color: "ECFDF5" }, line: { color: "A7F3D0", width: 1 }, rectRadius: 0.1
    });
    slide.addText(`${wordCount} / 40`, {
      x: 8.7, y: 0.25, w: 0.8, h: 0.35, fontSize: 9, bold: true, color: "065F46", align: "center", fontFace: t.fontEnglish
    });

    // 2. Slide Title
    slide.addText(title, {
      x: 0.5, y: 0.7, w: 8.8, h: 0.8,
      fontSize: 24, bold: true, color: "0F172A",
      fontFace: rtl ? t.fontArabic : t.fontEnglish, rtlMode: rtl
    });

    // 3. Right Visual Card
    const viDesc = typeof content.visualIntent === "object" && content.visualIntent?.description
      ? content.visualIntent.description
      : typeof content.visualIntent === "string" ? content.visualIntent : "";

    // Visual box
    slide.addShape("roundRect", {
      x: 5.4, y: 1.5, w: 4.1, h: 4.6, fill: { color: "FAFAFA" }, line: { color: "A7F3D0", width: 1.5 }, rectRadius: 0.15
    });

    let visualAdded = false;

    // Faculty upload / auto image (priority: facultyUploadedUrl → fetched → image → fallback)
    if (!visualAdded) {
      const imageData = await resolveImageDataForPptx(content, artifact.slideNo);
      if (imageData) {
        try {
          if (imageData.startsWith("data:")) {
            slide.addImage({ data: imageData, x: 5.5, y: 1.6, w: 3.9, h: 2.7 });
          } else {
            slide.addImage({ path: imageData, x: 5.5, y: 1.6, w: 3.9, h: 2.7 });
          }
          visualAdded = true;
        } catch { /* fall through */ }
      }
    }

    // SVG diagram fallback
    const svgCode =
      (content as any).visualSpec?.svgCode ||
      (content as any).visual?.svgCode ||
      (content as any).vectorSvgCode;
    if (!visualAdded && svgCode && typeof svgCode === "string" && svgCode.includes("<svg")) {
      try {
        const svgBase64 = Buffer.from(svgCode).toString("base64");
        slide.addImage({
          data: `data:image/svg+xml;base64,${svgBase64}`,
          x: 5.5, y: 1.6, w: 3.9, h: 2.7
        });
        visualAdded = true;
      } catch { /* fall through */ }
    }

    // Text description of what the visual should show
    if (!visualAdded && viDesc) {
      slide.addText(viDesc, {
        x: 5.55, y: 2.2, w: 3.8, h: 2.0, fontSize: 11, color: "0F7B8A", bold: true, align: "center", fontFace: t.fontEnglish,
        valign: "middle",
      });
    }

    // Visual caption
    const hasFaculty = Boolean((content.visualSpec as any)?.facultyUploadedUrl);
    const visualTitle =
      (content.visualSpec as any)?.title ||
      viDesc ||
      (hasFaculty ? "Faculty image" : "Visual");
    slide.addText(visualTitle.slice(0, 80), {
      x: 5.55, y: 4.4, w: 3.8, h: 0.3, fontSize: 10, color: "065F46", bold: true, fontFace: t.fontEnglish
    });

    // 4. Left Content Bullets
    if (bullets.length > 0) {
      slide.addText(
        bullets.map((b) => ({ text: b, options: { bullet: { code: "25CF" }, color: "334155", breakLine: true, rtlMode: rtl } })),
        {
          x: 0.5, y: 1.6, w: 4.7, h: 4.5,
          fontSize: 15, color: "334155",
          fontFace: rtl ? t.fontArabic : t.fontEnglish,
          valign: "top", rtlMode: rtl
        }
      );
    }

    // 5. Bottom Student Action Callout Box (Studio 1:1 Match)
    if (action) {
      slide.addShape("roundRect", {
        x: 0.5, y: 6.35, w: 9.0, h: 0.8, fill: { color: "ECFDF5" }, line: { color: "A7F3D0", width: 1.2 }, rectRadius: 0.15
      });
      slide.addText(`⚡  ${action}`, {
        x: 0.7, y: 6.35, w: 8.6, h: 0.8, fontSize: 13, bold: true, color: "065F46",
        fontFace: rtl ? t.fontArabic : t.fontEnglish, rtlMode: rtl
      });
      // Intentionally no badge — "Active Task" label must never appear on student slides.
      // The action text itself is sufficient; the label adds no learning value and was
      // previously leaking internal framework vocabulary to students.
    }

    // Instructor Notes — compose from structured notes object
    const notesObj = content.notes;
    let notesText = content.speakerNotes ?? "";
    if (notesObj && typeof notesObj === "object") {
      const parts: string[] = [];
      if (notesObj.timingMinutes) parts.push(`Timing: ${notesObj.timingMinutes} min`);
      if (notesObj.facilitationMoves?.length) parts.push(`Facilitation: ${notesObj.facilitationMoves.join(". ")}`);
      if (notesObj.instructorNotes) parts.push(`Context: ${notesObj.instructorNotes}`);
      if (notesObj.answers) parts.push(`Answer: ${notesObj.answers}`);
      if (parts.length > 0) notesText = parts.join("\n");
    }
    slide.addNotes(notesText || "No instructor notes provided.");
  }

  let result: any;
  try {
    result = await pptx.write({ outputType: "nodebuffer" });
  } catch {
    const b64 = await pptx.write({ outputType: "base64" });
    result = Buffer.from(b64 as string, "base64");
  }
  return Buffer.from(result as Uint8Array);
}
