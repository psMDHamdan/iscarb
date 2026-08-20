'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Activity, Award, Clock, TrendingUp } from "lucide-react";

export function AnalyticsAnalyticsAssessmentView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Assessment Analytics"
      titleAr="تحليلات التقييم"
      apiEndpoint="/api/v1/student/analytics/assessment"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
        { label: ar ? "تقييم" : "Assessment", href: "/student/analytics/assessment" },
      ]}
    >
      {(data: any, loading: boolean, error: string | null) => {
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
              <p className="text-sm text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</p>
            </div>
          );
        }

        if (error) {
          return (
            <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-red-900 dark:text-red-200">
                  {ar ? "خطأ في التحميل" : "Error Loading Page"}
                </h4>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-iscarb-green" />
                    {ar ? "متوسط العلامات" : "Average Score"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.averageScore || 0}/100</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "من جميع التقييمات" : "Across all assessments"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-500" />
                    {ar ? "التقييمات المكتملة" : "Completed Assessments"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.completed || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "من إجمالي {total} تقييم" : "of {total} assessments"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    {ar ? "متوسط الوقت" : "Average Time"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.avgTime || 0} {ar ? "دقيقة" : "min"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "لكل تقييم" : "per assessment"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    {ar ? "الترتيب النسبي" : "Relative Ranking"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.percentile || 50}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "النسبة المئوية" : "Percentile"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="trends" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="trends">{ar ? "اتجاهات العلامات" : "Score Trends"}</TabsTrigger>
                <TabsTrigger value="performance">{ar ? "الأداء حسب الموضوع" : "Performance by Topic"}</TabsTrigger>
                <TabsTrigger value="distribution">{ar ? "توزيع العلامات" : "Score Distribution"}</TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "اتجاهات العلامات بمرور الوقت" : "Score Trends Over Time"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.charts?.trendData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="assessment" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="score" name={ar ? "العَلَم" : "Score"} stroke="#0E6C3C" strokeWidth={2} />
                        <Line type="monotone" dataKey="classAverage" name={ar ? "متوسط الفصل" : "Class Average"} stroke="#08A8A8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "الأداء حسب الموضوع" : "Performance by Topic"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.charts?.topicPerformance || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="topic" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="yourScore" name={ar ? "عَلامتك" : "Your Score"} fill="#0E6C3C" />
                        <Bar dataKey="classAverage" name={ar ? "متوسط الفصل" : "Class Average"} fill="#08A8A8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="distribution" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "توزيع العلامات" : "Score Distribution"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.charts?.distributionData || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data?.charts?.distributionData?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={["#0E6C3C", "#08A8A8", "#6B7280", "#F59E0B"][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "تحسين الأداء" : "Performance Improvement"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.improvements?.map((imp: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-iscarb-green" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{imp.topic}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-iscarb-green" style={{ width: `${imp.improvement}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-iscarb-green">{imp.improvement}% {ar ? "تحسين" : "improvement"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{imp.action}</p>
                      </div>
                    </div>
                  ))}
                  {(!data?.improvements || data.improvements.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {ar ? "لا توجد بيانات للتحسين حاليًا" : "No improvement data available"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
