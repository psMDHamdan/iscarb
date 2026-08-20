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
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Lightbulb,
  Puzzle,
  Cog,
  Eye,
  Globe,
  AlertTriangle,
  BookOpen,
  Quote,
  Maximize2,
  Sparkles,
  Check,
  X,
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
  experienceId?: string;
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

export function ConceptContent({ concept, ar, experienceId }: ConceptContentProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const badge = STAGE_BADGE[concept.stage] || STAGE_BADGE.DISCOVER;
  const dir = ar ? "rtl" : "ltr";

  const fallbackVisual = getAcademicVisualForSlide(
    concept.orderIndex,
    concept.title,
    `${concept.coreInsight} ${concept.mechanism || ""}`
  );
  
  // ── Conditional sections: only render a section when it has real content.
  // Never show a hardcoded label ("Core Framework", "Think of It Like This",
  // "In the Real World", "Common Pitfalls", "How It Works") for an empty slot.
  const hasMentalModel = Boolean(concept.mentalModel?.trim());
  const hasMechanism = Boolean(concept.mechanism?.trim());
  const hasRealWorld = Boolean(concept.realWorldApplication?.trim());
  const hasPitfalls = Boolean(concept.misconceptionAlert?.misconception?.trim());
  
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

  const hasVisualContent =
    Boolean(displayImage) ||
    Boolean(concept.visual?.svgCode);


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={concept.id}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex flex-col h-full overflow-y-auto"
        dir={dir}
      >
        <div className="flex-1 space-y-8 p-6 sm:p-10 lg:p-12 max-w-4xl mx-auto w-full">

          {/* ── Stage Badge + Title ─────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm border border-white/20",
                  badge.color
                )}
              >
                {ar ? badge.labelAr : badge.labelEn}
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {ar ? `المفهوم ${concept.orderIndex}` : `Concept ${concept.orderIndex}`}
              </span>
              {concept.estimatedMinutes > 0 && (
                <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                  • ~{concept.estimatedMinutes} {ar ? "دقيقة" : "min"}
                </span>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              <StemRenderer content={concept.title} inline />
            </h2>
          </motion.div>

          {/* ── Flagged-for-review notice (placeholder content, no fabrication) ── */}
          {concept.flaggedForReview && (
            <motion.div
              variants={itemVariants}
              className="p-5 rounded-3xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-3"
            >
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-black text-amber-800 dark:text-amber-300">
                  {ar ? "يُعرض محتوى مؤقت — بانتظار مراجعة الأستاذ" : "Review pending — placeholder content"}
                </p>
                <p className="text-sm text-amber-700/90 dark:text-amber-200/70 leading-relaxed">
                  {ar
                    ? "لم تكن مواد المصدر كافية لتوليد هذا الجزء بدقة، لذلك لا يتم اختراع أي أرقام أو ادعاءات هنا."
                    : "The source material wasn't sufficient to generate this section accurately, so no figures or claims are invented here."}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Core Insight ────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent border border-emerald-500/20 dark:border-emerald-400/20 dark:from-emerald-950/40 shadow-sm backdrop-blur-sm group">
            <div className="absolute -inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-3xl rounded-full" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed pt-1">
                <StemRenderer content={concept.coreInsight} inline />
              </p>
            </div>
          </motion.div>

          {/* ── Mental Model (conditional) ──────────────────────────────── */}
          {hasMentalModel && (
            <motion.div variants={itemVariants}>
              <SectionCard
                icon={<Puzzle className="h-5 w-5" />}
                label={ar ? "تخيلها كالتالي" : "Think of It Like This"}
                accentColor="emerald"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Quote className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1 opacity-60" />
                    <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed italic font-medium">
                      <StemRenderer content={concept.mentalModel || ""} inline />
                    </p>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ── Mechanism (conditional) ──────────────────────────────────── */}
          {hasMechanism && (
            <motion.div variants={itemVariants}>
              <SectionCard
                icon={<Cog className="h-5 w-5" />}
                label={ar ? "كيف تعمل الآلية؟" : "How It Works"}
                accentColor="blue"
              >
                <div className="space-y-4">
                  <div className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    <StemRenderer content={concept.mechanism || ""} />
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ── Visual (conditional; Interactive Visual Showcase) ───────── */}
          {hasVisualContent && (
            <motion.div variants={itemVariants}>
              <SectionCard
                icon={<Eye className="h-5 w-5" />}
                label={displayTitle || (ar ? "التصور المرئي" : "Visual & Molecular Models")}
                accentColor="indigo"
              >
                <div className="space-y-4">
                  {displayImage && (
                    <div
                      onClick={() => setIsLightboxOpen(true)}
                      className="group relative rounded-3xl overflow-hidden border border-indigo-200/60 dark:border-indigo-800/60 shadow-inner bg-white/50 dark:bg-slate-900/50 p-2 cursor-pointer hover:shadow-brand transition-all backdrop-blur-sm"
                      title={ar ? "انقر لتكبير الصورة بدقة عالية" : "Click to expand high-resolution diagram"}
                    >
                      <img
                        src={
                          displayImage.startsWith("http")
                            ? `/api/iscarb/image-proxy?url=${encodeURIComponent(displayImage)}`
                            : displayImage
                        }
                        alt={displayCaption || displayTitle}
                        className="w-full rounded-2xl object-contain max-h-96 mx-auto group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackVisual.imageUrl;
                        }}
                      />
                      <div className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        <Maximize2 className="h-4 w-4" />
                        <span>{ar ? "تكبير" : "Expand"}</span>
                      </div>
                    </div>
                  )}

                  {concept.visual?.svgCode && (
                    <div
                      className="w-full rounded-3xl border border-indigo-200/60 dark:border-indigo-800/60 overflow-hidden bg-white/50 dark:bg-slate-900/50 p-3 shadow-inner backdrop-blur-sm"
                      dangerouslySetInnerHTML={{ __html: concept.visual.svgCode }}
                    />
                  )}

                  {displayCaption && (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 text-sm text-slate-700 dark:text-slate-300 text-center font-medium leading-relaxed italic">
                      <StemRenderer content={displayCaption} inline />
                    </div>
                  )}
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ── Real World Transfer (conditional) ───────────────────────── */}
          {hasRealWorld && (
            <motion.div variants={itemVariants}>
              <SectionCard
                icon={<Globe className="h-5 w-5" />}
                label={ar ? "في العالم الحقيقي" : "In the Real World"}
                accentColor="purple"
              >
                <div className="space-y-4">
                  <div className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-bold">
                    <StemRenderer content={concept.realWorldApplication || ""} />
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ── Common Pitfalls (conditional) ───────────────────────────── */}
          {hasPitfalls && concept.misconceptionAlert && (
            <motion.div variants={itemVariants}>
              <SectionCard
                icon={<AlertTriangle className="h-5 w-5" />}
                label={ar ? "أخطاء شائعة" : "Common Pitfalls"}
                accentColor="amber"
              >
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 space-y-2 text-sm sm:text-base">
                    <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      <span>
                        <StemRenderer content={concept.misconceptionAlert.misconception} inline />
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 pl-4 font-medium leading-relaxed">
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {ar ? "لماذا خطأ: " : "Why incorrect: "}
                      </span>
                      <StemRenderer content={concept.misconceptionAlert.whyItFails} inline />
                    </p>
                    <p className="text-slate-800 dark:text-slate-200 pl-4 font-semibold leading-relaxed">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {ar ? "الصواب: " : "Better way: "}
                      </span>
                      <StemRenderer content={concept.misconceptionAlert.correction} inline />
                    </p>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* ── Interactive Practice Activity ──────────────────────────── */}
          {concept.activity && (
            <motion.div variants={itemVariants}>
              <InteractiveActivityCard activity={concept.activity} ar={ar} />
            </motion.div>
          )}

          {/* ── Formative Self-Check Assessment ────────────────────────── */}
          {concept.assessment && (
            <motion.div variants={itemVariants}>
              <FormativeAssessmentCard assessment={concept.assessment} ar={ar} experienceId={experienceId} />
            </motion.div>
          )}

        </div>

        {/* Full-screen Lightbox Dialog */}
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-6 bg-white/95 dark:bg-slate-950/95 text-slate-900 dark:text-slate-100 border border-emerald-200/50 dark:border-emerald-800/50 rounded-3xl shadow-2xl backdrop-blur-xl">
            <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                {displayTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <img
                src={
                  displayImage.startsWith("http")
                    ? `/api/iscarb/image-proxy?url=${encodeURIComponent(displayImage)}`
                    : displayImage
                }
                alt={displayTitle}
                className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackVisual.imageUrl;
                }}
              />
            </div>
            {displayCaption && (
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center italic border-t border-slate-100 dark:border-slate-800 pt-4 font-medium">
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
  emerald: "border-emerald-200/60 bg-white/60 dark:bg-slate-900/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400",
  blue: "border-blue-200/60 bg-white/60 dark:bg-slate-900/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-400",
  indigo: "border-indigo-200/60 bg-white/60 dark:bg-slate-900/60 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-400",
  purple: "border-purple-200/60 bg-white/60 dark:bg-slate-900/60 dark:border-purple-800/40 text-purple-700 dark:text-purple-400",
  amber: "border-amber-200/60 bg-white/60 dark:bg-slate-900/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-400",
};

function SectionCard({ icon, label, accentColor, children }: SectionCardProps) {
  const styles = ACCENT_STYLES[accentColor];

  return (
    <div className={cn("p-6 sm:p-8 rounded-3xl border shadow-sm backdrop-blur-md transition-all hover:shadow-brand", styles)}>
      <div className="flex items-center gap-3 mb-5">
        <span className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-sm text-current">
          {icon}
        </span>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
          {label}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// InteractiveActivityCard
// ---------------------------------------------------------------------------

function InteractiveActivityCard({
  activity,
  ar,
}: {
  activity: NonNullable<StudentConceptViewModel["activity"]>;
  ar: boolean;
}) {
  const [hintIndex, setHintIndex] = useState(-1);

  return (
    <div className="p-6 sm:p-8 rounded-3xl border border-teal-200/80 dark:border-teal-800/60 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 dark:from-teal-950/40 dark:to-slate-900/60 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-black text-xs uppercase tracking-widest">
            {activity.actionVerb || (ar ? "نشاط تفاعلي" : "Interactive Challenge")}
          </span>
          <span className="text-xs font-bold text-slate-400">
            {activity.title}
          </span>
        </div>
      </div>

      <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
        <StemRenderer content={activity.prompt} />
      </div>

      {/* Progressive Hints Scaffolding */}
      {activity.progressiveHints && activity.progressiveHints.length > 0 && (
        <div className="pt-3 border-t border-teal-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">
              {ar ? "التوجيهات التدريجية (Hints)" : "Progressive Scaffolding Hints"}
            </span>
            <button
              onClick={() =>
                setHintIndex((prev) =>
                  prev < activity.progressiveHints.length - 1 ? prev + 1 : -1
                )
              }
              className="text-xs font-bold text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200 transition-colors"
            >
              {hintIndex < activity.progressiveHints.length - 1
                ? ar
                  ? `إظهار التلميح ${hintIndex + 2}`
                  : `Show Hint ${hintIndex + 2}`
                : ar
                ? "إخفاء التلميحات"
                : "Hide Hints"}
            </button>
          </div>

          {hintIndex >= 0 && (
            <div className="p-3 rounded-2xl bg-teal-100/60 dark:bg-teal-900/40 border border-teal-200/60 text-xs sm:text-sm font-medium text-teal-900 dark:text-teal-200">
              <StemRenderer content={activity.progressiveHints[hintIndex]} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormativeAssessmentCard
// ---------------------------------------------------------------------------

function FormativeAssessmentCard({
  assessment,
  ar,
  experienceId,
}: {
  assessment: NonNullable<StudentConceptViewModel["assessment"]>;
  ar: boolean;
  experienceId?: string;
}) {
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    correctOptionId: string;
    misconceptionFeedback?: string;
    variantAvailable?: boolean;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [variant, setVariant] = useState<{ variantQuestion?: string; variantExample?: string; hint?: string } | null>(null);

  const base = experienceId ? `/api/iscarb/lecture/experience/${experienceId}` : "";

  async function submit(optId: string) {
    if (checking || submitted) return;
    setSelectedOpt(optId);
    setChecking(true);
    try {
      const res = await fetch(`${base}/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: assessment.id, optionId: optId }),
      });
      const data = await res.json();
      if (res.ok && data.correct !== undefined) {
        setResult(data);
        setSubmitted(optId);
        if (data.correct) {
          try {
            await fetch(`${base}/session`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                interaction: {
                  conceptBlockId: assessment.id,
                  activityType: "MCQ_ANSWER",
                  studentInput: optId,
                  selectedOptionId: optId,
                  isCorrect: true,
                },
              }),
            });
          } catch {
            /* best-effort persistence */
          }
        }
      }
    } finally {
      setChecking(false);
    }
  }

  function loadVariant() {
    fetch("/api/iscarb/student/lecture/evaluate-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conceptTitle: assessment.stem,
        taskPrompt: assessment.stem,
        mode: "remediation",
        misconception: result?.misconceptionFeedback ?? "",
        lang: ar ? "ar" : "en",
      }),
    })
      .then((r) => r.json())
      .then((v) => setVariant(v))
      .catch(() => setVariant({}));
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl border border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-indigo-950/40 dark:to-slate-900/60 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest">
          {ar ? "تحقق من فهمك" : "Check Your Understanding"}
        </span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {assessment.difficulty}
        </span>
      </div>

      <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
        <StemRenderer content={assessment.stem} />
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {assessment.options.map((opt) => {
          const isSelected = selectedOpt === opt.id;
          const isSubmitted = submitted === opt.id;
          const isCorrectOpt = submitted != null && result?.correctOptionId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => submit(opt.id)}
              disabled={checking || submitted != null}
              className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-sm font-semibold text-left",
                isCorrectOpt
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 shadow-sm"
                  : isSubmitted
                    ? "border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300"
                    : isSelected
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-sm"
                      : "border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-indigo-300 text-slate-700 dark:text-slate-300"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                  isCorrectOpt ? "bg-emerald-600 text-white" : isSubmitted ? "bg-rose-500 text-white" : isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  {opt.id}
                </span>
                <span>
                  <StemRenderer content={opt.text} inline />
                </span>
              </div>
              {isCorrectOpt && <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              {isSubmitted && !isCorrectOpt && <X className="h-5 w-5 text-rose-500 dark:text-rose-400" />}
            </button>
          );
        })}
      </div>

      {/* ── Deterministic per-distractor feedback (spec §29, no extra LLM cost) ── */}
      {submitted && result && (
        <div
          className={cn(
            "p-4 rounded-2xl border text-sm font-semibold leading-relaxed",
            result.correct
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40 text-rose-900 dark:text-rose-200"
          )}
        >
          {result.correct
            ? (ar ? "أحسنت! إجابة صحيحة." : "Correct! Well done.")
            : (result.misconceptionFeedback ||
              (ar
                ? "هذه الإجابة تعكس مفهوماً خاطئاً شائعاً. أعد قراءة الآلية وحاول مجدداً."
                : "That answer reflects a common misunderstanding. Re-read the mechanism and try again."))}
        </div>
      )}

      {/* ── Adaptive loop: new variant on failure (full §29) ── */}
      {submitted && result && !result.correct && result.variantAvailable && !variant && (
        <button
          onClick={loadVariant}
          disabled={checking}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          {ar ? "جرّب سؤالاً جديداً — مثال مختلف" : "Try a New Question — Different Example"}
        </button>
      )}

      {variant && (
        <div className="space-y-4 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50">
          {variant.variantQuestion && (
            <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
              <StemRenderer content={variant.variantQuestion} />
            </p>
          )}
          {variant.variantExample && (
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <StemRenderer content={variant.variantExample} />
            </p>
          )}
          {variant.hint && (
            <p className="p-3 rounded-xl bg-indigo-100/70 dark:bg-indigo-900/40 border border-indigo-200/50 dark:border-indigo-800/40 text-xs sm:text-sm font-medium text-indigo-900 dark:text-indigo-200">
              <StemRenderer content={variant.hint} />
            </p>
          )}
        </div>
      )}
    </div>
  );
}

