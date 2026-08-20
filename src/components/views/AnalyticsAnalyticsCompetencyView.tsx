'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Target, TrendingUp, Award, Users } from "lucide-react";

export function AnalyticsAnalyticsCompetencyView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Competency Analytics"
      titleAr="تحليلات الكفاءات"
      apiEndpoint="/api/v1/student/analytics/competency"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
        { label: ar ? "كفاءة" : "Competency", href: "/student/analytics/competency" },
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
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4 text-iscarb-green" />
                    {ar ? "المستوى الحالي" : "Current Level"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.level || "Intermediate"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "التصنيف" : "Classification"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-iscarb-green" />
                    {ar ? "متوسط الدرجة" : "Average Score"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.averageScore || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "مجموع المهارات" : "Total Skills"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-iscarb-green" />
                    {ar ? "المهارات المحققة" : "Achieved Skills"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.achieved || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "من الإجمالي" : "Out of Total"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-iscarb-green" />
                    {ar ? "المهارات الناشئة" : "Emerging Skills"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.emerging || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "للتطوير" : "For Development"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="growth" className="space-y-4">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="growth">{ar ? "النمو" : "Growth"}</TabsTrigger>
                <TabsTrigger value="benchmark">{ar ? "المعيار" : "Benchmark"}</TabsTrigger>
                <TabsTrigger value="distribution">{ar ? "التوزيع" : "Distribution"}</TabsTrigger>
              </TabsList>

              {/* Growth Over Time */}
              <TabsContent value="growth" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "نمو الكفاءة عبر الوقت" : "Competency Growth Over Time"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.charts?.growthData || []}>
                          <defs>
                            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0e6c3c" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#0e6c3c" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" darkStroke="#374151" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: ar ? '#1f2937' : '#ffffff',
                              borderColor: ar ? '#374151' : '#e5e7eb',
                              color: ar ? '#f9fafb' : '#1f2937'
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="current"
                            name={ar ? "مستواك الحالي" : "Your Current Level"}
                            stroke="#0e6c3c"
                            fillOpacity={1}
                            fill="url(#colorCurrent)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="target"
                            name={ar ? "المستهدف" : "Target Level"}
                            stroke="#6366f1"
                            fillOpacity={1}
                            fill="url(#colorTarget)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Benchmark Comparison */}
              <TabsContent value="benchmark" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "مقارنة مع المعايير" : "Benchmark Comparison"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data?.charts?.benchmarkData || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" darkStroke="#374151" />
                          <XAxis dataKey="competency" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: ar ? '#1f2937' : '#ffffff',
                              borderColor: ar ? '#374151' : '#e5e7eb',
                              color: ar ? '#f9fafb' : '#1f2937'
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="student"
                            name={ar ? "الطالب" : "Student"}
                            stroke="#0e6c3c"
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="average"
                            name={ar ? "متوسط العينة" : "Sample Average"}
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                          />
                          <Line
                            type="monotone"
                            dataKey="benchmark"
                            name={ar ? "المعيار المطلوب" : "Required Benchmark"}
                            stroke="#ef4444"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Radar Chart for Competency Dimensions */}
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "المهارات حسب الأبعاد" : "Skills by Dimensions"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" darkStroke="#374151" />
                          <XAxis type="number" dataKey="x" name={ar ? "المهارة" : "Skill"} />
                          <YAxis type="number" dataKey="y" name={ar ? "الدرجة" : "Score"} />
                          <ZAxis type="number" dataKey="z" range={[60, 300]} name={ar ? "التقديم" : "Presentation"} />
                          <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{
                              backgroundColor: ar ? '#1f2937' : '#ffffff',
                              borderColor: ar ? '#374151' : '#e5e7eb',
                              color: ar ? '#f9fafb' : '#1f2937'
                            }}
                          />
                          <Legend />
                          <Scatter
                            name={ar ? "الطالب" : "Student"}
                            data={data?.charts?.radarData || []}
                            fill="#0e6c3c"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skill Distribution */}
              <TabsContent value="distribution" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "توزيع المهارات" : "Skill Distribution"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.charts?.radarData || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" darkStroke="#374151" />
                          <XAxis type="number" />
                          <YAxis dataKey="subject" type="category" width={100} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: ar ? '#1f2937' : '#ffffff',
                              borderColor: ar ? '#374151' : '#e5e7eb',
                              color: ar ? '#f9fafb' : '#1f2937'
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="current"
                            name={ar ? "الحالي" : "Current"}
                            fill="#0e6c3c"
                            radius={[0, 4, 4, 0]}
                          />
                          <Bar
                            dataKey="target"
                            name={ar ? "المستهدف" : "Target"}
                            fill="#6366f1"
                            radius={[4, 0, 0, 4]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-iscarb-green" />
                  {ar ? "التوصيات" : "Recommendations"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.recommendations?.map((rec: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-shrink-0 mt-1">
                        <TrendingUp className="h-5 w-5 text-iscarb-green" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{rec.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                        <p className="text-xs text-iscarb-green mt-2 font-medium">{rec.action}</p>
                      </div>
                    </div>
                  ))}
                  {(!data?.recommendations || data.recommendations.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {ar ? "لا توجد توصيات حالية" : "No recommendations available"}
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

export default AnalyticsAnalyticsCompetencyView;
