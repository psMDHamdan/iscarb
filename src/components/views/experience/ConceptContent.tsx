"use client";

/**
 * ConceptContent — center panel rendering a single ConceptBlock.
 *
 * Renders the 5-layer student view in a visually rich, scrollable layout:
 *   1. Stage badge + concept title
 *   2. Core insight
 *   3. Mental model (analogy + framework)
 *   4. Mechanism (explanation + steps)
 *   5. Interactive Visual Showcase (High-res biological models + Lightbox zoom)
 *   6. Real-world transfer (scenario + application)
 *   7. Common pitfalls
 *
 * No internal jargon — pure student-facing content.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Puzzle,
  Cog,
  Eye,
  Globe,
  AlertTriangle,
  Quote,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAcademicVisualForSlide } from "@/lib/lecture/academic-visuals";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StemRenderer } from "@/components/ui/StemRenderer";

import type {
  StudentConceptViewModel,
  PedagogicalPhase,
} from "@/lib/lecture/projections/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConceptContentProps {
  concept: StudentConceptViewModel;
  ar: boolean;
}

// ---------------------------------------------------------------------------
// Stage badge metadata
// ---------------------------------------------------------------------------

const STAGE_BADGE: Record<PedagogicalPhase, { labelEn: string; labelAr: string; color: string }> = {
  DISCOVER: { labelEn: "Discover", labelAr: "اكتشف", color: "bg-emerald-600 text-white" },
  UNDERSTAND: { labelEn: "Understand", labelAr: "افهم", color: "bg-teal-600 text-white" },
  EXPLORE: { labelEn: "Explore", labelAr: "استكشف", color: "bg-blue-600 text-white" },
  PRACTICE: { labelEn: "Practice", labelAr: "تدرّب", color: "bg-indigo-600 text-white" },
  APPLY: { labelEn: "Apply", labelAr: "طبّق", color: "bg-purple-600 text-white" },
  CHALLENGE: { labelEn: "Challenge", labelAr: "تحدَّ", color: "bg-rose-600 text-white" },
  MASTER: { labelEn: "Master", labelAr: "أتقن", color: "bg-amber-600 text-white" },
};

// ---------------------------------------------------------------------------
// ConceptContent
// ---------------------------------------------------------------------------

export function ConceptContent({ concept, ar }: ConceptContentProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const badge = STAGE_BADGE[concept.stage] || STAGE_BADGE.DISCOVER;
  const dir = ar ? "rtl" : "ltr";

  // ── Resolve display content with layered fallbacks ──────────────────────
  // Priority: coreContent fields (new compiler) → visibleCopy/bullets (legacy)
  const explanation =
    concept.coreContent?.explanation ||
    concept.visibleCopy ||
    (concept.bullets?.length ? concept.bullets[0] : "") ||
    "";

  const analogy = concept.coreContent?.analogy || "";

  const mechanismSteps: string[] =
    concept.coreContent?.steps ||
    (concept.bullets?.length && concept.bullets.length > 1 ? concept.bullets : []);

  const realWorldScenario =
    concept.realWorld?.scenario ||
    concept.realWorld?.application ||
    (concept.bullets?.length && concept.bullets.length > 2 ? concept.bullets.slice(1).join(" ") : "") ||
    "";

  const realWorldApplication =
    concept.realWorld?.application ||
    "";

  // ── Visual fallback ──────────────────────────────────────────────────────
  const fallbackVisual = getAcademicVisualForSlide(
    concept.orderIndex,
    concept.title,
    `${explanation} ${analogy}`
  );

  const rawVisualUrl = concept.visual?.imageUrl;
  const isInvalidUrl =
    !rawVisualUrl ||
    rawVisualUrl.endsWith(".pdf") ||
    rawVisualUrl.endsWith(".djvu") ||
    rawVisualUrl.endsWith(".ogg") ||
    rawVisualUrl.endsWith(".webm") ||
    rawVisualUrl.toLowerCase().includes("flag") ||
    rawVisualUrl.toLowerCase().includes("oklahoma");

  const displayImage = isInvalidUrl ? fallbackVisual.imageUrl : rawVisualUrl;
  const displayTitle = concept.visual?.title || fallbackVisual.title;
  const displayCaption = concept.visual?.caption || fallbackVisual.caption;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={concept.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col h-full overflow-y-auto"
        dir={dir}
      >
        <div className="flex-1 space-y-5 p-5 lg:p-6 max-w-3xl mx-auto w-full">

          {/* ── Stage Badge + Title ─────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs",
                  badge.color
                )}
              >
                {ar ? badge.labelAr : badge.labelEn}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                {ar ? `المفهوم ${concept.orderIndex}` : `Concept ${concept.orderIndex}`}
              </span>
              {concept.estimatedMinutes > 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  • ~{concept.estimatedMinutes} {ar ? "دقيقة" : "min"}
                </span>
              )}
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              <StemRenderer content={concept.title} inline />
            </h2>
          </div>

          {/* ── Core Insight ────────────────────────────────────────────── */}
          {explanation ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-l-4 border-emerald-500 dark:border-emerald-400 dark:from-emerald-950/30">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                  <StemRenderer content={explanation} inline />
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-sm text-center">
              {ar ? "المحتوى قيد المراجعة — سيتوفر قريباً" : "Content is being reviewed and will be available soon."}
            </div>
          )}

          {/* ── Mental Model ────────────────────────────────────────────── */}
          {(analogy || explanation) && (
            <SectionCard
              icon={<Puzzle className="h-4 w-4" />}
              label={ar ? "تخيلها كالتالي" : "Think of It Like This"}
              accentColor="emerald"
            >
              <div className="space-y-3">
                {analogy && (
                  <div className="flex items-start gap-2.5">
                    <Quote className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1 opacity-70" />
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      <StemRenderer content={analogy} inline />
                    </p>
                  </div>
                )}

                {explanation && (
                  <div className={analogy ? "pt-2.5 border-t border-emerald-100/60 dark:border-slate-800" : ""}>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0E6C3C]" />
                      {ar ? "الإطار المفاهيمي" : "Core Framework"}
                    </p>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-emerald-50/40 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                      <StemRenderer content={explanation} />
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* ── Mechanism ───────────────────────────────────────────────── */}
          {(explanation || mechanismSteps.length > 0) && (
            <SectionCard
              icon={<Cog className="h-4 w-4" />}
              label={ar ? "كيف تعمل الآلية؟" : "How It Works"}
              accentColor="blue"
            >
              <div className="space-y-3">
                {explanation && (
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <StemRenderer content={explanation} />
                  </div>
                )}

                {mechanismSteps.length > 1 && (
                  <ol className="space-y-2 pt-1">
                    {mechanismSteps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold border border-blue-400/20">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed font-medium">
                          <StemRenderer content={step} inline />
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </SectionCard>
          )}

          {/* ── Visual (Interactive Visual Showcase) ────────────────────────── */}
          <SectionCard
            icon={<Eye className="h-4 w-4" />}
            label={displayTitle || (ar ? "التصور المرئي" : "Visual & Molecular Models")}
            accentColor="indigo"
          >
            <div className="space-y-3">
              {displayImage && (
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  className="group relative rounded-2xl overflow-hidden border border-emerald-200/90 shadow-sm bg-white p-2.5 cursor-pointer hover:shadow-md transition-all"
                  title={ar ? "انقر لتكبير الصورة بدقة عالية" : "Click to expand high-resolution diagram"}
                >
                  <img
                    src={
                      displayImage.startsWith("http")
                        ? `/api/iscarb/image-proxy?url=${encodeURIComponent(displayImage)}`
                        : displayImage
                    }
                    alt={displayCaption || displayTitle}
                    className="w-full rounded-xl object-contain max-h-96 mx-auto group-hover:scale-101 transition-transform duration-200"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackVisual.imageUrl;
                    }}
                  />
                  <div className="absolute bottom-4 right-4 bg-black/75 hover:bg-black text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1.5 shadow-lg opacity-85 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>{ar ? "تكبير" : "Expand"}</span>
                  </div>
                </div>
              )}

              {concept.visual?.svgCode && (
                <div
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900/60 p-2"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: concept.visual.svgCode }}
                />
              )}

              {displayCaption && (
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 text-center font-medium leading-relaxed italic">
                  <StemRenderer content={displayCaption} inline />
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Real-World Transfer ─────────────────────────────────────── */}
          {(realWorldScenario || realWorldApplication) && (
            <SectionCard
              icon={<Globe className="h-4 w-4" />}
              label={ar ? "في الواقع" : "In the Real World"}
              accentColor="purple"
            >
              <div className="space-y-2">
                {realWorldScenario && (
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                    <StemRenderer content={realWorldScenario} />
                  </div>
                )}
                {realWorldApplication && realWorldApplication !== realWorldScenario && (
                  <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <StemRenderer content={realWorldApplication} />
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* ── Common Pitfalls ─────────────────────────────────────────── */}
          {concept.commonPitfalls && concept.commonPitfalls.length > 0 && (
            <SectionCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label={ar ? "أخطاء شائعة" : "Common Pitfalls"}
              accentColor="amber"
            >
              <div className="space-y-3">
                {concept.commonPitfalls.map((pitfall, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>
                        <StemRenderer content={pitfall.misconception} inline />
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 pl-3">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        {ar ? "لماذا خطأ: " : "Why incorrect: "}
                      </span>
                      <StemRenderer content={pitfall.whyWrong} inline />
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 pl-3 font-medium">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {ar ? "الصواب: " : "Better way: "}
                      </span>
                      <StemRenderer content={pitfall.betterWay} inline />
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

        </div>

        {/* Full-screen Lightbox Dialog */}
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-4 bg-white text-slate-900 border border-emerald-200 rounded-2xl shadow-2xl">
            <DialogHeader className="pb-2 border-b border-emerald-100">
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#0E6C3C]" />
                {displayTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
              <img
                src={
                  displayImage.startsWith("http")
                    ? `/api/iscarb/image-proxy?url=${encodeURIComponent(displayImage)}`
                    : displayImage
                }
                alt={displayTitle}
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-md border border-slate-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackVisual.imageUrl;
                }}
              />
            </div>
            {displayCaption && (
              <p className="text-xs text-slate-600 text-center italic border-t border-slate-100 pt-2 font-medium">
                {displayCaption}
              </p>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// SectionCard helper
// ---------------------------------------------------------------------------

interface SectionCardProps {
  icon: React.ReactNode;
  label: string;
  accentColor: "emerald" | "blue" | "indigo" | "purple" | "amber";
  children: React.ReactNode;
}

const ACCENT_STYLES = {
  emerald: "border-emerald-200/80 bg-white dark:bg-slate-900 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  blue: "border-blue-200/80 bg-white dark:bg-slate-900 dark:border-blue-900/40 text-blue-700 dark:text-blue-400",
  indigo: "border-indigo-200/80 bg-white dark:bg-slate-900 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400",
  purple: "border-purple-200/80 bg-white dark:bg-slate-900 dark:border-purple-900/40 text-purple-700 dark:text-purple-400",
  amber: "border-amber-200/80 bg-white dark:bg-slate-900 dark:border-amber-900/40 text-amber-700 dark:text-amber-400",
};

function SectionCard({ icon, label, accentColor, children }: SectionCardProps) {
  const styles = ACCENT_STYLES[accentColor];

  return (
    <div className={cn("p-4 rounded-2xl border shadow-xs transition-all", styles)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-current">
          {icon}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {label}
        </h3>
      </div>
      {children}
    </div>
  );
}
