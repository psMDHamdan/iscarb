"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Minus, BarChart3, Clock, Award, Target, BookOpen, Brain, Briefcase, Star, Zap, Activity, Users } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

type Period = "week" | "month" | "semester" | "year";

const periodLabels: Record<Period, { en: string; ar: string }> = {
  week: { en: "This Week", ar: "هذا الأسبوع" },
  month: { en: "This Month", ar: "هذا الشهر" },
  semester: { en: "This Semester", ar: "هذا الفصل" },
  year: { en: "This Year", ar: "هذه السنة" },
};

export function DashboardQuickStatsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [period, setPeriod] = useState<Period>("semester");

  const { data, isLoading: loading, error } = useApiQuery<{
    data: {
      metrics: { label: string; labelAr: string; value: string; trend: number; category: string }[];
      summary: { totalStudents: number; activeCourses: number; completionRate: number; avgScore: number };
      categories: { label: string; labelAr: string; value: number; color: string; icon: string }[];
      peerComparison: { yourScore: number; avgScore: number; topScore: number; percentile: number };
    }
  }>(
    ["dashboard", "quick-stats", period],
    `/api/v1/student/dashboard/quick-stats?period=${period}`
  );

  const statsData = data?.data;

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "إحصائيات سريعة" : "Quick Stats"} description={ar ? "نظرة سريعة على أدائك الأكاديمي" : "Quick view of your academic performance"} />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-sm text-muted-foreground">{ar ? "جاري تحميل الإحصائيات..." : "Loading statistics..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !statsData) {
    return (
      <>
        <PageHeader title={ar ? "إحصائيات سريعة" : "Quick Stats"} />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{ar ? "خطأ في تحميل الإحصائيات" : "Error Loading Stats"}</h4>
              <p className="text-sm mt-1 text-muted-foreground">
                {error instanceof Error ? error.message : (ar ? "تعذر تحميل الإحصائيات" : "Could not load statistics")}
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
                {ar ? "إعادة تحميل" : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const { metrics, summary, categories, peerComparison } = statsData;
  const hasMetrics = metrics && metrics.length > 0;

  return (
    <>
      <PageHeader
        title={ar ? "إحصائيات سريعة" : "Quick Stats"}
        description={ar ? "مؤشرات أداء رئيسية محدثة لحظة بلحظة" : "Real-time key performance indicators"}
      />

      <div className="space-y-6 pb-12">
        {/* Period Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.entries(periodLabels) as [Period, { en: string; ar: string }][]).map(([key, labels]) => (
            <Button
              key={key}
              size="sm"
              variant={period === key ? "default" : "outline"}
              onClick={() => setPeriod(key)}
              className={`text-xs ${period === key ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90" : ""}`}
            >
              {ar ? labels.ar : labels.en}
            </Button>
          ))}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={Users}
              label={ar ? "الإجمالي" : "Total"}
              value={`${summary.totalStudents}`}
              sub={ar ? "الطلاب" : "students"}
              color="text-blue-600"
              bg="bg-blue-50 dark:bg-blue-950/20"
            />
            <SummaryCard
              icon={BookOpen}
              label={ar ? "المساقات" : "Courses"}
              value={`${summary.activeCourses}`}
              sub={ar ? "نشطة" : "active"}
              color="text-purple-600"
              bg="bg-purple-50 dark:bg-purple-950/20"
            />
            <SummaryCard
              icon={Target}
              label={ar ? "الإكمال" : "Completion"}
              value={`${summary.completionRate}%`}
              sub={ar ? "معدل" : "rate"}
              color="text-emerald-600"
              bg="bg-emerald-50 dark:bg-emerald-950/20"
            />
            <SummaryCard
              icon={Award}
              label={ar ? "المعدل" : "Avg Score"}
              value={`${summary.avgScore}%`}
              sub={ar ? "متوسط" : "average"}
              color="text-amber-600"
              bg="bg-amber-50 dark:bg-amber-950/20"
            />
          </div>
        )}

        {/* Peer Comparison */}
        {peerComparison && (
          <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 to-transparent">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-iscarb-cyan" />
                  {ar ? "مقارنة مع الزملاء" : "Peer Comparison"}
                </CardTitle>
                <Badge variant="secondary" className="bg-iscarb-cyan/10 text-iscarb-cyan text-xs">
                  {ar ? "المئين" : "Percentile"}: {peerComparison.percentile}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Score bar */}
              <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-iscarb-cyan/30 to-iscarb-cyan/50 rounded-lg"
                  style={{ width: `${(peerComparison.avgScore / Math.max(peerComparison.topScore, 1)) * 100}%` }}
                />
                <div
                  className="absolute top-0 h-full bg-gradient-to-r from-iscarb-cyan to-blue-500 rounded-lg transition-all duration-700"
                  style={{ width: `${(peerComparison.yourScore / Math.max(peerComparison.topScore, 1)) * 100}%` }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-white shadow-lg"
                  style={{ left: `${(peerComparison.topScore / Math.max(peerComparison.topScore, 1)) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-iscarb-cyan" />
                  <span className="font-medium">{ar ? "أنت" : "You"}: {peerComparison.yourScore}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-iscarb-cyan/30" />
                  <span className="text-muted-foreground">{ar ? "المتوسط" : "Avg"}: {peerComparison.avgScore}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-0.5 bg-white shadow" />
                  <span className="text-muted-foreground">{ar ? "الأعلى" : "Top"}: {peerComparison.topScore}</span>
                </div>
              </div>
              <div className={`p-2 rounded-lg text-center text-xs font-medium ${
                peerComparison.yourScore >= peerComparison.topScore * 0.9
                  ? "bg-emerald-50 text-emerald-700"
                  : peerComparison.yourScore >= peerComparison.avgScore
                  ? "bg-blue-50 text-blue-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {peerComparison.yourScore >= peerComparison.topScore * 0.9
                  ? (ar ? "أداء متميز! أنت من بين الأوائل" : "Excellent performance! You're among the top")
                  : peerComparison.yourScore >= peerComparison.avgScore
                  ? (ar ? "أداء جيد! أنت فوق المتوسط" : "Good performance! You're above average")
                  : (ar ? "هناك مجال للتحسين. استمر في العمل!" : "Room for improvement. Keep going!")
                }
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Stats */}
        {categories && categories.length > 0 && (
          <Card>
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                {ar ? "إحصائيات الفئات" : "Category Stats"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {categories.map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-medium truncate">{ar ? cat.labelAr : cat.label}</p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(cat.value * 10, 100)}%`, backgroundColor: cat.color || "#0096C7" }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold w-8 text-right">{cat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main Metrics Grid */}
        {hasMetrics ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, idx) => {
              const TrendIcon = metric.trend > 0 ? TrendingUp : metric.trend < 0 ? TrendingDown : Minus;
              const isPositive = metric.trend >= 0;
              const trendColor = isPositive ? "text-emerald-600" : "text-red-600";
              const trendBg = isPositive ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-red-50 dark:bg-red-950/20";

              const numericValue = parseFloat(metric.value.replace(/[^0-9.]/g, "")) || 0;
              const barValue = Math.min(Math.abs(numericValue), 100);

              return (
                <Card key={idx} className="hover:shadow-md transition-all hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {ar && metric.labelAr ? metric.labelAr : metric.label}
                      </CardTitle>
                      <div className={`p-1.5 rounded-lg ${trendBg}`}>
                        <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{metric.value}</p>
                    {metric.trend !== undefined && metric.trend !== null && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-xs font-medium ${trendColor}`}>
                          {metric.trend > 0 ? "↑" : metric.trend < 0 ? "↓" : "–"} {Math.abs(metric.trend)}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {ar ? "مقارنة بالفترة السابقة" : "vs last period"}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${barValue}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 flex flex-col items-center text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">{ar ? "لا توجد إحصائيات متاحة" : "No statistics available yet"}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {ar ? "ستظهر الإحصائيات بمجرد بدء نشاطك" : "Statistics will appear once you start your activity"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Activity Legend */}
        {hasMetrics && (
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>{ar ? "تحسن" : "Improving"}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span>{ar ? "انخفاض" : "Declining"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Minus className="h-3 w-3 text-muted-foreground" />
              <span>{ar ? "مستقر" : "Stable"}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          <p className="text-[9px] text-muted-foreground/60">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
