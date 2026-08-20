"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { WordCountBadge } from "./WordCountBadge";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2, Image as ImageIcon, Sparkles, Edit2, CheckCircle2 } from "lucide-react";
import type { SlideContentJson } from "@/lib/lecture/generation/types";
import { getAcademicVisualForSlide } from "@/lib/lecture/academic-visuals";
import { VisualManagerModal } from "./VisualManagerModal";
import { StemRenderer } from "@/components/ui/StemRenderer";

interface Props {
  slideNo: number;
  content: SlideContentJson | null | undefined;
  total?: number;
  className?: string;
  onSaveVisual?: (visualData: { imageUrl: string; title: string; caption: string }) => Promise<void> | void;
}

/** Executive 16:9 presentation slide preview card matching BRD §11 specifications. */
export function SlidePreviewCard({ slideNo, content, total = 20, className, onSaveVisual }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [aiImage, setAiImage] = useState<string | null>(null);
  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);
  const [loadingAiImage, setLoadingAiImage] = useState(false);

  const fallbackVisual = getAcademicVisualForSlide(
    slideNo,
    content?.title,
    (content?.bullets || content?.visibleContent || []).join(" ")
  );
  const currentDisplayImage =
    content?.visualSpec?.fetchedImageUrl ||
    content?.visualSpec?.imageUrl ||
    fallbackVisual.imageUrl;

  const currentDisplayTitle =
    content?.visualSpec?.title ||
    fallbackVisual.title;

  const currentDisplayCaption =
    content?.visualSpec?.caption ||
    content?.visualSpec?.learningMessage ||
    fallbackVisual.caption;

  if (!content) {
    return (
      <div className={cn("relative w-full aspect-[16/9] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center p-8", className)}>
        <p className="text-sm text-slate-400 italic">No content generated for slide {slideNo}</p>
      </div>
    );
  }

  const bullets = content.bullets || content.visibleContent || [];
  const wordCount = (content.title || "").split(/\s+/).length + bullets.join(" ").split(/\s+/).length;
  const over = wordCount > 40;

  return (
    <div
      className={cn(
        "relative w-full aspect-[16/9] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col justify-between p-7 select-none transition-all",
        className
      )}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-[#0E6C3C] text-white font-mono text-xs px-2.5 py-0.5 shadow-xs">
            Slide {slideNo} / {total}
          </Badge>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            iSCARB BioTech Framework
          </span>
        </div>
        <div className="flex items-center gap-2">
          <WordCountBadge count={wordCount} />
        </div>
      </div>

      {/* Main Slide Content Area */}
      <div className="flex-1 flex flex-col justify-between py-3">
        {/* Title */}
        <div className="space-y-1 mb-2">
          <h3 className="font-display text-xl font-bold leading-snug tracking-tight text-slate-900 dark:text-white">
            <StemRenderer content={content.title ?? `Slide ${slideNo}`} inline />
          </h3>
          {ar && content.textAr?.title && (
            <p className="text-sm font-arabic font-bold text-emerald-600 dark:text-emerald-400 text-right" dir="rtl">
              <StemRenderer content={content.textAr.title} inline />
            </p>
          )}
        </div>

        {/* 2-Column Layout: Bullets on Left, Real Scientific Visual on Right */}
        <div className="flex-1 flex gap-6 pt-1 flex-row items-stretch">
          {/* Left Column: Academic Bullets */}
          <div className="flex-1 flex flex-col justify-center">
            <ul className={cn("space-y-3 text-[13px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed", over && "text-red-600 dark:text-red-400")}>
              {(bullets.length ? bullets : ["Content loading..."]).slice(0, 4).map((b, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-[#0E6C3C] shrink-0 shadow-xs" />
                  <span className="line-clamp-3 leading-relaxed">
                    <StemRenderer content={b} inline />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: High-Res Real Visual Container */}
          <div className="w-[48%] shrink-0 group relative rounded-2xl overflow-hidden border border-emerald-200/90 shadow-sm bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 text-slate-900 flex flex-col items-center justify-between p-3 min-h-[190px]">
            {/* Visual Image */}
            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-white border border-emerald-100 shadow-xs">
              <img
                src={(() => {
                  // Reject PDFs and non-image formats immediately, use fallback
                  const url = currentDisplayImage || "";
                  const lower = url.toLowerCase().split("?")[0];
                  const badExts = [".pdf", ".djvu", ".ogg", ".webm", ".ogv", ".mp4"];
                  if (badExts.some((e) => lower.endsWith(e))) {
                    return fallbackVisual.imageUrl;
                  }
                  return url.startsWith("http")
                    ? `/api/iscarb/image-proxy?url=${encodeURIComponent(url)}`
                    : url;
                })()}
                alt={currentDisplayTitle}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  // Use fallback Unsplash image directly (not through proxy to avoid redirect loops)
                  (e.target as HTMLImageElement).src = fallbackVisual.imageUrl;
                }}
              />

              {/* Hover Buttons: AI Find + Change Visual */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={async () => {
                    setLoadingAiImage(true);
                    try {
                      const res = await fetch("/api/iscarb/lecture/ai-find-image", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: content?.title || `Slide ${slideNo}`,
                          topic: (content?.bullets || []).join(" "),
                          slideNo,
                        }),
                      });
                      const data = await res.json();
                      if (data.imageUrl && onSaveVisual) {
                        await onSaveVisual({
                          imageUrl: data.imageUrl,
                          title: data.title,
                          caption: data.caption,
                        });
                      }
                    } finally {
                      setLoadingAiImage(false);
                    }
                  }}
                  disabled={loadingAiImage}
                  className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer"
                  title="Use LLM AI to find the perfect scientific image"
                >
                  {loadingAiImage ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>{loadingAiImage ? "Finding..." : "AI Find"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVisualModalOpen(true)}
                  className="bg-white/95 hover:bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg shadow-md border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
                  title="Change, upload, or search visual library"
                >
                  <Edit2 className="h-3 w-3 text-[#0E6C3C]" />
                  <span>Change</span>
                </button>
              </div>
            </div>

            {/* Visual Caption & Pedagogical Tag */}
            <div className="w-full pt-2 flex flex-col justify-between space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-emerald-800 line-clamp-1 truncate">
                  <StemRenderer content={currentDisplayTitle} inline />
                </span>
                <span className="text-[9px] font-mono text-slate-500 bg-emerald-100/60 px-1.5 py-0.5 rounded shrink-0">
                  {fallbackVisual.visualType || "Scientific Visual"}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 leading-tight line-clamp-2 italic">
                <StemRenderer content={currentDisplayCaption} inline />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Student Active Task Footer Bar */}
      {content.studentAction && (
        <div className="relative z-10 mt-auto flex items-center justify-between gap-3 rounded-xl bg-emerald-50/80 border border-emerald-200 px-3.5 py-2.5 text-xs font-bold text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <Zap className="h-3.5 w-3.5 text-[#0E6C3C] shrink-0" />
            <span className="truncate">
              <StemRenderer content={typeof content.studentAction === "object" ? (content.studentAction as any).prompt : content.studentAction} inline />
            </span>
          </div>
          <Badge className="bg-[#0E6C3C] text-white font-bold shrink-0 text-[10px] shadow-xs">Active Task</Badge>
        </div>
      )}

      {/* Slide Progress Bottom Line */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-[#0E6C3C] transition-all duration-500"
          style={{ width: `${Math.min(100, (slideNo / total) * 100)}%` }}
        />
      </div>

      {/* Interactive Visual Manager Modal */}
      <VisualManagerModal
        isOpen={isVisualModalOpen}
        onClose={() => setIsVisualModalOpen(false)}
        slideNo={slideNo}
        currentImageUrl={currentDisplayImage}
        currentTitle={currentDisplayTitle}
        currentCaption={currentDisplayCaption}
        onSaveVisual={async (visualData) => {
          if (onSaveVisual) {
            await onSaveVisual(visualData);
          } else {
            // Local fallback / direct API patch
            if (content?.visualSpec) {
              content.visualSpec.fetchedImageUrl = visualData.imageUrl;
              content.visualSpec.imageUrl = visualData.imageUrl;
              content.visualSpec.title = visualData.title;
              content.visualSpec.caption = visualData.caption;
            }
          }
        }}
      />
    </div>
  );
}
