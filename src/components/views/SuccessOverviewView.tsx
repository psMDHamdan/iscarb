"use client";

import { useEffect } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  TrendingUp,
  Target,
  Trophy,
  Zap,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Users,
  BarChart3,
  Flame,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface SuccessOverviewData {
  metrics: {
    overallScore: number;
    streak: number;
    goalsCompleted: number;
    totalGoals: number;
    badgesEarned: number;
    weeklyGrowth: number;
  };
  recentGoals: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    category: string;
  }>;
  recentAchievements: Array<{
    id: string;
    title: string;
    badgeIcon?: string;
    earnedAt: string;
    rarity: string;
  }>;
  riskSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  stats: {
    completedGoals: number;
    inProgressGoals: number;
    activeAchievements: number;
    weeklyFocus: number;
  };
}

export function SuccessOverviewView() {
  const { lang } = useApp();
  const { trackEvent } = useAnalytics();
  const ar = lang === "ar";

  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "success", "overview"],
    "/api/v1/student/success/overview",
  );
  const data = rawRes?.data ?? rawRes as SuccessOverviewData | null;
  const error = queryError?.message ?? null;

  useEffect(() => {
    trackEvent("page_view", { section: "success", page: "overview" });
  }, [trackEvent]);

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "نظرة عامة" : "Overview", href: "/student/success/overview" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "نظرة عامة على النجاح" : "Success Overview"} breadcrumbs={breadcrumbs} />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "نظرة عامة على النجاح" : "Success Overview"} breadcrumbs={breadcrumbs} />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">{ar ? "خطأ في التحميل" : "Error Loading Data"}</p>
              <p className="text-sm text-red-700">{error || (ar ? "فشل تحميل البيانات" : "Failed to load data")}</p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-green-600 bg-green-50";
    }
  };

  return (
    <>
      <PageHeader title={ar ? "نظرة عامة على النجاح" : "Success Overview"} breadcrumbs={breadcrumbs} />

      <div className="space-y-6 pb-12">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall Score */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-800">
                <Trophy className="h-4 w-4" />
                {ar ? "النقاط الإجمالية" : "Overall Score"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{data.metrics.overallScore}/100</div>
              <p className="text-xs text-green-600 mt-1">
                {data.metrics.weeklyGrowth > 0 ? "↑" : "↓"} {Math.abs(data.metrics.weeklyGrowth)}% {ar ? "هذا الأسبوع" : "this week"}
              </p>
            </CardContent>
          </Card>

          {/* Streak */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800">
                <Flame className="h-4 w-4" />
                {ar ? "سلسلة التفاني" : "Current Streak"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{data.metrics.streak}</div>
              <p className="text-xs text-orange-600 mt-1">{ar ? "أيام متتالية" : "consecutive days"}</p>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-800">
                <Target className="h-4 w-4" />
                {ar ? "الأهداف" : "Goals"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{data.metrics.goalsCompleted}/{data.metrics.totalGoals}</div>
              <p className="text-xs text-blue-600 mt-1">{ar ? "مكتملة من إجمالي" : "completed"}</p>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-800">
                <Zap className="h-4 w-4" />
                {ar ? "الإنجازات" : "Achievements"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{data.metrics.badgesEarned}</div>
              <p className="text-xs text-purple-600 mt-1">{ar ? "شارات مكتسبة" : "badges earned"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Goals */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  {ar ? "أهدافي الأخيرة" : "Recent Goals"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {data.recentGoals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{ar ? "لا توجد أهداف حالياً" : "No goals yet"}</p>
                    <Button className="mt-4" asChild>
                      <a href="/student/success/goals">{ar ? "إنشاء هدف" : "Create Goal"}</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.recentGoals.map((goal) => (
                      <div key={goal.id} className="flex items-start justify-between p-3 rounded-lg border hover:bg-gray-50 transition">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{goal.title}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{goal.category}</span>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${goal.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                              {goal.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800">{goal.progress || 0}%</div>
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-green-600" style={{ width: `${goal.progress || 0}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Risk Summary */}
          <Card className="lg:col-span-1">
            <CardHeader className="border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                {ar ? "الأخطار" : "Risk Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {data.riskSummary.total === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700">{ar ? "لا توجد أخطار" : "No risks detected"}</p>
                </div>
              ) : (
                <>
                  <div className={`p-3 rounded-lg ${getRiskColor("critical")}`}>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{ar ? "حرج" : "Critical"}</span>
                      <span className="font-bold">{data.riskSummary.critical}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${getRiskColor("high")}`}>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{ar ? "عالي" : "High"}</span>
                      <span className="font-bold">{data.riskSummary.high}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${getRiskColor("medium")}`}>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{ar ? "متوسط" : "Medium"}</span>
                      <span className="font-bold">{data.riskSummary.medium}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${getRiskColor("low")}`}>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{ar ? "منخفض" : "Low"}</span>
                      <span className="font-bold">{data.riskSummary.low}</span>
                    </div>
                  </div>
                </>
              )}
              <Button variant="outline" className="w-full mt-4" asChild>
                <a href="/student/success/risk">{ar ? "عرض التفاصيل" : "View Details"}</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Section */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-600" />
              {ar ? "إنجازات حديثة" : "Recent Achievements"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {data.recentAchievements.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{ar ? "لم تكتسب أي إنجازات بعد" : "No achievements yet"}</p>
                <Button className="mt-4" asChild>
                  <a href="/student/success/achievements">{ar ? "استكشف الإنجازات" : "Explore Achievements"}</a>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="text-center p-3 rounded-lg border hover:border-purple-400 transition">
                    <div className="text-3xl mb-2">{achievement.badgeIcon || "🏆"}</div>
                    <p className="text-xs font-medium line-clamp-2">{achievement.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{achievement.rarity}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button asChild variant="outline" className="h-auto flex-col py-4">
            <a href="/student/success/goals">
              <Target className="h-5 w-5 mb-2 text-green-600" />
              <span className="text-xs">{ar ? "الأهداف" : "Goals"}</span>
            </a>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col py-4">
            <a href="/student/success/success-coach">
              <Users className="h-5 w-5 mb-2 text-blue-600" />
              <span className="text-xs">{ar ? "مدرب النجاح" : "AI Coach"}</span>
            </a>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col py-4">
            <a href="/student/success/productivity">
              <Zap className="h-5 w-5 mb-2 text-orange-600" />
              <span className="text-xs">{ar ? "الإنتاجية" : "Productivity"}</span>
            </a>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col py-4">
            <a href="/student/success/achievements">
              <Trophy className="h-5 w-5 mb-2 text-purple-600" />
              <span className="text-xs">{ar ? "الإنجازات" : "Achievements"}</span>
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}
