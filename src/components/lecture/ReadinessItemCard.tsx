"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  Pencil,
  Trash2,
  X,
  Check,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Eye,
  BookOpen,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ReadinessItemJson } from "@/lib/lecture/generation/types";
import { StemRenderer } from "@/components/ui/StemRenderer";

interface Props {
  item: ReadinessItemJson;
  approved?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  onSave?: (patch: Partial<ReadinessItemJson>) => Promise<void> | void;
  className?: string;
}

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

/** Executive readiness assessment card matching BRD §14 specifications. */
export function ReadinessItemCard({
  item,
  approved,
  onApprove,
  onReject,
  onDelete,
  onSave,
  className,
}: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<{
    stem: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    correctIndex: number;
    difficulty: string;
    rationale: string;
    misconception: string;
    slideNo: number;
  } | null>(null);
  const normalizedOptions = (item.options ?? []).map((o: any, idx: number) => {
    if (typeof o === "string") {
      return {
        id: String.fromCharCode(65 + idx),
        text: o,
        isCorrect: idx === (item.correctIndex ?? 0),
      };
    }
    return {
      id: o?.id || String.fromCharCode(65 + idx),
      text: typeof o?.text === "string" ? o.text : String(o ?? `Option ${idx + 1}`),
      isCorrect: Boolean(o?.isCorrect) || idx === (item.correctIndex ?? 0),
    };
  });

  const openEditor = () => {
    setDraft({
      stem: item.stem,
      options: normalizedOptions.map((o) => ({ ...o })),
      correctIndex: item.correctIndex ?? normalizedOptions.findIndex((o) => o.isCorrect) ?? 0,
      difficulty: item.difficulty,
      rationale: item.rationale ?? "",
      misconception: item.misconception ?? "",
      slideNo: item.slideNo,
    });
    setEditing(true);
  };

  const submitEdit = async () => {
    if (!draft || !onSave) return;
    setSaving(true);
    try {
      await onSave({
        stem: draft.stem,
        options: draft.options,
        correctIndex: draft.correctIndex,
        difficulty: draft.difficulty as ReadinessItemJson["difficulty"],
        rationale: draft.rationale,
        misconception: draft.misconception || undefined,
        slideNo: draft.slideNo,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border border-emerald-100 dark:border-slate-700/50 shadow-md shadow-emerald-500/5 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 rounded-3xl bg-white dark:bg-slate-900", 
      className
    )}>
      {/* Decorative ambient light */}
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-[50px] pointer-events-none" />
      <CardContent className="relative p-6 sm:p-7 space-y-5 z-10">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs border-emerald-200 text-[#0E6C3C] bg-emerald-50/50 font-bold">
              {item.slideNo === 20 ? (
                <span className="flex items-center gap-1">🎯 S20 — Final Gate</span>
              ) : (
                <span className="flex items-center gap-1">📍 S{item.slideNo} — Embedded</span>
              )}
            </Badge>

            <Badge
              variant="outline"
              className={cn(
                "text-xs capitalize font-bold",
                item.difficulty === "easy" && "border-emerald-300 text-emerald-700 bg-emerald-50",
                item.difficulty === "medium" && "border-amber-300 text-amber-700 bg-amber-50",
                item.difficulty === "hard" && "border-purple-300 text-purple-700 bg-purple-50"
              )}
            >
              {item.difficulty}
            </Badge>

            {item.sourceLocator && (
              <Badge variant="outline" className="text-[11px] font-mono text-slate-500">
                {item.sourceLocator}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={openEditor}
              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 rounded-lg"
              title={ar ? "تعديل السؤال" : "Edit question"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 rounded-lg"
                title={ar ? "حذف السؤال" : "Delete question"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {approved !== undefined && (
              <Badge
                variant={approved ? "default" : "outline"}
                className={cn(
                  "cursor-pointer text-xs font-bold transition-colors ml-1 rounded-lg",
                  approved
                    ? "bg-[#0E6C3C] text-white hover:bg-[#0E6C3C]/90"
                    : "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                )}
                onClick={() => (approved ? onReject?.() : onApprove?.())}
              >
                {approved ? (
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> {ar ? "معتمد" : "Approved"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" /> {ar ? "قيد المراجعة" : "Approve"}
                  </span>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* Stem */}
        <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
          <StemRenderer content={item.stem} inline />
        </div>

        {/* Options List */}
        <div className="space-y-2">
          {normalizedOptions.map((opt, idx) => {
            const isPicked = picked === idx;
            const isCorrect = opt.isCorrect || idx === item.correctIndex;
            const showFeedback = isPicked || revealed;

            return (
              <button
                key={opt.id || idx}
                type="button"
                onClick={() => {
                  setPicked(idx);
                  setRevealed(true);
                }}
                className={cn(
                  "w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer",
                  showFeedback && isCorrect
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500"
                    : showFeedback && isPicked && !isCorrect
                    ? "border-red-400 bg-red-50 text-red-900"
                    : "border-slate-200 bg-slate-50/60 hover:border-emerald-300 hover:bg-white text-slate-800"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black border transition-colors",
                    showFeedback && isCorrect
                      ? "bg-[#0E6C3C] text-white border-[#0E6C3C]"
                      : "bg-white text-slate-700 border-slate-200 shadow-2xs"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed">
                    <StemRenderer content={opt.text} inline />
                  </span>
                </div>

                {showFeedback && isCorrect && <CheckCircle2 className="h-4 w-4 text-[#0E6C3C] shrink-0" />}
                {showFeedback && isPicked && !isCorrect && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Rationale Reveal Drawer */}
        {revealed && item.rationale && (
          <div className="p-4 rounded-xl border border-[#0F7B8A]/30 bg-[#0F7B8A]/5 space-y-2 text-xs leading-relaxed">
            <p className="font-bold text-[#0F7B8A] flex items-center gap-1.5 uppercase tracking-wider">
              <BookOpen className="h-4 w-4" /> {ar ? "الشرح والمبرر التربوي:" : "Pedagogical Rationale:"}
            </p>
            <div className="text-foreground/90 font-mono">
              <StemRenderer content={item.rationale} />
            </div>
          </div>
        )}

        {!revealed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRevealed(true)}
            className="text-xs text-[#0F7B8A] hover:bg-[#0F7B8A]/10 p-0 h-auto font-semibold"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            {ar ? "عرض المبرر والإجابة الصحيحة" : "Reveal Rationale & Correct Answer"}
          </Button>
        )}
      </CardContent>

      {/* Edit Dialog Drawer */}
      {editing && draft && (
        <div className="p-6 border-t bg-muted/20 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-sm flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[#0F7B8A]" />
              {ar ? "تحرير السؤال" : "Edit Assessment Item"}
            </h5>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-bold text-muted-foreground">{ar ? "نص السؤال" : "Question Stem"}</Label>
              <Input
                value={draft.stem}
                onChange={(e) => setDraft({ ...draft, stem: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-muted-foreground">{ar ? "الخيارات" : "Options"}</Label>
              <div className="space-y-2 mt-1">
                {draft.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${item.slideNo}`}
                      checked={draft.correctIndex === i}
                      onChange={() => setDraft({ ...draft, correctIndex: i, options: draft.options.map((o, idx) => ({ ...o, isCorrect: idx === i })) })}
                    />
                    <Input
                      value={opt.text}
                      onChange={(e) => {
                        const nextOpts = [...draft.options];
                        nextOpts[i] = { ...nextOpts[i], text: e.target.value };
                        setDraft({ ...draft, options: nextOpts });
                      }}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-muted-foreground">{ar ? "الشرح والمبرر" : "Rationale"}</Label>
              <Textarea
                value={draft.rationale}
                onChange={(e) => setDraft({ ...draft, rationale: e.target.value })}
                rows={2}
                className="mt-1 text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button size="sm" onClick={submitEdit} disabled={saving} className="bg-[#0F7B8A] text-white">
                {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التغييرات" : "Save Changes")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
