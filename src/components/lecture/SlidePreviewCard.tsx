"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { WordCountBadge } from "./WordCountBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Loader2,
  ImageOff,
  Sparkles,
  Edit2,
  RefreshCw,
  AlertTriangle,
  Upload,
  Undo2,
} from "lucide-react";
import type { SlideContentJson } from "@/lib/lecture/generation/types";
import { FALLBACK_ERROR_VISIBLE_COPY } from "@/lib/lecture/generation/constants";
import { getAcademicVisualForSlide } from "@/lib/lecture/academic-visuals";
import { resolveSlideImageUrl, hasFacultyUploadedImage } from "@/lib/lecture/visual-image";
import { proxiedImageUrl } from "@/lib/image-proxy";
import { VisualManagerModal } from "./VisualManagerModal";
import { StemRenderer } from "@/components/ui/StemRenderer";

interface Props {
  slideNo: number;
  content: SlideContentJson | null | undefined;
  total?: number;
  className?: string;
  projectId?: string;
  onSaveVisual?: (visualData: {
    imageUrl: string;
    title: string;
    caption: string;
    facultyUploaded?: boolean;
    visualSpec?: Record<string, unknown>;
  }) => Promise<void> | void;
  onRemoveFacultyImage?: () => Promise<void> | void;
  onRegenerate?: () => void;
}

/** Executive 16:9 presentation slide preview card matching BRD §11 specifications. */
export function SlidePreviewCard({
  slideNo,
  content,
  total = 20,
  className,
  projectId,
  onSaveVisual,
  onRemoveFacultyImage,
  onRegenerate,
}: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);
  const [loadingAiImage, setLoadingAiImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageState, setImageState] = useState<"loading" | "ok" | "error">("loading");
  const [activeImageSrc, setActiveImageSrc] = useState<string>("");

  const bodyBullets = content?.body?.bullets || content?.bullets || content?.visibleContent || [];
  const visibleCopy = content?.body?.visibleCopy || (content as { visibleCopy?: string })?.visibleCopy || "";
  const isGenerationFailed =
    Boolean((content as { generationFailed?: boolean })?.generationFailed) ||
    visibleCopy === FALLBACK_ERROR_VISIBLE_COPY;

  const slideTextForVisual = [...bodyBullets, visibleCopy].filter(Boolean).join(" ");
  const fallbackVisual = getAcademicVisualForSlide(slideNo, content?.title, slideTextForVisual);

  const facultyOverride = hasFacultyUploadedImage(content?.visualSpec);
  const currentDisplayImage = resolveSlideImageUrl(content?.visualSpec, fallbackVisual.imageUrl);

  const currentDisplayTitle = content?.visualSpec?.title || fallbackVisual.title;
  const currentDisplayCaption =
    content?.visualSpec?.caption ||
    content?.visualSpec?.learningMessage ||
    fallbackVisual.caption;

  const displayLines = useMemo(() => {
    if (isGenerationFailed) return { kind: "failed" as const, lines: [] as string[] };
    if (bodyBullets.length > 0) return { kind: "bullets" as const, lines: bodyBullets };
    if (visibleCopy && visibleCopy !== FALLBACK_ERROR_VISIBLE_COPY) {
      return { kind: "copy" as const, lines: [visibleCopy] };
    }
    return { kind: "empty" as const, lines: [] as string[] };
  }, [bodyBullets, visibleCopy, isGenerationFailed]);

  useEffect(() => {
    if (!currentDisplayImage) {
      setImageState("error");
      setActiveImageSrc("");
      return;
    }
    setImageState("loading");
    setActiveImageSrc(proxiedImageUrl(currentDisplayImage));
  }, [currentDisplayImage, slideNo]);

  if (!content) {
    return (
      <div className={cn("relative w-full aspect-[16/9] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center p-8", className)}>
        <p className="text-sm text-slate-400 italic">No content generated for slide {slideNo}</p>
      </div>
    );
  }

  const wordCount =
    (content.title || "").split(/\s+/).filter(Boolean).length +
    (bodyBullets.length ? bodyBullets : visibleCopy ? [visibleCopy] : [])
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;
  const over = wordCount > 40;

  const handleImageError = () => {
    const fallbackSrc = proxiedImageUrl(fallbackVisual.imageUrl);
    if (activeImageSrc !== fallbackSrc && fallbackVisual.imageUrl) {
      setActiveImageSrc(fallbackSrc);
      setImageState("loading");
      return;
    }
    setImageState("error");
  };

  const uploadFile = async (file: File) => {
    if (!projectId) {
      setUploadError("Missing project id");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/iscarb/lecture/projects/${projectId}/slides/${slideNo}/image`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || `Upload failed (${res.status})`);
        return;
      }
      if (onSaveVisual) {
        await onSaveVisual({
          imageUrl: data.imageUrl,
          title: content?.title || `Slide ${slideNo}`,
          caption: content?.visualSpec?.caption || "",
          facultyUploaded: true,
          visualSpec: data.visualSpec,
        });
      }
      setImageState("loading");
      setActiveImageSrc(proxiedImageUrl(data.imageUrl));
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFacultyImage = async () => {
    if (!projectId) return;
    setRemoving(true);
    setUploadError(null);
    try {
      const res = await fetch(`/api/iscarb/lecture/projects/${projectId}/slides/${slideNo}/image`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || `Remove failed (${res.status})`);
        return;
      }
      if (onRemoveFacultyImage) await onRemoveFacultyImage();
      else if (onSaveVisual) {
        await onSaveVisual({
          imageUrl: data.revertedTo || fallbackVisual.imageUrl,
          title: content?.title || `Slide ${slideNo}`,
          caption: "",
          facultyUploaded: false,
          visualSpec: data.visualSpec,
        });
      }
    } catch (err: any) {
      setUploadError(err?.message || "Remove failed");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full aspect-[16/9] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col justify-between p-7 select-none transition-all",
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
        }}
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-[#0E6C3C] text-white font-mono text-xs px-2.5 py-0.5 shadow-xs">
            Slide {slideNo} / {total}
          </Badge>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            iSCARB BioTech Framework
          </span>
          {facultyOverride && (
            <Badge className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold">
              Faculty image
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <WordCountBadge count={wordCount} />
        </div>
      </div>

      {/* Main Slide Content Area */}
      <div className="flex-1 flex flex-col justify-between py-3">
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

        <div className="flex-1 flex gap-6 pt-1 flex-row items-stretch">
          <div className="flex-1 flex flex-col justify-center">
            {displayLines.kind === "failed" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 space-y-2">
                <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-[13px] font-semibold leading-relaxed">
                    {ar ? "فشل التوليد — أعد توليد هذه الشريحة" : "Generation failed — regenerate this slide"}
                  </p>
                </div>
                {onRegenerate && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onRegenerate}
                    className="h-8 text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    {ar ? "إعادة التوليد" : "Regenerate slide"}
                  </Button>
                )}
              </div>
            ) : displayLines.lines.length > 0 ? (
              <ul className={cn("space-y-3 text-[13px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed", over && "text-red-600 dark:text-red-400")}>
                {displayLines.lines.slice(0, 4).map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-[#0E6C3C] shrink-0 shadow-xs" />
                    <span className="line-clamp-3 leading-relaxed">
                      <StemRenderer content={b} inline />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-slate-400 italic">
                {ar ? "لا يوجد محتوى نقطي لهذه الشريحة." : "No bullet content for this slide."}
              </p>
            )}
          </div>

          <div className="w-[48%] shrink-0 group relative rounded-2xl overflow-hidden border border-emerald-200/90 shadow-sm bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 text-slate-900 flex flex-col items-center justify-between p-3 min-h-[190px]">
            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-white border border-emerald-100 shadow-xs">
              {imageState === "error" ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-slate-50 text-slate-500 px-3">
                  <ImageOff className="h-6 w-6 text-slate-400" />
                  <span className="text-[10px] font-semibold text-center leading-tight">
                    {ar ? "تعذّر تحميل الصورة" : "Image unavailable"}
                  </span>
                </div>
              ) : (
                <>
                  {imageState === "loading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-[1]">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    </div>
                  )}
                  <img
                    src={activeImageSrc}
                    alt={currentDisplayTitle}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                    onLoad={() => setImageState("ok")}
                    onError={handleImageError}
                  />
                </>
              )}

              <div className="absolute top-2 right-2 flex flex-wrap items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity max-w-[95%]">
                {projectId && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer"
                    title={facultyOverride ? "Replace faculty image" : "Upload image for this slide"}
                  >
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    <span>{uploading ? "Uploading..." : facultyOverride ? "Replace" : "Upload"}</span>
                  </button>
                )}
                {facultyOverride && projectId && (
                  <button
                    type="button"
                    onClick={() => void removeFacultyImage()}
                    disabled={removing}
                    className="bg-white/95 hover:bg-white text-amber-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow-md border border-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                    title="Remove faculty image and revert to auto"
                  >
                    {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />}
                    <span>Revert</span>
                  </button>
                )}
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
                          topic: bodyBullets.join(" "),
                          slideNo,
                        }),
                      });
                      const data = await res.json();
                      if (data.imageUrl && onSaveVisual) {
                        await onSaveVisual({
                          imageUrl: data.imageUrl,
                          title: data.title,
                          caption: data.caption,
                          facultyUploaded: false,
                        });
                        setImageState("loading");
                        setActiveImageSrc(proxiedImageUrl(data.imageUrl));
                      }
                    } finally {
                      setLoadingAiImage(false);
                    }
                  }}
                  disabled={loadingAiImage || facultyOverride}
                  className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title={facultyOverride ? "Remove faculty image first to use AI Find" : "Use LLM AI to find the perfect scientific image"}
                >
                  {loadingAiImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
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

            {uploadError && (
              <p className="w-full text-[10px] text-red-600 font-semibold mt-1 line-clamp-2">{uploadError}</p>
            )}

            <div className="w-full pt-2 flex flex-col justify-between space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-emerald-800 line-clamp-1 truncate">
                  <StemRenderer content={currentDisplayTitle} inline />
                </span>
                <span className="text-[9px] font-mono text-slate-500 bg-emerald-100/60 px-1.5 py-0.5 rounded shrink-0">
                  {facultyOverride ? "Faculty Upload" : fallbackVisual.visualType || "Scientific Visual"}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 leading-tight line-clamp-2 italic">
                <StemRenderer content={currentDisplayCaption} inline />
              </div>
            </div>
          </div>
        </div>
      </div>

      {content.studentAction && (
        <div className="relative z-10 mt-auto flex items-center justify-between gap-3 rounded-xl bg-emerald-50/80 border border-emerald-200 px-3.5 py-2.5 text-xs font-bold text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <Zap className="h-3.5 w-3.5 text-[#0E6C3C] shrink-0" />
            <span className="truncate">
              <StemRenderer content={typeof content.studentAction === "object" ? (content.studentAction as any).prompt : content.studentAction} inline />
            </span>
          </div>
          <Badge className="bg-[#0E6C3C] text-white font-bold shrink-0 text-[10px] shadow-xs">⚡ Activity</Badge>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-[#0E6C3C] transition-all duration-500"
          style={{ width: `${Math.min(100, (slideNo / total) * 100)}%` }}
        />
      </div>

      <VisualManagerModal
        isOpen={isVisualModalOpen}
        onClose={() => setIsVisualModalOpen(false)}
        slideNo={slideNo}
        projectId={projectId}
        currentImageUrl={currentDisplayImage}
        currentTitle={currentDisplayTitle}
        currentCaption={currentDisplayCaption}
        onSaveVisual={async (visualData) => {
          if (onSaveVisual) {
            await onSaveVisual(visualData);
          }
          setImageState("loading");
          setActiveImageSrc(proxiedImageUrl(visualData.imageUrl));
        }}
      />
    </div>
  );
}
