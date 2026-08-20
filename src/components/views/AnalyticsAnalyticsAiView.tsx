'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Bot, Zap, Brain, Sparkles } from "lucide-react";

export function AnalyticsAnalyticsAiView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="AI Analytics"
      titleAr="تحليلات الذكاء الاصطناعي"
      apiEndpoint="/api/v1/student/analytics/ai"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
        { label: ar ? "ذكاء اصطناعي" : "AI", href: "/student/analytics/ai" },
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
                    <Bot className="h-4 w-4 text-iscarb-green" />
                    {ar ? "الاستخدام اليومي" : "Daily Usage"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.dailyCalls || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "استدعاءات اليوم" : "Calls today"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    {ar ? "ال tokens المستخدمة" : "Tokens Used"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.tokens || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "هذا الأسبوع" : "This week"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-amber-500" />
                    {ar ? "الميزات الأكثر استخدامًا" : "Most Used Features"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.topFeature || "Chat"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "في الأسبوع الماضي" : "Last week"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    {ar ? "النتائج المساعدة" : "AI-Assisted Outcomes"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.summary?.assisted || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "من الأنشطة" : "from activities"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="usage" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="usage">{ar ? "استخدام الذكاء الاصطناعي" : "AI Usage"}</TabsTrigger>
                <TabsTrigger value="features">{ar ? "الخصائص الأكثر استخدامًا" : "Most Used Features"}</TabsTrigger>
                <TabsTrigger value="outcomes">{ar ? "النتائج المساعدة" : "AI-Assisted Outcomes"}</TabsTrigger>
              </TabsList>

              <TabsContent value="usage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "استخدام الذكاء الاصطناعي اليومي" : "Daily AI Usage"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.charts?.dailyUsage || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="calls" name={ar ? "المكالمات" : "Calls"} fill="#0E6C3C" />
                        <Bar dataKey="tokens" name={ar ? "Tokens" : "Tokens"} fill="#08A8A8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "استخدام الميزات حسب النوع" : "Feature Usage by Type"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.charts?.featureUsage || []}>
                        <defs>
                          <linearGradient id="colorFeatures" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0E6C3C" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#0E6C3C" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="feature" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="usage" name={ar ? "الاستخدام" : "Usage"} stroke="#0E6C3C" fillOpacity={1} fill="url(#colorFeatures)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outcomes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{ar ? "النتائج المساعدة" : "AI-Assisted Outcomes"}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.charts?.outcomes || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="activity" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="success" name={ar ? "نجاح" : "Success"} stroke="#0E6C3C" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "الخصائص المساعدة" : "AI-Assisted Features"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.features?.map((feature: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-shrink-0 mt-1">
                        <Sparkles className="h-5 w-5 text-iscarb-green" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{feature.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-iscarb-green" style={{ width: `${feature.usage}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-iscarb-green">{feature.usage}% {ar ? "استخدام" : "usage"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                  {(!data?.features || data.features.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {ar ? "لا توجد بيانات مساعدة حالية" : "No AI-assisted data available"}
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
