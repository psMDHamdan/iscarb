'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Briefcase, Network, Target, TrendingUp } from "lucide-react";

export function AnalyticsAnalyticsCareerView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Career Analytics"
      titleAr="تحليلات التوظيف"
      apiEndpoint="/api/v1/student/analytics/career"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
        { label: ar ? "وظيفي" : "Career", href: "/student/analytics/career" },
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
                    <Briefcase className="h-4 w-4 text-iscarb-green" />
                    {ar ? "جاهزية التوظيف" : "Career Readiness"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.readinessScore || 0}/100</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "مستوى الجاهزية" : "Readiness Level"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Network className="h-4 w-4 text-blue-500" />
                    {ar ? "عدد الاتصالات" : "Network Connections"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.connections || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "من أقرانك" : "From peers"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    {ar ? "التطبيقات" : "Applications"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.applications || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "تم التقديم مؤخرًا" : "Recently submitted"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    {ar ? "المطابقة مع الوظائف" : "Job Match Score"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.matchScore || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "مطابقة تلقائية" : "Auto-matched"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="progression" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="progression">{ar ? "التقدم في الوظيفة" : "Job Progression"}</TabsTrigger>
                <TabsTrigger value="funnel">{ar ? "قائمة التطبيقات" : "Application Funnel"}</TabsTrigger>
                <TabsTrigger value="network">{ar ? "نمو الشبكة" : "Network Growth"}</TabsTrigger>
              </TabsList>

              <TabsContent value="progression" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "تطور جاهزية التوظيف" : "Career Readiness Progression"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.charts?.progressionData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="readiness" name={ar ? "جاهزية التوظيف" : "Career Readiness"} stroke="#0E6C3C" strokeWidth={2} />
                        <Line type="monotone" dataKey="benchmark" name={ar ? "معيار الصناعة" : "Industry Benchmark"} stroke="#08A8A8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="funnel" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "قائمة التطبيقات الوظيفية" : "Job Application Funnel"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.charts?.funnelData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="stage" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name={ar ? "عدد" : "Count"} fill="#0E6C3C" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="network" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "نمو الشبكة المهنية" : "Professional Network Growth"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.charts?.networkData || []}>
                        <defs>
                          <linearGradient id="colorNetwork" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0E6C3C" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#0E6C3C" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="connections" name={ar ? "الاتصالات" : "Connections"} stroke="#0E6C3C" fillOpacity={1} fill="url(#colorNetwork)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "وظائف مقترحة" : "Suggested Jobs"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.suggestedJobs?.map((job: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-shrink-0 w-10 h-10 rounded bg-iscarb-green/10 flex items-center justify-center text-iscarb-green font-bold">
                        {job.company?.charAt(0) || "J"}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{job.title}</h4>
                        <p className="text-xs text-muted-foreground">{job.company} • {job.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-iscarb-green">{job.matchScore}%</div>
                        <div className="text-[10px] text-muted-foreground">{ar ? "مطابقة" : "Match"}</div>
                      </div>
                    </div>
                  ))}
                  {(!data?.suggestedJobs || data.suggestedJobs.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {ar ? "لا توجد وظائف مقترحة حاليًا" : "No suggested jobs available"}
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
