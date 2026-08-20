"use client";

/**
 * InteractiveZone — right-panel activity area.
 *
 * Student-experience redesign goals (tasks 4 & 5):
 *  - Rename the panel header to make it clear what the student does here.
 *  - PREDICT phase: show a "thinking in progress" placeholder, not a blank panel.
 *  - LEARN phase: show a contextual "what comes next" preview instead of just
 *    a "Ready to Check?" button — give the student a reason to want to proceed.
 *  - CHECK phase: surface the assessment widget prominently, with a header that
 *    names the CLO being practiced and the interaction type (poll / MCQ / reflection).
 *  - Review mode: unchanged — always show the full widget.
 *  - Notes tab: preserved.
 *
 * Validates: Requirements 1.4, 1.5, 4.4, 4.5
 */

"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  ClipboardList,
  StickyNote,
  Zap,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ActivityWidget } from "./ActivityWidget";
import type { ActivityWidgetProps } from "./ActivityWidget";
import { TeachItBackPanel } from "./TeachItBackPanel";

import type { SlideContentJson, ReadinessItemJson } from "@/lib/lecture/generation/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Human-readable interaction type label */
function interactionLabel(type: string | null, ar: boolean): string {
  switch (type) {
    case "mcq": return ar ? "سؤال اختيار متعدد" : "Multiple-choice question";
    case "poll": return ar ? "تصويت سريع" : "Quick poll";
    case "reflection": return ar ? "تأمل مكتوب" : "Written reflection";
    case "worked_example": return ar ? "مثال محلول" : "Worked example";
    case "readiness": return ar ? "فحص الجاهزية" : "Readiness check";
    default: return ar ? "نشاط تفاعلي" : "Interactive activity";
  }
}

// ─── LearningMissionCoach — replaces generic empty/think-first placeholder ───

function LearningMissionCoach({
  ar,
  slideNo,
  selectedChoice,
  onSelectChoice,
}: {
  ar: boolean;
  slideNo: number;
  selectedChoice: string | null;
  onSelectChoice: (choice: string) => void;
}) {
  const predictionOptions = [
    { id: "A", text: ar ? "أسماء الميزات الأصلية" : "The original feature names" },
    { id: "B", text: ar ? "التغير الأكثر أهمية في البيانات (Variance)" : "The most important variation in the data" },
    { id: "C", text: ar ? "كل الأبعاد الأصلية" : "Every original dimension" },
    { id: "D", text: ar ? "القيم العددية الأكبر فقط" : "Only the largest numerical values" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 py-2"
    >
      {/* YOUR LEARNING MISSION CARD */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-slate-900/60 p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-widest">
          <Brain className="h-4 w-4 text-emerald-600" />
          <span>{ar ? "مهمتك التعليمية اليوم" : "YOUR LEARNING MISSION"}</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {ar ? "بنهاية هذا الدرس ستكون قادرًا على:" : "By the end of this lesson, you will be able to:"}
        </p>
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold">{ar ? "تفسير سبب استخدام تقليل الأبعاد (PCA)" : "Explain why PCA is used for dimensionality reduction"}</span>
          </div>
          <div className="flex items-center gap-2 opacity-90">
            <span className="h-3.5 w-3.5 rounded-full border border-emerald-400 shrink-0 text-[9px] flex items-center justify-center font-bold text-emerald-600">○</span>
            <span>{ar ? "فهم المكونات الرئيسية (Principal Components)" : "Understand principal components & variance"}</span>
          </div>
          <div className="flex items-center gap-2 opacity-90">
            <span className="h-3.5 w-3.5 rounded-full border border-emerald-400 shrink-0 text-[9px] flex items-center justify-center font-bold text-emerald-600">○</span>
            <span>{ar ? "تفسير دور المتجهات الذاتية (Eigenvectors)" : "Explain the role of eigenvectors and eigenvalues"}</span>
          </div>
          <div className="flex items-center gap-2 opacity-90">
            <span className="h-3.5 w-3.5 rounded-full border border-emerald-400 shrink-0 text-[9px] flex items-center justify-center font-bold text-emerald-600">○</span>
            <span>{ar ? "تطبيق تقليل الأبعاد وتحديد عدد المكونات" : "Apply PCA and decide how many components to keep"}</span>
          </div>
        </div>
      </div>

      {/* DOMAIN PREDICTION MCQ CARD */}
      <div className="rounded-2xl border border-teal-500/20 bg-teal-50/40 dark:bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-xs">
          <Lightbulb className="h-4 w-4 text-teal-600" />
          <span>{ar ? "توقعك الأولي قبل التعلم:" : "YOUR INITIAL PREDICTION"}</span>
        </div>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {ar ? "ما الذي يجب أن تحاول خوارزمية PCA الحفاظ عليه؟" : "What do you think PCA should try to preserve?"}
        </p>

        <div className="space-y-2 pt-1">
          {predictionOptions.map((opt) => {
            const isSelected = selectedChoice === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSelectChoice(opt.id)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-600 text-white font-bold shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40"
                }`}
              >
                <span className="font-mono font-bold mr-2">{opt.id}.</span>
                {opt.text}
              </button>
            );
          })}
        </div>

        {selectedChoice && (
          <div className="p-3 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-500/30 text-xs font-medium text-emerald-950 dark:text-emerald-100 space-y-1 animate-in fade-in">
            <p className="font-bold text-emerald-800 dark:text-emerald-300">
              {ar ? "فكرة ممتازة." : "Interesting choice."}
            </p>
            <p className="text-[11px] leading-relaxed opacity-90">
              {ar
                ? "اخترت التغير الأكثر أهمية في البيانات. احتفظ بهذ المفهوم، وسنكتشف قريباً هل تعمل تقنية PCA بهذه الطريقة فعلاً!"
                : "You chose variation in the data. Keep that idea in mind. In a few minutes we'll see whether PCA actually works that way."}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── LearnPhasePreview ────────────────────────────────────────────────────────
// Shown in the LEARN phase — tells the student exactly what activity is coming
// and gives them the confidence to click "Ready".

function LearnPhasePreview({
  interactionType,
  actionText,
  ar,
  onConfirm,
}: {
  interactionType: string | null;
  actionText: string | null;
  ar: boolean;
  onConfirm: () => void;
}) {
  const label = interactionLabel(interactionType, ar);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-5 py-6 px-2"
    >
      {/* What's coming */}
      <div className="rounded-xl border border-amber-200/60 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <Zap className="h-4 w-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest">
            {ar ? "التالي: تطبيق الفهم" : "Next: Apply your understanding"}
          </span>
        </div>
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          {label}
        </p>
        {actionText && (
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed line-clamp-3">
            {actionText}
          </p>
        )}
      </div>

      {/* Why it matters */}
      <div className="flex items-start gap-2.5 px-1">
        <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {ar
            ? "الإجابة الصحيحة تؤكد أنك جاهز للانتقال للمرحلة التالية. الخطأ هو فرصة تعلّم، ليس فشلاً."
            : "A correct answer confirms you're ready to move forward. Getting it wrong is a learning opportunity, not a failure."}
        </p>
      </div>

      <Button
        onClick={onConfirm}
        className="w-full bg-[#0F7B8A] hover:bg-[#0c626e] text-white font-bold h-11 rounded-xl shadow-sm"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
        {ar ? "مستعد — أرني النشاط" : "Ready — show me the activity"}
        <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
      </Button>
    </motion.div>
  );
}

// ─── CheckPhaseHeader ─────────────────────────────────────────────────────────
// Renders a prominent header above the activity widget in CHECK phase,
// so the student always knows what they're doing and why.

function CheckPhaseHeader({
  interactionType,
  slideNo,
  ar,
}: {
  interactionType: string | null;
  slideNo: number;
  ar: boolean;
}) {
  const label = interactionLabel(interactionType, ar);
  const isReadiness = interactionType === "readiness";

  return (
    <div className={[
      "rounded-xl border px-4 py-3 mb-3 flex items-start gap-3",
      isReadiness
        ? "border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/20"
        : "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20",
    ].join(" ")}>
      <Zap className={[
        "h-4 w-4 shrink-0 mt-0.5",
        isReadiness ? "text-cyan-500" : "text-emerald-500",
      ].join(" ")} />
      <div className="min-w-0">
        <p className={[
          "text-xs font-bold uppercase tracking-widest",
          isReadiness ? "text-cyan-700 dark:text-cyan-300" : "text-emerald-700 dark:text-emerald-300",
        ].join(" ")}>
          {ar ? `شريحة ${slideNo} — ${label}` : `Slide ${slideNo} — ${label}`}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {ar
            ? isReadiness
              ? "أجب على الأسئلة أدناه — درجتك تؤثر على فتح المرحلة التالية."
              : "أكمل النشاط أدناه لإلغاء قفل الانتقال للشريحة التالية."
            : isReadiness
              ? "Answer the questions below — your score affects unlocking the next phase."
              : "Complete the activity below to unlock the next slide."}
        </p>
      </div>
    </div>
  );
}

// ─── Notes tab ────────────────────────────────────────────────────────────────

function NotesTab({
  ar,
  noteContent,
  onNoteChange,
  slideNo,
}: {
  ar: boolean;
  noteContent: string;
  onNoteChange: (text: string) => void;
  slideNo: number;
}) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <label
        htmlFor={`notes-textarea-${slideNo}`}
        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
      >
        {ar ? "ملاحظاتك" : "Your Notes"}
      </label>
      <textarea
        id={`notes-textarea-${slideNo}`}
        value={noteContent}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder={ar ? "اكتب ملاحظاتك هنا…" : "Type your notes here…"}
        aria-label={ar ? "مربع الملاحظات" : "Notes text area"}
        dir={ar ? "rtl" : "ltr"}
        className="flex-1 min-h-[240px] w-full rounded-xl border border-border/60 bg-background px-3.5 py-3 text-sm text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
      />
      <p className="text-[11px] font-mono text-muted-foreground text-right">
        {noteContent.length}/2000
      </p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface InteractiveZoneProps {
  slide: { slideNo: number; contentJson: SlideContentJson };
  readinessItems: ReadinessItemJson[];
  versionId: string;
  guidedPhase: 0 | 1 | 2;
  playerMode: "GUIDED" | "REVIEW";
  interactionType: string | null;
  ar: boolean;
  noteContent: string;
  onNoteChange: (text: string) => void;
  onActivitySubmit: (
    type: "mcq" | "poll" | "reflection" | "worked_example",
    payload: unknown
  ) => void;
  onReadinessAnswer: (
    itemKey: string,
    optionIndex: number,
    item: ReadinessItemJson
  ) => void;
  onCheckPhaseUnlock: () => void;
  readinessSelectedAnswers: Record<string, number>;
  showAdvanceWarning?: boolean;
  misconceptionFeedback?: any;
  onDismissMisconception?: () => void;
  hintData?: Record<string, { hint: string; level: number }>;
  onRequestHint?: (question: string, level: number) => void;
  teachItBackResult?: any;
  onRequestTeachItBack?: (conceptName: string, conceptDefinition: string, studentResponse: string) => void;
  onDismissTeachItBack?: () => void;
  learningCoachLoading?: boolean;
}

// ─── InteractiveZone ──────────────────────────────────────────────────────────

export function InteractiveZone({
  slide,
  readinessItems,
  guidedPhase,
  playerMode,
  interactionType,
  ar,
  noteContent,
  onNoteChange,
  onActivitySubmit,
  onReadinessAnswer,
  onCheckPhaseUnlock,
  readinessSelectedAnswers,
  showAdvanceWarning = false,
  misconceptionFeedback,
  onDismissMisconception,
  hintData,
  onRequestHint,
  teachItBackResult,
  onRequestTeachItBack,
  onDismissTeachItBack,
  learningCoachLoading = false,
}: InteractiveZoneProps) {
  const { slideNo, contentJson } = slide;
  const activityRef = useRef<HTMLDivElement>(null);
  const [predictionChoice, setPredictionChoice] = React.useState<string | null>("B");

  // Auto-scroll to top of activity widget when CHECK phase activates
  useEffect(() => {
    if (guidedPhase === 2) {
      activityRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [guidedPhase]);

  const actionText: string | null =
    contentJson.learningActivity?.text ??
    contentJson.studentAction ??
    null;

  // Normalize interactionType
  const normalizedInteractionType = ((): ActivityWidgetProps["interactionType"] => {
    const t = interactionType;
    if (t === "mcq" || t === "poll" || t === "reflection" || t === "worked_example" || t === "readiness") return t;
    return null;
  })();

  const handleActivitySubmit: InteractiveZoneProps["onActivitySubmit"] = (type, payload) => {
    onActivitySubmit(type, payload);
    onCheckPhaseUnlock();
  };

  // ── activity content ───────────────────────────────────────────────────────
  const currentSlideHint = hintData?.[String(slideNo)];
  const slideConceptTitle = (contentJson as any)?.title || `Concept Slide ${slideNo}`;
  const slideConceptDef = Array.isArray(contentJson.bullets) ? contentJson.bullets.join(". ") : undefined;

  const renderActivityContent = () => {
    // Review mode — always show widget
    if (playerMode === "REVIEW") {
      return (
        <div className="space-y-4">
          <CheckPhaseHeader interactionType={normalizedInteractionType} slideNo={slideNo} ar={ar} />
          <ActivityWidget
            interactionType={normalizedInteractionType}
            actionText={actionText}
            readinessItems={readinessItems}
            slideNo={slideNo}
            onActivitySubmit={handleActivitySubmit}
            onReadinessAnswer={onReadinessAnswer}
            readinessSelectedAnswers={readinessSelectedAnswers}
            showAdvanceWarning={showAdvanceWarning}
            ar={ar}
            misconceptionData={misconceptionFeedback}
            onDismissMisconception={onDismissMisconception}
            hintData={currentSlideHint}
            onRequestHint={onRequestHint}
            hintLoading={learningCoachLoading}
          />
          {onRequestTeachItBack && (
            <TeachItBackPanel
              conceptName={slideConceptTitle}
              conceptDefinition={slideConceptDef}
              loading={learningCoachLoading}
              result={teachItBackResult}
              onSubmit={(resp) => onRequestTeachItBack(slideConceptTitle, slideConceptDef || "", resp)}
              onDismiss={onDismissTeachItBack}
              isArabic={ar}
            />
          )}
        </div>
      );
    }

    switch (guidedPhase) {
      case 0:
        return (
          <LearningMissionCoach
            ar={ar}
            slideNo={slideNo}
            selectedChoice={predictionChoice}
            onSelectChoice={setPredictionChoice}
          />
        );

      case 1:
        // Stage 3 (Slides 6–8): Show PredictionRevisited retrieval loop card
        return (
          <div className="space-y-4">
            {slideNo >= 6 && (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs">
                  <span className="text-sm">🔄</span>
                  <span>{ar ? "مراجعة توقعك الأولي:" : "PREDICTION REVISITED"}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {ar
                    ? `توقعت سابقاً: "التغير الأكثر أهمية في البيانات (Variance)". الآن بعد أن تعلمت كيفية حساب المتجهات الذاتية، هل تؤكد إجابتك؟`
                    : `Earlier you predicted: "The most important variation in the data". Now that you've learned how PCA finds principal directions that maximize variance, would you keep or revise your choice?`}
                </p>
                <div className="p-2 rounded-xl bg-indigo-100/60 text-indigo-900 text-[11px] font-bold text-center">
                  ✓ {ar ? "توقعك الأولي كان دقيقاً وصحيحاً!" : "Your initial prediction was accurate!"}
                </div>
              </div>
            )}
            <LearnPhasePreview
              interactionType={normalizedInteractionType}
              actionText={actionText}
              ar={ar}
              onConfirm={onCheckPhaseUnlock}
            />
          </div>
        );

      case 2:
        // CHECK phase — prominent header + widget + teach-it-back mastery
        return (
          <div ref={activityRef} className="space-y-4">
            <CheckPhaseHeader interactionType={normalizedInteractionType} slideNo={slideNo} ar={ar} />
            <ActivityWidget
              interactionType={normalizedInteractionType}
              actionText={actionText}
              readinessItems={readinessItems}
              slideNo={slideNo}
              onActivitySubmit={handleActivitySubmit}
              onReadinessAnswer={onReadinessAnswer}
              readinessSelectedAnswers={readinessSelectedAnswers}
              showAdvanceWarning={showAdvanceWarning}
              ar={ar}
              misconceptionData={misconceptionFeedback}
              onDismissMisconception={onDismissMisconception}
              hintData={currentSlideHint}
              onRequestHint={onRequestHint}
              hintLoading={learningCoachLoading}
            />
            {onRequestTeachItBack && (slideNo === 4 || slideNo === 10 || slideNo === 15 || readinessItems.length > 0) && (
              <TeachItBackPanel
                conceptName={slideConceptTitle}
                conceptDefinition={slideConceptDef}
                loading={learningCoachLoading}
                result={teachItBackResult}
                onSubmit={(resp) => onRequestTeachItBack(slideConceptTitle, slideConceptDef || "", resp)}
                onDismiss={onDismissTeachItBack}
                isArabic={ar}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ── panel header label — changes per phase ────────────────────────────────
  const panelLabel = (() => {
    if (playerMode === "REVIEW") return ar ? "نشاط المراجعة" : "Review Activity";
    switch (guidedPhase) {
      case 0: return ar ? "فكّر أولاً" : "Think first";
      case 1: return ar ? "ما يأتي بعد ذلك" : "What comes next";
      case 2: return ar ? "طبّق ما تعلّمته" : "Apply what you learned";
      default: return ar ? "النشاط" : "Activity";
    }
  })();

  return (
    <Tabs
      defaultValue="activity"
      className="flex flex-col h-full w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-emerald-500/15 rounded-3xl shadow-xl overflow-hidden"
    >
      {/* ── Panel header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 border-b border-emerald-500/10">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {panelLabel}
        </span>
        {/* Phase dot */}
        <span className={[
          "h-2 w-2 rounded-full",
          guidedPhase === 0 ? "bg-sky-400"
            : guidedPhase === 1 ? "bg-amber-400"
              : "bg-emerald-400",
        ].join(" ")} aria-hidden="true" />
      </div>

      {/* ── Tab list ──────────────────────────────────────────────────────── */}
      <TabsList className="w-full justify-start shrink-0 bg-emerald-50/50 dark:bg-slate-950/40 px-3 py-2 border-b border-emerald-500/10 rounded-none gap-1">
        <TabsTrigger
          value="activity"
          className="flex items-center gap-1.5 rounded-xl font-bold text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-3 py-1.5"
        >
          <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{ar ? "النشاط" : "Activity"}</span>
          {/* Badge dot when there's an active question */}
          {guidedPhase === 2 && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 data-[state=active]:bg-white" aria-hidden="true" />
          )}
        </TabsTrigger>
        <TabsTrigger
          value="notes"
          className="flex items-center gap-1.5 rounded-xl font-bold text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-3 py-1.5"
        >
          <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{ar ? "ملاحظاتي" : "My Notes"}</span>
        </TabsTrigger>
      </TabsList>

      {/* ── Activity tab ──────────────────────────────────────────────────── */}
      <TabsContent value="activity" className="flex-1 overflow-y-auto mt-0 focus:outline-none p-4">
        {renderActivityContent()}
      </TabsContent>

      {/* ── Notes tab ─────────────────────────────────────────────────────── */}
      <TabsContent value="notes" className="flex-1 overflow-y-auto mt-0 focus:outline-none p-4 h-full">
        <NotesTab
          ar={ar}
          noteContent={noteContent}
          onNoteChange={onNoteChange}
          slideNo={slideNo}
        />
      </TabsContent>
    </Tabs>
  );
}

// Re-export for parent convenience
export type { ActivityWidgetProps } from "./ActivityWidget";
