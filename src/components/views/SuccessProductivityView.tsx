"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Zap,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Calendar,
  Settings,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ProductivitySession {
  id: string;
  sessionDate: string;
  tasksCompleted: number;
  plannedTasks: number;
  actualHoursSpent: number;
  qualityScore: number;
  distractionCount: number;
  sessionType: string;
}

interface ProductivityStats {
  weeklyAverage: number;
  tasksThisWeek: number;
  hoursThisWeek: number;
  avgQualityScore: number;
  trend: "up" | "down" | "stable";
  streak: number;
  focusAreas: Array<{ name: string; sessions: number; avgScore: number }>;
}

export function SuccessProductivityView() {
  const { lang } = useApp();
  const { trackEvent } = useAnalytics();
  const ar = lang === "ar";

  const [sessions, setSessions] = useState<ProductivitySession[]>([]);
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductivityData();
  }, []);

  const fetchProductivityData = async () => {
    try {
      setLoading(true);
      trackEvent("page_view", { section: "success", page: "productivity" });

      const response = await fetch("/api/v1/student/success/productivity");
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      if (result.success) {
        setSessions(result.data?.sessions || []);
        setStats(result.data?.stats || null);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      trackEvent("error", { section: "success", page: "productivity", error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "الإنتاجية" : "Productivity", href: "/student/success/productivity" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "الإنتاجية" : "Productivity"} breadcrumbs={breadcrumbs} />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "لوحة الإنتاجية" : "Productivity Dashboard"}
        description={ar ? "تتبع وتحسين إنتاجيتك" : "Track and improve your productivity"}
        breadcrumbs={breadcrumbs}
      />

      <div className="space-y-6 pb-12">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Key Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800">
                  <Zap className="h-4 w-4" />
                  {ar ? "متوسط أسبوعي" : "Weekly Avg"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats.weeklyAverage}%</div>
                <p className="text-xs text-orange-600 mt-1">{ar ? "الإنتاجية" : "productivity"}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-800">
                  <Target className="h-4 w-4" />
                  {ar ? "مهام هذا الأسبوع" : "Tasks This Week"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.tasksThisWeek}</div>
                <p className="text-xs text-blue-600 mt-1">{ar ? "مكتملة" : "completed"}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-800">
                  <Clock className="h-4 w-4" />
                  {ar ? "ساعات العمل" : "Hours Worked"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {stats.hoursThisWeek.toFixed(1)}h
                </div>
                <p className="text-xs text-purple-600 mt-1">{ar ? "هذا الأسبوع" : "this week"}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-800">
                  <BarChart3 className="h-4 w-4" />
                  {ar ? "جودة العمل" : "Quality Score"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.avgQualityScore}/100</div>
                <p className="text-xs text-green-600 mt-1">{ar ? "متوسط" : "average"}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Chart Area */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              {ar ? "جلسات الإنتاجية" : "Productivity Sessions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{ar ? "لا توجد جلسات بعد" : "No sessions yet"}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {ar ? "ابدأ جلسة إنتاجية لتتبع تقدمك" : "Start a session to track your progress"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {new Date(session.sessionDate).toLocaleDateString()}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {session.sessionType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {session.tasksCompleted}/{session.plannedTasks} {ar ? "مهام مكتملة" : "tasks completed"} •{" "}
                        {session.actualHoursSpent.toFixed(1)}h {ar ? "عمل" : "worked"}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">{session.qualityScore}%</div>
                      <div className="w-20 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${session.qualityScore}%` }}
                        />
                      </div>
                      {session.distractionCount > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          {session.distractionCount} {ar ? "انقطاعات" : "distractions"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Focus Areas */}
        {stats && stats.focusAreas?.length > 0 && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">{ar ? "مجالات التركيز" : "Focus Areas"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {stats.focusAreas.map((area, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{area.name}</p>
                      <p className="text-xs text-gray-500">
                        {area.sessions} {ar ? "جلسات" : "sessions"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">{area.avgScore}%</div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${area.avgScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Productivity Tips */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {ar ? "نصائح تحسين الإنتاجية" : "Productivity Tips"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm font-medium text-blue-900">
                {ar ? "استخدم تقنية بومودورو" : "Use Pomodoro Technique"}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {ar ? "اعمل 25 دقيقة ثم خذ فترة راحة قصيرة" : "Work for 25 minutes, then take a short break"}
              </p>
            </div>
            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-sm font-medium text-green-900">
                {ar ? "حدد الأولويات في الصباح" : "Set Priorities in Morning"}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {ar ? "خطط ليومك قبل البدء" : "Plan your day before you start"}
              </p>
            </div>
            <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
              <p className="text-sm font-medium text-orange-900">
                {ar ? "التخلص من التشتيتات" : "Eliminate Distractions"}
              </p>
              <p className="text-xs text-orange-700 mt-1">
                {ar ? "أطفئ الإشعارات أثناء العمل" : "Turn off notifications while working"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
