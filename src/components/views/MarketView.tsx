"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Building2, Flame, Radio, Sparkles, Target, TrendingUp, TrendingDown,
  Users, Zap, Briefcase, MapPin, Landmark, LineChart as LineChartIcon,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useApiQuery } from "@/lib/use-api-query";

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
interface MarketSignal {
  id: string; skill: string; demandIndex: number; trend: string; rolesOpen: number;
  vision2030: boolean; heat: number; capturedAt: string;
}
interface EmployerGroup {
  employer: string; sector: string; signals: MarketSignal[]; totalRolesOpen: number;
  avgHeat: number; vision2030: boolean;
}
interface TopSkill {
  skill: string; demandIndex: number; rolesOpen: number; trend: string; employerCount: number;
}
interface MarketResponse {
  employers: EmployerGroup[]; topSkills: TopSkill[]; totalSignals: number; totalEmployers: number;
}
interface StudentBrief {
  id: string; name: string; program: string; cohort: string; readinessScore: number;
}
interface StudentsResponse { students: StudentBrief[] }

interface JobMatch {
  job: {
    id: string; title: string; titleAr: string | null; employer: string; sector: string;
    sscoCode: string | null; vision2030: boolean; location: string | null; skills: string[];
  };
  matchScore: number; sscoScore: number; compositeScore: number; skillsScore: number; vision2030Bonus: number;
}
interface JobsResponse { matches: JobMatch[]; studentSkills: string[]; total: number }

interface ForecastPoint { year: number; projectedIndex: number }
interface SkillForecast {
  skill: string; sector: string; currentIndex: number; trend: string; vision2030: boolean;
  points: ForecastPoint[]; outlook: "accelerating" | "growing" | "steady" | "cooling";
}
interface ForecastResponse {
  forecasts: SkillForecast[]; scopedToSector: string | null; matchedFromCluster: string | null;
  horizon: { from: number; to: number }; methodologyNote: string;
}

const FALLBACK_TOP: TopSkill[] = [
  { skill: "Time-series ML", demandIndex: 92, rolesOpen: 47, trend: "rising", employerCount: 3 },
  { skill: "AML analytics", demandIndex: 90, rolesOpen: 52, trend: "rising", employerCount: 2 },
  { skill: "PDPL engineering", demandIndex: 88, rolesOpen: 41, trend: "rising", employerCount: 2 },
  { skill: "5G network slicing", demandIndex: 87, rolesOpen: 35, trend: "rising", employerCount: 1 },
  { skill: "Renewable energy systems", demandIndex: 86, rolesOpen: 68, trend: "rising", employerCount: 2 },
  { skill: "Process digital twin", demandIndex: 84, rolesOpen: 31, trend: "rising", employerCount: 1 },
  { skill: "Credit risk modeling", demandIndex: 81, rolesOpen: 28, trend: "stable", employerCount: 2 },
  { skill: "ESG reporting", demandIndex: 78, rolesOpen: 22, trend: "rising", employerCount: 2 },
  { skill: "NLP Arabic dialect", demandIndex: 76, rolesOpen: 19, trend: "rising", employerCount: 1 },
  { skill: "Cloud FinOps", demandIndex: 73, rolesOpen: 25, trend: "stable", employerCount: 1 },
];

function matchColor(score: number): string {
  if (score >= 80) return "bg-iscarb-green text-white";
  if (score >= 60) return "bg-iscarb-green-soft text-iscarb-green border border-iscarb-green/30";
  if (score >= 40) return "bg-iscarb-gold-soft text-iscarb-gold-dark border border-iscarb-gold/40";
  return "bg-muted text-muted-foreground border border-border";
}

const OUTLOOK_STYLE: Record<string, string> = {
  accelerating: "bg-iscarb-green text-white",
  growing: "bg-iscarb-green-soft text-iscarb-green-dark",
  steady: "bg-iscarb-cyan-soft text-iscarb-cyan-dark",
  cooling: "bg-muted text-muted-foreground",
};
const OUTLOOK_LABEL: Record<string, { en: string; ar: string }> = {
  accelerating: { en: "Accelerating", ar: "متسارع" },
  growing: { en: "Growing", ar: "نامٍ" },
  steady: { en: "Steady", ar: "مستقر" },
  cooling: { en: "Cooling", ar: "متباطئ" },
};

// ─────────────────────────────────────────────────────────────────────────────
//  MarketView — "Saudi Labor Market" (merges the former Market Intelligence +
//  Job Match views into 3 tabs: Demand / Open Roles / My Fit). The R&D review
//  flagged two issues this rewrite fixes:
//    1. Two separate nav doors for what is really one labor-market question.
//    2. "What this means for you" fabricated a student's skills from an
//       if/else on their PROGRAM NAME (deriveStudentSkills) instead of their
//       real evidenced skills — now reads studentSkills from /api/iscarb/jobs,
//       which derives it from the actual CareerMapping + evaluated projects.
// ─────────────────────────────────────────────────────────────────────────────
export function MarketView() {
  const { ar } = useI18n();
  const { selectedStudentId, setSelectedStudent } = useApp();
  const [tab, setTab] = useState("demand");

  const { data: marketData, isLoading: marketLoading, error: marketError } =
    useApiQuery<MarketResponse>(["market"], "/api/iscarb/market");
  const { data: studentsData, isLoading: studentsLoading, error: studentsError } =
    useApiQuery<StudentsResponse>(["students"], "/api/iscarb/students");
  const { data: jobsData, isLoading: jobsLoading } = useApiQuery<JobsResponse>(
    ["jobs", selectedStudentId ?? ""],
    `/api/iscarb/jobs?studentId=${selectedStudentId}`,
    { enabled: !!selectedStudentId },
  );
  const { data: forecastData } = useApiQuery<ForecastResponse>(
    ["market-forecast", selectedStudentId ?? ""],
    `/api/iscarb/market/forecast${selectedStudentId ? `?studentId=${selectedStudentId}` : ""}`,
  );

  const employers = marketData?.employers ?? [];
  const topSkills = marketData?.topSkills ?? FALLBACK_TOP;
  const students = studentsData?.students ?? [];

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const tickerSkills = topSkills.length >= 4 ? topSkills : FALLBACK_TOP;

  // REAL skills (from CareerMapping + evaluated projects, via /api/iscarb/jobs)
  // — replaces the old keyword-on-program-name fabrication.
  const studentSkills = jobsData?.studentSkills ?? [];
  const demandMatches = useMemo(() => {
    if (!selectedStudent || !studentSkills.length) return [];
    const norm = (s: string) => s.trim().toLowerCase();
    const have = new Set(studentSkills.map(norm));
    const out: { skill: string; employer: string; demandIndex: number; sector: string }[] = [];
    for (const emp of employers) {
      for (const sig of emp.signals) {
        if (have.has(norm(sig.skill))) {
          out.push({ skill: sig.skill, employer: emp.employer, demandIndex: sig.demandIndex, sector: emp.sector });
        }
      }
    }
    return out.sort((a, b) => b.demandIndex - a.demandIndex).slice(0, 6);
  }, [selectedStudent, studentSkills, employers]);

  const matches = jobsData?.matches ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header totalSignals={marketData?.totalSignals} totalEmployers={marketData?.totalEmployers} ar={ar} />

      <TickerTape skills={tickerSkills} loading={marketLoading} ar={ar} />

      {(marketError || studentsError) && (
        <div className="alert-iron mb-6 mt-4 rounded-lg p-3 text-xs text-destructive">
          {marketError && <div>{L(ar, "Could not load live market board — showing the last known snapshot.", "تعذّر تحميل لوحة السوق الحيّة — يُعرض آخر لقطة معروفة.")}</div>}
          {studentsError && <div>{L(ar, "Could not load students — the \"My Fit\" tab is hidden.", "تعذّر تحميل الطلاب — تبويب \"فرصي\" مخفي.")}</div>}
        </div>
      )}

      {/* Student picker — shared across all 3 tabs */}
      <Card className="mb-5 border-iscarb-green/15">
        <CardContent className="flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:items-center">
          <Avatar className="size-10 border-2 border-iscarb-green/20">
            <AvatarFallback className="bg-iscarb-green-soft text-xs font-bold text-iscarb-green">
              {selectedStudent ? selectedStudent.name.split(" ").map((p) => p[0]).slice(0, 2).join("") : "—"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {L(ar, "Pick a student to see open roles and personal fit", "اختر طالباً لعرض الوظائف المتاحة ودرجة توافقه")}
            </label>
            <Select
              value={selectedStudentId ?? "__none__"}
              onValueChange={(v) => setSelectedStudent(v === "__none__" ? null : v)}
              disabled={studentsLoading}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder={L(ar, "No student selected — pick one", "لا يوجد طالب مختار — اختر واحداً")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{L(ar, "— No student —", "— بلا طالب —")}</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-semibold">{s.name}</span>
                    <span className="ml-1 text-xs text-muted-foreground">· {s.program} · {s.readinessScore}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="demand"><TrendingUp className="me-1.5 size-3.5" />{L(ar, "Demand", "الطلب")}</TabsTrigger>
          <TabsTrigger value="roles"><Briefcase className="me-1.5 size-3.5" />{L(ar, "Open Roles", "الوظائف")}</TabsTrigger>
          <TabsTrigger value="fit"><Target className="me-1.5 size-3.5" />{L(ar, "My Fit", "فرصي")}</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: DEMAND ──────────────────────────────────────────────── */}
        <TabsContent value="demand" className="space-y-6">
          <Card className="border-iscarb-cyan/15 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-iscarb-cyan" />
                  {L(ar, "Trending — top 10 skills by demand index", "الأكثر طلباً — أعلى 10 مهارات حسب مؤشر الطلب")}
                </span>
                <Badge variant="secondary" className="bg-iscarb-green-soft text-iscarb-green">
                  {topSkills.length} {L(ar, "skills", "مهارة")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {marketLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSkills.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                      <CartesianGrid stroke="rgba(14,42,34,0.08)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="skill" width={140} tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(30,138,90,0.06)" }}
                        contentStyle={{ borderRadius: 10, border: "1px solid rgba(30,138,90,0.2)", background: "rgba(255,255,255,0.96)", fontSize: 12 }}
                        formatter={(value: number) => [`${value}%`, L(ar, "Demand", "الطلب")]}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Bar dataKey="demandIndex" radius={[6, 6, 6, 6]}>
                        {topSkills.slice(0, 10).map((entry, i) => (
                          <Cell key={entry.skill + i} fill={brandFillForIndex(i, topSkills.slice(0, 10).length)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forecast — predictive layer (P2): model-based, never claimed as AI prediction. */}
          {forecastData && forecastData.forecasts.length > 0 && (
            <Card className="border-iscarb-gold/20 shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <LineChartIcon className="size-4 text-iscarb-gold-dark" />
                  {L(ar, `Demand outlook ${forecastData.horizon.from}–${forecastData.horizon.to}`, `توقّع الطلب ${forecastData.horizon.from}–${forecastData.horizon.to}`)}
                  {forecastData.matchedFromCluster && (
                    <Badge variant="outline" className="ms-1 text-[10px]">{forecastData.matchedFromCluster}</Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{L(ar, "Model-based projection from each skill's current trend — directional, not an exact forecast.", "إسقاط مبني على نموذج وفق اتجاه كل مهارة الحالي — اتجاهي وليس تنبؤاً دقيقاً.")}</p>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-4">
                {forecastData.forecasts.slice(0, 6).map((f) => {
                  const end = f.points[f.points.length - 1]?.projectedIndex ?? f.currentIndex;
                  return (
                    <div key={f.skill} className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-iscarb-ink dark:text-white">{f.skill}</div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{f.currentIndex}%</span>
                          {end > f.currentIndex ? <TrendingUp className="size-3 text-iscarb-green" /> : <TrendingDown className="size-3 text-muted-foreground" />}
                          <span className="font-semibold text-iscarb-ink dark:text-white">{end}%</span>
                          <span>· {forecastData.horizon.to}</span>
                        </div>
                      </div>
                      <Badge className={OUTLOOK_STYLE[f.outlook]}>{L(ar, OUTLOOK_LABEL[f.outlook].en, OUTLOOK_LABEL[f.outlook].ar)}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold tracking-tight text-iscarb-ink dark:text-white">
                {L(ar, "Employer signal board", "لوحة إشارات أصحاب العمل")}
              </h2>
              <span className="text-xs text-muted-foreground">{employers.length} {L(ar, "employers · live", "جهة عمل · حيّ")}</span>
            </div>
            {marketLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
              </div>
            ) : employers.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-10 text-center text-sm text-muted-foreground">
                {L(ar, "No market signals yet.", "لا توجد إشارات سوق بعد.")}
              </CardContent></Card>
            ) : (
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              >
                {employers.map((emp) => <EmployerCard key={emp.employer} emp={emp} ar={ar} />)}
              </motion.div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-xl bg-iscarb-ink text-white shadow-brand">
            <div className="grid-dots pointer-events-none absolute inset-0 opacity-10" />
            <div className="relative flex flex-col items-start justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Flame className="mt-0.5 size-5 text-iscarb-gold" />
                <div>
                  <div className="text-sm font-semibold">{L(ar, "If your skills aren't on this board, neither is your job offer.", "إن لم تكن مهاراتك على هذه اللوحة، فلن يكون عرض عملك كذلك.")}</div>
                  <div className="text-xs text-white/70">{L(ar, "Stop polishing the CV. Go build the skills the board is paying for.", "توقف عن تلميع السيرة الذاتية. اذهب وابنِ المهارات التي تدفع اللوحة مقابلها.")}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-arabic text-sm font-bold text-iscarb-gold" dir="rtl">نهاية كل الأعذار</div>
                <div className="text-[10px] uppercase tracking-wider text-white/60">The end of all excuses</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: OPEN ROLES ──────────────────────────────────────────── */}
        <TabsContent value="roles">
          <RolesTab matches={matches} loading={jobsLoading} hasStudent={!!selectedStudentId} ar={ar} />
        </TabsContent>

        {/* ── TAB 3: MY FIT ──────────────────────────────────────────────── */}
        <TabsContent value="fit">
          <Card className="overflow-hidden border-iscarb-green/20 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Target className="size-4 text-iscarb-green" />
                  {L(ar, "What this means for you", "ماذا يعني هذا لك")}
                </span>
                {selectedStudent && <Badge variant="outline" className="border-iscarb-gold/40 text-iscarb-gold-dark">{selectedStudent.program}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {!selectedStudent ? (
                <div className="rounded-lg border border-dashed border-border/70 bg-card p-6 text-center text-sm text-muted-foreground">
                  {L(ar, "Pick a student above and we will highlight which of their REAL evidenced skills are in demand at which employer.", "اختر طالباً أعلاه وسنبرز أيّ مهاراته الموثَّقة فعلياً مطلوبة لدى أيّ صاحب عمل.")}
                </div>
              ) : jobsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : studentSkills.length === 0 ? (
                <div className="alert-iron rounded-lg p-4 text-sm text-destructive">
                  <div className="font-semibold">
                    {L(ar, `${selectedStudent.name}: no evidenced skills yet.`, `${selectedStudent.name}: لا توجد مهارات موثَّقة بعد.`)}
                  </div>
                  <div className="mt-0.5 text-xs text-destructive/80">
                    {L(ar, "Generate a capstone or evaluate a project to start building verifiable skill evidence.", "ولّد مشروع تخرّج أو قيّم مشروعاً لبدء بناء دليل مهارات قابل للتحقق.")}
                  </div>
                </div>
              ) : demandMatches.length === 0 ? (
                <div className="alert-iron rounded-lg p-4 text-sm text-destructive">
                  <div className="font-semibold">
                    {L(ar, `${selectedStudent.name}: none of your evidenced skills match the live demand board.`, `${selectedStudent.name}: لا توجد مهارة موثَّقة لديك تطابق لوحة الطلب الحيّة.`)}
                  </div>
                  <div className="mt-0.5 text-xs text-destructive/80">
                    {L(ar, "This is the worst signal a portfolio can send. Close the gap before the next recruitment cycle.", "هذه أسوأ إشارة يمكن أن يرسلها الملف. أغلق الفجوة قبل دورة التوظيف القادمة.")}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {demandMatches.map((m, i) => (
                    <motion.div
                      key={m.skill + m.employer + i}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="rounded-lg border border-iscarb-green/30 bg-iscarb-green-soft/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-iscarb-green">{L(ar, "Your skill wanted at", "مهارتك مطلوبة لدى")}</div>
                          <div className="mt-0.5 text-sm font-bold text-iscarb-ink dark:text-white">{m.employer}</div>
                          <div className="text-xs text-muted-foreground">{m.skill} · {m.sector}</div>
                        </div>
                        <Badge className="bg-iscarb-green text-white">{m.demandIndex}% {L(ar, "demand", "طلب")}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {selectedStudent && matches[0] && (
                <div className="rounded-lg border border-iscarb-cyan/30 bg-iscarb-cyan-soft/30 p-3 text-sm">
                  <span className="font-semibold text-iscarb-cyan-dark">{matches[0].matchScore}%</span>{" "}
                  {L(ar, `best overall job match: ${ar && matches[0].job.titleAr ? matches[0].job.titleAr : matches[0].job.title} at ${matches[0].job.employer}.`, `أفضل تطابق وظيفي شامل: ${matches[0].job.titleAr ?? matches[0].job.title} لدى ${matches[0].job.employer}.`)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function Header({ totalSignals, totalEmployers, ar }: { totalSignals?: number; totalEmployers?: number; ar: boolean }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-iscarb-green">
        <Radio className="size-3.5 animate-pulse-soft" />
        {L(ar, "Saudi Labor Market — Live Intelligence", "سوق العمل السعودي — ذكاء حيّ")}
      </div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-iscarb-ink dark:text-white sm:text-4xl">
        {L(ar, "The board employers are hiring against —", "اللوحة التي يوظّف عليها أصحاب العمل —")}{" "}
        <span className="text-gradient-brand">{L(ar, "right now.", "الآن.")}</span>
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        {L(
          ar,
          "Real demand signals, open roles, and your personal fit — one board, not three. If a skill is not here, you should not be studying it.",
          "إشارات طلب حقيقية ووظائف متاحة ودرجة توافقك الشخصي — لوحة واحدة لا ثلاث. إن لم تكن المهارة هنا، فلا تدرسها.",
        )}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
        {typeof totalSignals === "number" && (
          <Badge variant="outline" className="border-iscarb-cyan/30 text-iscarb-cyan"><Zap className="size-3" /> {totalSignals} {L(ar, "live signals", "إشارة حيّة")}</Badge>
        )}
        {typeof totalEmployers === "number" && (
          <Badge variant="outline" className="border-iscarb-green/30 text-iscarb-green"><Building2 className="size-3" /> {totalEmployers} {L(ar, "employers", "جهة عمل")}</Badge>
        )}
      </div>
    </div>
  );
}

function TickerTape({ skills, loading, ar }: { skills: TopSkill[]; loading: boolean; ar: boolean }) {
  const tape = [...skills, ...skills];
  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border border-iscarb-green/20 bg-iscarb-ink text-white shadow-brand">
      <div className="flex items-center">
        <div className="flex shrink-0 items-center gap-2 border-r border-white/15 bg-iscarb-green/20 px-4 py-2.5">
          <Radio className="size-4 animate-pulse-soft text-iscarb-gold" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{L(ar, "Live", "حيّ")}</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {loading ? (
            <div className="flex gap-3 px-4 py-2.5 text-xs text-white/60">{L(ar, "Loading live signals…", "جارٍ تحميل الإشارات الحيّة…")}</div>
          ) : (
            <div className="flex w-max animate-marquee items-center gap-6 px-4 py-2.5">
              {tape.map((s, i) => (
                <div key={s.skill + i} className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="font-semibold text-iscarb-gold">{s.skill}</span>
                  <span className="text-white/50">·</span>
                  <span className="text-white/80">{s.demandIndex}% {L(ar, "demand", "طلب")} · {s.rolesOpen} {L(ar, "roles", "وظيفة")}</span>
                  {s.trend === "rising" && <TrendingUp className="size-3 text-iscarb-cyan" />}
                </div>
              ))}
            </div>
          )}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-iscarb-ink to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-iscarb-ink to-transparent" />
        </div>
      </div>
    </div>
  );
}

function EmployerCard({ emp, ar }: { emp: EmployerGroup; ar: boolean }) {
  const top3 = emp.signals.slice(0, 3);
  const initials = emp.employer.replace(/[^A-Za-z0-9 ]/g, "").split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
      <Card className="group h-full border-iscarb-green/15 transition-all hover:border-iscarb-green/35 hover:shadow-brand">
        <CardContent className="flex h-full flex-col gap-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl font-display text-lg font-bold text-white shadow-brand" style={{ background: "linear-gradient(135deg,#00B4D8 0%,#1E8A5A 60%,#FFB700 100%)" }} aria-hidden>
                {initials || emp.employer[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-display text-base font-bold text-iscarb-ink dark:text-white">{emp.employer}</div>
                <Badge variant="outline" className="mt-0.5 border-iscarb-cyan/30 text-[10px] text-iscarb-cyan">{emp.sector}</Badge>
              </div>
            </div>
            {emp.vision2030 && <Badge className="shrink-0 bg-iscarb-gold text-white"><Sparkles className="size-3" />V2030</Badge>}
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{L(ar, "Market heat", "حرارة السوق")}</span>
              <span className="text-iscarb-ink dark:text-white">{emp.avgHeat}/100</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${Math.max(6, Math.min(100, emp.avgHeat))}%`, background: "linear-gradient(90deg,#00B4D8,#1E8A5A 55%,#FFB700)" }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{L(ar, "Top 3 in-demand skills", "أعلى 3 مهارات مطلوبة")}</div>
            {top3.map((s, i) => (
              <div key={s.id ?? s.skill + i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-iscarb-ink dark:text-white">{s.skill}</span>
                  <span className="font-display font-bold text-iscarb-ink dark:text-white">{s.demandIndex}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(6, Math.min(100, s.demandIndex))}%`, background: "linear-gradient(90deg,#00B4D8 0%,#FFB700 100%)" }} />
                </div>
              </div>
            ))}
            {top3.length === 0 && <div className="text-xs text-muted-foreground">{L(ar, "No live signals for this employer.", "لا إشارات حيّة لهذه الجهة.")}</div>}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="size-3.5" />{emp.totalRolesOpen} {L(ar, "open roles", "وظيفة شاغرة")}</span>
            <span className="flex items-center gap-1.5 text-iscarb-green"><TrendingUp className="size-3.5" />{emp.signals[0]?.trend ?? "stable"}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RolesTab({ matches, loading, hasStudent, ar }: { matches: JobMatch[]; loading: boolean; hasStudent: boolean; ar: boolean }) {
  const { t } = useI18n();
  if (!hasStudent) {
    return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{L(ar, "Pick a student above to see ranked open roles.", "اختر طالباً أعلاه لعرض الوظائف المتاحة المرتَّبة.")}</CardContent></Card>;
  }
  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">{t("jobs.weights")}</p>
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-28 w-full rounded-xl" /><Skeleton className="h-28 w-full rounded-xl" /></div>
      ) : matches.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t("jobs.empty")}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <Card key={m.job.id}>
              <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
                <div>
                  <CardTitle className="text-base">{ar && m.job.titleAr ? m.job.titleAr : m.job.title}</CardTitle>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-iscarb-ink dark:text-white">{m.job.employer}</span>
                    <span>· {m.job.sector}</span>
                    {m.job.location && <span className="inline-flex items-center gap-0.5"><MapPin className="size-3" />{m.job.location}</span>}
                    {m.job.vision2030 && <Badge variant="secondary" className="bg-iscarb-green-soft text-iscarb-green">{t("jobs.vision2030")}</Badge>}
                  </div>
                  {m.job.sscoCode && (
                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-iscarb-green">
                      <Landmark className="size-3" /> {t("jobs.ssco", { code: m.job.sscoCode })}
                    </div>
                  )}
                </div>
                <div className={`shrink-0 rounded-lg px-3 py-1.5 text-center ${matchColor(m.matchScore)}`}>
                  <div className="text-lg font-bold leading-none">{m.matchScore}%</div>
                  <div className="text-[10px] opacity-80">{t("jobs.match")}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex flex-wrap gap-1">{m.job.skills.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                  <Factor label={t("jobs.factor.ssco")} value={m.sscoScore} />
                  <Factor label={t("jobs.factor.composite")} value={m.compositeScore} />
                  <Factor label={t("jobs.factor.skills")} value={m.skillsScore} />
                  <Factor label={t("jobs.factor.vision")} value={m.vision2030Bonus} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Factor({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
      <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-muted"><div className="h-full bg-iscarb-cyan" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function brandFillForIndex(i: number, total: number): string {
  const t = total <= 1 ? 0 : i / (total - 1);
  const palette = ["#00B4D8", "#0096C7", "#1E8A5A", "#FFB700"];
  if (t < 0.33) return palette[0];
  if (t < 0.5) return palette[1];
  if (t < 0.8) return palette[2];
  return palette[3];
}

export default MarketView;
