"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, TrendingUp, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function CompetenciesCompetencyGapAnalysisView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("gap");

  useEffect(() => {
    fetchGapAnalysis();
  }, []);

  const fetchGapAnalysis = async () => {
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

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "تحليل الفجوات" : "Gap Analysis"}
          description={ar ? "تحليل الفجوات في كفاءاتك" : "Analyze the gaps in your competencies"}
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

  const { gaps, summary, recommendations, chartData } = data;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const sortedGaps = [...gaps].sort((a, b) => {
    if (sortBy === "gap") return b.gap - a.gap;
    if (sortBy === "current") return a.currentLevel - b.currentLevel;
    return b.targetLevel - a.targetLevel;
  });

  return (
    <>
      <PageHeader
        title={ar ? "تحليل الفجوات" : "Gap Analysis"}
        description={ar ? "تحديد الفجوات في مهاراتك والمسار الأمثل للتطور" : "Identify skill gaps and optimal development paths"}
      />

      <div className="space-y-6 pb-12">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "إجمالي الفجوات" : "Total Gaps"}
                </p>
                <p className="text-2xl font-bold mt-2">{summary.totalGaps}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "متوسط الفجوة" : "Avg Gap"}
                </p>
                <p className="text-2xl font-bold mt-2">{summary.avgGap}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "فجوات حرجة" : "Critical"}
                </p>
                <p className="text-2xl font-bold mt-2 text-red-600">{summary.criticalCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "متوسط المستوى" : "Avg Level"}
                </p>
                <p className="text-2xl font-bold mt-2">{summary.avgCurrentLevel}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData && chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "مقارنة المستويات الحالية والمستهدفة" : "Current vs Target Levels"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#3b82f6" />
                  <Bar dataKey="target" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Sort Options */}
        <div className="flex gap-2">
          <Button
            variant={sortBy === "gap" ? "default" : "outline"}
            onClick={() => setSortBy("gap")}
            size="sm"
          >
            {ar ? "ترتيب حسب الفجوة" : "Sort by Gap"}
          </Button>
          <Button
            variant={sortBy === "current" ? "default" : "outline"}
            onClick={() => setSortBy("current")}
            size="sm"
          >
            {ar ? "ترتيب حسب المستوى الحالي" : "Sort by Current"}
          </Button>
          <Button
            variant={sortBy === "target" ? "default" : "outline"}
            onClick={() => setSortBy("target")}
            size="sm"
          >
            {ar ? "ترتيب حسب المستهدف" : "Sort by Target"}
          </Button>
        </div>

        {/* Gap Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{ar ? "تفاصيل الفجوات" : "Gap Details"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedGaps.map((gapItem) => (
                <div key={gapItem.competencyId} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{gapItem.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{gapItem.category}</p>
                    </div>
                    <Badge className={getPriorityColor(gapItem.priority)}>
                      {gapItem.priority}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{ar ? "المستوى الحالي" : "Current"}</p>
                      <p className="text-lg font-bold text-blue-600">{gapItem.currentLevel}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{ar ? "المستوى المستهدف" : "Target"}</p>
                      <p className="text-lg font-bold text-green-600">{gapItem.targetLevel}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{ar ? "الفجوة" : "Gap"}</p>
                      <p className="text-lg font-bold text-red-600">{gapItem.gap}%</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${gapItem.currentLevel}%` }}
                    />
                  </div>

                  {gapItem.recommendation && (
                    <p className="text-xs text-muted-foreground">{gapItem.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                {ar ? "التوصيات الذكية" : "AI Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                      {rec.resources && (
                        <div className="flex gap-2 mt-2">
                          {rec.resources.map((resource, ridx) => (
                            <Button
                              key={ridx}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => window.open(resource.url, "_blank")}
                            >
                              {resource.type}
                            </Button>
                          ))}
                        </div>
                      )}
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
