"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Brain,
  PlayCircle,
  Target,
  Trophy,
  X,
  Sparkles,
} from "lucide-react";
import { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";

interface OrientationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  courseName: string;
  clos: CourseLearningOutcome[];
  conceptCount: number;
  practiceCount: number;
  onStart: () => void;
  ar?: boolean;
}

export function OrientationModal({
  isOpen,
  onClose,
  title,
  courseName,
  clos,
  conceptCount,
  practiceCount,
  onStart,
  ar = false,
}: OrientationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl transition-all">
        {/* Top Decorative Gradient Blur */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="size-5" />
        </Button>

        {/* Header */}
        <div className="space-y-3 text-center sm:text-left pr-8">
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold px-3 py-1 text-xs"
          >
            <Sparkles className="size-3.5 mr-1.5 inline text-emerald-500" />
            {courseName}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {ar
              ? "أهلاً بك في هذه المحاضرة التفاعلية. إليك نظرة عامة على نواتج التعلم وخطة الدرس:"
              : "Welcome to today's interactive lecture. Here is what you will learn:"}
          </p>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-6">
          {/* Learning Outcomes Section */}
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-50/40 dark:bg-slate-900/50 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <Target className="size-4 text-emerald-600" />
              <span>{ar ? "نواتج تعلم المساق (CLOs)" : "Course Learning Outcomes"}</span>
            </div>
            <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
              {clos && clos.length > 0 ? (
                clos.map((clo, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-medium">{clo.text}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-medium">
                    {ar
                      ? "المفهوم الأساسي، التحليل الإحصائي، التطبيقات العملية، والتحدي الختامي"
                      : "Master geometric intuition, mathematical mechanism, worked calculations, and decision trade-offs."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3 text-center shadow-sm">
              <Clock className="size-4 mx-auto mb-1 text-emerald-600" />
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {ar ? "الوقت المتوقع" : "Estimated Time"}
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                ~35 {ar ? "دقيقة" : "min"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3 text-center shadow-sm">
              <Brain className="size-4 mx-auto mb-1 text-emerald-600" />
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {ar ? "الشرائح" : "Slides"}
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {conceptCount || 20}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3 text-center shadow-sm">
              <BookOpen className="size-4 mx-auto mb-1 text-emerald-600" />
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {ar ? "التطبيقات" : "Practice"}
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {practiceCount || 5}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3 text-center shadow-sm">
              <Trophy className="size-4 mx-auto mb-1 text-emerald-600" />
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {ar ? "التحدي الختامي" : "Challenge"}
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                1
              </div>
            </div>
          </div>

          {/* Start Learning CTA Button */}
          <Button
            size="lg"
            onClick={() => {
              onStart();
              onClose();
            }}
            className="w-full h-14 text-base font-bold bg-[#0F7B8A] hover:bg-[#0c626e] text-white rounded-2xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <PlayCircle className="size-5 mr-2" />
            {ar ? "ابدأ الدرس الآن" : "Start Learning"}
          </Button>
        </div>
      </div>
    </div>
  );
}
