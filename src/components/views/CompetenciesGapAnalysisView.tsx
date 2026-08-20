"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, TrendingDown, Target, BookOpen, CheckCircle2, ArrowRight } from "lucide-react";

interface GapItem {
  id: string;
  name: string;
  category: string;
  current: number;
  target: number;
  gap: number;
  priority: "critical" | "high" | "medium" | "low";
  evidenceCount: number;
  lastAssessed: string | null;
}

interface Recommendation {
  competencyId: string;
  competencyName: string;
  recommendation: string;
  suggestedActions: string[];
  estimatedTime: string;
  resources: any[];
}

interface GapData {
  gaps: GapItem[];
  stats: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    totalGaps: number;
    avgGap: number;
  };
  recommendations: Recommendation[];
}

const PRIORITY_CONFIG: Record<string, { label: string; labelAr: string; color: string; bg: string; border: string; badge: "default" | "secondary" | "outline" | "destructive" }> = {
  critical: { label: "Critical", labelAr: "حرجة", color: "text-red-700", bg: "bg-red-50 dark:bg-red-900/10", border: "border-red-300", badge: "destructive" },
  high: { label: "High", labelAr: "عالية", color: "text-orange-700", bg: "bg-orange-50 dark:bg-orange-900/10", border: "border-orange-300", badge: "secondary" },
  medium: { label: "Medium", labelAr: "متوسطة", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-300", badge: "outline" },
  low: { label: "Low", labelAr: "منخفضة", color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200", badge: "outline" },
};

export function CompetenciesGapAnalysisView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/v1/student/competencies/gap")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "تحليل الفجوات" : "Gap Analysis"}
          description={ar ? "تحديد فجوات الكفاءة وأولويات التطوير" : "Identify competency gaps and development priorities"}
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
        <PageHeader title={ar ? "تحليل الفجوات" : "Gap Analysis"} />
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

  const filtered = activeFilter === "all"
    ? data.gaps
    : data.gaps.filter((g) => g.priority === activeFilter);

  return (
    <>
      <PageHeader
        title={ar ? "تحليل الفجوات" : "Gap Analysis"}
        description={ar ? "مقارنة مستوياتك الحالية بالأهداف المطلوبة وتحديد أولويات التطوير" : "Compare current levels to target requirements and highlight learning priorities"}
      />

      <div className="space-y-6 pb-12">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: ar ? "إجمالي الفجوات" : "Total Gaps", value: data.stats.totalGaps, color: "" },
            { label: ar ? "فجوات حرجة" : "Critical", value: data.stats.critical, color: "text-red-600" },
            { label: ar ? "عالية الأولوية" : "High Priority", value: data.stats.high, color: "text-orange-600" },
            { label: ar ? "متوسط الفجوة" : "Avg Gap", value: `${data.stats.avgGap}%`, color: "" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Priority breakdown */}
        {data.stats.totalGaps > 0 && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">{ar ? "توزيع الأولوية" : "Priority Distribution"}</h3>
              <div className="grid gap-3 sm:grid-cols-4">
                {(["critical", "high", "medium", "low"] as const).map((priority) => {
                  const cfg = PRIORITY_CONFIG[priority];
                  const count = data.stats[priority];
                  const pct = data.stats.totalGaps > 0 ? Math.round((count / data.stats.totalGaps) * 100) : 0;
                  return (
                    <div key={priority} className={`rounded-lg p-3 border ${cfg.bg} ${cfg.border}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${cfg.color}`}>{ar ? cfg.labelAr : cfg.label}</span>
                        <span className={`text-lg font-bold ${cfg.color}`}>{count}</span>
                      </div>
                      <Progress value={pct} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        {data.gaps.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {["all", "critical", "high", "medium", "low"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${activeFilter === f
                    ? "bg-iscarb-green text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {f === "all" ? (ar ? "الكل" : "All") : (ar ? PRIORITY_CONFIG[f]?.labelAr : f)}
                {f !== "all" && ` (${data.stats[f as keyof typeof data.stats] || 0})`}
              </button>
            ))}
          </div>
        )}

        {/* Gap Cards */}
        {filtered.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-4 w-4" />
                {ar ? "الفجوات المكتشفة" : "Identified Gaps"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtered.map((gap) => {
                  const cfg = PRIORITY_CONFIG[gap.priority];
                  return (
                    <div key={gap.id} className={`border rounded-lg p-4 ${cfg.bg} ${cfg.border}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className={`font-semibold text-sm ${cfg.color}`}>{gap.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">{gap.category}</p>
                        </div>
                        <Badge variant={cfg.badge} className="text-xs ml-2 shrink-0 capitalize">
                          {ar ? cfg.labelAr : cfg.label}
                        </Badge>
                      </div>

                      {/* Current vs Target comparison */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{ar ? "المستوى الحالي" : "Current Level"}</span>
                            <span className="font-semibold">{gap.current}%</span>
                          </div>
                          <Progress value={gap.current} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{ar ? "المستوى المستهدف" : "Target Level"}</span>
                            <span className="font-semibold">{gap.target}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                            <div
                              className="h-full bg-gray-400 rounded-full"
                              style={{ width: `${gap.target}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10 text-xs">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>{gap.evidenceCount} {ar ? "أدلة" : "evidence"}</span>
                          {gap.lastAssessed && (
                            <span>{ar ? "آخر تقييم" : "Last assessed"}: {new Date(gap.lastAssessed).toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
                          )}
                        </div>
                        <span className={`font-bold text-sm ${cfg.color}`}>
                          {ar ? "الفجوة" : "Gap"}: {gap.gap}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : data.gaps.length === 0 ? null : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {ar ? "لا توجد فجوات بهذه الأولوية" : "No gaps with this priority"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-iscarb-blue" />
                {ar ? "توصيات التطوير" : "Development Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recommendations.map((rec, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm flex-1">{rec.competencyName}</h4>
                      <Badge variant="outline" className="text-xs ml-2 shrink-0">{rec.estimatedTime}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{rec.recommendation}</p>
                    {rec.suggestedActions.length > 0 && (
                      <div className="space-y-1.5">
                        {rec.suggestedActions.map((action, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <ArrowRight className="h-3 w-3 text-iscarb-green shrink-0" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state — no gaps */}
        {data.gaps.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{ar ? "لا توجد فجوات!" : "No gaps identified!"}</h3>
              <p className="text-sm text-muted-foreground">
                {ar ? "ممتاز! حققت جميع أهدافك في الكفاءات" : "Excellent! You've achieved all your competency targets"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
