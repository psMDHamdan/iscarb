"use client";

import Link from "next/link";
import { useApiQuery } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  BarChart3,
  PlayCircle,
  RotateCcw,
  Lock,
  Flame,
} from "lucide-react";

export interface StudentLectureItem {
  id: string;
  projectId: string;
  courseCode: string;
  courseTitle: string;
  specialty: string | null;
  publishedAt: string;
  slideCount: number;
  completedSlides: number;
  score: number | null;
}

interface ListResponse {
  versions: StudentLectureItem[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Derive the 6 learning phases shown as a mini-roadmap on each card */
const PHASE_LABELS = [
  { en: "Hook", ar: "البداية", color: "bg-blue-500" },
  { en: "Concepts", ar: "المفاهيم", color: "bg-teal-500" },
  { en: "Practice", ar: "التدريب", color: "bg-purple-500" },
  { en: "Cases", ar: "الحالات", color: "bg-cyan-500" },
  { en: "Apply", ar: "التطبيق", color: "bg-emerald-500" },
  { en: "Mastery", ar: "الإتقان", color: "bg-amber-500" },
];

/**
 * Which phase is currently active given completed slide count out of 20.
 * S1–4 → 0 | S5–7 → 1 | S8–10 → 2 | S11–13 → 3 | S14–17 → 4 | S18–20 → 5
 */
function activePhase(completed: number): number {
  if (completed >= 18) return 5;
  if (completed >= 14) return 4;
  if (completed >= 11) return 3;
  if (completed >= 8) return 2;
  if (completed >= 5) return 1;
  return 0;
}

/** Estimated learning time based on slide count (roughly 1.5 min/slide) */
function estimateMinutes(slideCount: number): number {
  return Math.round(slideCount * 1.5);
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface PhasePipsProps {
  completed: number;
  total: number;
  ar: boolean;
}

function PhasePips({ completed, total, ar }: PhasePipsProps) {
  const current = activePhase(Math.round((completed / Math.max(total, 1)) * 20));
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {PHASE_LABELS.map((p, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={i}
            title={ar ? p.ar : p.en}
            className={[
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              done ? p.color : active ? `${p.color} opacity-60` : "bg-slate-200 dark:bg-slate-700",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function StudentLecturesPage() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data, isLoading, error } = useApiQuery<ListResponse>(
    ["student", "lectures"],
    "/api/iscarb/lecture/student/list",
  );

  const versions = data?.versions ?? [];

  // Separate not-started, in-progress and completed for clearer grouping
  const notStarted = versions.filter((v) => v.completedSlides === 0);
  const inProgress = versions.filter(
    (v) => v.completedSlides > 0 && v.completedSlides < (v.slideCount || 20),
  );
  const completed = versions.filter(
    (v) => v.completedSlides >= (v.slideCount || 20),
  );

  const hasAny = versions.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={ar ? "محاضراتي" : "My Lectures"}
        description={
          ar
            ? "كل محاضرة تأخذك من السؤال إلى الإتقان — تعلّم، تدرّب، ثم أثبت فهمك."
            : "Each lecture takes you from question to mastery — learn, practice, then prove it."
        }
      />

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-6 text-sm text-red-600">
            {ar ? "حدث خطأ أثناء جلب المحاضرات" : "Failed to load lectures"} —{" "}
            {error.message}
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!isLoading && !error && !hasAny && (
        <Card className="border-2 border-dashed border-border/80 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-14 text-center">
            <div className="mb-4 rounded-full bg-[#0F7B8A]/10 p-5 text-[#0F7B8A]">
              <BookOpen className="h-12 w-12" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">
              {ar ? "لا توجد محاضرات منشورة بعد" : "No published lectures yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {ar
                ? "ستظهر هنا المحاضرات بعد نشرها من أعضاء هيئة التدريس."
                : "Lectures will appear here once published by your faculty."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── In Progress — highest priority ───────────────────────────────── */}
      {!isLoading && !error && inProgress.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            <Flame className="h-4 w-4" />
            {ar ? "استأنف التعلم" : "Continue Learning"}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((lec) => (
              <LectureCard key={lec.id} lec={lec} ar={ar} />
            ))}
          </div>
        </section>
      )}

      {/* ── Not Started ──────────────────────────────────────────────────── */}
      {!isLoading && !error && notStarted.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <Lock className="h-4 w-4" />
            {ar ? "المحاضرات الجديدة" : "New Lectures"}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {notStarted.map((lec) => (
              <LectureCard key={lec.id} lec={lec} ar={ar} />
            ))}
          </div>
        </section>
      )}

      {/* ── Completed ────────────────────────────────────────────────────── */}
      {!isLoading && !error && completed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            {ar ? "أتممتها" : "Completed"}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((lec) => (
              <LectureCard key={lec.id} lec={lec} ar={ar} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── LectureCard ──────────────────────────────────────────────────────────────

function LectureCard({
  lec,
  ar,
}: {
  lec: StudentLectureItem;
  ar: boolean;
}) {
  const slideTotal = lec.slideCount || 20;
  const completedCount = lec.completedSlides || 0;
  const pct = Math.round((completedCount / slideTotal) * 100);
  const isComplete = completedCount >= slideTotal;
  const isNew = completedCount === 0;
  const mins = estimateMinutes(slideTotal);

  // Practice count is derived from a standard iSCARB lecture structure
  // (3 Pause&Discuss + 2 polls + 1 collaboration = 6 interactions minimum)
  const interactions = Math.max(4, Math.round(slideTotal * 0.3));
  const readinessChecks = 4; // always 4 per BRD §7

  // CTA label
  let ctaLabel: string;
  let CtaIcon: React.ElementType;
  if (isComplete) {
    ctaLabel = ar ? "مراجعة" : "Review";
    CtaIcon = RotateCcw;
  } else if (!isNew) {
    ctaLabel = ar ? "متابعة" : "Continue";
    CtaIcon = PlayCircle;
  } else {
    ctaLabel = ar ? "ابدأ التعلم" : "Start Learning";
    CtaIcon = PlayCircle;
  }

  return (
    <Link
      href={`/student/lecture/${lec.id}`}
      className="group block focus:outline-none"
    >
      <Card
        className={[
          "h-full overflow-hidden border bg-card shadow-sm",
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl",
          isComplete
            ? "border-emerald-500/30 hover:border-emerald-500/60"
            : "border-border/80 hover:border-[#0F7B8A]/50",
        ].join(" ")}
      >
        {/* Top accent bar — phase gradient */}
        <div
          className={[
            "h-1 w-full",
            isComplete
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : isNew
                ? "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500"
                : "bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A]",
          ].join(" ")}
        />

        <CardContent className="flex flex-col gap-4 p-5">
          {/* ── Header row ─────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-2">
            <Badge
              variant="outline"
              className="shrink-0 bg-muted/50 font-mono text-[10px] font-bold"
            >
              {lec.courseCode}
            </Badge>
            <StatusBadge isComplete={isComplete} isNew={isNew} ar={ar} />
          </div>

          {/* ── Title ──────────────────────────────────────────────────── */}
          <div className="space-y-0.5">
            <h3 className="font-display text-base font-bold leading-snug text-foreground line-clamp-2 transition-colors group-hover:text-[#0F7B8A]">
              {lec.courseTitle}
            </h3>
            {lec.specialty && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {lec.specialty}
              </p>
            )}
          </div>

          {/* ── Phase roadmap pips ─────────────────────────────────────── */}
          <div className="space-y-1.5">
            <PhasePips completed={completedCount} total={slideTotal} ar={ar} />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>{ar ? "البداية" : "Hook"}</span>
              <span>
                {completedCount}/{slideTotal}{" "}
                {ar ? "شرائح" : "slides"}
              </span>
              <span>{ar ? "الإتقان" : "Mastery"}</span>
            </div>
          </div>

          {/* ── What's inside ─────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/30 dark:bg-slate-800/40 p-3 border border-border/40">
            <MetaChip
              icon={<Clock className="h-3 w-3" />}
              value={`~${mins}m`}
              label={ar ? "وقت التعلم" : "Learn time"}
              ar={ar}
            />
            <MetaChip
              icon={<Zap className="h-3 w-3 text-amber-500" />}
              value={String(interactions)}
              label={ar ? "تفاعلات" : "Activities"}
              ar={ar}
            />
            <MetaChip
              icon={<BarChart3 className="h-3 w-3 text-cyan-500" />}
              value={String(readinessChecks)}
              label={ar ? "فحوصات" : "Checks"}
              ar={ar}
            />
          </div>

          {/* ── Score (if completed) ──────────────────────────────────── */}
          {lec.score !== null && isComplete && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-2">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                {ar ? "درجتك النهائية" : "Your final score"}
              </span>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                {lec.score}/100
              </span>
            </div>
          )}

          {/* ── CTA footer ────────────────────────────────────────────── */}
          <div
            className={[
              "flex items-center justify-between border-t border-border/50 pt-3 mt-auto",
            ].join(" ")}
          >
            <span className="text-[10px] text-muted-foreground">
              {new Date(lec.publishedAt).toLocaleDateString()}
            </span>
            <span
              className={[
                "flex items-center gap-1.5 text-xs font-bold transition-all",
                "opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5",
                isComplete
                  ? "text-emerald-600"
                  : "text-[#0F7B8A]",
              ].join(" ")}
            >
              <CtaIcon className="h-3.5 w-3.5" />
              {ctaLabel}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function StatusBadge({
  isComplete,
  isNew,
  ar,
}: {
  isComplete: boolean;
  isNew: boolean;
  ar: boolean;
}) {
  if (isComplete) {
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[10px] font-bold text-emerald-600 shrink-0">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {ar ? "مكتملة" : "Completed"}
      </Badge>
    );
  }
  if (!isNew) {
    return (
      <Badge className="border-amber-500/30 bg-amber-500/15 text-[10px] font-bold text-amber-600 shrink-0">
        {ar ? "قيد التقدم" : "In Progress"}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px] text-muted-foreground shrink-0"
    >
      {ar ? "جديدة" : "New"}
    </Badge>
  );
}

function MetaChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  ar: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-xs font-bold text-foreground">{value}</span>
      </div>
      <span className="text-[9px] text-muted-foreground leading-none">
        {label}
      </span>
    </div>
  );
}
