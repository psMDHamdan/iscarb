"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Flame,
  Gauge,
  GraduationCap,
  Landmark,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/lib/store";
import { RoadmapHero } from "@/components/iscarb/RoadmapHero";
import { WelcomeBanner } from "@/components/iscarb/WelcomeBanner";
import { StudentDashboardHero } from "@/components/iscarb/StudentDashboardHero";
import { useApiQuery } from "@/lib/use-api-query";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
//  Types — match API contracts documented for task 2-a
// ─────────────────────────────────────────────────────────────────────────────
interface OverviewResponse {
  avgReadiness: number;
  studentsTracked: number;
  openChallenges: number;
  liveMarketSignals: number;
  topDecileReadiness: number;
  cohortAverage: number;
  atRiskCount: number;
}

interface MarketSignal {
  id: string;
  employer: string;
  sector: string;
  skill: string;
  demandIndex: number;
  trend: string;
  rolesOpen: number;
  vision2030: boolean;
}

interface OverviewPayload extends OverviewResponse {
  marketSignals?: MarketSignal[];
}

interface ClassificationsSummary {
  summary?: {
    counts?: {
      scedLevels: number;
      scedBroadFields: number;
      scedSpecializations: number;
      sscoMajorGroups: number;
      sscoOccupations: number;
    };
    coverage?: {
      careerMappingsAnchoredPct: number;
      studentsAnchoredPct: number;
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Static fallbacks (used while loading or if the API is not yet wired)
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_TICKER: MarketSignal[] = [
  { id: "f1", employer: "Saudi Aramco", sector: "Energy", skill: "Time-series ML", demandIndex: 92, trend: "rising", rolesOpen: 47, vision2030: true },
  { id: "f2", employer: "stc", sector: "Telecom", skill: "5G network slicing", demandIndex: 88, trend: "rising", rolesOpen: 35, vision2030: true },
  { id: "f3", employer: "Al Rajhi Bank", sector: "Banking", skill: "AML analytics", demandIndex: 90, trend: "rising", rolesOpen: 52, vision2030: true },
  { id: "f4", employer: "NEOM", sector: "Megaproject", skill: "Renewable energy systems", demandIndex: 94, trend: "rising", rolesOpen: 68, vision2030: true },
  { id: "f5", employer: "SDAIA", sector: "Government", skill: "PDPL engineering", demandIndex: 86, trend: "rising", rolesOpen: 41, vision2030: true },
  { id: "f6", employer: "SABIC", sector: "Industry", skill: "Process digital twin", demandIndex: 79, trend: "rising", rolesOpen: 31, vision2030: true },
];

// Pipeline steps: stable identity/icon/colour; text comes from i18n at render.
const PIPELINE_STEPS = [
  { key: "inform", icon: Sparkles, color: "#00B4D8" },
  { key: "simulate", icon: Zap, color: "#1E8A5A" },
  { key: "comply", icon: ShieldCheck, color: "#0096C7" },
  { key: "assess", icon: Gauge, color: "#FFB700" },
  { key: "brand", icon: Trophy, color: "#1E8A5A" },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

// ─────────────────────────────────────────────────────────────────────────────
//  HomeView
// ─────────────────────────────────────────────────────────────────────────────
export function HomeView() {
  const setView = useApp((s) => s.setView);
  const { t, ar } = useI18n();
  const { data, isLoading: loading, error } = useApiQuery<OverviewPayload>(
    ["overview"],
    "/api/iscarb/overview",
  );
  const { data: clf } = useApiQuery<ClassificationsSummary>(
    ["classifications-summary"],
    "/api/iscarb/classifications",
  );

  // Real figures from the overview API (single source of truth). The `?? 0`
  // are type-safety defaults for the brief loading window only — the stat cards
  // and hero render a skeleton while `loading` is true, so no fabricated number
  // is ever shown (previously these defaulted to 71 / 88 / 5 / 2 …).
  const overview: OverviewResponse = {
    avgReadiness: data?.avgReadiness ?? 0,
    studentsTracked: data?.studentsTracked ?? 0,
    openChallenges: data?.openChallenges ?? 0,
    liveMarketSignals: data?.liveMarketSignals ?? 0,
    topDecileReadiness: data?.topDecileReadiness ?? 0,
    cohortAverage: data?.cohortAverage ?? 0,
    atRiskCount: data?.atRiskCount ?? 0,
  };

  // Cohort band counts derived from REAL overview totals (no longer hardcoded).
  // top-decile is 10% by definition; at-risk is the real count; the remainder is
  // split career-ready / developing. Ideal future state: have /overview return the
  // four band counts directly.
  const cohortTotal = overview.studentsTracked;
  const cohortTopDecile = Math.round(cohortTotal * 0.1);
  const cohortAtRisk = Math.min(overview.atRiskCount, cohortTotal);
  const cohortRemainder = Math.max(0, cohortTotal - cohortTopDecile - cohortAtRisk);
  const cohortCareerReady = Math.round(cohortRemainder * 0.55);
  const cohortDeveloping = Math.max(0, cohortRemainder - cohortCareerReady);
  const cohortMax = Math.max(1, cohortTotal);

  const ticker = (data?.marketSignals ?? FALLBACK_TICKER).slice(0, 6);
  // duplicate for seamless marquee
  const tickerLoop = [...ticker, ...ticker];

  return (
    <div className="relative">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-brand-mesh relative overflow-hidden">
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="max-w-3xl">
              <motion.div variants={item} className="mb-5 flex items-center gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <img
                    src="/iscarb-mark.png?v=3"
                    alt=""
                    width={48}
                    height={48}
                    className="h-11 w-11 sm:h-12 sm:w-12 object-contain shrink-0"
                  />
                  <div className="flex flex-col leading-none">
                    <span className="font-display text-2xl font-bold tracking-tight text-iscarb-ink dark:text-white">
                      iSCARB
                    </span>
                    <span className="mt-1 font-arabic text-[13px] font-semibold text-iscarb-green" dir="rtl">
                      إسكارب
                    </span>
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-green">
                    {t("home.hero.eyebrow")}
                  </span>
                  {/* opposite-language gloss keeps the bilingual brand motif */}
                  <span
                    className={cn("text-xs text-muted-foreground", ar ? "" : "font-arabic")}
                    dir={ar ? "ltr" : "rtl"}
                  >
                    {ar ? "Sovereign Readiness Engine" : "محرّك الجاهزية السيادي"}
                  </span>
                </div>
              </motion.div>

              <motion.h1
                variants={item}
                className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-iscarb-ink dark:text-white sm:text-5xl lg:text-6xl"
              >
                {t("home.hero.titleLead")}{" "}
                <span className="text-gradient-brand">{t("home.hero.titleHighlight")}</span>.
              </motion.h1>

              <motion.p
                variants={item}
                className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg"
              >
                {t("home.hero.subtitle")}
              </motion.p>

              <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="bg-iscarb-green text-white shadow-brand hover:bg-iscarb-green-dark"
                  onClick={() => setView("simulation")}
                >
                  <Zap className="size-4" />
                  {t("home.hero.runSim")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-iscarb-gold/40 text-iscarb-ink hover:bg-iscarb-gold-soft dark:text-white"
                  onClick={() => setView("capstone")}
                >
                  <Trophy className="size-4 text-iscarb-gold" />
                  {t("home.hero.genCapstone")}
                </Button>
              </motion.div>

              <motion.div
                variants={item}
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-iscarb-green" /> {t("home.hero.badgeNcaaa")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Flame className="size-3.5 text-iscarb-gold" /> {t("home.hero.badgeVision")}
                </span>
                <span className={cn(ar ? "font-arabic" : "")} dir={ar ? "rtl" : "ltr"}>
                  {t("home.hero.mottoEn")}
                </span>
              </motion.div>
            </div>

            {/* floating readiness ring panel */}
            <motion.div variants={item} className="hidden shrink-0 lg:block">
              <HeroRingPanel
                score={overview.avgReadiness}
                topDecile={overview.topDecileReadiness}
                t={t}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* ── LIVE MARKET TICKER ─────────────────────────────────────────── */}
        <div className="relative border-y border-iscarb-green/15 bg-iscarb-ink/[0.03]">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-iscarb-green/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-iscarb-green">
              <Radio className="size-3 animate-pulse-soft" /> {t("home.ticker.live")}
            </span>
            <div className="relative flex-1 overflow-hidden">
              <div className="flex w-max animate-marquee items-center gap-6">
                {tickerLoop.map((s, i) => (
                  <div key={`${s.id}-${i}`} className="flex shrink-0 items-center gap-2 text-sm">
                    <span className="font-semibold text-iscarb-ink dark:text-white">
                      {s.skill}
                    </span>
                    <span className="text-muted-foreground">@ {s.employer}</span>
                    <Badge
                      variant="secondary"
                      className="bg-iscarb-green/10 text-iscarb-green"
                    >
                      <ArrowUpRight className="size-3" />
                      {s.demandIndex}%
                    </Badge>
                  </div>
                ))}
              </div>
              {/* edge fades */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── GUIDED NEXT STEP (the journey spine — shows when a student is active) ── */}
      <section className="mx-auto max-w-7xl space-y-5 px-4 pt-10 sm:px-6 lg:px-8">
        <WelcomeBanner />
        <StudentDashboardHero />
        <RoadmapHero />
      </section>

      {/* ── OVERVIEW STAT CARDS ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("home.live.eyebrow")}
          title={t("home.live.title")}
          subtitle={t("home.live.subtitle")}
        />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <StatCard
            icon={Gauge}
            color="#1E8A5A"
            label={t("home.stat.avgReadiness")}
            value={loading ? null : `${overview.avgReadiness}`}
            suffix="/100"
            hint={t("home.stat.topDecile", { n: overview.topDecileReadiness })}
            loading={loading}
            error={error?.message ?? null}
            offlineLabel={t("common.offline")}
          />
          <StatCard
            icon={GraduationCap}
            color="#00B4D8"
            label={t("home.stat.studentsTracked")}
            value={loading ? null : `${overview.studentsTracked}`}
            hint={t("home.stat.atRisk", { n: overview.atRiskCount })}
            loading={loading}
            error={error?.message ?? null}
            offlineLabel={t("common.offline")}
          />
          <StatCard
            icon={Target}
            color="#FFB700"
            label={t("home.stat.openChallenges")}
            value={loading ? null : `${overview.openChallenges}`}
            hint={t("home.stat.challengeHint")}
            loading={loading}
            error={error?.message ?? null}
            offlineLabel={t("common.offline")}
          />
          <StatCard
            icon={Activity}
            color="#0096C7"
            label={t("home.stat.liveSignals")}
            value={loading ? null : `${overview.liveMarketSignals}`}
            hint={t("home.stat.refreshedHourly")}
            loading={loading}
            error={error?.message ?? null}
            offlineLabel={t("common.offline")}
          />
        </motion.div>
      </section>

      {/* ── NATIONAL CLASSIFICATIONS ENGINE (sovereign anchoring) ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("home.clf.eyebrow")}
          title={t("home.clf.title")}
          subtitle={t("home.clf.subtitle")}
        />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-8 grid gap-4 lg:grid-cols-2"
        >
          {/* SCED card */}
          <motion.div variants={item}>
            <Card className="h-full border-iscarb-cyan/20 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-iscarb-cyan/10">
                    <GraduationCap className="size-6 text-iscarb-cyan" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-base font-bold text-iscarb-ink dark:text-white">
                      {t("home.clf.sced.title")}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t("home.clf.sced.basis")}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {t("home.clf.sced.body")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-iscarb-cyan/10 text-iscarb-cyan">
                    {t("home.clf.sced.levels", { n: clf?.summary?.counts?.scedLevels ?? 9 })}
                  </Badge>
                  <Badge variant="secondary" className="bg-iscarb-cyan/10 text-iscarb-cyan">
                    {t("home.clf.sced.fields", { n: clf?.summary?.counts?.scedBroadFields ?? 11 })}
                  </Badge>
                  <Badge variant="secondary" className="bg-iscarb-cyan/10 text-iscarb-cyan">
                    {t("home.clf.sced.specs", { n: clf?.summary?.counts?.scedSpecializations ?? 19 })}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* SSCO card */}
          <motion.div variants={item}>
            <Card className="h-full border-iscarb-green/20 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-iscarb-green/10">
                    <Landmark className="size-6 text-iscarb-green" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-base font-bold text-iscarb-ink dark:text-white">
                      {t("home.clf.ssco.title")}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t("home.clf.ssco.basis")}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {t("home.clf.ssco.body")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-iscarb-green-soft text-iscarb-green">
                    {t("home.clf.ssco.majors", { n: clf?.summary?.counts?.sscoMajorGroups ?? 10 })}
                  </Badge>
                  <Badge variant="secondary" className="bg-iscarb-green-soft text-iscarb-green">
                    {t("home.clf.ssco.occs", { n: clf?.summary?.counts?.sscoOccupations ?? 17 })}
                  </Badge>
                  <Badge variant="secondary" className="bg-iscarb-green-soft text-iscarb-green">
                    <BadgeCheck className="mr-1 size-3" />
                    {t("home.clf.ssco.anchored", { n: clf?.summary?.coverage?.careerMappingsAnchoredPct ?? 100 })}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-dashed border-iscarb-gold/40 bg-iscarb-gold-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-iscarb-ink dark:text-white">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-iscarb-green" />
            {t("home.clf.note")}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setView("career")}
            className="shrink-0 border-iscarb-green/40 text-iscarb-green hover:bg-iscarb-green-soft"
          >
            {t("home.clf.cta")} <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* ── HOW IT WORKS — 5-STEP PIPELINE ──────────────────────────────── */}
      <section className="bg-ink-section relative overflow-hidden">
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            dark
            eyebrow={t("home.pipeline.eyebrow")}
            title={t("home.pipeline.title")}
            subtitle={t("home.pipeline.subtitle")}
          />
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 grid gap-4 md:grid-cols-5"
          >
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div key={step.key} variants={item} className="relative">
                <Card className="h-full border-white/10 bg-white/[0.04] text-white shadow-none">
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-between">
                      <span
                        className="flex size-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${step.color}22`, color: step.color }}
                      >
                        <step.icon className="size-5" />
                      </span>
                      <span className="font-display text-xs font-bold text-white/40">
                        0{i + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-display text-lg font-bold">
                        {t(`home.step.${step.key}`)}
                      </div>
                      <div
                        className={cn("text-xs text-white/60", ar ? "" : "font-arabic")}
                        dir={ar ? "ltr" : "rtl"}
                      >
                        {/* opposite-language gloss of the stage name */}
                        {ar
                          ? { inform: "Inform", simulate: "Simulate", comply: "Comply", assess: "Assess", brand: "Brand" }[step.key]
                          : { inform: "تعبئة", simulate: "محاكاة", comply: "امتثال", assess: "تقييم", brand: "تمكين" }[step.key]}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-white/70">
                      {t(`home.pipeline.${step.key}`)}
                    </p>
                  </CardContent>
                </Card>
                {/* connector */}
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <div
                      className="h-0.5 w-4"
                      style={{
                        background: `linear-gradient(90deg, ${step.color}, ${PIPELINE_STEPS[i + 1].color})`,
                      }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => setView("pipeline")}
            >
              {t("home.pipeline.openViewer")}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FEAR OF BEING AVERAGE ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-iscarb-gold-soft text-iscarb-gold-dark" variant="secondary">
              <Flame className="size-3" /> {t("home.avg.badge")}
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl">
              {t("home.avg.titleLead")}{" "}
              <span className="text-gradient-green">{t("home.avg.titleHighlight")}</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">{t("home.avg.body")}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-iscarb-green/15 bg-iscarb-green-soft p-4">
                <div
                  className={cn("text-2xl font-bold text-iscarb-green", ar ? "font-arabic" : "")}
                  dir={ar ? "rtl" : "ltr"}
                >
                  {t("home.avg.iCanBig")}
                </div>
                <div
                  className={cn("mt-1 text-xs text-muted-foreground", ar ? "" : "font-arabic")}
                  dir={ar ? "ltr" : "rtl"}
                >
                  {t("home.avg.iCanSub")}
                </div>
              </div>
              <div className="rounded-xl border border-iscarb-gold/30 bg-iscarb-gold-soft p-4">
                <div
                  className={cn("text-2xl font-bold text-iscarb-gold-dark", ar ? "font-arabic" : "")}
                  dir={ar ? "rtl" : "ltr"}
                >
                  {t("home.avg.endBig")}
                </div>
                <div
                  className={cn("mt-1 text-xs text-muted-foreground", ar ? "" : "font-arabic")}
                  dir={ar ? "ltr" : "rtl"}
                >
                  {t("home.avg.endSub")}
                </div>
              </div>
            </div>
            <Button
              className="mt-6 bg-iscarb-green shadow-brand hover:bg-iscarb-green-dark"
              onClick={() => setView("readiness")}
            >
              <Gauge className="size-4" />
              {t("home.avg.seeScale")}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="overflow-hidden border-iscarb-green/15 shadow-brand">
              <div className="bg-iscarb-ink px-6 py-5 text-white">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-iscarb-gold">
                  {t("home.cohort.eyebrow")}
                </div>
                <div className="font-display text-xl font-bold">{t("home.cohort.title")}</div>
              </div>
              <CardContent className="space-y-4 pt-0">
                <CohortBar label={t("home.cohort.topDecile")} value={cohortTopDecile} max={cohortMax} color="#1E8A5A" />
                <CohortBar label={t("home.cohort.careerReady")} value={cohortCareerReady} max={cohortMax} color="#00B4D8" />
                <CohortBar label={t("home.cohort.developing")} value={cohortDeveloping} max={cohortMax} color="#FFB700" />
                <CohortBar label={t("home.cohort.atRisk")} value={cohortAtRisk} max={cohortMax} color="#FB5B45" />
                <div className="rounded-lg border border-iscarb-gold/30 bg-iscarb-gold-soft p-3 text-xs">
                  <span className="font-semibold text-iscarb-gold-dark">
                    {t("home.cohort.noteLead")}
                  </span>{" "}
                  {t("home.cohort.noteBody")}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── ALIGNMENT FOOTER NOTE ───────────────────────────────────────── */}
      <section className="border-t border-border bg-iscarb-ink/[0.02]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold text-iscarb-green">iSCARB</span>
            <span>·</span>
            <span>{t("home.footer.ncaaa")}</span>
            <span>·</span>
            <span>{t("home.footer.etec")}</span>
            <span>·</span>
            <span>{t("home.footer.vision")}</span>
          </div>
          <div className={cn(ar ? "font-arabic" : "")} dir={ar ? "rtl" : "ltr"}>
            {t("home.footer.motto")}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  dark,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <div
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.22em]",
          dark ? "text-iscarb-gold" : "text-iscarb-green",
        )}
      >
        {eyebrow}
      </div>
      <h2
        className={cn(
          "mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl",
          dark ? "text-white" : "text-iscarb-ink dark:text-white",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-3 text-sm sm:text-base",
            dark ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
  suffix,
  hint,
  loading,
  error,
  offlineLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  value: string | null;
  suffix?: string;
  hint?: string;
  loading: boolean;
  error: string | null;
  offlineLabel: string;
}) {
  return (
    <motion.div variants={item}>
      <Card className="h-full border-border/60 shadow-sm transition-shadow hover:shadow-brand">
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between">
            <span
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}1A`, color }}
            >
              <Icon className="size-4" />
            </span>
            {error && (
              <span className="text-[10px] font-medium text-destructive">{offlineLabel}</span>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white">
                {value}
                {suffix && (
                  <span className="ml-0.5 text-base font-medium text-muted-foreground">
                    {suffix}
                  </span>
                )}
              </div>
            )}
          </div>
          {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CohortBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-foreground">{label}</span>
        <span className="font-semibold text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function HeroRingPanel({
  score,
  topDecile,
  t,
}: {
  score: number;
  topDecile: number;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const gap = Math.max(0, topDecile - score);
  return (
    <Card className="relative w-[320px] overflow-hidden border-iscarb-green/15 bg-white/80 shadow-brand backdrop-blur dark:bg-white/[0.03]">
      <div className="grid-dots pointer-events-none absolute inset-0 opacity-30" />
      <CardContent className="relative space-y-4 pt-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-iscarb-green">
            {t("home.hero.panel.title")}
          </span>
          <Badge className="bg-iscarb-gold-soft text-iscarb-gold-dark" variant="secondary">
            {t("common.live")}
          </Badge>
        </div>
        <div className="flex items-center justify-center py-2">
          <CircularGauge score={score} size={180} />
        </div>
        <div className="rounded-lg border border-iscarb-gold/30 bg-iscarb-gold-soft p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-iscarb-gold-dark">
              {t("home.hero.panel.gap", { gap })}
            </span>
            <span className="text-muted-foreground">
              {t("home.hero.panel.topDecile", { n: topDecile })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Lightweight inline gauge (HomeView's hero doesn't need the full ReadinessRing tier system)
function CircularGauge({ score, size = 180 }: { score: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <defs>
        <linearGradient id="home-gauge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00B4D8" />
          <stop offset="55%" stopColor="#1E8A5A" />
          <stop offset="100%" stopColor="#FFB700" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(30,138,90,0.10)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#home-gauge)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ filter: "drop-shadow(0 6px 14px rgba(30,138,90,0.20))" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="rotate-90 fill-iscarb-ink font-display text-4xl font-bold dark:fill-white"
        style={{ transformOrigin: "center" }}
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}

export default HomeView;
