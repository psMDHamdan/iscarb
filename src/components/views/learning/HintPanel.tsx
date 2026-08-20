"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lightbulb, ChevronRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HintPanelProps {
  hint: string;
  level: number;
  maxLevel?: number;
  loading?: boolean;
  onRequestNextLevel?: () => void;
  onDismiss?: () => void;
  isArabic?: boolean;
}

export function HintPanel({
  hint,
  level,
  maxLevel = 3,
  loading = false,
  onRequestNextLevel,
  onDismiss,
  isArabic = false,
}: HintPanelProps) {
  if (!hint) return null;

  const levelLabels = {
    1: { en: "Conceptual Clue", ar: "تلميح مفاهيمي" },
    2: { en: "Formula / Mechanism", ar: "الآلية / العلاقة الرياضية" },
    3: { en: "Solution Scaffold", ar: "خطوة الحل الأولى" },
  };

  const currentLabel = (levelLabels as any)[level] || { en: `Hint ${level}`, ar: `تلميح ${level}` };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="mt-3 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 p-3.5 space-y-2.5 shadow-sm text-sm"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center text-sky-600 dark:text-sky-300">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-xs text-sky-950 dark:text-sky-200">
            {isArabic ? "تلميح مدعوم بالذكاء الاصطناعي" : "AI Scaffolded Hint"}
          </span>
          <Badge variant="outline" className="text-[10px] bg-white/80 dark:bg-slate-900/80 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-medium">
            {isArabic ? `${currentLabel.ar} (${level}/${maxLevel})` : `${currentLabel.en} (${level}/${maxLevel})`}
          </Badge>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 rounded"
            aria-label="Close hint"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 pl-8 pr-2">
        {hint}
      </p>

      {onRequestNextLevel && level < maxLevel && (
        <div className="pt-1 flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRequestNextLevel}
            disabled={loading}
            className="text-xs h-7 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-sky-500" />
            <span>
              {loading
                ? isArabic ? "جاري تجهيز التلميح..." : "Generating..."
                : isArabic ? "طلب تلميح أعمق" : "Need a deeper hint?"}
            </span>
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
