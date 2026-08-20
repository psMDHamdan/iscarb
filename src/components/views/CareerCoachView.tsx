"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useStudentData } from "@/hooks/useStudentData";
import { useAI } from "@/hooks/useAI";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Loader2, Sparkles, AlertCircle, CheckCircle } from "lucide-react";

interface CoachingResponse {
  id: string;
  topic: string;
  advice: string;
  actionItems: string[];
  resources: Array<{
    type: string;
    title: string;
    url?: string;
  }>;
  timelineWeeks: number;
  successMetrics: string[];
}

interface StudentProfile {
  id: string;
  name: string;
  program: string;
  college: string;
  readinessScore: number;
}

export function CareerCoachView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: studentData, loading: studentLoading } = useStudentData<StudentProfile>(
    "/api/iscarb/student/profile"
  );
  const { trackEvent } = useAnalytics();
  const [topic, setTopic] = useState("");
  const [goalType, setGoalType] = useState<"technical" | "leadership" | "soft-skills" | "general">("general");
  const [coachingResponse, setCoachingResponse] = useState<CoachingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAction, setExpandedAction] = useState<number | null>(null);

  const handleGenerateCoaching = async () => {
    if (!topic.trim()) {
      setError("Please enter a coaching topic");
      return;
    }

    setLoading(true);
    setError(null);
    trackEvent("ai_feature_used", { feature: "career_coach", topic });

    try {
      const response = await fetch("/api/v1/student/career/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          goalType,
          context: studentData ? `Student in ${studentData.program} at ${studentData.college}` : "",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate coaching");

      const result = await response.json();
      setCoachingResponse(result.data);
      trackEvent("coaching_generated", { topic, items: result.data.actionItems.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate coaching";
      setError(msg);
      trackEvent("coaching_error", { topic, error: msg });
    } finally {
      setLoading(false);
    }
  };

  if (studentLoading) {
    return (
      <div className={`min-h-full bg-gradient-to-br from-indigo-50 to-blue-50 p-6 ${ar ? "rtl" : "ltr"}`}>
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full bg-gradient-to-br from-indigo-50 to-blue-50 p-6 ${ar ? "rtl" : "ltr"}`}>
      <div className="max-w-5xl mx-auto space-y-8">
        <PageHeader
          title={ar ? "مدرب الحياة المهنية" : "Career Coach"}
          description={ar ? "احصل على تدريب شخصي متقدم وأهداف مهنية" : "Get personalized AI coaching and career guidance"}
          eyebrow={
            <div className="flex items-center gap-2 text-indigo-600">
              <Sparkles className="w-4 h-4" />
              {ar ? "مدعوم بالذكاء الاصطناعي" : "AI-Powered"}
            </div>
          }
        />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-2 border-indigo-100 bg-white">
          <CardHeader>
            <CardTitle>{ar ? "اطلب التدريب" : "Request Coaching"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ar ? "موضوع التدريب" : "Coaching Topic"}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={ar ? "مثال: الإعداد للمقابلات أو تطوير المهارات" : "e.g., Interview prep, skill development"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ar ? "نوع الهدف" : "Goal Type"}
                </label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="general">{ar ? "عام" : "General"}</option>
                  <option value="technical">{ar ? "تقني" : "Technical"}</option>
                  <option value="leadership">{ar ? "قيادة" : "Leadership"}</option>
                  <option value="soft-skills">{ar ? "المهارات الناعمة" : "Soft Skills"}</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleGenerateCoaching}
              disabled={loading || !topic.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {ar ? "جاري التدريب..." : "Generating Coaching..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {ar ? "احصل على التدريب" : "Get Coaching"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {coachingResponse && (
          <div className="space-y-6">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-green-900">{ar ? "نصيحة التدريب" : "Coaching Advice"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {coachingResponse.advice}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{ar ? "خطوات العمل" : "Action Items"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coachingResponse.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => setExpandedAction(expandedAction === idx ? null : idx)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{item}</p>
                          {expandedAction === idx && (
                            <p className="text-sm text-gray-600 mt-2">
                              {ar ? "اضغط للمتابعة مع الخطوة التالية" : "Click to track your progress"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{ar ? "الموارد المقترحة" : "Recommended Resources"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {coachingResponse.resources.map((resource, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{resource.type}</p>
                            <p className="text-sm text-gray-900 mt-1">{resource.title}</p>
                          </div>
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                              {ar ? "زيارة" : "Visit"}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{ar ? "معايير النجاح" : "Success Metrics"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {coachingResponse.successMetrics.map((metric, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2"></div>
                        <p className="text-sm text-gray-700">{metric}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-900 font-medium">
                      {ar ? "المدة المقترحة:" : "Recommended Timeline:"}
                    </p>
                    <p className="text-lg text-indigo-700 font-bold mt-1">
                      {coachingResponse.timelineWeeks} {ar ? "أسبوع" : "weeks"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!coachingResponse && !loading && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                {ar ? "أدخل موضوع التدريب أعلاه للحصول على إرشادات شخصية من مدربك الذكي" : "Enter a coaching topic above to get personalized guidance from your AI coach"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
