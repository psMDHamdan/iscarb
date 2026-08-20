"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3, Clock, Target, TrendingUp, AlertCircle } from "lucide-react";

interface ProductivitySession {
  id: string;
  sessionDate: string;
  tasksCompleted: number;
  plannedTasks: number;
  actualHoursSpent: number;
  qualityScore: number;
  sessionType: string;
  distractionCount: number;
}

interface ProductivityData {
  sessions: ProductivitySession[];
  stats: {
    totalSessions: number;
    averageQuality: number;
    totalHoursSpent: number;
    tasksCompletionRate: number;
    averageDistractions: number;
  };
  trend: number;
}

export function SuccessSuccessProductivityView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [data, setData] = useState<ProductivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/success/productivity");
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        if (result.success) setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "الإنتاجية" : "Productivity", href: "/student/success/productivity" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "لوحة الإنتاجية" : "Productivity Dashboard"} breadcrumbs={breadcrumbs} />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "لوحة الإنتاجية" : "Productivity Dashboard"} breadcrumbs={breadcrumbs} />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={ar ? "لوحة الإنتاجية" : "Productivity Dashboard"} breadcrumbs={breadcrumbs} />

      <div className="space-y-6 pb-12">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">{ar ? "الجلسات" : "Sessions"}</p>
              <p className="text-3xl font-bold text-[#0E6C3C]">{data.stats.totalSessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">{ar ? "متوسط الجودة" : "Avg Quality"}</p>
              <p className="text-3xl font-bold text-blue-600">{data.stats.averageQuality}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">{ar ? "ساعات العمل" : "Hours"}</p>
              <p className="text-3xl font-bold text-green-600">{data.stats.totalHoursSpent.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">{ar ? "معدل الإنجاز" : "Completion"}</p>
              <p className="text-3xl font-bold text-purple-600">{data.stats.tasksCompletionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">{ar ? "الاتجاه" : "Trend"}</p>
              <p className={`text-3xl font-bold ${data.trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {data.trend >= 0 ? "+" : ""}{data.trend}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {ar ? "جلسات الإنتاجية" : "Productivity Sessions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.sessions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{ar ? "لا توجد جلسات بعد" : "No sessions yet"}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">{ar ? "التاريخ" : "Date"}</th>
                      <th className="text-left py-2 px-4">{ar ? "النوع" : "Type"}</th>
                      <th className="text-left py-2 px-4">{ar ? "المهام" : "Tasks"}</th>
                      <th className="text-left py-2 px-4">{ar ? "الساعات" : "Hours"}</th>
                      <th className="text-left py-2 px-4">{ar ? "الجودة" : "Quality"}</th>
                      <th className="text-left py-2 px-4">{ar ? "التشتيتات" : "Distractions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessions.map((session) => (
                      <tr key={session.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">
                          {new Date(session.sessionDate).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                        </td>
                        <td className="py-2 px-4">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {session.sessionType}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          {session.tasksCompleted}/{session.plannedTasks}
                        </td>
                        <td className="py-2 px-4">{session.actualHoursSpent.toFixed(1)}h</td>
                        <td className="py-2 px-4">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${session.qualityScore}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <span className={session.distractionCount > 3 ? "text-red-600" : "text-gray-600"}>
                            {session.distractionCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="border-l-4 border-l-[#0E6C3C]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {ar ? "الرؤى" : "Insights"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#0E6C3C] font-bold">•</span>
                <span>
                  {ar
                    ? `متوسط جودتك ${data.stats.averageQuality}% - استمر في التركيز على جودة العمل`
                    : `Your average quality is ${data.stats.averageQuality}% - keep focusing on work quality`}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0E6C3C] font-bold">•</span>
                <span>
                  {ar
                    ? `أنت تنجز ${data.stats.tasksCompletionRate}% من المهام المخططة`
                    : `You're completing ${data.stats.tasksCompletionRate}% of planned tasks`}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
