"use client";

import { useState, useMemo } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Target,
  Brain,
  Star,
  BarChart3,
  Download,
  FileText,
  Lightbulb,
  ArrowRight,
  Share2,
  Bot,
  User,
  Clock,
  ChevronRight,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { useApp } from "@/lib/store";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface ResultItem {
  submission: { id: string; status: string; startedAt: string; submittedAt: string | null; timeSpent: number; attemptNumber?: number };
  assessment?: { id: string; title: string };
  scoring: { totalScore: number; maxScore: number; percentageScore: number; band: string; passed: boolean };
  breakdown: { criterion: string; weight: number; score: number; maxScore: number; feedback: string }[];
  aiAnalysis: { strengths: string[]; improvements: string[]; nextSteps: string[] };
  competencyMapping?: { competency: string; score: number; level: string }[];
  facultyFeedback?: string;
  improvementPlan?: string[];
}

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(2)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    </div>
  );
}

// Single result detail view
function ResultDetail({ data, ar }: { data: ResultItem; ar: boolean }) {
  const sc = data.scoring;
  const radarData = data.breakdown?.map(b => ({
    criterion: b.criterion,
    score: b.maxScore > 0 ? (b.score / b.maxScore) * 100 : 0,
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Score Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-8 text-center ring-1 ${sc.passed
          ? "bg-gradient-to-br from-emerald-500/10 to-green-50/50 ring-emerald-500/20"
          : "bg-gradient-to-br from-red-500/10 to-orange-50/50 ring-red-500/20"
          }`}
      >
        <div className="mb-2">
          {sc.passed
            ? <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            : <AlertCircle className="mx-auto h-12 w-12 text-red-500" />}
        </div>
        <h2 className="text-sm font-medium text-muted-foreground mb-1">
          {data.assessment?.title || (ar ? "النتيجة النهائية" : "Final Score")}
        </h2>
        <div className={`text-6xl font-bold ${sc.passed ? "text-emerald-600" : "text-red-600"}`}>
          {sc.percentageScore}%
        </div>
        <div className="mt-2 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <span>{sc.totalScore}/{sc.maxScore} {ar ? "نقطة" : "points"}</span>
          <Badge className={`rounded-lg ${sc.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
            {sc.passed ? (ar ? "ناجح" : "PASSED") : (ar ? "راسب" : "FAILED")}
          </Badge>
          <Badge variant="outline" className="rounded-lg">{ar ? "الدرجة" : "Grade"}: {sc.band}</Badge>
        </div>
        {data.submission.timeSpent > 0 && (
          <p className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />{data.submission.timeSpent} {ar ? "دقيقة" : "minutes"}
          </p>
        )}
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg text-xs">
            <Download className="mr-1 h-3 w-3" />{ar ? "تقرير" : "Report"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg text-xs">
            <Share2 className="mr-1 h-3 w-3" />{ar ? "مشاركة" : "Share"}
          </Button>
        </div>
      </motion.div>

      {/* Score Breakdown + Radar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-iscarb-green" />
              {ar ? "تفصيل النتائج" : "Score Breakdown"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {data.breakdown?.map((b, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{b.criterion}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{b.score}/{b.maxScore}</span>
                    <span className="text-muted-foreground">({b.weight}%)</span>
                  </div>
                </div>
                <Progress value={b.maxScore > 0 ? (b.score / b.maxScore) * 100 : 0} className="h-2" />
                {b.feedback && <p className="mt-1 text-[10px] text-muted-foreground">{b.feedback}</p>}
              </div>
            ))}
            {!data.breakdown?.length && (
              <p className="text-xs text-muted-foreground py-4 text-center">{ar ? "لا تفاصيل متاحة" : "No breakdown available"}</p>
            )}
          </CardContent>
        </Card>

        {radarData.length > 0 && (
          <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-iscarb-green" />
                {ar ? "الملف المهاري" : "Skill Profile"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Analysis */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Star className="h-4 w-4 text-emerald-500" />
              {ar ? "نقاط القوة" : "Strengths"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.aiAnalysis?.strengths?.length ? data.aiAnalysis.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-emerald-50/50 p-2.5 text-xs dark:bg-emerald-900/10">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>{s}</span>
              </div>
            )) : <p className="text-xs text-muted-foreground">{ar ? "لا توجد بيانات" : "No data"}</p>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-amber-500" />
              {ar ? "مجالات التحسين" : "Areas to Improve"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.aiAnalysis?.improvements?.length ? data.aiAnalysis.improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50/50 p-2.5 text-xs dark:bg-amber-900/10">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>{imp}</span>
              </div>
            )) : <p className="text-xs text-muted-foreground">{ar ? "لا توجد بيانات" : "No data"}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Faculty Feedback */}
      {data.facultyFeedback && (
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-blue-500" />
              {ar ? "ملاحظات عضو هيئة التدريس" : "Faculty Feedback"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{data.facultyFeedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {ar ? "الخطوات التالية" : "Recommended Next Steps"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data.improvementPlan ?? data.aiAnalysis?.nextSteps ?? []).map((step, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-iscarb-green/20 text-xs font-bold text-iscarb-green">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Results list view
function ResultsList({ results, ar, onSelect }: { results: ResultItem[]; ar: boolean; onSelect: (r: ResultItem) => void }) {
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <motion.div key={r.submission.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <Card
            className="group cursor-pointer rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-iscarb-green/20 dark:bg-gray-900 dark:ring-gray-800"
            onClick={() => onSelect(r)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${r.scoring.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>
                {r.scoring.percentageScore}%
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold truncate">{r.assessment?.title || (ar ? "التقييم" : "Assessment")}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{r.submission.submittedAt ? new Date(r.submission.submittedAt).toLocaleDateString() : "-"}</span>
                  <span>·</span>
                  <span>{r.scoring.band} {ar ? "درجة" : "grade"}</span>
                  {r.submission.timeSpent > 0 && (
                    <><span>·</span><span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{r.submission.timeSpent}m</span></>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`rounded-lg text-xs ${r.scoring.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {r.scoring.passed ? (ar ? "ناجح" : "Passed") : (ar ? "راسب" : "Failed")}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-iscarb-green transition-colors" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AssessmentResultsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [singleResultId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("id");
  });
  const [selectedResult, setSelectedResult] = useState<ResultItem | null>(null);

  const { data: singleRes, isLoading: singleLoading } = useApiQuery<any>(
    ["student", "assessment", singleResultId ?? "none", "results"],
    `/api/v1/student/assessment/${singleResultId ?? "none"}/results`,
    { enabled: !!singleResultId },
  );
  const { data: listRes, isLoading: listLoading, error: listError } = useApiQuery<any>(
    ["student", "assessment", "results"],
    "/api/v1/student/assessment/results",
    { enabled: !singleResultId },
  );

  const singleResult = singleRes?.data ?? singleRes ?? null;
  const resultsList = useMemo(() => listRes?.data ?? [], [listRes]);
  const loading = singleResultId ? singleLoading : listLoading;
  const error = listError?.message ?? null;

  const displayResult = singleResult || selectedResult;

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "النتائج والتغذية الراجعة" : "Results & Feedback"} />
        <div className="space-y-6 pb-12">
          <LoadingSkeleton ar={ar} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "النتائج والتغذية الراجعة" : "Results & Feedback"} />
        <div className="space-y-6 pb-12">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
            <h3 className="text-lg font-semibold">{ar ? "خطأ في التحميل" : "Error loading"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={ar ? "النتائج والتغذية الراجعة" : "Results & Feedback"} />
      <div className="space-y-6 pb-12" dir={ar ? "rtl" : "ltr"}>
        {displayResult ? (
          <>
            {/* Back button when viewing from list */}
            {!singleResult && selectedResult && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-sm"
                onClick={() => setSelectedResult(null)}
              >
                ← {ar ? "العودة إلى النتائج" : "Back to Results"}
              </Button>
            )}
            <ResultDetail data={displayResult} ar={ar} />
          </>
        ) : resultsList.length > 0 ? (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: ar ? "الإجمالي" : "Total",
                  value: resultsList.length,
                  color: "text-violet-500",
                },
                {
                  label: ar ? "ناجح" : "Passed",
                  value: resultsList.filter(r => r.scoring.passed).length,
                  color: "text-emerald-500",
                },
                {
                  label: ar ? "متوسط النتيجة" : "Avg Score",
                  value: `${Math.round(resultsList.reduce((s, r) => s + r.scoring.percentageScore, 0) / resultsList.length)}%`,
                  color: "text-blue-500",
                },
              ].map(s => (
                <Card key={s.label} className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                  <CardContent className="p-4 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ResultsList results={resultsList} ar={ar} onSelect={setSelectedResult} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">{ar ? "لا توجد نتائج بعد" : "No results yet"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar ? "أكمل بعض التقييمات لترى نتائجك هنا" : "Complete some assessments to see your results here"}
            </p>
            <Button
              className="mt-4 rounded-xl bg-iscarb-green text-white hover:bg-iscarb-green-dark"
              onClick={() => window.location.href = "/assessment/catalog"}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              {ar ? "استعرض التقييمات" : "Browse Assessments"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
