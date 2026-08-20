"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Save, Brain, Sparkles, ChevronRight, Menu, FileText } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-query";

export function AiNotebookView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [selectedNotebook, setSelectedNotebook] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, isLoading: loading, error, refetch } = useApiQuery<{
    data: { notebooks: any[]; reviews: any[]; stats: any }
  }>(["ai", "notebook"], "/api/v1/student/ai/notebook");

  const { mutate: saveNotebook } = useApiMutation<{ success: boolean; data: any }>(
    (data) => ({ url: "/api/v1/student/ai/notebook", method: "PUT", body: data })
  );

  useEffect(() => {
    if (data?.data?.notebooks && data.data.notebooks.length > 0) {
      setSelectedNotebook(data.data.notebooks[0]);
      setContent(data.data.notebooks[0].content || "");
    }
  }, [data]);

  const handleSaveNotebook = async () => {
    if (!selectedNotebook) return;

    const result = await saveNotebook({
      id: selectedNotebook.id,
      content,
      title: selectedNotebook.title,
    });

    if (result?.success) refetch();
  };

  const handleAutoSummarize = async () => {
    setIsGenerating(true);
    // Simulate AI summary generation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const summary = content.substring(0, 200) + "...";
    alert(ar ? `تمت إنشاء ملخص تلقائي: ${summary}` : `Auto-generated summary: ${summary}`);
    setIsGenerating(false);
  };

  const handleInlineSuggestion = () => {
    // Simulate inline AI suggestion
    const suggestion = ar ? "هنا اقتراح مساعد ذكي..." : "Here's an AI suggestion...";
    setContent(prev => prev + (prev ? "\n\n" : "") + suggestion);
  };

  if (loading) return (
    <><PageHeader title={ar ? "دفتر الذكاء الاصطناعي" : "AI Notebook"} />
      <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}</div></>
  );
  if (error || !data?.data) return errorState(ar);

  const { notebooks, reviews, stats } = data.data;

  return (
    <>
      <PageHeader title={ar ? "دفتر الذكاء الاصطناعي" : "AI Notebook"}
        description={ar ? `${stats.totalNotebooks} دفاتر | ${stats.totalReviews} مراجعات` : `${stats.totalNotebooks} notebooks | ${stats.totalReviews} reviews`} />

      <div className="grid gap-4 lg:grid-cols-12 h-[calc(100vh-200px)] pb-12">
        {/* Sidebar - Notebooks List */}
        <div className={`lg:col-span-3 ${showSidebar ? "block" : "hidden lg:block"} lg:block`}>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-iscarb-green" />
                {ar ? "الدفاتر" : "Notebooks"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="space-y-1">
                {notebooks.map((notebook: any) => (
                  <div
                    key={notebook.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedNotebook?.id === notebook.id ? "bg-iscarb-green/10" : "hover:bg-accent/50"
                      }`}
                    onClick={() => {
                      setSelectedNotebook(notebook);
                      setContent(notebook.content || "");
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px]">{notebook.status}</Badge>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(notebook.updatedAt || notebook.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium truncate">{notebook.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-1">{notebook.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardContent className="p-2 border-t border-border/40">
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => { }}>
                <Save className="h-3 w-3 mr-1" />
                {ar ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Editor Area */}
        <Card className="lg:col-span-9 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/40 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-iscarb-green" />
              <CardTitle className="text-base">
                {selectedNotebook?.title || ar ? "دفتر جديد" : "New Notebook"}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={handleAutoSummarize} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Brain className="h-3 w-3 mr-1" />
                )}
                {ar ? "ملخص تلقائي" : "Auto-Summarize"}
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={handleSaveNotebook}>
                <Save className="h-3 w-3 mr-1" />
                {ar ? "حفظ" : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* AI Sidebar Toggle */}
            <div className="flex items-center justify-between">
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowSidebar(!showSidebar)}>
                <Menu className="h-4 w-4 mr-1" />
                {showSidebar ? ar ? "إخفاء" : "Hide" : ar ? "عرض" : "Show"} AI Sidebar
              </Button>
              <span className="text-xs text-muted-foreground">{ar ? "المحتوى: " : "Content: "}{content.length} {ar ? "حرف" : "chars"}</span>
            </div>

            {/* Editor */}
            <div className="relative">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={ar ? "اكتب محتوى الدفتر..." : "Type notebook content..."}
                className="min-h-[400px] resize-none font-mono text-sm"
              />

              {/* Inline Suggestions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-iscarb-cyan/10 text-iscarb-cyan hover:bg-iscarb-cyan/20"
                  onClick={handleInlineSuggestion}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {ar ? "اقتراح" : "Suggest"}
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Button size="sm" variant="outline" className="justify-start text-xs h-auto py-2" onClick={handleAutoSummarize}>
                <Brain className="h-3 w-3 mr-2" />
                {ar ? "ملخص هذا القسم" : "Summarize this section"}
              </Button>
              <Button size="sm" variant="outline" className="justify-start text-xs h-auto py-2" onClick={() => { }}>
                <Brain className="h-3 w-3 mr-2" />
                {ar ? "توسيع المحتوى" : "Expand content"}
              </Button>
              <Button size="sm" variant="outline" className="justify-start text-xs h-auto py-2" onClick={() => { }}>
                <Sparkles className="h-3 w-3 mr-2" />
                {ar ? "تحسين الكتابة" : "Improve writing"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Sidebar */}
        {showSidebar && (
          <div className="lg:col-span-3 hidden lg:block">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2 border-b border-border/40">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-iscarb-cyan" />
                  {ar ? "المساعد الذكي" : "AI Assistant"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 flex-1">
                {/* Quick Q&A */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">{ar ? "اسأل حول المحتوى" : "Ask about content"}</label>
                  <Textarea
                    className="text-xs h-24"
                    placeholder={ar ? "اكتب سؤالك..." : "Ask a question..."}
                  />
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {ar ? "سؤال" : "Ask"}
                  </Button>
                </div>

                {/* AI Suggestions */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">{ar ? "اقتراحات الذكاء الاصطناعي" : "AI Suggestions"}</label>
                  <div className="p-3 rounded-lg bg-accent/30 text-xs space-y-2">
                    <p className="text-muted-foreground">{ar ? "• يمكننا تحسين هذا القسم" : "• This section could be improved"}</p>
                    <p className="text-muted-foreground">{ar ? "• أضف أمثلة عملية" : "• Add practical examples"}</p>
                    <p className="text-muted-foreground">{ar ? "• استخدم لغة أوضح" : "• Use clearer language"}</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">{ar ? "النشاط الحديث" : "Recent Activity"}</label>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-iscarb-green" />
                      <span>{ar ? "تم الحفظ: " : "Saved: "}{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-iscarb-cyan" />
                      <span>{ar ? "تم التوليد: " : "Generated: "}{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{ar ? "المراجعات والتعليقات" : "Reviews & Feedback"}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.slice(0, 4).map((review: any) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">{review.status}</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(review.reviewDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{review.feedback}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{ar ? "التقييم:" : "Rating:"}</span>
                    <span className="text-xs font-bold text-iscarb-green">{review.rating}/5</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function errorState(ar: boolean) {
  return (
    <><PageHeader title={ar ? "دفتر الذكاء الاصطناعي" : "AI Notebook"} />
      <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
      </CardContent></Card></>
  );
}
