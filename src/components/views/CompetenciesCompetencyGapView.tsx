"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, TrendingDown, Zap } from "lucide-react";

export function CompetenciesCompetencyGapView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/competencies/gap-analysis");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load gap analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const response = await fetch("/api/v1/student/competencies/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "تحليل الفجوات" : "Gap Analysis"}
          description={ar ? "حدد الفجوات في مهاراتك وخطط للتطوير" : "Identify skills gaps and plan development"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green" />
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "تحليل الفجوات" : "Gap Analysis"} />
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const { gaps, stats, recommendations, priorities } = data;

  return (
    <>
      <PageHeader
        title={ar ? "تحليل الفجوات" : "Gap Analysis"}
        description={ar ? "تحليل شامل لفجوات المهارات والتوصيات" : "Comprehensive skills gap analysis and recommendations"}
      />

      <div className="space-y-6 pb-12">
        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="gap-2"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {ar ? "تحليل جديد" : "New Analysis"}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "إجمالي الفجوات" : "Total Gaps"}
                </p>
                <p className="text-2xl font-bold mt-2">{stats.totalGaps}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "حرجة" : "Critical"}
                </p>
                <p className="text-2xl font-bold mt-2 text-red-600">{stats.critical}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "عالية" : "High"}
                </p>
                <p className="text-2xl font-bold mt-2 text-orange-600">{stats.high}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "متوسطة" : "Medium"}
                </p>
                <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.medium}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Gaps */}
        {priorities && priorities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                {ar ? "الفجوات ذات الأولوية" : "Priority Gaps"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priorities.map((gap: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{gap.competency}</h4>
                      <Badge
                        variant={
                          gap.severity === "critical"
                            ? "destructive"
                            : gap.severity === "high"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs capitalize"
                      >
                        {gap.severity}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">{gap.description}</p>

                    {/* Gap Visualization */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span>{ar ? "الحالي" : "Current"}:</span>
                        <span className="font-semibold">{Math.round(gap.current)}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-iscarb-blue h-2 rounded-full"
                          style={{ width: `${gap.current}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs mt-2">
                        <span>{ar ? "المطلوب" : "Required"}:</span>
                        <span className="font-semibold">{Math.round(gap.required)}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${gap.required}%` }}
                        />
                      </div>
                    </div>

                    {/* Gap Size */}
                    <div className="p-2 bg-red-50 rounded text-xs">
                      <span className="text-muted-foreground">{ar ? "حجم الفجوة" : "Gap Size"}:</span>
                      <span className="font-semibold ml-2 text-red-600">{Math.round(gap.gap)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Gaps */}
        {gaps && gaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "جميع الفجوات" : "All Gaps"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gaps.map((gap: any) => (
                  <div key={gap.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{gap.competency}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {gap.severity}
                      </Badge>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">{ar ? "الحالي" : "Current"}:</span>
                        <p className="font-semibold">{Math.round(gap.current)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{ar ? "المطلوب" : "Required"}:</span>
                        <p className="font-semibold">{Math.round(gap.required)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{ar ? "الفجوة" : "Gap"}:</span>
                        <p className="font-semibold text-red-600">{Math.round(gap.gap)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "التوصيات" : "Recommendations"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{rec.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {rec.impact} {ar ? "تأثير" : "impact"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span>{ar ? "مدة التنفيذ" : "Duration"}:</span>
                      <span className="font-semibold">{rec.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
