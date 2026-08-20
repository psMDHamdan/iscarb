"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  Target,
  Brain,
  Sparkles,
  ArrowRight,
  Calendar,
  BookOpen,
  Zap,
  BarChart3,
  RefreshCw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Star,
  Flag,
  FileText,
  GraduationCap,
  XCircle,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface AssessmentStats {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  overallScore: number;
  competencyScore: number;
  careerReadiness: number;
  topStrengths: string[];
  topWeaknesses: string[];
}

interface RecentAssessment {
  id: string;
  title: string;
  score: number | null;
  submittedAt: string | null;
  status: string;
  competency: string;
}

interface UpcomingDeadline {
  id: string;
  title: string;
  daysRemaining: number;
  type: string;
  priority: "high" | "medium" | "low";
}

interface AssessmentOverview {
  stats: AssessmentStats;
  recentAssessments: RecentAssessment[];
  upcomingDeadlines: UpcomingDeadline[];
  monthlyScores: { month: string; score: number; count: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  trend?: "up" | "down" | "stable";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:shadow-md hover:ring-iscarb-green/20 dark:bg-gray-900 dark:ring-gray-800"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-iscarb-ink dark:text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AssessmentOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "assessment", "overview"],
    "/api/v1/student/assessment/overview",
  );
  const data = rawRes?.data ?? rawRes as AssessmentOverview | null;
  const error = queryError?.message ?? null;

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <StudentPageTemplate title={ar ? "نظرة عامة على التقييم" : "Assessment Overview"}>
        <LoadingSkeleton ar={ar} />
      </StudentPageTemplate>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <StudentPageTemplate title={ar ? "نظرة عامة على التقييم" : "Assessment Overview"}>
        <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <h3 className="text-lg font-semibold">{ar ? "خطأ في التحميل" : "Error loading"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />{ar ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      </StudentPageTemplate>
    );
  }

  const d = data as any;
  if (!d) {
    return (
      <StudentPageTemplate title={ar ? "نظرة عامة على التقييم" : "Assessment Overview"}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{ar ? "لا توجد بيانات" : "No data available"}</h3>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />{ar ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      </StudentPageTemplate>
    );
  }
  const s = d?.stats;
  const totalAssessments = s?.total ?? 0;

  return (
    <StudentPageTemplate title={ar ? "نظرة عامة على التقييم" : "Assessment Overview"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* AI Daily Brief */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-iscarb-green/10 via-emerald-50/50 to-white p-5 ring-1 ring-iscarb-green/20 dark:from-iscarb-green/5 dark:via-emerald-900/10 dark:to-gray-900"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-iscarb-green p-2.5">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-iscarb-ink dark:text-white">
                {ar ? "ملخص التقييمات" : "Assessment Summary"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {ar
                  ? `لديك ${totalAssessments} تقييم · ${s?.passed ?? 0} ناجح · ${s?.failed ?? 0} يحتاج تحسيناً`
                  : `${totalAssessments} total · ${s?.passed ?? 0} passed · ${s?.failed ?? 0} needs improvement`}
              </p>
            </div>
            <Badge className="rounded-lg bg-iscarb-green/20 text-iscarb-green-dark text-xs font-medium">
              {ar ? "الدرجة الكلية" : "Overall"}: {s?.overallScore ?? 0}%
            </Badge>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Award}
            label={ar ? "إجمالي التقييمات" : "Total Assessments"}
            value={String(totalAssessments)}
            sub={ar ? "مكتمل ومعلق" : "Completed & pending"}
            color="bg-violet-500"
          />
          <StatCard
            icon={CheckCircle2}
            label={ar ? "ناجح" : "Passed"}
            value={String(s?.passed ?? 0)}
            sub={ar ? "استوفى الحد الأدنى" : "Met threshold"}
            color="bg-emerald-500"
          />
          <StatCard
            icon={Clock}
            label={ar ? "معلق" : "Pending"}
            value={String(s?.pending ?? 0)}
            sub={ar ? "لم يتم التقديم بعد" : "Not yet submitted"}
            color="bg-amber-500"
          />
          <StatCard
            icon={Brain}
            label={ar ? "الكفاءات" : "Competencies"}
            value={`${s?.competencyScore ?? 0}%`}
            sub={ar ? "درجة الكفاءة" : "Competency score"}
            color="bg-sky-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Performance Chart */}
          <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-iscarb-green" />
                {ar ? "الأداء الشهري" : "Monthly Performance"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-56">
                {(d?.monthlyScores?.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d?.monthlyScores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {(d?.monthlyScores ?? []).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {ar ? "لا توجد بيانات كافية" : "Not enough data"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Strengths / Weaknesses */}
          <div className="space-y-4">
            <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Star className="h-4 w-4 text-emerald-500" />
                  {ar ? "أقوى المهارات" : "Top Strengths"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {s?.topStrengths?.length ? (
                  s.topStrengths.slice(0, 4).map((str, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-emerald-50/50 p-2 text-xs dark:bg-emerald-900/10">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{str}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {ar ? "لا توجد بيانات كافية" : "Not enough data"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4 text-amber-500" />
                  {ar ? "مهارات تحتاج تحسيناً" : "Needs Improvement"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {s?.topWeaknesses?.length ? (
                  s.topWeaknesses.slice(0, 4).map((w, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-amber-50/50 p-2 text-xs dark:bg-amber-900/10">
                      <Target className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span>{w}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {ar ? "لا توجد بيانات كافية" : "Not enough data"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent & Upcoming */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Assessments */}
          <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-iscarb-green" />
                {ar ? "آخر التقييمات" : "Recent Assessments"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {d?.recentAssessments?.length ? (
                d.recentAssessments.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "-"}</span>
                        {a.competency && <Badge variant="outline" className="rounded-md text-[10px]">{a.competency}</Badge>}
                      </div>
                    </div>
                    <div className="ml-3 text-right">
                      <Badge className={`rounded-lg text-xs ${
                        a.status === "SCORED" && (a.score ?? 0) >= 70
                          ? "bg-emerald-100 text-emerald-700"
                          : a.status === "SCORED"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {a.score !== null ? `${a.score}%` : a.status.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {ar ? "لا توجد تقييمات حديثة" : "No recent assessments"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4 text-amber-500" />
                {ar ? "المواعيد القادمة" : "Upcoming Deadlines"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {d?.upcomingDeadlines?.length ? (
                d.upcomingDeadlines.slice(0, 5).map((dl) => (
                  <div
                    key={dl.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{dl.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="rounded-md text-[10px]">{dl.type}</Badge>
                      </div>
                    </div>
                    <Badge className={`rounded-lg text-xs font-medium ${
                      dl.daysRemaining <= 1
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : dl.daysRemaining <= 3
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {dl.daysRemaining === 0
                        ? ar ? "اليوم" : "Today"
                        : dl.daysRemaining < 0
                        ? ar ? "متأخر" : "Overdue"
                        : `${dl.daysRemaining}d`}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {ar ? "لا توجد مواعيد قادمة" : "No upcoming deadlines"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentPageTemplate>
  );
}
