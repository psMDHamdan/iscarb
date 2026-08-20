"use client";

/**
 * SlideCanvas — left content panel of the Student Workbench.
 *
 * Student-experience redesign goals:
 *  - Slide 1 (hook): render a "Why This Matters" framing banner before content.
 *  - Remove the pointless third "Knowledge Check" tab that just says questions
 *    appear elsewhere. The check prompt is now embedded at the bottom of
 *    the LEARN phase with a visible call-to-action.
 *  - PREDICT phase: unchanged — textarea for prediction before content reveals.
 *  - LEARN phase: title → visual → bullets → embedded action callout → CTA.
 *  - CHECK phase: content dims and the activity widget is the focus (in IZ).
 *  - Max 40 visible words, max 5 bullets — ZTM density rule preserved.
 *  - Framer Motion slide transition: 0.25 s.
 *
 * Validates: Requirements 1.3, 4.2–4.4, 5.1, 5.11, 9.1–9.4, 12.1–12.6
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Expand, Zap } from "lucide-react";

import { StudentProgressOverlay } from "./StudentProgressOverlay";
import { renderSvgDiagram } from "@/lib/lecture/renderer/svg-visual-renderer";
import { generateVisualPlaceholderDataUrl } from "@/lib/lecture/renderer/visual-placeholder";
import type { SlideContentJson } from "@/lib/lecture/generation/types";
import { StemRenderer } from "@/components/ui/StemRenderer";

// ─── getSlidePhase ────────────────────────────────────────────────────────────
// Phase ranges: 1–4 blue | 5–7 teal | 8–10 purple | 11–13 cyan | 14–17 emerald | 18–20 amber

function getSlidePhase(slideNo: number): {
  nameEn: string;
  nameAr: string;
  color: string;
  borderColor: string;
} {
  if (slideNo <= 2) return { nameEn: "01 Discover the problem", nameAr: "01 اكتشف المشكلة", color: "bg-emerald-600 text-white", borderColor: "border-emerald-400" };
  if (slideNo <= 5) return { nameEn: "02 Build the idea", nameAr: "02 ابنِ الفكرة", color: "bg-teal-600 text-white", borderColor: "border-teal-400" };
  if (slideNo <= 8) return { nameEn: "03 See how it works", nameAr: "03 افهم الآلية", color: "bg-blue-600 text-white", borderColor: "border-blue-400" };
  if (slideNo <= 11) return { nameEn: "04 Practice", nameAr: "04 تدرب", color: "bg-indigo-600 text-white", borderColor: "border-indigo-400" };
  if (slideNo <= 14) return { nameEn: "05 Apply", nameAr: "05 طبق", color: "bg-purple-600 text-white", borderColor: "border-purple-400" };
  if (slideNo <= 17) return { nameEn: "06 Challenge yourself", nameAr: "06 تحدَّ نفسك", color: "bg-rose-600 text-white", borderColor: "border-rose-400" };
  return { nameEn: "07 Check your mastery", nameAr: "07 اختبر إتقانك", color: "bg-amber-600 text-white", borderColor: "border-amber-400" };
}

// ─── word helpers ─────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function capBulletsToWordLimit(
  bullets: string[],
  maxWords: number
): { visible: string[]; truncated: boolean } {
  let total = 0;
  const visible: string[] = [];
  for (const bullet of bullets) {
    const wc = countWords(bullet);
    if (total + wc > maxWords && visible.length > 0) return { visible, truncated: true };
    visible.push(bullet);
    total += wc;
  }
  return { visible, truncated: false };
}

// ─── PhasesBanner ─────────────────────────────────────────────────────────────

function PhasesBanner({ slideNo, ar }: { slideNo: number; ar: boolean }) {
  const phase = getSlidePhase(slideNo);
  return (
    <div
      className={`w-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase ${phase.color}`}
      aria-label={ar ? phase.nameAr : phase.nameEn}
    >
      {ar ? phase.nameAr : phase.nameEn}
    </div>
  );
}

// ─── WhyItMattersPanel — shown only for S1 (hook slide) ──────────────────────
// Gives the student the high-stakes framing question before any bullets appear.

function WhyItMattersPanel({
  actionPrompt,
  ar,
}: {
  actionPrompt: string;
  ar: boolean;
}) {
  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 p-6 space-y-4 shadow-md">
      {/* Bold Headline */}
      <div className="space-y-1">
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
          {ar ? "المشكلة الواقعية والدافع" : "1. The problem"}
        </span>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 pt-1">
          {ar ? "لديك كمية هائلة من البيانات." : "You have too much data."}
        </h2>
      </div>

      {/* Real Scenario */}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed sm:text-base">
        {ar
          ? "تخيل أنك تبني نموذجاً للتعرف على الأرقام المكتوبة بخط اليد. تحتوي كل صورة على 784 قيمة بكسل (أبعاد كبيرة جدًا). بياناتك يصعب رسمها بيانيًا ونموذجك يصبح أبطأ."
          : "Imagine you're building a model to recognize handwritten digits. Each image contains 784 pixel values. That's a lot of dimensions. Now imagine your dataset contains thousands of images. Your model is slow and difficult to visualize."}
      </p>

      {/* Visual Flow Diagram */}
      <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-emerald-500/15 flex flex-wrap items-center justify-around gap-3 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-inner">
        <div className="flex flex-col items-center">
          <span className="text-emerald-600 font-extrabold text-sm">784</span>
          <span className="text-[10px] text-slate-500 font-sans">{ar ? "أبعاد وحدات البكسل" : "pixel features"}</span>
        </div>
        <span className="text-emerald-500 font-black text-base">→</span>
        <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-sans text-xs font-bold shadow-xs">
          PCA
        </div>
        <span className="text-emerald-500 font-black text-base">→</span>
        <div className="flex flex-col items-center">
          <span className="text-teal-600 font-extrabold text-sm">20</span>
          <span className="text-[10px] text-slate-500 font-sans">{ar ? "مركبة مفيدة" : "useful components"}</span>
        </div>
      </div>

      {/* The Challenge Question */}
      <div className="pt-2 border-t border-emerald-500/15 text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
        <span className="text-emerald-600 font-black text-base">🎯</span>
        <span>
          {ar
            ? "التحدي: هل يمكننا تقليل الأبعاد دون فقدان المعلومات التي تجعل الصور مفيدة؟"
            : "Your challenge: Can we reduce the number of dimensions without losing the information that makes the images useful?"}
        </span>
      </div>
    </div>
  );
}

// ─── PredictPhase ─────────────────────────────────────────────────────────────

function PredictPhase({
  slideNo,
  actionPrompt,
  ar,
  onPredictSubmit,
}: {
  slideNo: number;
  actionPrompt: string;
  ar: boolean;
  onPredictSubmit: (text: string) => void;
}) {
  const [selectedChoice, setSelectedChoice] = useState<string>("B");

  const choices = [
    { id: "A", text: ar ? "أسماء الميزات الأصلية" : "The original feature names" },
    { id: "B", text: ar ? "التغير الأكثر أهمية في البيانات (Variance)" : "The most important variation in the data" },
    { id: "C", text: ar ? "كل الأبعاد الأصلية" : "Every original dimension" },
    { id: "D", text: ar ? "القيم العددية الأكبر فقط" : "Only the largest numerical values" },
  ];

  return (
    <div className="flex flex-col flex-1 px-4 sm:px-8 py-6 gap-6 max-w-2xl mx-auto w-full">
      <WhyItMattersPanel actionPrompt={actionPrompt} ar={ar} />

      <div className="rounded-3xl border border-teal-500/20 bg-white/90 dark:bg-slate-900/90 p-6 space-y-4 shadow-xl">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">
            {ar ? "قدم توقعك الأول" : "MAKE YOUR PREDICTION"}
          </p>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {ar
              ? "ما الذي يجب أن تحاول خوارزمية تقليل الأبعاد (PCA) الحفاظ عليه؟"
              : "What should we try to preserve when reducing the dimensions?"}
          </h3>
        </div>

        <div className="space-y-2.5 pt-1">
          {choices.map((c) => {
            const isSelected = selectedChoice === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChoice(c.id)}
                className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-600 text-white font-bold shadow-md ring-2 ring-emerald-400/30"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 hover:border-emerald-500/40"
                }`}
              >
                <span className="font-mono font-bold mr-2.5 opacity-80">{c.id}.</span>
                <StemRenderer content={c.text} inline />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPredictSubmit(selectedChoice)}
          className="w-full py-3.5 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {ar ? "تأكيد التوقع والانتقال للدرس ←" : "Make Prediction & Continue →"}
        </button>
      </div>
    </div>
  );
}

// ─── VisualPanel ─────────────────────────────────────────────────────────────

function VisualPanel({
  slideNo,
  visualIntent,
  nodes,
  onExpandVisual,
  ar,
}: {
  slideNo: number;
  visualIntent: string | undefined | null;
  nodes: string[];
  onExpandVisual?: () => void;
  ar: boolean;
}) {
  const svgMarkup = visualIntent
    ? renderSvgDiagram(visualIntent, nodes, slideNo, 560, 300)
    : null;
  const fallbackDataUrl = generateVisualPlaceholderDataUrl({
    slideNo,
    fn: "core_concept",
    visualIntent: visualIntent ?? "diagram",
    width: 560,
    height: 300,
  });

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      {svgMarkup ? (
        <div
          className="w-full"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      ) : (
        <img
          src={fallbackDataUrl}
          alt={visualIntent ? `Diagram: ${visualIntent}` : "Visual"}
          className="w-full object-contain"
          width={560}
          height={300}
        />
      )}
      {onExpandVisual && (
        <button
          onClick={onExpandVisual}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={ar ? "توسيع الرسم البياني" : "Expand diagram"}
        >
          <Expand size={14} className="text-slate-600 dark:text-slate-300" />
        </button>
      )}
    </div>
  );
}

// ─── CheckPhaseCTA — replaces the old third tab ───────────────────────────────
// Shown at the bottom of the presentation when guidedPhase === 1.
// Clearly tells the student *what they're about to do* and *why*.

function CheckPhaseCTA({
  interactionLabel,
  ar,
  onReady,
}: {
  interactionLabel: string;
  ar: boolean;
  onReady: () => void;
}) {
  return (
    <div className="mt-auto pt-4 space-y-3">
      {/* What happens next */}
      <div className="rounded-xl border border-amber-200/60 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-3">
        <Zap className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
        <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <span className="font-bold block mb-0.5">
            {ar ? "حان وقت التطبيق" : "Time to apply what you learned"}
          </span>
          {interactionLabel || (ar
            ? "ستجيب على سؤال مباشر لتتحقق من فهمك."
            : "You'll answer a direct question to verify your understanding.")}
        </div>
      </div>

      <button
        onClick={onReady}
        className="w-full py-3.5 px-6 rounded-2xl bg-[#0F7B8A] hover:bg-[#0c626e] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
      >
        {ar ? "مستعد — أرني السؤال ←" : "I'm ready — show me the question →"}
      </button>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SlideCanvasProps {
  slide: { slideNo: number; contentJson: SlideContentJson };
  playerMode: "GUIDED" | "REVIEW";
  guidedPhase: 0 | 1 | 2;   // 0=PREDICT | 1=LEARN | 2=CHECK
  ar: boolean;
  headingRef?: React.Ref<HTMLHeadingElement>;
  onPredictSubmit: (text: string) => void;
  onReadyToCheck: () => void;
  completedSlideIndices: Set<number>;
  totalSlides: number;
  onExpandVisual?: () => void;
}

const MAX_CONTENT_WORDS = 40;
const MAX_VISIBLE_BULLETS = 5;

// ─── SlideCanvas ──────────────────────────────────────────────────────────────

export function SlideCanvas({
  slide,
  playerMode,
  guidedPhase,
  ar,
  headingRef,
  onPredictSubmit,
  onReadyToCheck,
  completedSlideIndices,
  totalSlides,
  onExpandVisual,
}: SlideCanvasProps) {
  const slideNo = slide?.slideNo ?? 1;
  const contentJson: SlideContentJson = slide?.contentJson ?? (slide as unknown as SlideContentJson) ?? {};
  const [showDiagram, setShowDiagram] = useState(false);
  const [showAllBullets, setShowAllBullets] = useState(false);

  // ── derive content ─────────────────────────────────────────────────────────
  const rawTitle = ar
    ? contentJson.textAr?.title ?? contentJson.title
    : contentJson.title;

  const rawBullets: string[] = ar
    ? contentJson.textAr?.bullets ?? contentJson.bullets ?? []
    : contentJson.bullets ?? [];

  const visualIntent: string | undefined =
    typeof contentJson.visualIntent === "string" ? contentJson.visualIntent : undefined;

  const svgNodes = rawBullets.filter((b) => b.trim().length > 0);

  const actionPrompt: string =
    (contentJson.learningActivity?.text as string | undefined) ??
    contentJson.studentAction ??
    "";

  const isHookSlide = slideNo === 1;
  const isLowDensity = !visualIntent && rawBullets.length === 0;
  const isPredictPhase = playerMode === "GUIDED" && guidedPhase === 0;
  const isLearnPhase = playerMode === "GUIDED" && guidedPhase === 1;
  const isCheckPhase = guidedPhase === 2 || playerMode === "REVIEW";
  const currentSlideIndex = slideNo - 1;

  // Bullet visibility
  const bulletsToConsider = rawBullets.slice(0, MAX_VISIBLE_BULLETS);
  let visibleBullets: string[];
  let hasBulletOverflow = rawBullets.length > MAX_VISIBLE_BULLETS;
  let hasWordOverflow = false;

  if (showAllBullets) {
    visibleBullets = rawBullets.slice(0, MAX_VISIBLE_BULLETS);
  } else {
    const { visible, truncated } = capBulletsToWordLimit(bulletsToConsider, MAX_CONTENT_WORDS);
    visibleBullets = visible;
    hasWordOverflow = truncated;
  }
  const showMoreToggle = hasBulletOverflow || hasWordOverflow;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${slideNo}-${guidedPhase}`}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col w-full h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl border border-emerald-500/15"
      >
        {/* Phase banner */}
        <PhasesBanner slideNo={slideNo} ar={ar} />

        {/* Progress strip — slide 2+ */}
        {slideNo >= 2 && (
          <div className="px-5 pt-3">
            <StudentProgressOverlay
              currentSlideIndex={currentSlideIndex}
              completedSlideIndices={completedSlideIndices}
              totalSlides={totalSlides}
            />
          </div>
        )}

        {/* ── PREDICT phase ──────────────────────────────────────────────── */}
        {isPredictPhase && (
          <PredictPhase
            slideNo={slideNo}
            actionPrompt={actionPrompt}
            ar={ar}
            onPredictSubmit={onPredictSubmit}
          />
        )}

        {/* ── LEARN / CHECK / REVIEW phase ───────────────────────────────── */}
        {!isPredictPhase && (
          <>
            {/* Diagram toggle button — only when there is a visual */}
            {visualIntent && (
              <div className="px-5 pt-3 shrink-0">
                <button
                  onClick={() => setShowDiagram((v) => !v)}
                  className={[
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                    showDiagram
                      ? "bg-emerald-600 text-white border-emerald-700"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400",
                  ].join(" ")}
                  aria-pressed={showDiagram}
                >
                  🎨 {showDiagram
                    ? (ar ? "إخفاء الرسم" : "Hide diagram")
                    : (ar ? "عرض الرسم التوضيحي" : "Show concept diagram")}
                </button>
              </div>
            )}

            {/* Main content area */}
            <div
              className={[
                "flex flex-col flex-1 overflow-y-auto px-6 pt-4 pb-6 gap-4",
                isLowDensity ? "items-center justify-center text-center" : "",
                // Dim content in CHECK phase so the activity widget is the focus
                isCheckPhase && playerMode === "GUIDED" ? "opacity-80" : "",
              ].join(" ")}
              dir={ar ? "rtl" : "ltr"}
            >
              {/* Hook slide framing question — before the title */}
              {isHookSlide && actionPrompt && (
                <WhyItMattersPanel actionPrompt={actionPrompt} ar={ar} />
              )}

              {/* Slide title */}
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight focus:outline-none tracking-tight"
              >
                <StemRenderer content={rawTitle} inline />
              </h1>

              {/* Diagram (toggle) */}
              {showDiagram && visualIntent && (
                <VisualPanel
                  slideNo={slideNo}
                  visualIntent={visualIntent}
                  nodes={svgNodes}
                  onExpandVisual={onExpandVisual}
                  ar={ar}
                />
              )}

              {/* Inline visual (compact) when diagram toggle is hidden */}
              {!showDiagram && visualIntent && (
                <div className="max-h-40 overflow-hidden rounded-xl border border-emerald-500/15 shadow-sm">
                  <VisualPanel
                    slideNo={slideNo}
                    visualIntent={visualIntent}
                    nodes={svgNodes}
                    onExpandVisual={onExpandVisual}
                    ar={ar}
                  />
                </div>
              )}

              {/* Bullets */}
              {visibleBullets.length > 0 && (
                <ul className="space-y-2.5 w-full" aria-label={ar ? "نقاط الشريحة" : "Slide points"}>
                  {visibleBullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed"
                    >
                      <span
                        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold border border-emerald-400/20"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <span>
                        <StemRenderer content={bullet} inline />
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Show more / less */}
              {showMoreToggle && (
                <button
                  onClick={() => setShowAllBullets((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors focus:outline-none rounded-md px-1"
                  aria-expanded={showAllBullets}
                >
                  {showAllBullets ? (
                    <><ChevronUp size={16} />{ar ? "عرض أقل" : "Show less"}</>
                  ) : (
                    <><ChevronDown size={16} />{ar ? "عرض المزيد" : "Show more"}</>
                  )}
                </button>
              )}

              {/* Low-density action callout (non-hook slides) */}
              {isLowDensity && actionPrompt && !isHookSlide && (
                <div className="mt-4 max-w-md mx-auto px-5 py-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-sm font-semibold shadow-sm">
                  <StemRenderer content={actionPrompt} />
                </div>
              )}

              {/* CHECK phase state label — tells student where to look */}
              {isCheckPhase && playerMode === "GUIDED" && (
                <div className="mt-2 rounded-xl border border-amber-200/60 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span>
                    {ar
                      ? "نشاط التقييم ظاهر في اللوحة الجانبية ←"
                      : "The practice activity is in the panel on the right →"}
                  </span>
                </div>
              )}

              {/* LEARN phase CTA — replaces the old "Knowledge Check" tab */}
              {isLearnPhase && (
                <CheckPhaseCTA
                  interactionLabel={actionPrompt}
                  ar={ar}
                  onReady={onReadyToCheck}
                />
              )}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
