"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { Plus, Trash2, Sparkles, FileText } from "lucide-react";

export interface CourseLearningOutcome {
  id: string;
  number: string;
  text: string;
  bloomLevel: string;
  weight: number;
}

const BLOOM = ["remember", "understand", "apply", "analyze", "evaluate", "create"];

interface Props {
  initial?: CourseLearningOutcome[];
  selectedIds?: string[];
  onSubmit: (clos: CourseLearningOutcome[], selectedIds: string[]) => void;
  submitting?: boolean;
  disabled?: boolean;
  className?: string;
}

const SAMPLE_TEXTS = [
  "Understand core concepts and principles of the lecture material",
  "Apply foundational techniques to practical problem scenarios",
  "Analyze complex system structures and component relationships",
  "Evaluate solution trade-offs and implementation performance",
  "Design and synthesize comprehensive project solutions",
];

function inferBloom(text: string): string {
  const t = text.toLowerCase();
  const words = t.split(/\s+/);
  const firstVerb = words.find((w) =>
    /^(design|create|develop|synthesize|construct|evaluate|assess|justify|critique|judge|analyze|compare|differentiate|examine|distinguish|apply|use|implement|solve|demonstrate|calculate|explain|describe|summarize|interpret|classify|remember|identify|list)$/.test(w)
  );

  if (firstVerb) {
    if (/design|create|develop|synthesize|construct/.test(firstVerb)) return "create";
    if (/evaluate|assess|justify|critique|judge/.test(firstVerb)) return "evaluate";
    if (/analyze|compare|differentiate|examine|distinguish/.test(firstVerb)) return "analyze";
    if (/apply|use|implement|solve|demonstrate|calculate/.test(firstVerb)) return "apply";
    if (/explain|describe|summarize|interpret|classify/.test(firstVerb)) return "understand";
  }

  if (/design|create|develop|synthesize|construct/.test(t)) return "create";
  if (/evaluate|assess|justify|critique|judge/.test(t)) return "evaluate";
  if (/analyze|compare|differentiate|examine|distinguish/.test(t)) return "analyze";
  if (/apply|use|implement|solve|demonstrate|calculate/.test(t)) return "apply";
  if (/explain|describe|summarize|interpret|classify/.test(t)) return "understand";
  return "remember";
}

function parseCloText(text: string): CourseLearningOutcome[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 10);

  return lines.map((line, i) => {
    const clean = line
      .replace(/^(CLO[-\s]?\d+[:.]?\s*|[\d]+[.)]\s*|[•\-–]\s*)/i, "")
      .trim();

    const bloomLevel = inferBloom(clean);

    return {
      id: `clo-paste-${i + 1}-${Math.random().toString(36).slice(2, 7)}`,
      number: `CLO-${i + 1}`,
      text: clean,
      bloomLevel,
      weight: Math.floor(100 / Math.max(1, lines.length)),
    };
  });
}

function blankClo(index: number): CourseLearningOutcome {
  return {
    id: `clo-${index}-${Math.random().toString(36).substring(2, 8)}`,
    number: `CLO-${index}`,
    text: SAMPLE_TEXTS[(index - 1) % SAMPLE_TEXTS.length],
    bloomLevel: index === 1 ? "understand" : index === 2 ? "apply" : "analyze",
    weight: 20,
  };
}

/** Faculty CLO entry — plan generation stays blocked until ≥1 CLO submitted (AC-15). */
export function CLOEntryForm({ initial, selectedIds = [], onSubmit, submitting, disabled, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [mode, setMode] = useState<"form" | "paste">("form");
  const [pasteText, setPasteText] = useState("");

  const initialClos = useMemo(() => (initial?.length ? initial : [blankClo(1), blankClo(2)]), [initial]);
  const [clos, setClos] = useState<CourseLearningOutcome[]>(initialClos);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(selectedIds.length ? selectedIds : initialClos.map((c) => c.id))
  );

  const selectedList = useMemo(() => clos.filter((c) => selected.has(c.id)), [clos, selected]);
  const isOverLimit = selectedList.length > 5;
  const valid = selectedList.length >= 1 && selectedList.length <= 5 && selectedList.every((c) => c.text.trim().length > 0);

  const update = (id: string, patch: Partial<CourseLearningOutcome>) =>
    setClos((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const handleParseImport = () => {
    const parsed = parseCloText(pasteText);
    if (parsed.length > 0) {
      setClos(parsed);
      setSelected(new Set(parsed.map((c) => c.id).slice(0, 5)));
      setMode("form");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mode Switcher Tabs & BRD Constraint Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit border border-border/60">
          <button
            type="button"
            onClick={() => setMode("form")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer",
              mode === "form" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {ar ? "إدخال يدوي" : "Manual Entry"}
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1",
              mode === "paste" ? "bg-[#0F7B8A] text-white shadow" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            {ar ? "لصق من الخطة الدراسية" : "Paste from Syllabus"}
          </button>
        </div>

        <div
          className={cn(
            "text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5",
            isOverLimit
              ? "bg-red-50 text-red-600 border-red-200"
              : selectedList.length >= 1
              ? "bg-emerald-50 text-[#0E6C3C] border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          )}
        >
          <span>
            {ar
              ? `المحدد: ${selectedList.length} من 5 كحد أقصى`
              : `Selected: ${selectedList.length} of max 5`}
          </span>
        </div>
      </div>

      {/* PASTE MODE UI */}
      {mode === "paste" && (
        <div className="space-y-3 p-4 rounded-2xl border border-border/80 bg-muted/10">
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-3 space-y-1 border border-border/50">
            <p className="font-bold text-foreground">{ar ? "تنسيقات مقبولة:" : "Accepted formats (one per line):"}</p>
            <p className="font-mono text-[11px]">CLO 1: Students will be able to analyze security protocols...</p>
            <p className="font-mono text-[11px]">1. Describe the key principles of data structures...</p>
            <p className="font-mono text-[11px]">• Apply software design patterns to web architectures...</p>
          </div>

          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={
              ar
                ? "الصق مخرجات التعلّم هنا — سطر واحد لكل مخرج..."
                : "Paste your learning outcomes here — one per line..."
            }
            className="min-h-[160px] font-mono text-sm leading-relaxed rounded-xl"
            dir={ar ? "rtl" : "ltr"}
          />

          <Button
            type="button"
            onClick={handleParseImport}
            disabled={!pasteText.trim()}
            className="bg-[#0F7B8A] text-white hover:bg-[#0F7B8A]/90 rounded-xl text-xs font-bold px-6 shadow-md"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {ar ? "تحليل وتحويل" : "Parse & Import"}
          </Button>
        </div>
      )}

      {/* FORM MODE UI */}
      {mode === "form" && (
        <div className="space-y-3">
          {clos.map((clo, i) => (
            <div key={clo.id} className="rounded-xl border border-border/80 bg-card p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`sel-${clo.id}`}
                  checked={selected.has(clo.id)}
                  onCheckedChange={(v) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (v) next.add(clo.id);
                      else next.delete(clo.id);
                      return next;
                    });
                  }}
                  aria-label={ar ? `تحديد ${clo.number}` : `Select ${clo.number}`}
                />
                <Input
                  value={clo.number}
                  onChange={(e) => update(clo.id, { number: e.target.value })}
                  className="w-24 font-bold"
                  aria-label="CLO number"
                />
                <Select value={clo.bloomLevel} onValueChange={(v) => update(clo.id, { bloomLevel: v })}>
                  <SelectTrigger className="w-32 capitalize text-xs font-semibold" aria-label="Bloom level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOM.map((b) => (
                      <SelectItem key={b} value={b} className="capitalize text-xs">
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setClos((prev) => prev.filter((c) => c.id !== clo.id));
                      setSelected((prev) => {
                        const next = new Set(prev);
                        next.delete(clo.id);
                        return next;
                      });
                    }}
                    className="ml-auto text-muted-foreground hover:text-red-600"
                    aria-label={ar ? `حذف ${clo.number}` : `Delete ${clo.number}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Input
                value={clo.text}
                onChange={(e) => update(clo.id, { text: e.target.value })}
                placeholder={ar ? "نص مخرج التعلّم..." : "Outcome description..."}
                className="mt-2 text-sm"
              />
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => {
                const nextNo = clos.length + 1;
                const newC = blankClo(nextNo);
                setClos((prev) => [...prev, newC]);
                setSelected((prev) => new Set(prev).add(newC.id));
              }}
              className="rounded-xl text-xs font-semibold"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {ar ? "إضافة مخرج تعلم" : "Add CLO"}
            </Button>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="button"
        disabled={!valid || submitting || disabled}
        onClick={() => valid && onSubmit(clos, Array.from(selected))}
        className="w-full bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white rounded-xl font-bold text-sm py-5 shadow-lg"
      >
        {submitting
          ? ar
            ? "جاري الحفظ..."
            : "Saving CLOs..."
          : ar
          ? `اعتماد (${selectedList.length}) مخرجات تعلم والمتابعة`
          : `Save (${selectedList.length}) CLOs & Continue`}
      </Button>
    </div>
  );
}
