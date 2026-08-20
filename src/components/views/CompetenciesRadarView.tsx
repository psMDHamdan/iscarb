"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface RadarDataPoint {
  category: string;
  value: number;
  fullMark: number;
}

interface CompetencyItem {
  id: string;
  competencyId: string;
  name: string;
  category: string;
  level: number;
  current: number;
  target: number;
  trend: number;
}

interface RadarData {
  radarData: RadarDataPoint[];
  competencies: CompetencyItem[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-xs dark:bg-gray-900">
      <p className="font-semibold capitalize mb-1">{d.category}</p>
      <p className="text-iscarb-green">Level: {Math.round(d.value)}%</p>
    </div>
  );
}

export function CompetenciesRadarView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "competencies", "radar"],
    "/api/v1/student/competencies/radar",
  );
  const data = rawRes?.data ?? rawRes as RadarData | null;
  const error = queryError?.message ?? null;

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "مخطط الرادار" : "Competency Radar"}
          description={ar ? "تقييم مرئي لمستويات كفاءاتك الثمانية" : "Visual radar chart across 8 competency dimensions"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-sm text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "مخطط الرادار" : "Competency Radar"} />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <p className="text-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                {ar ? "إعادة المحاولة" : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  // Normalize radar data for Recharts (max = 100)
  const radarChartData = data.radarData.map((d) => ({
    category: d.category,
    value: Math.round(d.value),
    fullMark: 100,
  }));

  const hasRadarData = radarChartData.length > 0 && radarChartData.some((d) => d.value > 0);

  return (
    <>
      <PageHeader
        title={ar ? "مخطط الرادار" : "Competency Radar"}
        description={ar ? "تقييم وتتبع مستويات كفاءاتك بصريًا عبر جميع الأبعاد" : "Visualize and track your competency levels across all dimensions"}
      />

      <div className="space-y-6 pb-12">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{ar ? "ملف الكفاءات" : "Competency Profile"}</CardTitle>
          </CardHeader>
          <CardContent>
            {hasRadarData ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#9ca3af" }} />
                    <Radar
                      name={ar ? "مستواك" : "Your Level"}
                      dataKey="value"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">
                  {ar ? "لا توجد بيانات كفاءة بعد. أضف أدلة لترى مخطط الرادار." : "No competency data yet. Add evidence to see the radar chart."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category summary cards */}
        {data.radarData.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.radarData.map((cat) => (
              <Card key={cat.category}>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-xs uppercase tracking-wide capitalize mb-2">{cat.category}</h4>
                  <p className="text-2xl font-bold mb-2">{Math.round(cat.value)}%</p>
                  <Progress value={Math.min(100, cat.value)} className="h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Individual competencies */}
        {data.competencies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "تفاصيل الكفاءات" : "Competency Details"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {data.competencies.map((comp) => (
                  <div key={comp.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-sm">{comp.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{comp.category}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {comp.trend > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        ) : comp.trend < 0 ? (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <Minus className="h-3.5 w-3.5 text-gray-400" />
                        )}
                        <span className={`text-xs font-semibold ${comp.trend > 0 ? "text-green-600" : comp.trend < 0 ? "text-red-600" : "text-gray-500"}`}>
                          {comp.trend > 0 ? "+" : ""}{comp.trend}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{ar ? "الحالي" : "Current"}</span>
                          <span className="font-semibold">{comp.current}%</span>
                        </div>
                        <Progress value={comp.current} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{ar ? "الهدف" : "Target"}</span>
                          <span className="font-semibold">{comp.target}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-400 rounded-full"
                            style={{ width: `${comp.target}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <Badge variant={comp.current >= comp.target ? "default" : "outline"} className="text-xs">
                        {comp.current >= comp.target
                          ? (ar ? "تحقق" : "Achieved")
                          : `${comp.target - comp.current}% ${ar ? "متبقي" : "to go"}`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {data.competencies.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {ar ? "لا توجد كفاءات. تواصل مع المرشد الأكاديمي لتعيين إطار الكفاءات." : "No competencies found. Contact your academic advisor to set up the competency framework."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
