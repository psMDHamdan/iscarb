"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, CheckCircle2, AlertTriangle, Send, Sparkles, X, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export interface TeachItBackResult {
  whatYouGotRight?: string;
  missing?: string;
  betterExplanation?: string;
  isMasteryDemonstrated?: boolean;
}

interface TeachItBackPanelProps {
  conceptName: string;
  conceptDefinition?: string;
  loading?: boolean;
  result?: TeachItBackResult | null;
  onSubmit: (response: string) => void;
  onDismiss?: () => void;
  isArabic?: boolean;
}

export function TeachItBackPanel({
  conceptName,
  conceptDefinition,
  loading = false,
  result,
  onSubmit,
  onDismiss,
  isArabic = false,
}: TeachItBackPanelProps) {
  const [response, setResponse] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-4 rounded-xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/60 dark:bg-indigo-950/30 p-4 space-y-3.5 shadow-sm text-sm"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/50 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
              {isArabic ? `اشرح المفهوم بأسلوبك (Teach-it-Back): ${conceptName}` : `Active Recall Mastery: ${conceptName}`}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isArabic
                ? "اشرح كيف يعمل المفهوم بكلماتك لاختبار ترسيخ المعرفة."
                : "Explain this concept in your own words to solidify your mental model."}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            aria-label="Close panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!result ? (
        <div className="space-y-3">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder={
              isArabic
                ? "اكتب شرحك هنا... (مثال: الهدف الأساسي من المفهوم، كيف يرتبط بالبيانات، وما هي مخرجاته؟)"
                : "Type your explanation here... (e.g. What is the core mechanism, why does it matter, and how is it used?)"
            }
            className="min-h-[90px] text-xs bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/60 focus-visible:ring-indigo-500"
            disabled={loading}
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">
              {response.length < 20
                ? isArabic ? "اكتب 20 حرفاً على الأقل لتقييم الشرح" : "Write at least 20 characters for evaluation"
                : isArabic ? `${response.length} حرف` : `${response.length} characters`}
            </span>
            <Button
              size="sm"
              onClick={() => onSubmit(response)}
              disabled={loading || response.trim().length < 15}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
            >
              {loading ? (
                <span>{isArabic ? "جاري التقييم..." : "Evaluating..."}</span>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>{isArabic ? "تقييم فهمي" : "Evaluate My Understanding"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            {result.isMasteryDemonstrated ? (
              <Badge className="bg-emerald-600 text-white text-xs flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>{isArabic ? "إتقان مفاهيمي مثبت!" : "Concept Mastery Demonstrated!"}</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs border-amber-400 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isArabic ? "فهم قيد التطوير" : "Developing Understanding"}</span>
              </Badge>
            )}
          </div>

          {result.whatYouGotRight && (
            <div className="rounded-lg p-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs">
              <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isArabic ? "ما أجدت في شرحه:" : "What You Grasped Accurately:"}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-4">
                {result.whatYouGotRight}
              </p>
            </div>
          )}

          {result.missing && (
            <div className="rounded-lg p-2.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs">
              <div className="flex items-center gap-1 text-amber-800 dark:text-amber-300 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isArabic ? "عناصر تزيد فهمك عمقاً:" : "Key Elements to Strengthen:"}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-4">
                {result.missing}
              </p>
            </div>
          )}

          {result.betterExplanation && (
            <div className="rounded-lg p-2.5 bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900 text-xs">
              <span className="font-semibold text-indigo-900 dark:text-indigo-300 block mb-1">
                {isArabic ? "الصياغة المفاهيمية المثلى:" : "Canonical Exemplar Model:"}
              </span>
              <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed">
                &quot;{result.betterExplanation}&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
