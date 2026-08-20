"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { useSession } from "@/lib/use-session";
import { clearClientToken } from "@/lib/client-auth";
import { listEmployabilityAttempts } from "@/lib/assessment/attempt-report-store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Award,
} from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

// ── Module title map ────────────────────────────────────────────────────────

const MODULE_TITLES: Record<string, string> = {
  M01: "Strategic Communication",
  M02: "Critical Thinking & Problem-Solving",
  M03: "Teamwork & Conflict Resolution",
  M04: "Adaptability & Resilience",
  M08: "Ethical Context Integration",
  M11: "Interview Mastery",
  M16: "Project Management Fundamentals",
  M18: "AI in the Workplace",
  M19: "Cybersecurity Awareness",
  M30: "SQL & Statistics",
  M37: "Programming Logic (JavaScript)",
  M38: "Software Quality (Code Review)",
  M41: "Career Adaptability",
  M46: "Career Plan & Motivation",
  M47: "Intercultural Awareness",
};

const DIMENSION_LABELS: Record<string, { en: string; ar: string }> = {
  core_professionalism: { en: "Core Professionalism", ar: "الاحتراف المهني" },
  business_digital: { en: "Business & Digital", ar: "الأعمال والرقمي" },
  job_fit: { en: "Job-Fit (Technical)", ar: "الملاءمة الوظيفية" },
  growth_potential: { en: "Growth Potential", ar: "إمكانات النمو" },
};

// ── Types ──────────────────────────────────────────────────────────────────

interface CriterionRow {
  criterion: string;
  score: number;
  max: number;
  weight?: number;
}

interface AssessmentResult {
  id: string;
  moduleCode: string;
  dimension: string;
  score: number;
  band: string;
  passed: boolean;
  feedback: string;
  createdAt: string;
  strengths?: string | string[];
  improvements?: string | string[];
  perCriterionJson?: string;
  rawResponse?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseList(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}

function parseCriteria(raw: string | undefined): CriterionRow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as CriterionRow[];
    return [];
  } catch {
    return [];
  }
}

const BAND_COLORS: Record<string, string> = {
  weak: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  developing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  proficient: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  strong: "bg-iscarb-green text-white dark:bg-iscarb-green/80",
};

// ── Expandable result card ─────────────────────────────────────────────────

function ResultCard({ res, ar, defaultCollapsed }: { res: AssessmentResult; ar: boolean; defaultCollapsed?: boolean }) {
  const [expanded, setExpanded] = useState(!(defaultCollapsed ?? false));

  const strengths = parseList(res.strengths);
  const improvements = parseList(res.improvements);
  const criteria = parseCriteria(res.perCriterionJson);
  const bandKey = (res.band ?? "weak").toLowerCase();
  const bandColor = BAND_COLORS[bandKey] ?? BAND_COLORS.weak;

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 w-full ${res.passed ? "bg-iscarb-green" : "bg-red-500"}`} />

      {/* Header (always visible) */}
      <CardHeader className="bg-gray-50/50 dark:bg-gray-900/20 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-xl flex flex-wrap items-center gap-2">
              {MODULE_TITLES[res.moduleCode] ?? res.moduleCode}
              <Badge variant="outline" className="font-mono font-normal text-xs">
                {res.moduleCode}
              </Badge>
              <Badge variant="outline" className="font-normal text-xs">
                {res.dimension.replace(/_/g, " ")}
              </Badge>
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              {new Date(res.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-display font-bold tabular-nums">
                {Math.round(res.score)}
                <span className="text-lg text-muted-foreground">%</span>
              </div>
              <div className="flex gap-2 justify-end mt-1">
                <Badge className={bandColor}>{res.band}</Badge>
                <Badge
                  className={
                    res.passed
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }
                >
                  {res.passed
                    ? ar ? "ناجح" : "Pass"
                    : ar ? "لم ينجح" : "Fail"}
                </Badge>
              </div>
            </div>

            {/* Expand toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              {expanded ? (
                <>
                  {ar ? "طي" : "Collapse"}
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  {ar ? "عرض التفاصيل" : "View Details"}
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Feedback (always visible) */}
      <CardContent className="p-6 space-y-4">
        <div>
          <h4 className="font-semibold mb-2 text-sm">
            {ar ? "الملاحظات" : "Feedback"}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border">
            {res.feedback}
          </p>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="space-y-4 pt-2">
            {/* Strengths */}
            {strengths.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm text-emerald-700 dark:text-emerald-400">
                  {ar ? "نقاط القوة" : "Strengths"}
                </h4>
                <ul className="space-y-1.5">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {improvements.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm text-amber-700 dark:text-amber-400">
                  {ar ? "نقاط التحسين" : "Areas to Improve"}
                </h4>
                <ul className="space-y-1.5">
                  {improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* User Submission */}
            {res.rawResponse && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">
                  {ar ? "إجابتك" : "Your Submission"}
                </h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/20 p-4 rounded-xl border border-muted/50">
                  {res.rawResponse}
                </div>
              </div>
            )}

            {/* Per-criterion breakdown */}
            {criteria.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-sm">
                  {ar ? "تفاصيل المعايير" : "Criterion Breakdown"}
                </h4>
                <div className="space-y-3">
                  {criteria.map((c, i) => {
                    const pct = c.max > 0 ? Math.round((c.score / c.max) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium capitalize">
                            {(c.criterion || "Unknown Criterion").replace(/_/g, " ")}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {Math.round(c.score)} / {c.max}
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          className="h-2 bg-muted"
                          indicatorClassName={
                            pct >= 60
                              ? "bg-iscarb-green"
                              : pct >= 40
                                ? "bg-amber-400"
                                : "bg-red-400"
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── ByDimensionView ────────────────────────────────────────────────────────

function ByDimensionView({ results, ar }: { results: AssessmentResult[]; ar: boolean }) {
  const grouped = useMemo(() => {
    const map = new Map<string, AssessmentResult[]>();
    for (const r of results) {
      const bucket = map.get(r.dimension) ?? [];
      bucket.push(r);
      map.set(r.dimension, bucket);
    }
    return map;
  }, [results]);

  const dimensionOrder = ["core_professionalism", "business_digital", "job_fit", "growth_potential"];

  return (
    <div className="space-y-8">
      {dimensionOrder.map((dim) => {
        const dimResults = grouped.get(dim);
        if (!dimResults || dimResults.length === 0) return null;
        const avgScore = Math.round(
          dimResults.reduce((s, r) => s + r.score, 0) / dimResults.length,
        );
        const label = DIMENSION_LABELS[dim] ?? { en: dim, ar: dim };
        return (
          <div key={dim}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{ar ? label.ar : label.en}</h2>
              <Badge className="text-sm bg-iscarb-green/10 text-iscarb-green-dark border border-iscarb-green/20">
                {ar ? "متوسط" : "Avg"}: {avgScore}%
              </Badge>
            </div>
            <div className="space-y-4">
              {dimResults.map((res) => (
                <ResultCard key={res.id} res={res} ar={ar} defaultCollapsed />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AssessmentResultsPage() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { studentId } = useSession();

  const { data: rawRes, isLoading: loadingResults, error: errResults } = useApiQuery<{
    data: AssessmentResult[];
  }>(
    ["student", "assessment", "results"],
    "/api/iscarb/assessment/responses",
  );

  const { data: rawSubs, isLoading: loadingSubs, error: errSubs } = useApiQuery<{
    data: any[];
  }>(
    ["student", "assessment", "submissions"],
    "/api/iscarb/assessment/my-submissions",
  );

  const results: AssessmentResult[] = rawRes?.data ?? [];
  const submissions: any[] = rawSubs?.data ?? [];

  const localAttempts = useMemo(() => {
    if (typeof window === "undefined" || !studentId) return [];
    const list = listEmployabilityAttempts(studentId);
    return list.map((a) => ({
      id: a.id,
      assessmentId: "employability-live",
      title: `Core Employability Assessment${a.specialization ? ` (${a.specialization})` : ''}`,
      status: "FINAL",
      score: Math.round(a.profile.composite),
      percentageScore: Math.round(a.profile.composite),
      timeLimitMinutes: 60,
      startedAt: a.computedAt,
      submittedAt: a.computedAt,
      scoredAt: a.computedAt,
    }));
  }, [studentId]);

  const scoredSubmissions = useMemo(() => {
    const map = new Map<string, any>();
    for (const s of localAttempts) {
      map.set(s.id, s);
    }
    for (const s of submissions) {
      if (s.status === 'SCORED' || s.status === 'REVIEWED' || s.status === 'FINAL' || s.status === 'COMPLETED' || s.status === 'SUBMITTED') {
        map.set(s.id, s);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [localAttempts, submissions]);
  
  const isLoading = loadingResults || loadingSubs;
  const error = errResults || errSubs;

  return (
    <>
      <PageHeader
        title={ar ? "النتائج والملاحظات" : "Results & Feedback"}
        description={
          ar
            ? "تفاصيل تقييماتك والملاحظات لتحسين الأداء"
            : "Detailed breakdown of your assessments and feedback for improvement."
        }
      />
      <div
        className="mx-auto max-w-5xl space-y-6 pb-12 px-4"
        dir={ar ? "rtl" : "ltr"}
      >
        {/* Start New Assessment */}
        <div className="flex justify-end">
          <Button
            onClick={() => (window.location.href = "/assessment/employability")}
            className="gap-2 bg-iscarb-green text-white hover:bg-iscarb-green-dark rounded-xl"
          >
            {ar ? "بدء تقييم جديد" : "Start New Assessment"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <XCircle className="mx-auto h-10 w-10 text-red-400" />
              <p className="text-red-500 font-medium">
                {String(error?.message || error).includes("Student not found")
                  ? (ar 
                      ? "انتهت صلاحية الجلسة أو تم إعادة تعيين قاعدة البيانات. يرجى تسجيل الخروج وتسجيل الدخول مرة أخرى." 
                      : "Your session is invalid (the database may have been recently reset). Please log out and log in again.")
                  : (ar ? "حدث خطأ أثناء تحميل النتائج" : "Error loading results")}
              </p>
              <p className="text-sm text-red-400 opacity-75 font-mono max-w-lg mx-auto whitespace-pre-wrap break-all">
                [Debug: {String(error?.message || error)}]
              </p>
              {String(error?.message || error).includes("Student not found") ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try { await fetch("/api/v1/auth/logout", { method: "POST" }); } catch {}
                    clearClientToken();
                    window.location.href = "/login";
                  }}
                >
                  {ar ? "تسجيل الخروج الآن" : "Log out now"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/assessment/employability")}
                >
                  {ar ? "بدء تقييم جديد" : "Start New Assessment"}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground space-y-4">
              <BarChart3 className="mx-auto h-12 w-12 opacity-20" />
              <p>{ar ? "لا توجد نتائج بعد" : "No results available yet"}</p>
              <Button
                onClick={() => (window.location.href = "/assessment/employability")}
                className="bg-iscarb-green text-white hover:bg-iscarb-green-dark rounded-xl gap-2"
              >
                {ar ? "ابدأ أول تقييم" : "Start your first assessment"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all-tests">
            <TabsList className="mb-4">
              <TabsTrigger value="all-tests">{ar ? "كل الاختبارات" : "All Tests"}</TabsTrigger>
              <TabsTrigger value="by-module">{ar ? "حسب الوحدة" : "By Module"}</TabsTrigger>
              <TabsTrigger value="by-dimension">{ar ? "حسب البُعد" : "By Dimension"}</TabsTrigger>
              <TabsTrigger value="trends">{ar ? "الاتجاهات" : "Trends"}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-tests">
              <div className="overflow-x-auto bg-card rounded-xl border border-border/50 shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/30 text-muted-foreground uppercase text-xs border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 font-semibold">{ar ? 'اسم التقييم' : 'Assessment Name'}</th>
                      <th className="px-6 py-4 font-semibold">{ar ? 'التاريخ والوقت' : 'Date & Time'}</th>
                      <th className="px-6 py-4 font-semibold text-center">{ar ? 'النتيجة' : 'Score'}</th>
                      <th className="px-6 py-4 font-semibold text-right">{ar ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {scoredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                          {ar ? 'لم تُقدّم أي تقييم بعد' : 'No tests available yet'}
                        </td>
                      </tr>
                    ) : (
                      scoredSubmissions.map((sub: any) => {
                        const score = sub.percentageScore ?? sub.score ?? 0;
                        const dateObj = sub.submittedAt ? new Date(sub.submittedAt) : null;
                        return (
                          <tr key={sub.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 font-bold text-foreground">
                              {sub.title}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                              {dateObj ? (
                                <div className="flex flex-col">
                                  <span>{dateObj.toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
                                  <span className="text-xs opacity-70">{dateObj.toLocaleTimeString(ar ? "ar-SA" : "en-US")}</span>
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant="outline" className="font-bold text-sm px-3 bg-background">
                                {score}%
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <Link href={`/student/results/${sub.id}`}>
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <FileText className="size-4 text-blue-500" />
                                    <span className="hidden sm:inline">{ar ? 'التقرير التفصيلي' : 'Detailed Report'}</span>
                                  </Button>
                                </Link>
                                
                                <Link href={`/api/iscarb/assessment/certificate?studentId=${studentId}&specialization=${encodeURIComponent(sub.title)}`} target="_blank">
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Award className="size-4 text-iscarb-gold" />
                                    <span className="hidden sm:inline">{ar ? 'الشهادة' : 'Certificate'}</span>
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="by-module">
              <div className="space-y-6">
                {results.map((res) => (
                  <ResultCard key={res.id} res={res} ar={ar} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="by-dimension">
              <ByDimensionView results={results} ar={ar} />
            </TabsContent>
            <TabsContent value="trends">
              <TrendsView ar={ar} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}

function TrendsView({ ar }: { ar: boolean }) {
  const { data, isLoading, error } = useApiQuery<any[]>("/api/iscarb/assessment/trends");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-iscarb-green" />
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>{ar ? "لا تتوفر بيانات للاتجاهات بعد" : "No trend data available yet"}</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    date: new Date(d.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US", { month: "short", day: "numeric" }),
    Composite: d.composite,
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ar ? "تطور الأداء" : "Performance Over Time"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={12} tickMargin={10} stroke="#888888" />
                <YAxis domain={[0, 100]} fontSize={12} stroke="#888888" />
                <RechartsTooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Composite"
                  name={ar ? "الدرجة المركبة" : "Composite Score"}
                  stroke="#10b981"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
