"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { UploadCloud, FileText, X, ScanText } from "lucide-react";
import Tesseract from "tesseract.js";

const ACCEPTED = [".pdf", ".pptx", ".docx", ".html", ".htm", ".png", ".jpg", ".jpeg"];
const IMAGE_TYPES = [".png", ".jpg", ".jpeg"];
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

interface Props {
  onFile: (file: File, extractedText?: string) => void;
  busy?: boolean;
  className?: string;
}

/** Drag-and-drop upload zone for PPTX/PDF/DOCX/HTML/Images with Client-side OCR. */
export function UploadDropzone({ onFile, busy, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OCR State
  const [isOcring, setIsOcring] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");

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
    // Client-side OCR is too slow; send file directly to backend for OCR
    onFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validate(file)) void processFile(file);
  };

  const isBusy = busy || isOcring;

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
        {isOcring ? (
          <div aria-live="polite" className="flex flex-col items-center gap-3 w-full max-w-[200px] text-sm text-emerald-800">
            <ScanText className="h-10 w-10 animate-pulse text-emerald-600" />
            <div className="flex w-full items-center justify-between text-xs font-bold">
              <span>{ocrStatus}</span>
              <span>{ocrProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
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
