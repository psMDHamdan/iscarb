"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Cog,
  Eye,
  Globe,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StemRenderer } from "@/components/ui/StemRenderer";
import { DynamicMermaid } from "@/components/ui/DynamicMermaid";
import type {
  StudentConceptViewModel,
  PedagogicalPhase,
} from "@/lib/lecture/projections/types";
import { resolveSlideImageUrl } from "@/lib/lecture/visual-image";

// ---------------------------------------------------------------------------
// Props & Metadata
// ---------------------------------------------------------------------------

interface ConceptContentProps {
  concept: StudentConceptViewModel;
  ar: boolean;
}

const STAGE_BADGE: Record<PedagogicalPhase, { labelEn: string; labelAr: string; color: string }> = {
  DISCOVER: { labelEn: "Discover", labelAr: "اكتشف", color: "emerald" },
  UNDERSTAND: { labelEn: "Understand", labelAr: "افهم", color: "teal" },
  EXPLORE: { labelEn: "Explore", labelAr: "استكشف", color: "blue" },
  PRACTICE: { labelEn: "Practice", labelAr: "تدرّب", color: "indigo" },
  APPLY: { labelEn: "Apply", labelAr: "طبّق", color: "purple" },
  CHALLENGE: { labelEn: "Challenge", labelAr: "تحدَّ", color: "rose" },
  MASTER: { labelEn: "Master", labelAr: "أتقن", color: "amber" },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ConceptContent({ concept, ar }: ConceptContentProps) {
  const dir = ar ? "rtl" : "ltr";
  const badgeInfo = STAGE_BADGE[concept.stage] || STAGE_BADGE.DISCOVER;

  // -- Derived Content --
  const explanation =
    concept.coreContent?.explanation ||
    concept.visibleCopy ||
    (concept.bullets?.length ? concept.bullets[0] : "") ||
    "";

  const analogy = concept.coreContent?.analogy || "";
  const mechanismSteps: string[] =
    concept.coreContent?.steps ||
    (concept.bullets?.length && concept.bullets.length > 1 ? concept.bullets : []);

  const realWorldScenario = concept.realWorld?.scenario || "";
  const realWorldApplication = concept.realWorld?.application || "";
  const hook = concept.hook || concept.headline || "";

  // Visuals — resolve using priority (facultyUploadedUrl -> fetchedImageUrl -> imageUrl)
  const rawVisualUrl = resolveSlideImageUrl(
    concept.visual as any,
    concept.visual?.imageUrl || (concept.visual as any)?.fetchedImageUrl
  );
  // If it's a real generated image (not a fallback unsplash), we prioritize it heavily.
  const isStockUrl = rawVisualUrl?.includes("unsplash") || rawVisualUrl?.includes("pollinations");
  const displayImage = rawVisualUrl; // We will show it even if stock, but style it nicely.
  const svgCode = concept.visual?.svgCode;
  const displayTitle = concept.visual?.title || concept.title;
  const displayCaption = concept.visual?.caption || "";

  return (
    <div
      className="flex-1 overflow-y-auto w-full h-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 p-4 md:p-8 custom-scrollbar relative"
      dir={dir}
    >
      <div className="max-w-5xl mx-auto space-y-8 pb-32">
        {/* HEADER */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-${badgeInfo.color}-100 dark:bg-${badgeInfo.color}-900/30 text-${badgeInfo.color}-700 dark:text-${badgeInfo.color}-300 border border-${badgeInfo.color}-200 dark:border-${badgeInfo.color}-800/50`}>
              {ar ? badgeInfo.labelAr : badgeInfo.labelEn}
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {concept.title}
          </h1>
        </header>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Narrative & Visuals */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* The Hook / Scenario */}
            {hook && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 backdrop-blur-sm shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3 text-rose-600 dark:text-rose-400">
                  <HelpCircle className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">{ar ? "السيناريو" : "The Scenario"}</h3>
                </div>
                <div className="text-lg md:text-xl font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  <StemRenderer content={hook} />
                </div>
              </motion.div>
            )}

            {/* Core Concept & Analogy */}
            {explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">
                  <Lightbulb className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">{ar ? "المفهوم الأساسي" : "Core Concept"}</h3>
                </div>
                <div className="text-base text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
                  <StemRenderer content={explanation} />
                  {analogy && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-400 dark:border-emerald-600">
                      <p className="text-sm font-semibold italic text-emerald-800 dark:text-emerald-200">
                        "{analogy}"
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Visual Focal Point */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg relative group"
            >
              {/* Image priority over SVG */}
              {displayImage ? (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImage}
                    alt={displayTitle}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-6 right-6">
                    <h4 className="text-white font-bold text-lg drop-shadow-md">{displayTitle}</h4>
                    {displayCaption && (
                      <p className="text-slate-200 text-sm font-medium drop-shadow-sm mt-1 line-clamp-2">
                        {displayCaption}
                      </p>
                    )}
                  </div>
                </div>
              ) : svgCode ? (
                <div className="p-6 bg-white dark:bg-slate-900 flex flex-col items-center justify-center min-h-[300px]">
                  <div
                    className="w-full h-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: svgCode }}
                  />
                  {displayCaption && (
                    <p className="text-slate-500 text-sm mt-4 italic text-center">{displayCaption}</p>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-white dark:bg-slate-900 min-h-[300px] flex items-center justify-center">
                  <DynamicMermaid
                    conceptTitle={concept.title}
                    explanation={explanation}
                    mechanismSteps={mechanismSteps}
                  />
                </div>
              )}
            </motion.div>

          </div>

          {/* RIGHT COLUMN: Mechanisms & Application */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Mechanism Stepper */}
            {mechanismSteps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400">
                  <Cog className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">{ar ? "كيف تعمل الآلية" : "How It Works"}</h3>
                </div>
                
                <div className="space-y-0 relative">
                  {mechanismSteps.map((step, i) => (
                    <div key={i} className="relative">
                      {i < mechanismSteps.length - 1 && (
                        <div className="absolute left-[15px] top-[30px] w-0.5 h-full bg-blue-200 dark:bg-blue-800" />
                      )}
                      <div className="flex items-start gap-4 relative z-10 pb-6">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center text-sm font-extrabold shadow-sm">
                          {i + 1}
                        </span>
                        <div className="flex-1 pt-1 text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          <StemRenderer content={step} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Real World Transfer */}
            {(realWorldScenario || realWorldApplication) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 rounded-3xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50"
              >
                <div className="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400">
                  <Globe className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">{ar ? "الواقع" : "Real World"}</h3>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-3">
                  {realWorldScenario && <p className="font-semibold">{realWorldScenario}</p>}
                  {realWorldApplication && realWorldApplication !== realWorldScenario && (
                    <StemRenderer content={realWorldApplication} />
                  )}
                </div>
              </motion.div>
            )}

            {/* Pitfalls */}
            {concept.commonPitfalls && concept.commonPitfalls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 rounded-3xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50"
              >
                <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">{ar ? "أخطاء شائعة" : "Common Pitfalls"}</h3>
                </div>
                <div className="space-y-4">
                  {concept.commonPitfalls.map((pitfall, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 line-through decoration-red-500/50 decoration-2">
                        {pitfall.misconception}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        <span className="font-bold text-amber-600 dark:text-amber-500 mr-1">Actually:</span>
                        {pitfall.betterWay}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
