"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Compass,
  Flag,
  Loader2,
  Bot,
  type LucideIcon,
  PartyPopper,
  Plus,
  Sparkles,
  Target,
  TestTube2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, type ViewId } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useApiQuery, useApiMutation } from "@/hooks/use-api-query";

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
interface StudentBrief {
  id: string;
  name: string;
  program: string;
  college: string;
  readinessScore: number;
}
interface StudentsResponse {
  students: StudentBrief[];
}
interface OnboardingTask {
  id: string;
  key: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  category: "explore" | "reflect" | "try" | "connect" | string;
  ctaView: string | null;
  order: number;
  done: boolean;
}
interface Onboarding {
  id: string;
  studentId: string;
  academicYear: number;
  mode: "exploratory" | "standard";
  targetDriven: boolean;
  interests: string[];
  strengths: string[];
  completed: boolean;
  completedAt: string | null;
  progress: { done: number; total: number; pct: number };
  tasks: OnboardingTask[];
}

const CATEGORY_META: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  explore: { icon: Compass, color: "#0096C7", bg: "#E0F2FB" },
  reflect: { icon: Sparkles, color: "#E0A100", bg: "#FFF6E0" },
  try: { icon: TestTube2, color: "#1E8A5A", bg: "#E6F4EE" },
  connect: { icon: Users, color: "#7C3AED", bg: "#F1EBFD" },
};
function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? CATEGORY_META.explore;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

// ─────────────────────────────────────────────────────────────────────────────
//  OnboardingView
// ─────────────────────────────────────────────────────────────────────────────
export function OnboardingView() {
  const { t, ar, num } = useI18n();

  const { data: apiResponse, isLoading: loading, error, refetch: reload } = useApiQuery<{ data: Onboarding }>(
    ["student", "onboarding"],
    "/api/v1/student/onboarding"
  );
  const data = apiResponse?.data;

  // Optimistic mirror so checkboxes/year feel instant; replaced by server truth.
  const [model, setModel] = useState<Onboarding | null>(null);
  useEffect(() => setModel(data ?? null), [data]);

  const [busy, setBusy] = useState(false);

  const mutation = useApiMutation<{ data: Onboarding }, Record<string, unknown>>(
    "/api/v1/student/onboarding",
    { method: "POST" }
  );

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await mutation.mutateAsync(body);
      setModel(res.data);
    } catch {
      notify.fail(ar ? "ar" : "en");
      reload();
    } finally {
      setBusy(false);
    }
  }

  const view = model ?? data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <OnboardingHeader />


      {error && (
        <div className="alert-iron mb-6 rounded-lg p-3 text-xs text-destructive">{t("onb.error")}</div>
      )}

      {loading && !view ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : view ? (
        view.completed ? (
          <GraduatedPanel
            onReopen={() => patch({ completed: false })}
            onCareer={() => window.location.href = "/student/career"}
            onReadiness={() => window.location.href = "/student/readiness"}
            busy={busy}
          />
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Mode banner */}
            <motion.div variants={itemAnim}>
              <ModeBanner mode={view.mode} />
            </motion.div>

            {/* Year selector + progress */}
            <motion.div variants={itemAnim} className="grid gap-6 md:grid-cols-2">
              <YearCard
                year={view.academicYear}
                busy={busy}
                onPick={(y) => patch({ academicYear: y })}
              />
              <ProgressCard progress={view.progress} num={num} />
            </motion.div>

            {/* Interests + strengths */}
            <motion.div variants={itemAnim}>
              <ProfileCard
                interests={view.interests}
                strengths={view.strengths}
                busy={busy}
                onSaveInterests={(v) => patch({ interests: v })}
                onSaveStrengths={(v) => patch({ strengths: v })}
              />
            </motion.div>

            {/* Tasks — pending always visible (actionable); completed ones
                collapse once there are several, so a well-progressed
                student isn't scrolling past a wall of checked-off items. */}
            <motion.div variants={itemAnim}>
              <TasksCard tasks={view.tasks} busy={busy} onOpen={(v) => window.location.href = `/student/${v}`} onToggle={(taskKey, done) => patch({ taskKey, done })} />
            </motion.div>

            {/* Graduate CTA */}
            <motion.div variants={itemAnim}>
              <GraduateCta
                pct={view.progress.pct}
                busy={busy}
                onGraduate={() => patch({ completed: true })}
              />
            </motion.div>
          </motion.div>
        )
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Tasks card — pending visible, completed collapsible
// ─────────────────────────────────────────────────────────────────────────────
function TasksCard({
  tasks,
  busy,
  onOpen,
  onToggle,
}: {
  tasks: OnboardingTask[];
  busy: boolean;
  onOpen: (v: ViewId) => void;
  onToggle: (taskKey: string, done: boolean) => void;
}) {
  const { t } = useI18n();
  const [showCompleted, setShowCompleted] = useState(false);
  const pending = tasks.filter((tk) => !tk.done);
  const completed = tasks.filter((tk) => tk.done);

  return (
    <Card className="border-iscarb-green/15 shadow-brand">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flag className="size-4 text-iscarb-green" />
          {t("onb.tasks.title")}
        </CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">{t("onb.tasks.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {pending.map((task) => (
          <TaskRow key={task.id} task={task} busy={busy} onOpen={onOpen} onToggle={(done) => onToggle(task.key, done)} />
        ))}
        {pending.length === 0 && completed.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("onb.tasks.subtitle")}</p>
        )}
        {completed.length > 0 && (
          <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
            <CollapsibleTrigger className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground">
              {showCompleted ? t("onb.tasks.hideCompleted") : t("onb.tasks.showCompleted", { n: completed.length })}
              <ChevronDown className={`size-3.5 transition-transform ${showCompleted ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {completed.map((task) => (
                <TaskRow key={task.id} task={task} busy={busy} onOpen={onOpen} onToggle={(done) => onToggle(task.key, done)} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Header
// ─────────────────────────────────────────────────────────────────────────────
function OnboardingHeader() {
  const { t } = useI18n();
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
      <motion.div variants={itemAnim} className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-iscarb-ink ring-1 ring-iscarb-green/15">
          <Compass className="size-5 text-iscarb-gold" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-green">
            {t("onb.eyebrow")}
          </div>
          <div className="font-arabic text-xs text-muted-foreground" dir="rtl">
            {t("onb.arTag")}
          </div>
        </div>
      </motion.div>
      <motion.h1
        variants={itemAnim}
        className="mt-3 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl"
      >
        {t("onb.title")} <span className="text-gradient-brand">{t("onb.titleHighlight")}</span>
      </motion.h1>
      <motion.p variants={itemAnim} className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        {t("onb.subtitle")}
      </motion.p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mode banner
// ─────────────────────────────────────────────────────────────────────────────
function ModeBanner({ mode }: { mode: "exploratory" | "standard" }) {
  const { t } = useI18n();
  const exploratory = mode === "exploratory";
  return (
    <div className="relative overflow-hidden rounded-xl bg-iscarb-ink text-white shadow-brand">
      <div className="grid-dots pointer-events-none absolute inset-0 opacity-10" />
      <div className="relative flex items-start gap-3 px-5 py-4">
        {exploratory ? (
          <Compass className="mt-0.5 size-5 shrink-0 text-iscarb-gold" />
        ) : (
          <Target className="mt-0.5 size-5 shrink-0 text-iscarb-gold" />
        )}
        <div>
          <div className="font-display text-base font-bold">
            {exploratory ? t("onb.mode.exploratory.title") : t("onb.mode.standard.title")}
          </div>
          <div className="mt-0.5 text-sm text-white/70">
            {exploratory ? t("onb.mode.exploratory.body") : t("onb.mode.standard.body")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Year card
// ─────────────────────────────────────────────────────────────────────────────
function YearCard({
  year,
  busy,
  onPick,
}: {
  year: number;
  busy: boolean;
  onPick: (y: number) => void;
}) {
  const { t } = useI18n();
  const options: { value: number; label: string }[] = [
    { value: 1, label: t("onb.year.1") },
    { value: 2, label: t("onb.year.2") },
    { value: 3, label: t("onb.year.3") },
    { value: 4, label: t("onb.year.4plus") },
  ];
  const active = year >= 4 ? 4 : year;
  return (
    <Card className="border-iscarb-green/15 shadow-brand">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          {t("onb.year.label")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {options.map((o) => (
            <button
              key={o.value}
              disabled={busy}
              onClick={() => onPick(o.value)}
              className={cn(
                "rounded-lg border px-2 py-2.5 text-sm font-semibold transition-all disabled:opacity-60",
                active === o.value
                  ? "border-iscarb-green bg-iscarb-green text-white shadow-brand"
                  : "border-border text-foreground hover:border-iscarb-green/50 hover:bg-accent",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Progress card
// ─────────────────────────────────────────────────────────────────────────────
function ProgressCard({
  progress,
  num,
}: {
  progress: { done: number; total: number; pct: number };
  num: (n: number | string) => string;
}) {
  const { t } = useI18n();
  return (
    <Card className="border-iscarb-green/15 shadow-brand">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
          <span>{t("onb.progress.label")}</span>
          <span className="font-display text-2xl font-bold text-iscarb-ink dark:text-white">
            {num(progress.pct)}
            <span className="text-sm text-muted-foreground">%</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Progress value={progress.pct} className="h-2.5" />
        <p className="mt-2 text-[11px] text-muted-foreground">
          {t("onb.progress.steps", { done: progress.done, total: progress.total })}
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Profile (interests + strengths)
// ─────────────────────────────────────────────────────────────────────────────
function ProfileCard({
  interests,
  strengths,
  busy,
  onSaveInterests,
  onSaveStrengths,
}: {
  interests: string[];
  strengths: string[];
  busy: boolean;
  onSaveInterests: (v: string) => void;
  onSaveStrengths: (v: string) => void;
}) {
  const { t, ar } = useI18n();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/v1/student/onboarding/generate", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Generation failed");
      
      const data = await res.json();
      
      const generatedInterests = ar ? data.interestsAr : data.interestsEn;
      const generatedStrengths = ar ? data.strengthsAr : data.strengthsEn;
      
      onSaveInterests(generatedInterests);
      onSaveStrengths(generatedStrengths);
    } catch (e) {
      console.error(e);
      // Fallback in case of AI error
      const fallbackInterests = ar ? "الذكاء الاصطناعي, التقنية المالية, رؤية 2030, علم البيانات" : "Artificial Intelligence, Fintech, Vision 2030, Data Science";
      const fallbackStrengths = ar ? "حل المشكلات, بايثون, أجايل, القيادة" : "Problem Solving, Python, Agile, Leadership";
      onSaveInterests(fallbackInterests);
      onSaveStrengths(fallbackStrengths);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-iscarb-green/15 shadow-brand">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-iscarb-gold-dark" />
            {t("onb.profile.title")}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAIGenerate}
            disabled={busy || isGenerating}
            className="h-8 border-iscarb-cyan/30 text-iscarb-cyan-dark hover:bg-iscarb-cyan/10 hover:text-iscarb-cyan gap-1.5 transition-all"
          >
            {isGenerating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Bot className="size-3.5" />
            )}
            {isGenerating 
              ? (ar ? "جاري التوليد..." : "Generating...") 
              : (ar ? "توليد بالذكاء الاصطناعي" : "Generate with AI")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 pt-4 md:grid-cols-2">
        <TagEditor
          label={t("onb.interests.label")}
          placeholder={t("onb.interests.placeholder")}
          empty={t("onb.interests.empty")}
          tags={interests}
          busy={busy || isGenerating}
          onSave={onSaveInterests}
          color="#0096C7"
          bg="#E0F2FB"
        />
        <TagEditor
          label={t("onb.strengths.label")}
          placeholder={t("onb.strengths.placeholder")}
          empty={t("onb.strengths.empty")}
          tags={strengths}
          busy={busy || isGenerating}
          onSave={onSaveStrengths}
          color="#1E8A5A"
          bg="#E6F4EE"
        />
      </CardContent>
    </Card>
  );
}

function TagEditor({
  label,
  placeholder,
  empty,
  tags,
  busy,
  onSave,
  color,
  bg,
}: {
  label: string;
  placeholder: string;
  empty: string;
  tags: string[];
  busy: boolean;
  onSave: (v: string) => void;
  color: string;
  bg: string;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState("");

  const add = () => {
    const v = value.trim();
    if (!v) return;
    const next = Array.from(new Set([...tags, ...v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)])).slice(0, 12);
    onSave(next.join(", "));
    setValue("");
  };
  const remove = (tag: string) => onSave(tags.filter((x) => x !== tag).join(", "));

  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.length === 0 ? (
          <span className="text-xs text-muted-foreground">{empty}</span>
        ) : (
          tags.map((tag) => (
            <button
              key={tag}
              disabled={busy}
              onClick={() => remove(tag)}
              className="group inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity disabled:opacity-60"
              style={{ borderColor: `${color}55`, color, backgroundColor: bg }}
              title={ar2(t) ? "إزالة" : "Remove"}
            >
              {tag}
              <span className="opacity-50 group-hover:opacity-100">×</span>
            </button>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          disabled={busy}
          className="h-9"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-9 shrink-0 gap-1"
          disabled={busy || !value.trim()}
          onClick={add}
        >
          <Plus className="size-3.5" />
          {t("onb.save")}
        </Button>
      </div>
    </div>
  );
}

// tiny helper so the remove tooltip can be bilingual without threading `ar`.
function ar2(t: (k: string) => string): boolean {
  return t("onb.save") === "حفظ";
}

// ─────────────────────────────────────────────────────────────────────────────
//  Task row
// ─────────────────────────────────────────────────────────────────────────────
function TaskRow({
  task,
  busy,
  onOpen,
  onToggle,
}: {
  task: OnboardingTask;
  busy: boolean;
  onOpen: (v: ViewId) => void;
  onToggle: (done: boolean) => void;
}) {
  const { t, ar } = useI18n();
  const meta = categoryMeta(task.category);
  const Icon = meta.icon;
  const title = ar ? task.titleAr : task.titleEn;
  const desc = ar ? task.descriptionAr : task.descriptionEn;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 transition-colors",
        task.done ? "border-iscarb-green/30 bg-iscarb-green-soft/40" : "border-border bg-card",
      )}
    >
      <button
        disabled={busy}
        onClick={() => onToggle(!task.done)}
        aria-label={task.done ? t("onb.task.done") : t("onb.task.markDone")}
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-all disabled:opacity-60",
          task.done
            ? "border-iscarb-green bg-iscarb-green text-white"
            : "border-muted-foreground/40 text-transparent hover:border-iscarb-green",
        )}
      >
        <Check className="size-3.5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: meta.color, backgroundColor: meta.bg }}
          >
            <Icon className="size-3" />
            {t(`onb.cat.${task.category}`)}
          </span>
        </div>
        <div className={cn("mt-1 text-sm font-semibold", task.done ? "text-muted-foreground line-through" : "text-iscarb-ink dark:text-white")}>
          {title}
        </div>
        {desc && <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>}
      </div>

      {task.ctaView && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 shrink-0 gap-1 text-iscarb-cyan-dark hover:text-iscarb-green"
          onClick={() => onOpen(task.ctaView as ViewId)}
        >
          {t("onb.task.open")}
          <ArrowRight className={cn("size-3.5", ar && "rotate-180")} />
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Graduate CTA
// ─────────────────────────────────────────────────────────────────────────────
function GraduateCta({
  pct,
  busy,
  onGraduate,
}: {
  pct: number;
  busy: boolean;
  onGraduate: () => void;
}) {
  const { t } = useI18n();
  const ready = pct >= 75;
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-iscarb-gold/30 bg-iscarb-gold-soft/40 p-5 text-center">
      <Button
        size="lg"
        disabled={busy || !ready}
        onClick={onGraduate}
        className="gap-2 bg-iscarb-green hover:bg-iscarb-green-dark disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
        {t("onb.graduate.cta")}
      </Button>
      {!ready && <p className="text-xs text-muted-foreground">{t("onb.graduate.hint")}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Graduated panel
// ─────────────────────────────────────────────────────────────────────────────
function GraduatedPanel({
  onReopen,
  onCareer,
  onReadiness,
  busy,
}: {
  onReopen: () => void;
  onCareer: () => void;
  onReadiness: () => void;
  busy: boolean;
}) {
  const { t } = useI18n();
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div
        variants={itemAnim}
        className="flex flex-col items-center gap-4 rounded-2xl border border-iscarb-green/20 bg-brand-mesh p-10 text-center"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-iscarb-ink ring-1 ring-iscarb-gold/30">
          <PartyPopper className="size-8 text-iscarb-gold" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-iscarb-ink dark:text-white">
            {t("onb.graduated.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("onb.graduated.body")}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onCareer} className="gap-2 bg-iscarb-green hover:bg-iscarb-green-dark">
            <Target className="size-4" />
            {t("onb.graduated.gotoCareer")}
          </Button>
          <Button onClick={onReadiness} variant="outline" className="gap-2">
            <Sparkles className="size-4" />
            {t("onb.graduated.gotoReadiness")}
          </Button>
          <Button onClick={onReopen} variant="ghost" size="sm" disabled={busy} className="text-muted-foreground">
            {t("onb.graduated.reopen")}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default OnboardingView;
