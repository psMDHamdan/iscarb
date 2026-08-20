'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Clock, BookOpen, CheckCircle } from "lucide-react";

export function AnalyticsAnalyticsLearningView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Learning Analytics"
      titleAr="تحليلات تعلم"
      apiEndpoint="/api/v1/student/analytics/learning"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
        { label: ar ? "تعلم" : "Learning", href: "/student/analytics/learning" },
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-iscarb-green" />
                    {ar ? "مجموع الساعات" : "Total Hours"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-iscarb-green">
                    {data?.summary?.totalStudyHours || 0}h
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-iscarb-green" />
                    {ar ? "الجلسات المكتملة" : "Completed Sessions"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-iscarb-green">
                    {data?.summary?.completedSessions || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-iscarb-green" />
                    {ar ? "معدل الاحتفاظ" : "Retention Rate"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-iscarb-green">
                    {data?.summary?.retentionRate || 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="time" className="space-y-4">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="time">{ar ? "الوقت" : "Time"}</TabsTrigger>
                <TabsTrigger value="velocity">{ar ? "السرعة" : "Velocity"}</TabsTrigger>
                <TabsTrigger value="retention">{ar ? "الاحتفاظ" : "Retention"}</TabsTrigger>
                <TabsTrigger value="paths">{ar ? "المسارات" : "Paths"}</TabsTrigger>
              </TabsList>

              <TabsContent value="time" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "الوقت المخصص للدراسة" : "Study Time by Day"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.timeSpentByDay || []}>
                          <defs>
                            <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0e6c3c" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#0e6c3c" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis unit="h" />
                          <Tooltip />
                          <Area type="monotone" dataKey="hours" stroke="#0e6c3c" fillOpacity={1} fill="url(#colorTime)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="velocity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "سرعة التعلم" : "Learning Velocity"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data?.learningVelocity || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis unit="h" />
                          <Tooltip />
                          <Line type="monotone" dataKey="hours" stroke="#0e6c3c" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="retention" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "معدل الاحتفاظ" : "Retention Rate"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-64">
                      <div className="relative w-48 h-48">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            className="text-gray-200"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.8"
                          />
                          <path
                            className="text-iscarb-green"
                            strokeDasharray={`${data?.summary?.retentionRate}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.8"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-iscarb-green">
                            {data?.summary?.retentionRate || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="paths" className="space-y-4">
                <div className="space-y-4">
                  {data?.pathProgress?.map((path: any, idx: number) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>{path.path}</span>
                          <span className="text-iscarb-green font-bold">{Math.round(path.progress)}%</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-iscarb-green rounded-full transition-all duration-500"
                            style={{ width: `${path.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <CheckCircle className={`h-4 w-4 ${path.completed ? "text-green-500" : "text-gray-400"}`} />
                          <span className="text-sm text-muted-foreground">
                            {path.completed ? (ar ? "مكتمل" : "Completed") : (ar ? "قيد التقدم" : "In Progress")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}

export default AnalyticsAnalyticsLearningView;
