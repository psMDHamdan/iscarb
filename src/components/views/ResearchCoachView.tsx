"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Send, Sparkles } from "lucide-react";

export function ResearchCoachView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/research/ai-coach");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load research coach");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) return;

    try {
      setAiLoading(true);
      setAiResponse(null);

      const response = await fetch("/api/v1/student/research/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) throw new Error("Failed to get AI response");

      const reader = response.body?.getReader();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += new TextDecoder().decode(value);
          setAiResponse(fullResponse);
        }
      }

      setQuestion("");
    } catch (err) {
      setAiResponse(ar ? "حدث خطأ أثناء الحصول على الرد" : "Error getting AI response");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "مدرب البحث" : "Research Coach"}
          description={ar ? "احصل على إرشادات بحثية شخصية من الذكاء الاصطناعي" : "Get personalized research guidance from AI"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <PageHeader
          title={ar ? "مدرب البحث" : "Research Coach"}
          description={ar ? "احصل على إرشادات بحثية شخصية من الذكاء الاصطناعي" : "Get personalized research guidance from AI"}
        />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
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

  return (
    <>
      <PageHeader
        title={ar ? "مدرب البحث" : "Research Coach"}
        description={ar ? "احصل على إرشادات بحثية شخصية من الذكاء الاصطناعي" : "Get personalized research guidance from AI"}
      />

      <div className="space-y-8 pb-12">
        {/* Quick Tips */}
        {data?.tips && data.tips.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">{ar ? "نصائح سريعة" : "Quick Tips"}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {data.tips.map((tip: any, idx: number) => (
                <Card key={idx} className="border-l-4 border-l-iscarb-green">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-iscarb-green">{tip.title}</p>
                    <p className="text-sm text-muted-foreground mt-2">{tip.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ask AI Coach */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-iscarb-green" />
                {ar ? "اسأل مدرب البحث" : "Ask Research Coach"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={ar ? "اسأل أي سؤال متعلق بالبحث..." : "Ask any research-related question..."}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-24"
                disabled={aiLoading}
              />
              <Button
                onClick={handleAsk}
                disabled={!question.trim() || aiLoading}
                className="w-full"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {ar ? "جاري المعالجة..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {ar ? "إرسال" : "Send"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* AI Response */}
          {aiResponse && (
            <Card className="mt-4 bg-gradient-to-r from-iscarb-green/5 to-blue-500/5">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-iscarb-green mb-3">{ar ? "رد المدرب" : "Coach Response"}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Research Methodologies */}
        {data?.methodologies && data.methodologies.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">{ar ? "منهجيات البحث الموصى بها" : "Recommended Research Methodologies"}</h3>
            <div className="space-y-4">
              {data.methodologies.map((method: any) => (
                <Card key={method.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{method.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {method.steps?.map((step: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{step}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {data?.resources && data.resources.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">{ar ? "الموارد المفيدة" : "Helpful Resources"}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {data.resources.map((resource: any) => (
                <Card key={resource.id}>
                  <CardContent className="p-4">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-iscarb-green hover:underline font-semibold text-sm"
                    >
                      {resource.title}
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">{resource.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
