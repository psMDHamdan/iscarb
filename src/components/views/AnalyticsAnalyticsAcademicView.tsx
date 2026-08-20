'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, BookOpen } from "lucide-react";

export function AnalyticsAnalyticsAcademicView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Academic Analytics"
      titleAr="تحليلات أكاديمية"
      apiEndpoint="/api/v1/student/analytics/academic"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
        { label: ar ? "أكاديمي" : "Academic", href: "/student/analytics/academic" },
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
                  <CardTitle className="text-sm">{ar ? "المساقات المسجلة" : "Enrolled Courses"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-iscarb-green">
                    {data?.summary?.totalCourses || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{ar ? "المعدل التراكمي" : "GPA"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-iscarb-green">
                    {data?.summary?.averageGPA || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{ar ? "توزيع الدرجات" : "Grade Distribution"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${(data?.summary?.averageGPA || 0) / 4 * 100}%` }} />
                    </div>
                    <span className="text-sm">{(data?.summary?.averageGPA || 0) / 4 * 100}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="trend" className="space-y-4">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="trend">{ar ? "المعدل" : "Trend"}</TabsTrigger>
                <TabsTrigger value="performance">{ar ? "الأداء" : "Performance"}</TabsTrigger>
                <TabsTrigger value="distribution">{ar ? "التوزيع" : "Distribution"}</TabsTrigger>
              </TabsList>

              <TabsContent value="trend" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "معدل التطور الأكاديمي" : "Academic Performance Trend"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data?.gpaTrend || []}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                          <XAxis dataKey="semester" />
                          <YAxis domain={[0, 4]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: ar ? '#fff' : '#fff',
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="gpa"
                            stroke="#0e6c3c"
                            strokeWidth={2}
                            dot={{ fill: '#0e6c3c', strokeWidth: 2, r: 4 }}
                            name={ar ? "المعدل التراكمي" : "GPA"}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "الأداء حسب المساق" : "Performance by Course"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.coursePerformance || []}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                          <XAxis dataKey="course" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: ar ? '#fff' : '#fff',
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Bar dataKey="grade" fill="#0e6c3c" name={ar ? "الدرجة" : "Grade"} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="distribution" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "توزيع الدرجات" : "Grade Distribution"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.gradeDistribution || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#0e6c3c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}

export default AnalyticsAnalyticsAcademicView;
