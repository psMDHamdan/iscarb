'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Clock, CheckCircle, Timer, Target } from "lucide-react";

export function AnalyticsAnalyticsProductivityView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Productivity Analytics"
      titleAr="تحليلات الإنتاجية"
      apiEndpoint="/api/v1/student/analytics/productivity"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
        { label: ar ? "إنتاجية" : "Productivity", href: "/student/analytics/productivity" },
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
                    <CheckCircle className="h-4 w-4 text-iscarb-green" />
                    {ar ? "معدل إكمال المهام" : "Task Completion Rate"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.completionRate || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "من جميع المهام" : "of all tasks"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    {ar ? "إجمالي وقت التركيز" : "Total Focus Time"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.focusTime || 0} {ar ? "ساعة" : "hr"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "هذا الأسبوع" : "This week"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Timer className="h-4 w-4 text-amber-500" />
                    {ar ? "متوسط وقت الإنجاز" : "Average Completion Time"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.avgTime || 0} {ar ? "دقيقة" : "min"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "للمهام المكتملة" : "for completed tasks"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-yellow-500" />
                    {ar ? "معدل إنجاز الأهداف" : "Goal Achievement Rate"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.goalRate || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "من الأهداف النشطة" : "of active goals"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="focus" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="focus">{ar ? "جلسات التركيز" : "Focus Sessions"}</TabsTrigger>
                <TabsTrigger value="tasks">{ar ? "إكمال المهام" : "Task Completion"}</TabsTrigger>
                <TabsTrigger value="goals">{ar ? "التقدم في الأهداف" : "Goal Progress"}</TabsTrigger>
              </TabsList>

              <TabsContent value="focus" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "جلسات التركيز اليومية" : "Daily Focus Sessions"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.charts?.dailyFocus || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="duration" name={ar ? "المدة" : "Duration"} fill="#0E6C3C" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "إكمال المهام حسب اليوم" : "Task Completion by Day"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.charts?.taskCompletion || []}>
                        <defs>
                          <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0E6C3C" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#0E6C3C" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="completed" name={ar ? "مكتملة" : "Completed"} stroke="#0E6C3C" fillOpacity={1} fill="url(#colorTasks)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "التقدم في الأهداف" : "Goal Progress"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.charts?.goalProgress || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="progress" name={ar ? "التقدم" : "Progress"} stroke="#0E6C3C" strokeWidth={2} />
                        <Line type="monotone" dataKey="target" name={ar ? "الهدف" : "Target"} stroke="#08A8A8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "نصائح الإنتاجية" : "Productivity Tips"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.tips?.map((tip: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-shrink-0 mt-1">
                        <Target className="h-5 w-5 text-iscarb-green" />
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
