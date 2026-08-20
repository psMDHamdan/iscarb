'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Heart, Smile, Activity, Brain } from "lucide-react";

export function AnalyticsAnalyticsWellnessView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Wellness Analytics"
      titleAr="تحليلات العافية"
      apiEndpoint="/api/v1/student/analytics/wellness"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
        { label: ar ? "عافية" : "Wellness", href: "/student/analytics/wellness" },
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
                    <Heart className="h-4 w-4 text-iscarb-green" />
                    {ar ? " điểm العافية" : "Wellness Score"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.score || 0}/100</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "التقييم العام" : "Overall rating"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Smile className="h-4 w-4 text-blue-500" />
                    {ar ? "المزاج اليومي" : "Daily Mood"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.mood || "Positive"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "آخر تسجيل" : "Last recorded"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-500" />
                    {ar ? "عدد مرات تسجيل المزاج" : "Mood Entries"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.entries || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "هذا الأسبوع" : "This week"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-yellow-500" />
                    {ar ? "المعدل الحالي" : "Current Rate"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.rate || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "دقيقة" : "minute"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="mood" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="mood">{ar ? "اتجاهات المزاج" : "Mood Trends"}</TabsTrigger>
                <TabsTrigger value="habits">{ar ? "استمرارية العادات" : "Habit Consistency"}</TabsTrigger>
                <TabsTrigger value="history">{ar ? "سجل العافية" : "Wellness History"}</TabsTrigger>
              </TabsList>

              <TabsContent value="mood" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "اتجاهات المزاج" : "Mood Trends"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.charts?.moodTrend || []}>
                        <defs>
                          <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0E6C3C" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#0E6C3C" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="score" name={ar ? "درجة المزاج" : "Mood Score"} stroke="#0E6C3C" fillOpacity={1} fill="url(#colorMood)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="habits" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "استمرارية العادات" : "Habit Consistency"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.charts?.habitConsistency || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="habit" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" name={ar ? "مكتملة" : "Completed"} fill="#0E6C3C" />
                        <Bar dataKey="missed" name={ar ? "مفقودة" : "Missed"} fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "سجل العافية" : "Wellness History"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.charts?.wellnessHistory || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="score" name={ar ? "العافية" : "Wellness"} stroke="#0E6C3C" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "نصائح العافية" : "Wellness Tips"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.tips?.map((tip: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-shrink-0 mt-1">
                        <Brain className="h-5 w-5 text-iscarb-green" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{tip.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                        <p className="text-xs text-iscarb-green mt-2 font-medium">{tip.action}</p>
                      </div>
                    </div>
                  ))}
                  {(!data?.tips || data.tips.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {ar ? "لا توجد نصائح حالية" : "No tips available"}
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
