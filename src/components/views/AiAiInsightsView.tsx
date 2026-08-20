"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Lightbulb, Target } from "lucide-react";

export function AiAiInsightsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="AI Insights"
      titleAr="رؤى الذكاء الاصطناعي"
      apiEndpoint="/api/v1/student/ai/insights"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: "AI", href: "/student/ai" },
        { label: ar ? "الرؤى" : "Insights", href: "/student/ai/ai/insights" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "رؤى التعلم" : "Learning Insights"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.learningInsights || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "توصيات" : "Recommendations"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.recommendations || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "أنماط" : "Patterns"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.patterns || 0}</p>
              </CardContent>
            </Card>
          </div>
          {data?.insights?.map((insight: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="font-medium text-sm">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}
