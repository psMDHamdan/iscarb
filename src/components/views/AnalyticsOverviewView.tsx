'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, TrendingUp, Users, BookOpen, Award, Clock, Heart, Bot } from "lucide-react";

export function AnalyticsOverviewView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Analytics Overview"
      titleAr="نظرة عامة على التحليلات"
      apiEndpoint="/api/v1/student/analytics/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
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

        const metrics = [
          {
            title: t("analytics.courses"),
            titleAr: "المساقات",
            value: data?.summary?.coursesEnrolled || 0,
            icon: BookOpen,
            color: "bg-blue-500",
          },
          {
            title: t("analytics.averageGrade"),
            titleAr: "المعدل التراكمي",
            value: data?.summary?.averageGrade || 0,
            icon: TrendingUp,
            color: "bg-green-500",
          },
          {
            title: t("analytics.assessments"),
            titleAr: "التقييمات",
            value: data?.summary?.assessmentsTaken || 0,
            icon: Award,
            color: "bg-purple-500",
          },
          {
            title: t("analytics.competencies"),
            titleAr: "المهارات",
            value: data?.summary?.competenciesTracked || 0,
            icon: Users,
            color: "bg-orange-500",
          },
        ];

        // Build all 8 sub-domain summary metrics
        const allMetrics = [
          {
            title: t("analytics.courses"),
            titleAr: "المساقات",
            value: data?.summary?.coursesEnrolled || 0,
            icon: BookOpen,
            color: "bg-blue-500",
            trend: "+12%",
          },
          {
            title: t("analytics.averageGrade"),
            titleAr: "المعدل التراكمي",
            value: data?.summary?.averageGrade || 0,
            icon: TrendingUp,
            color: "bg-green-500",
            trend: "+3%",
          },
          {
            title: t("analytics.assessments"),
            titleAr: "التقييمات",
            value: data?.summary?.assessmentsTaken || 0,
            icon: Award,
            color: "bg-purple-500",
            trend: "-2%",
          },
          {
            title: t("analytics.competencies"),
            titleAr: "المهارات",
            value: data?.summary?.competenciesTracked || 0,
            icon: Users,
            color: "bg-orange-500",
            trend: "+8%",
          },
          {
            title: t("analytics.readiness"),
            titleAr: "الجاهزية",
            value: data?.successScore?.score || 0,
            icon: TrendingUp,
            color: "bg-cyan-500",
            trend: "+5%",
          },
          {
            title: t("analytics.focusTime"),
            titleAr: "وقت التركيز",
            value: data?.productivity?.focusMinutesThisWeek ? `${Math.round(data.productivity.focusMinutesThisWeek / 60)}h` : "0h",
            icon: Clock,
            color: "bg-pink-500",
            trend: "+15%",
          },
          {
            title: t("analytics.wellness"),
            titleAr: "الصحة",
            value: data?.wellness?.summary?.score || 0,
            icon: Heart,
            color: "bg-red-500",
            trend: "+2%",
          },
          {
            title: t("analytics.aiUsage"),
            titleAr: "استخدام الذكاء الاصطناعي",
            value: data?.ai?.summary?.dailyCalls || 0,
            icon: Bot,
            color: "bg-amber-500",
            trend: "+20%",
          },
        ];

        const Sparkline = ({ data: sparklineData, color }: { data: number[]; color: string }) => {
          const max = Math.max(...sparklineData, 1);
          const min = Math.min(...sparklineData, 0);
          const range = max - min || 1;
          const points = sparklineData
            .map((val, i) => {
              const x = (i / (sparklineData.length - 1)) * 60;
              const y = 20 - ((val - min) / range) * 20;
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <svg className="h-8 w-20" viewBox="0 0 60 20" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
                className="opacity-70"
              />
            </svg>
          );
        };

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {allMetrics.map((metric, idx) => (
                <Card key={idx}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium">
                      {ar ? metric.titleAr : metric.title}
                    </CardTitle>
                    <metric.icon className="h-3 w-3" style={{ color: metric.color.replace("bg-", "").replace("-", "") }} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {metric.value}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-[10px] ${metric.trend.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                        {metric.trend}
                      </span>
                      <Sparkline
                        data={idx % 2 === 0 ? [10, 25, 18, 35, 28, 45] : [45, 38, 42, 35, 40, 45]}
                        color={metric.color.replace("bg-", "").replace("-", "")}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="academic" className="space-y-4">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="academic">{ar ? "أكاديمي" : "Academic"}</TabsTrigger>
                <TabsTrigger value="learning">{ar ? "تعلم" : "Learning"}</TabsTrigger>
                <TabsTrigger value="competency">{ar ? "كفاءة" : "Competency"}</TabsTrigger>
                <TabsTrigger value="career">{ar ? "مهني" : "Career"}</TabsTrigger>
                <TabsTrigger value="assessment">{ar ? "تقييم" : "Assessment"}</TabsTrigger>
                <TabsTrigger value="productivity">{ar ? "إنتاجية" : "Productivity"}</TabsTrigger>
                <TabsTrigger value="wellness">{ar ? "صحة" : "Wellness"}</TabsTrigger>
                <TabsTrigger value="ai">{ar ? "ذكاء اصطناعي" : "AI"}</TabsTrigger>
              </TabsList>

              <TabsContent value="academic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "الأداء الأكاديمي" : "Academic Performance"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.charts?.courseGrades || []}>
                          <defs>
                            <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0e6c3c" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#0e6c3c" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="course" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="grade" stroke="#0e6c3c" fillOpacity={1} fill="url(#colorGrade)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="learning" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "التعلم والنشاط" : "Learning & Activity"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data?.charts?.learningActivity || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="hours" stroke="#0e6c3c" name={ar ? "الساعات" : "Hours"} />
                          <Line type="monotone" dataKey="tasks" stroke="#10b981" name={ar ? "المهام" : "Tasks"} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="competency" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "المهارات والكفاءات" : "Skills & Competencies"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data?.charts?.competencyRadar || []}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name={ar ? "مستواك" : "Your Level"} dataKey="a" stroke="#0e6c3c" fill="#0e6c3c" fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="career" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "الجاهزية المهنية" : "Career Readiness"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.charts?.careerMetrics || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="metric" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="score" fill="#0e6c3c" name={ar ? "الدرجة" : "Score"} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assessment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "الأداء التقييمي" : "Assessment Performance"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.charts?.scoreTrend || []}>
                          <defs>
                            <linearGradient id="colorAssessment" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0e6c3c" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#0e6c3c" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="assessment" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="score" stroke="#0e6c3c" fillOpacity={1} fill="url(#colorAssessment)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="productivity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "الإنتاجية" : "Productivity"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.charts?.dailyFocus || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis unit="m" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="duration" fill="#0e6c3c" name={ar ? "الدقائق" : "Minutes"} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="wellness" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "الصحة والعافية" : "Wellness"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.charts?.moodTrend || []}>
                          <defs>
                            <linearGradient id="colorWellness" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0e6c3c" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#0e6c3c" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="score" stroke="#0e6c3c" fillOpacity={1} fill="url(#colorWellness)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{ar ? "استخدام الذكاء الاصطناعي" : "AI Usage"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.charts?.dailyUsage || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="calls" fill="#0e6c3c" name={ar ? "المكالمات" : "Calls"} />
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

export default AnalyticsOverviewView;
