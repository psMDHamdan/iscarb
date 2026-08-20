"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Sparkles, Brain, Lightbulb, TrendingUp, Target, Send, RefreshCw, ChevronDown, ChevronUp, Star, Zap, MessageCircle, Clock, Award, CheckCircle2 } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  learning: Brain,
  academic: TrendingUp,
  career: Target,
  competency: Lightbulb,
  wellness: Sparkles,
};

const categoryColors: Record<string, string> = {
  learning: "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20",
  academic: "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20",
  career: "border-purple-200 bg-purple-50/50 dark:bg-purple-950/20",
  competency: "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20",
  wellness: "border-rose-200 bg-rose-50/50 dark:bg-rose-950/20",
};

const categoryBadgeColors: Record<string, string> = {
  learning: "bg-blue-100 text-blue-700",
  academic: "bg-emerald-100 text-emerald-700",
  career: "bg-purple-100 text-purple-700",
  competency: "bg-amber-100 text-amber-700",
  wellness: "bg-rose-100 text-rose-700",
};

export function DashboardAIInsightsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [askQuery, setAskQuery] = useState("");
  const [askResult, setAskResult] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const { data, isLoading: loading, error, refetch } = useApiQuery<{
    data: {
      insights: {
        title: string; titleAr: string; category: string;
        content: string; contentAr: string;
        source: string; actionable: boolean;
        confidence: number;
        explanation: string; explanationAr: string;
        generatedAt: string;
      }[];
      generatedAt: string;
    }
  }>(
    ["dashboard", "ai-insights"],
    "/api/v1/student/dashboard/ai-insights"
  );

  const insightsData = data?.data;
  const filteredInsights = insightsData?.insights?.filter(
    (insight: any) => !filterCategory || insight.category === filterCategory
  );
  const uniqueCategories = [...new Set(insightsData?.insights?.map((i: any) => i.category) || [])];

  const handleAskAI = async () => {
    if (!askQuery.trim()) return;
    setAskLoading(true);
    setAskResult(null);
    try {
      const r = await fetch("/api/v1/student/dashboard/ai-advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: askQuery }),
      });
      const result = await r.json();
      setAskResult(result?.data?.response || (ar ? "لم يتم العثور على إجابة" : "No answer found"));
    } catch {
      setAskResult(ar ? "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى." : "Sorry, an error occurred. Please try again.");
    } finally {
      setAskLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "رؤى الذكاء الاصطناعي" : "AI Insights"} description={ar ? "توصيات مخصصة من iSCARB AI" : "Personalized recommendations from iSCARB AI"} />
        <div className="space-y-4">
          <Card>
            <CardContent className="p-12 flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
              <p className="text-sm text-muted-foreground">{ar ? "جاري تحليل بياناتك..." : "Analyzing your data..."}</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !insightsData) {
    return (
      <>
        <PageHeader title={ar ? "رؤى الذكاء الاصطناعي" : "AI Insights"} />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{ar ? "خطأ في تحميل الرؤى" : "Error Loading Insights"}</h4>
              <p className="text-sm mt-1 text-muted-foreground">
                {error instanceof Error ? error.message : (ar ? "تعذر الاتصال بـ iSCARB AI" : "Could not connect to iSCARB AI")}
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  {ar ? "إعادة تحميل" : "Retry"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const insights = insightsData.insights;
  const hasInsights = insights && insights.length > 0;

  return (
    <>
      <PageHeader
        title={ar ? "رؤى الذكاء الاصطناعي" : "AI Insights"}
        description={ar ? "تحليلات ذكية وتوصيات شخصية من iSCARB AI" : "Smart analytics and personalized recommendations from iSCARB AI"}
      />

      <div className="space-y-6 pb-12">
        {/* Ask AI Section */}
        <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-iscarb-cyan/10">
                <MessageCircle className="h-5 w-5 text-iscarb-cyan" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{ar ? "اسأل iSCARB AI" : "Ask iSCARB AI"}</h3>
                <p className="text-xs text-muted-foreground">{ar ? "اطرح أي سؤال عن أدائك الأكاديمي" : "Ask anything about your academic performance"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAskAI(); } }}
                placeholder={ar ? "مثال: كيف أحسن معدلي التراكمي؟" : "e.g., How can I improve my GPA?"}
                className="flex-1"
                disabled={askLoading}
              />
              <Button
                size="sm"
                onClick={handleAskAI}
                disabled={askLoading || !askQuery.trim()}
                className="bg-iscarb-cyan hover:bg-iscarb-cyan/90 text-white gap-1 shrink-0"
              >
                {askLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {ar ? "اسأل" : "Ask"}
              </Button>
            </div>
            {askResult && (
              <div className="mt-3 p-3 rounded-lg bg-white/80 dark:bg-background/80 border border-iscarb-cyan/20">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-iscarb-cyan shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{askResult}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Bar */}
        {hasInsights && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant={filterCategory === null ? "default" : "outline"}
                onClick={() => setFilterCategory(null)}
                className={`text-xs ${filterCategory === null ? "bg-iscarb-cyan/80 text-white" : ""}`}
              >
                {ar ? "الكل" : "All"}
              </Button>
              {uniqueCategories.map((cat: string) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={filterCategory === cat ? "default" : "outline"}
                  onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                  className={`text-xs capitalize ${
                    filterCategory === cat
                      ? "bg-iscarb-cyan/80 text-white"
                      : ""
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {insightsData.generatedAt && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {ar ? "آخر تحديث" : "Updated"}: {new Date(insightsData.generatedAt).toLocaleTimeString()}
                </span>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetch()}
                className="text-xs gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                {ar ? "تحديث" : "Refresh"}
              </Button>
            </div>
          </div>
        )}

        {hasInsights && filteredInsights ? (
          <div className="space-y-4">
            {filteredInsights.map((insight: any, idx: number) => {
              const Icon = categoryIcons[insight.category] || Sparkles;
              const cardStyle = categoryColors[insight.category] || "border-blue-200 bg-blue-50/50";
              const isExpanded = expandedInsight === idx;

              return (
                <Card
                  key={idx}
                  className={`${cardStyle} hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer`}
                  onClick={() => setExpandedInsight(isExpanded ? null : idx)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background/80 dark:bg-background/50 shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{ar && insight.titleAr ? insight.titleAr : insight.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`text-[9px] ${categoryBadgeColors[insight.category] || ""}`}
                            >
                              {insight.category}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {ar ? "المصدر:" : "Source:"} {insight.source}
                            </span>
                            {insight.actionable && (
                              <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-600 bg-emerald-50">
                                <Zap className="h-2.5 w-2.5 mr-1" />{ar ? "قابل للتنفيذ" : "Actionable"}
                              </Badge>
                            )}
                            {/* Confidence indicator */}
                            <div className="flex items-center gap-1 text-[9px]">
                              <Star className={`h-2.5 w-2.5 ${insight.confidence >= 80 ? "text-emerald-500" : insight.confidence >= 60 ? "text-amber-500" : "text-muted-foreground"}`} />
                              <span className="text-muted-foreground">{insight.confidence}% {ar ? "ثقة" : "confidence"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {ar && insight.contentAr ? insight.contentAr : insight.content}
                    </p>

                    {/* Explanation (collapsible) */}
                    {isExpanded && (insight.explanation || insight.explanationAr) && (
                      <div className="mt-3 p-3 rounded-lg bg-white/50 dark:bg-background/50 border border-border/40">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs font-semibold">{ar ? "الشرح" : "Explanation"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ar && insight.explanationAr ? insight.explanationAr : insight.explanation}
                        </p>
                      </div>
                    )}

                    {/* Confidence bar (when expanded) */}
                    {isExpanded && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground">{ar ? "مستوى الثقة" : "Confidence"}:</span>
                        <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[200px]">
                          <div
                            className={`h-1.5 rounded-full ${
                              insight.confidence >= 80 ? "bg-emerald-500" : insight.confidence >= 60 ? "bg-amber-500" : "bg-muted-foreground/30"
                            }`}
                            style={{ width: `${insight.confidence}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-medium">{insight.confidence}%</span>
                      </div>
                    )}

                    {/* Action button for actionable insights */}
                    {insight.actionable && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline" className="text-xs text-iscarb-cyan-dark border-iscarb-cyan/30">
                          <Target className="h-3 w-3 mr-1" />
                          {ar ? "اتخذ إجراء" : "Take Action"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 flex flex-col items-center text-center">
              <Brain className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">{ar ? "لا توجد رؤى متاحة حالياً" : "No insights available yet"}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {ar ? "سيتم إنشاء الرؤى بناءً على نشاطك الأكاديمي" : "Insights will be generated based on your academic activity"}
              </p>
              <Button size="sm" variant="outline" className="mt-4 gap-1" onClick={() => refetch()}>
                <RefreshCw className="h-3 w-3" />
                {ar ? "تحديث" : "Refresh"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
