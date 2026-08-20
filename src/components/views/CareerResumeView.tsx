"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle, Sparkles, Plus } from "lucide-react";

export function CareerResumeView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeContent, setResumeContent] = useState("");
  const [template, setTemplate] = useState("modern");
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/career/resume");
        if (!response.ok) throw new Error("Failed to fetch resume data");
        const result = await response.json();
        setData(result.data);
        setResumeContent(result.data?.resume || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveResume = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/v1/student/career/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: resumeContent, template }),
      });

      if (!response.ok) throw new Error("Failed to save resume");
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiReview = async () => {
    try {
      setAiGenerating(true);
      const response = await fetch("/api/v1/student/career/ai-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: resumeContent }),
      });

      if (!response.ok) throw new Error("Failed to generate AI review");
      const result = await response.json();
      setData(prev => ({ ...prev, lastReview: result.data.review }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate review");
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={ar ? "السيرة الذاتية" : "Resume"} />
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={ar ? "السيرة الذاتية" : "Resume"} />
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-destructive">{error}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "السيرة الذاتية" : "Resume"}
        description={ar ? "أنشئ وحسّن سيرتك الذاتية باستخدام نماذج احترافية" : "Build and improve your resume with professional templates"}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {ar ? "محرر السيرة الذاتية" : "Resume Editor"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {ar ? "اختر النموذج" : "Choose Template"}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["modern", "classic", "creative", "ats-friendly"].map(t => (
                    <Button
                      key={t}
                      variant={template === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTemplate(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {ar ? "محتوى السيرة الذاتية" : "Resume Content"}
                </label>
                <textarea
                  value={resumeContent}
                  onChange={e => setResumeContent(e.target.value)}
                  placeholder={ar ? "أدخل محتوى السيرة الذاتية..." : "Enter your resume content..."}
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm min-h-96"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveResume}
                  disabled={submitting || !resumeContent.trim()}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {ar ? "حفظ" : "Save"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleAiReview}
                  disabled={aiGenerating || !resumeContent.trim()}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {ar ? "مراجعة الذكاء الاصطناعي" : "AI Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {data?.lastReview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {ar ? "آخر مراجعة" : "Last Review"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {data.lastReview.score && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {ar ? "درجة الجودة" : "Quality Score"}
                    </div>
                    <div className="text-lg font-bold">{data.lastReview.score}/100</div>
                  </div>
                )}

                {data.lastReview.strengths?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      {ar ? "نقاط القوة" : "Strengths"}
                    </div>
                    <div className="space-y-1">
                      {data.lastReview.strengths.map((s: string, i: number) => (
                        <div key={i} className="text-xs">✓ {s}</div>
                      ))}
                    </div>
                  </div>
                )}

                {data.lastReview.improvements?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      {ar ? "التحسينات المقترحة" : "Suggested Improvements"}
                    </div>
                    <div className="space-y-1">
                      {data.lastReview.improvements.map((imp: string, i: number) => (
                        <div key={i} className="text-xs">• {imp}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {ar ? "تم المراجعة:" : "Reviewed:"} {new Date(data.lastReview.date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {ar ? "نماذج قابلة للتحميل" : "Download Templates"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                {ar ? "اختر نموذجاً احترافياً لبدء العمل" : "Choose a professional template to get started"}
              </p>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                {ar ? "Modern Template" : "Modern Template"}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                {ar ? "Classic Template" : "Classic Template"}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                {ar ? "ATS-Friendly" : "ATS-Friendly"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
