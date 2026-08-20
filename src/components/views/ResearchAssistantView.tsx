"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Sparkles, Send, Lightbulb, FileText, Zap } from "lucide-react";

export function ResearchAssistantView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolInput, setToolInput] = useState("");
  const [toolResponse, setToolResponse] = useState<string | null>(null);
  const [toolLoading, setToolLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/research/ai-assistant");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load research assistant");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToolRun = async () => {
    if (!selectedTool || !toolInput.trim()) return;

    try {
      setToolLoading(true);
      setToolResponse(null);

      const response = await fetch("/api/v1/student/research/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: selectedTool,
          input: toolInput,
        }),
      });

      if (!response.ok) throw new Error("Failed to run tool");

      const reader = response.body?.getReader();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += new TextDecoder().decode(value);
          setToolResponse(fullResponse);
        }
      }
    } catch (err) {
      setToolResponse(ar ? "حدث خطأ أثناء تشغيل الأداة" : "Error running tool");
    } finally {
      setToolLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "مساعد البحث" : "Research Assistant"}
          description={ar ? "أدوات الذكاء الاصطناعي لتسريع بحثك" : "AI tools to accelerate your research"}
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
          title={ar ? "مساعد البحث" : "Research Assistant"}
          description={ar ? "أدوات الذكاء الاصطناعي لتسريع بحثك" : "AI tools to accelerate your research"}
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

  const tools = [
    {
      id: "abstract-generator",
      name: ar ? "مولد الملخص" : "Abstract Generator",
      description: ar ? "توليد ملخص احترافي لدراستك" : "Generate a professional abstract for your study",
      icon: <FileText className="h-5 w-5" />,
      placeholder: ar ? "أدخل محتوى الدراسة..." : "Enter your study content...",
    },
    {
      id: "literature-synthesis",
      name: ar ? "تركيب أدبي" : "Literature Synthesis",
      description: ar ? "توليف الأدبيات المرتبطة بموضوعك" : "Synthesize related literature on your topic",
      icon: <Lightbulb className="h-5 w-5" />,
      placeholder: ar ? "أدخل موضوع البحث..." : "Enter your research topic...",
    },
    {
      id: "methodology-guide",
      name: ar ? "دليل المنهجية" : "Methodology Guide",
      description: ar ? "احصل على نصائح حول منهجية بحثك" : "Get guidance on your research methodology",
      icon: <Sparkles className="h-5 w-5" />,
      placeholder: ar ? "أدخل وصف منهجيتك..." : "Describe your methodology...",
    },
    {
      id: "citation-formatter",
      name: ar ? "منسق الاستشهادات" : "Citation Formatter",
      description: ar ? "تنسيق استشهاداتك تلقائياً" : "Format your citations automatically",
      icon: <Zap className="h-5 w-5" />,
      placeholder: ar ? "أدخل المراجع..." : "Enter your references...",
    },
  ];

  const selectedToolData = tools.find((t) => t.id === selectedTool);

  return (
    <>
      <PageHeader
        title={ar ? "مساعد البحث" : "Research Assistant"}
        description={ar ? "أدوات الذكاء الاصطناعي لتسريع بحثك" : "AI tools to accelerate your research"}
      />

      <div className="space-y-8 pb-12">
        {/* Tools Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{ar ? "الأدوات المتاحة" : "Available Tools"}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {tools.map((tool) => (
              <Card
                key={tool.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedTool === tool.id ? "ring-2 ring-iscarb-green" : ""
                }`}
                onClick={() => {
                  setSelectedTool(tool.id);
                  setToolInput("");
                  setToolResponse(null);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-iscarb-green">{tool.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{tool.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tool Interface */}
        {selectedToolData && (
          <Card className="bg-gradient-to-r from-iscarb-green/5 to-blue-500/5 border-iscarb-green/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedToolData.icon}
                {selectedToolData.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={selectedToolData.placeholder}
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                className="min-h-32"
                disabled={toolLoading}
              />

              <Button
                onClick={handleToolRun}
                disabled={!toolInput.trim() || toolLoading}
                className="w-full"
              >
                {toolLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {ar ? "جاري المعالجة..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {ar ? "تشغيل الأداة" : "Run Tool"}
                  </>
                )}
              </Button>

              {toolResponse && (
                <div className="p-4 bg-white dark:bg-slate-950 rounded-lg border">
                  <p className="text-xs font-semibold text-iscarb-green mb-2">{ar ? "النتيجة" : "Result"}</p>
                  <p className="text-sm whitespace-pre-wrap">{toolResponse}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Suggestions */}
        {data?.suggestions && data.suggestions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">{ar ? "الاقتراحات الذكية" : "Smart Suggestions"}</h3>
            <div className="space-y-3">
              {data.suggestions.map((suggestion: any, idx: number) => (
                <Card key={idx} className="border-l-4 border-l-iscarb-green">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-iscarb-green">{suggestion.title}</p>
                    <p className="text-sm text-muted-foreground mt-2">{suggestion.description}</p>
                    {suggestion.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setSelectedTool(suggestion.tool);
                          setToolInput(suggestion.input || "");
                        }}
                      >
                        {ar ? "تطبيق" : "Apply"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Usage Stats */}
        {data?.usage && (
          <Card>
            <CardHeader>
              <CardTitle>{ar ? "إحصائيات الاستخدام" : "Usage Statistics"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">{ar ? "الأدوات المستخدمة اليوم" : "Tools Used Today"}</p>
                  <p className="text-2xl font-bold mt-1">{data.usage.toolsUsedToday || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{ar ? "إجمالي الاستخدامات" : "Total Uses"}</p>
                  <p className="text-2xl font-bold mt-1">{data.usage.totalUses || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{ar ? "الأداة الأكثر استخداماً" : "Most Used Tool"}</p>
                  <p className="text-sm font-semibold mt-1">{data.usage.mostUsedTool || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
