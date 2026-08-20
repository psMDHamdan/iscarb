"use client";

import { useState } from "react";
import {
  Sparkles, Coins, Briefcase, Trophy, ChevronDown, ArrowRight, Bot, Flame, TrendingUp, TrendingDown,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useApiQuery } from "@/lib/use-api-query";
import { ReadinessRing } from "@/components/iscarb/ReadinessRing";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import * as Icons from "lucide-react";
import type { ViewId } from "@/lib/store";

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

interface DashboardJob {
  id: string;
  title: string;
  titleAr: string | null;
  employer: string;
  matchScore: number;
}
interface DashboardAchievement {
  label: string;
  source: string;
  at: string;
  valueDelta: number;
}
interface DashboardBadge {
  code: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  earned: boolean;
}
interface DashboardResponse {
  student: { id: string; name: string; readinessScore: number };
  healthScore: number;
  mapping: { generatedTitle: string; titleAr: string | null } | null;
  ledger: { estimatedValue: number; equityScore: number };
  topJobs: DashboardJob[];
  recentAchievements: DashboardAchievement[];
  agent: { name: string; persona: string; lastNudge: string | null } | null;
  streakDays: number;
  trajectory: { points: { date: string; value: number }[]; growthPercent: number };
  nextStep: {
    stageKey: string;
    titleEn: string;
    titleAr: string;
    ctaEn: string;
    ctaAr: string;
    view: string;
    tab?: string;
  } | null;
  gamification: {
    points: number;
    level: { code: string; nameEn: string; nameAr: string };
    badges: DashboardBadge[];
    totalAvailable: number;
  };
}

/** Tiny dependency-free sparkline for the value trajectory. */
function Sparkline({ points, positive }: { points: { value: number }[]; positive: boolean }) {
  if (points.length < 2) return null;
  const w = 120;
  const h = 36;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((p.value - min) / span) * h).toFixed(1)}`)
    .join(" ");
  const stroke = positive ? "var(--iscarb-green, #16a34a)" : "#dc2626";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PERSONA_COLOR: Record<string, string> = {
  challenger: "border-iscarb-gold/30 bg-iscarb-gold-soft/40",
  coach: "border-iscarb-green/30 bg-iscarb-green-soft/40",
  scout: "border-iscarb-cyan/30 bg-iscarb-cyan-soft/40",
};

/**
 * The Home "Student Dashboard" (P0 fix): before this component existed, Home
 * was a marketing/overview page with no single place answering "where do I
 * stand right now" — a student (or an investor watching over their shoulder)
 * had to visit Readiness, Equity, Jobs, and Agent separately to piece it
 * together. ONE call to /api/iscarb/dashboard now answers it: a Health Score,
 * the equity SAR value, the top job match, the most recent win, the agent's
 * last nudge, and the gamification layer. Renders nothing without a selected
 * student (RoadmapHero/WelcomeBanner own that empty state already).
 */
export function StudentDashboardHero() {
  const { ar } = useI18n();
  const selectedStudentId = useApp((s) => s.selectedStudentId);
  const setView = useApp((s) => s.setView);
  const { data } = useApiQuery<DashboardResponse>(
    ["dashboard", selectedStudentId ?? ""],
    `/api/iscarb/dashboard?studentId=${selectedStudentId}`,
    { enabled: !!selectedStudentId },
  );
  const [showAllBadges, setShowAllBadges] = useState(false);

  if (!selectedStudentId || !data) return null;

  const go = (view: ViewId) => setView(view);
  const earnedBadges = data.gamification.badges.filter((b) => b.earned);
  const personaClass = data.agent ? PERSONA_COLOR[data.agent.persona] ?? PERSONA_COLOR.coach : PERSONA_COLOR.coach;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Health Score */}
        <div className="flex flex-col items-center gap-2 lg:w-[180px] lg:shrink-0">
          <ReadinessRing
            score={data.healthScore}
            size={140}
            stroke={10}
            label={L(ar, "Health Score", "مؤشر الجاهزية")}
            showAverageZone={false}
          />
          <Badge className="bg-iscarb-ink text-white">
            {ar ? data.gamification.level.nameAr : data.gamification.level.nameEn}
          </Badge>
        </div>

        {/* Identity + value + jobs */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-iscarb-ink dark:text-white">
              {L(ar, `Hi ${data.student.name.split(" ")[0]}`, `مرحباً ${data.student.name.split(" ")[0]}`)}
            </h2>
            {data.mapping && (
              <p className="text-sm text-muted-foreground">{ar ? data.mapping.titleAr ?? data.mapping.generatedTitle : data.mapping.generatedTitle}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-iscarb-gold-soft text-iscarb-gold-dark"><Coins className="size-4" /></div>
              <div>
                <div className="text-sm font-bold text-iscarb-ink dark:text-white">{Math.round(data.ledger.estimatedValue).toLocaleString(ar ? "ar-SA" : "en-US")} {L(ar, "SAR/yr", "ريال/سنة")}</div>
                <div className="text-[11px] text-muted-foreground">{L(ar, "Your modeled market value", "قيمتك السوقية المُقدَّرة")}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-iscarb-cyan-soft text-iscarb-cyan-dark"><Trophy className="size-4" /></div>
              <div>
                <div className="text-sm font-bold text-iscarb-ink dark:text-white">{data.gamification.points} {L(ar, "pts", "نقطة")}</div>
                <div className="text-[11px] text-muted-foreground">{earnedBadges.length}/{data.gamification.totalAvailable} {L(ar, "badges", "شارة")}</div>
              </div>
            </div>

            {/* Streak (P0-1): real activity streak, prominent with a break-fear cue. */}
            <div className="flex items-center gap-2">
              <div className={`flex size-8 items-center justify-center rounded-lg ${data.streakDays >= 3 ? "bg-iscarb-gold-soft text-iscarb-gold-dark" : "bg-muted text-muted-foreground"}`}>
                <Flame className="size-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-iscarb-ink dark:text-white">
                  {data.streakDays > 0
                    ? L(ar, `${data.streakDays}-day streak`, `${data.streakDays} ${data.streakDays === 1 ? "يوم" : "أيام"} متتالية`)
                    : L(ar, "Start a streak", "ابدأ سلسلة")}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {data.streakDays >= 3
                    ? L(ar, "Don't break it!", "لا تكسرها!")
                    : data.streakDays > 0
                      ? L(ar, "Keep it going today", "واصلها اليوم")
                      : L(ar, "Act today to begin", "ابدأ بنشاط اليوم")}
                </div>
              </div>
            </div>

            {/* Growth trajectory (P0-3): sparkline + % change this term. */}
            {data.trajectory.points.length >= 2 && (
              <div className="flex items-center gap-2">
                <Sparkline points={data.trajectory.points} positive={data.trajectory.growthPercent >= 0} />
                <div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${data.trajectory.growthPercent >= 0 ? "text-iscarb-green-dark" : "text-red-600"}`}>
                    {data.trajectory.growthPercent >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {data.trajectory.growthPercent >= 0 ? "+" : ""}{data.trajectory.growthPercent}%
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {data.trajectory.growthPercent >= 0
                      ? L(ar, "value this term", "قيمتك هذا الفصل")
                      : L(ar, "dropped — review gaps", "انخفضت — راجع فجواتك")}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top job match */}
          {data.topJobs[0] && (
            <button
              onClick={() => go("market")}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-iscarb-green/20 bg-iscarb-green-soft/30 p-3 text-start transition hover:bg-iscarb-green-soft/50"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 shrink-0 text-iscarb-green-dark" />
                <span className="text-sm">
                  <strong>{data.topJobs[0].matchScore}%</strong> {L(ar, "تطابق:", "match:")} {ar ? data.topJobs[0].titleAr ?? data.topJobs[0].title : data.topJobs[0].title} · {data.topJobs[0].employer}
                </span>
              </div>
              <ArrowRight className="size-4 shrink-0 text-iscarb-green-dark rtl:rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Next step CTA (P1-6): the single most relevant action, from the roadmap. */}
      {data.nextStep && (
        <button
          onClick={() => go(data.nextStep!.view as ViewId)}
          className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl border-2 border-iscarb-gold/50 bg-iscarb-gold-soft/30 p-3 text-start transition hover:bg-iscarb-gold-soft/50"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-iscarb-gold-dark">
              👉 {L(ar, "Your next step", "خطوتك التالية")}
            </div>
            <div className="truncate text-sm font-semibold text-iscarb-ink dark:text-white">
              {ar ? data.nextStep.titleAr : data.nextStep.titleEn}
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-iscarb-gold px-3 py-1.5 text-xs font-semibold text-white">
            {ar ? data.nextStep.ctaAr : data.nextStep.ctaEn}
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </span>
        </button>
      )}

      {/* Last nudge */}
      {data.agent?.lastNudge && (
        <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 ${personaClass}`}>
          <Bot className="mt-0.5 size-4 shrink-0" />
          <div>
            <div className="text-xs font-semibold">{data.agent.name}</div>
            <p className="text-sm" dir="auto">{data.agent.lastNudge}</p>
          </div>
        </div>
      )}

      {/* Recent achievement + badges */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {data.recentAchievements[0] && (
          <div className="rounded-xl border border-border/60 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="size-3" />{L(ar, "Most recent", "آخر نشاط")}
            </div>
            <p className="text-sm" dir="auto">{data.recentAchievements[0].label}</p>
          </div>
        )}

        <Collapsible open={showAllBadges} onOpenChange={setShowAllBadges}>
          <div className="rounded-xl border border-border/60 p-3">
            <CollapsibleTrigger className="flex w-full items-center justify-between text-start">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Trophy className="size-3" />{L(ar, "Badges earned", "الشارات المكتسبة")}
              </span>
              <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${showAllBadges ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {earnedBadges.length === 0 ? (
                <span className="text-xs text-muted-foreground">{L(ar, "Keep going — your first badge is close.", "استمر — شارتك الأولى قريبة.")}</span>
              ) : (
                earnedBadges.slice(0, showAllBadges ? undefined : 6).map((b) => {
                  const Icon = (Icons as unknown as Record<string, typeof Sparkles>)[b.icon] ?? Sparkles;
                  return (
                    <span
                      key={b.code}
                      title={ar ? b.nameAr : b.nameEn}
                      className={`flex size-7 items-center justify-center rounded-full ${
                        b.tier === "gold" ? "bg-iscarb-gold-soft text-iscarb-gold-dark" : b.tier === "silver" ? "bg-slate-200 text-slate-600" : "bg-iscarb-cyan-soft text-iscarb-cyan-dark"
                      }`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                  );
                })
              )}
            </div>
            <CollapsibleContent>
              {earnedBadges.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-border/40 pt-2">
                  {earnedBadges.map((b) => (
                    <p key={b.code} className="text-xs text-muted-foreground">{ar ? b.nameAr : b.nameEn}</p>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}

export default StudentDashboardHero;
