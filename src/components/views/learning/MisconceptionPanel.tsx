"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ChevronDown, ChevronUp, Sparkles, Compass, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MisconceptionFeedbackData {
  explanation?: string;
  mentalModelShift?: string;
  retryHint?: string;
}

interface MisconceptionPanelProps {
  data: MisconceptionFeedbackData;
  onDismiss?: () => void;
  onRetry?: () => void;
  isArabic?: boolean;
}

export function MisconceptionPanel({
  data,
  onDismiss,
  onRetry,
  isArabic = false,
}: MisconceptionPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 overflow-hidden shadow-sm text-sm"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="p-3.5 flex items-center justify-between bg-amber-100/60 dark:bg-amber-900/40 border-b border-amber-200/60 dark:border-amber-800/40">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold text-xs uppercase tracking-wide">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{isArabic ? "تحليل الفهم الخاطئ (AI Learning Coach)" : "Conceptual Analysis & Guidance"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 rounded"
            aria-label="Toggle details"
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 rounded"
              aria-label="Dismiss feedback"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 space-y-3.5 text-slate-800 dark:text-slate-200"
          >
            {data.explanation && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-950 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isArabic ? "لماذا كانت هذه الإجابة غير دقيقة؟" : "Why this mental model was incomplete:"}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 pl-5 pr-2">
                  {data.explanation}
                </p>
              </div>
            )}

            {data.mentalModelShift && (
              <div className="space-y-1 rounded-lg p-2.5 bg-white/70 dark:bg-slate-900/60 border border-amber-200/50 dark:border-amber-900/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isArabic ? "التحول الذهني المطلوب للمفهوم:" : "Target Mental Model Shift:"}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {data.mentalModelShift}
                </p>
              </div>
            )}

            {data.retryHint && (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isArabic ? "تلميح للمحاولة التالية:" : "Guidance for your next try:"}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 pl-5">
                  {data.retryHint}
                </p>
              </div>
            )}

            {onRetry && (
              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-200"
                >
                  {isArabic ? "إعادة المحاولة الآن" : "Retry with New Perspective"}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
