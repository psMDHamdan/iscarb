"use client";

/**
 * UploadDropzone — drag-and-drop file upload with browser-side text extraction.
 * ===========================================================================
 * For images → Tesseract.js OCR in the browser.
 * For PDFs  → pdfjs-dist text extraction in the browser.
 * For PPTX  → JSZip XML text extraction in the browser.
 *
 * Extracted text is sent to the server as `extractedText`, which bypasses
 * the slow server-side parse worker entirely — making upload near-instant.
 */
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { UploadCloud, FileText, X, ScanText } from "lucide-react";
import Tesseract from "tesseract.js";

const ACCEPTED = [".pdf", ".pptx", ".docx", ".html", ".htm", ".png", ".jpg", ".jpeg"];
const IMAGE_TYPES = [".png", ".jpg", ".jpeg"];
const PDF_TYPES = [".pdf"];
const PPTX_TYPES = [".pptx"];
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

interface Props {
  onFile: (file: File, extractedText?: string) => void;
  busy?: boolean;
  className?: string;
}

// ─── Browser-side PDF text extraction (pdfjs-dist) ──────────────────────

async function extractPdfText(file: File): Promise<string | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    // Use standard (non-legacy) build for the browser
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url,
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => (typeof item.str === "string" ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) pages.push(text);
    }

    const fullText = pages.join("\n\n");
    // Only return if we got meaningful text (not just whitespace)
    return fullText.length > 50 ? fullText : null;
  } catch (err) {
    console.warn("[UploadDropzone] PDF text extraction failed:", err);
    return null;
  }
}

// ─── Browser-side PPTX text extraction (JSZip) ─────────────────────────

async function extractPptxText(file: File): Promise<string | null> {
  try {
    const JSZip = (await import("jszip")).default;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slides = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort();

    const texts: string[] = [];
    for (const slidePath of slides) {
      const xml = await zip.file(slidePath)!.async("string");
      // Quick XML text extraction: grab all <a:t>...</a:t> content
      const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
      if (matches) {
        const slideText = matches
          .map((m) => m.replace(/<\/?a:t>/g, "").trim())
          .filter(Boolean)
          .join(" ");
        if (slideText) texts.push(slideText);
      }
    }

    const fullText = texts.join("\n\n");
    return fullText.length > 50 ? fullText : null;
  } catch (err) {
    console.warn("[UploadDropzone] PPTX text extraction failed:", err);
    return null;
  }
}

// ─── Image OCR (Tesseract.js) ──────────────────────────────────────────

async function ocrImage(
  file: File,
  lang: "en" | "ar" = "en",
  onProgress?: (pct: number) => void,
): Promise<string | null> {
  try {
    const worker = await Tesseract.createWorker([lang === "ar" ? "ara" : "eng"], 1, {
      logger: (m) => {
        if (m.status === "recognizing text") onProgress?.(Math.round(m.progress * 100));
      },
    });
    const { data } = await worker.recognize(file);
    await worker.terminate();
    return data.text?.trim() || null;
  } catch (err) {
    console.warn("[UploadDropzone] Tesseract OCR failed:", err);
    return null;
  }
}

// ─── Component ──────────────────────────────────────────────────────────

export function UploadDropzone({ onFile, busy, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const validate = useCallback(
    (file: File) => {
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      if (!ACCEPTED.includes(ext)) {
        setError(ar ? `نوع الملف غير مدعوم (${ext})` : `Unsupported file type (${ext})`);
        return false;
      }
      if (file.size > MAX_BYTES) {
        setError(ar ? "الملف يتجاوز 50 ميغابايت" : "File exceeds 50 MB limit");
        return false;
      }
      if (file.size === 0) {
        setError(ar ? "ملف فارغ" : "Empty file");
        return false;
      }
      setError(null);
      return true;
    },
    [ar],
  );

  const processFile = async (file: File) => {
    const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();

    setProcessing(true);
    setProgress(0);

    try {
      let extractedText: string | undefined;

      // ── Image → Tesseract.js OCR ──────────────────────────────
      if (IMAGE_TYPES.includes(ext)) {
        setStatus(ar ? "جاري التعرف على النصوص..." : "Recognizing text...");
        setProgress(10);
        const text = await ocrImage(file, "en", (pct) => setProgress(10 + pct * 0.8));
        if (text) extractedText = text;
        setProgress(90);
      }

      // ── PDF → pdfjs-dist text extraction (browser-side) ───────
      else if (PDF_TYPES.includes(ext)) {
        setStatus(ar ? "جاري استخراج النصوص من PDF..." : "Extracting text from PDF...");
        setProgress(20);
        const text = await extractPdfText(file);
        if (text) extractedText = text;
        setProgress(80);
      }

      // ── PPTX → JSZip text extraction (browser-side) ───────────
      else if (PPTX_TYPES.includes(ext)) {
        setStatus(ar ? "جاري استخراج النصوص من العرض..." : "Extracting text from presentation...");
        setProgress(20);
        const text = await extractPptxText(file);
        if (text) extractedText = text;
        setProgress(80);
      }

      // ── DOCX / HTML → server handles it (small files) ─────────
      else {
        setStatus(ar ? "جارٍ التجهيز..." : "Preparing...");
        setProgress(50);
      }

      setProgress(100);

      // Small delay so the user sees 100% before the UI transitions
      await new Promise((r) => setTimeout(r, 200));

      onFile(file, extractedText);
    } catch (err) {
      console.error("[UploadDropzone] processing failed:", err);
      setError(ar ? "فشلت معالجة الملف" : "File processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validate(file)) void processFile(file);
  };

  const isBusy = busy || processing;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={ar ? "رفع ملف مصدر" : "Upload a source file"}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
          dragging
            ? "border-emerald-500 bg-emerald-500/10 scale-[1.02]"
            : "border-border bg-slate-50/50 hover:border-emerald-500/60 hover:bg-slate-50",
          isBusy && "pointer-events-none opacity-80",
        )}
      >
        {processing ? (
          <div aria-live="polite" className="flex flex-col items-center gap-3 w-full max-w-[200px] text-sm text-emerald-800">
            <ScanText className="h-10 w-10 animate-pulse text-emerald-600" />
            <div className="flex w-full items-center justify-between text-xs font-bold">
              <span>{status}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : busy ? (
          <div aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            {ar ? "جارٍ الرفع والمعالجة…" : "Uploading & Processing…"}
          </div>
        ) : (
          <>
            <UploadCloud className="h-12 w-12 text-slate-400 mb-1" />
            <p className="text-sm font-bold text-slate-700">
              {ar ? "اسحب الملف هنا أو انقر للاختيار" : "Drag a file here or click to browse"}
            </p>
            <p className="text-[10px] text-slate-400">
              {ar ? "PDF، PPTX، DOCX، صور — حتى 50 ميغابايت" : "PDF, PPTX, DOCX, images — up to 50 MB"}
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && validate(file)) void processFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
          <X className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
