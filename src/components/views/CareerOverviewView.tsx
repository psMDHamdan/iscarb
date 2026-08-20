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

interface CareerOverviewData {
  student: {
    id: string;
    name: string;
    program: string;
    readinessScore: number;
  };
  profile: {
    headline?: string;
    targetRoles: string[];
    linkedinUrl?: string;
  } | null;
  goals: {
    total: number;
    completed: number;
    active: number;
    items: Array<{
      id: string;
      title: string;
      category: string;
      priority: string;
      progress: number;
      targetDate?: string;
      status: string;
    }>;
  };
  applications: {
    total: number;
    applied: number;
    interviewing: number;
    rejected: number;
    placementStatus: string;
  };
  mockInterviews: {
    total: number;
    recent: Array<{
      id: string;
      type: string;
      targetRole?: string;
      score?: number;
      completedAt?: string;
    }>;
  };
  developmentPlan: {
    id: string;
    targetRole?: string;
    timeline?: number;
    skillsToAcquire: string[];
  } | null;
  aiInsights: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    confidence?: number;
    actionable: boolean;
  }>;
  intelligence: {
    targetRole?: string;
    readinessScore: number;
    jobMatchCount: number;
    estimatedTimeWeeks?: number;
  } | null;
}

export function CareerOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data, loading, error, refetch } = useStudentData<CareerOverviewData>(
    "/api/v1/student/career/overview"
  );
  const { trackEvent } = useAnalytics();
  const { generate: generateAI, response: aiResponse, loading: aiLoading } = useAI();
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    trackEvent("page_view", { section: "career", page: "overview" });
  }, [trackEvent]);

  if (loading) {
    return (
      <div className={`min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 ${ar ? "rtl" : "ltr"}`}>
        <div className="max-w-6xl mx-auto animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-full bg-gray-50 p-6 ${ar ? "rtl" : "ltr"}`}>
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              <h2 className="text-xl font-bold mb-2">
                {ar ? "خطأ في تحميل البيانات" : "Error Loading Career Overview"}
              </h2>
              <p className="mb-4">{error}</p>
              <Button onClick={refetch} variant="outline">
                {ar ? "إعادة محاولة" : "Retry"}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const overview = data as CareerOverviewData | null;
  if (!overview) {
    return (
      <div className={`min-h-full bg-gray-50 p-6 ${ar ? "rtl" : "ltr"}`}>
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-gray-600 mb-4">
            {ar ? "لا توجد بيانات مهنية حتى الآن" : "No career data available yet"}
          </p>
          <Button
            onClick={() => trackEvent("action", { action: "start_career_planning" })}
          >
            {ar ? "ابدأ التخطيط الوظيفي" : "Start Career Planning"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full bg-gradient-to-br from-gray-50 to-gray-100 ${ar ? "rtl" : "ltr"}`}>
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          <PageHeader
            title={ar ? "لوحة المسار الوظيفي" : "Career Dashboard"}
            description={ar
              ? `مرحباً ${overview.student.name} - رحلتك الوظيفية الشخصية`
              : `Welcome ${overview.student.name} - Your personalized career journey`}
          />

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card
              className="p-6 bg-white hover:shadow-lg transition cursor-pointer border-l-4 border-l-green-500"
              onClick={() => trackEvent("metric_view", { metric: "applications" })}
            >
              <h3 className="text-gray-600 text-sm font-semibold mb-2">
                {ar ? "الطلبات" : "Applications"}
              </h3>
              <div className="text-3xl font-bold text-green-600">
                {overview.applications?.total || 0}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {overview.applications?.interviewing || 0}{" "}
                {ar ? "قيد المقابلة" : "interviewing"}
              </p>
            </Card>

            <Card className="p-6 bg-white hover:shadow-lg transition border-l-4 border-l-blue-500">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">
                {ar ? "الأهداف النشطة" : "Active Goals"}
              </h3>
              <div className="text-3xl font-bold text-blue-600">
                {overview.goals?.active || 0}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {overview.goals?.completed || 0} {ar ? "مكتملة" : "completed"}
              </p>
            </Card>

            <Card className="p-6 bg-white hover:shadow-lg transition border-l-4 border-l-purple-500">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">
                {ar ? "المقابلات التدريبية" : "Mock Interviews"}
              </h3>
              <div className="text-3xl font-bold text-purple-600">
                {overview.mockInterviews?.total || 0}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {ar ? "تحضير شامل" : "Comprehensive prep"}
              </p>
            </Card>

            <Card className="p-6 bg-white hover:shadow-lg transition border-l-4 border-l-amber-500">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">
                {ar ? "درجة الجاهزية" : "Readiness Score"}
              </h3>
              <div className="text-3xl font-bold text-amber-600">
                {overview.intelligence?.readinessScore || overview.student?.readinessScore || 0}%
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {overview.intelligence?.jobMatchCount || 0}{" "}
                {ar ? "وظيفة مطابقة" : "matching jobs"}
              </p>
            </Card>
          </div>

          {/* Career Profile Section */}
          {overview.profile && (
            <Card className="p-6 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">
                    {ar ? "ملف المسار الوظيفي" : "Career Profile"}
                  </h2>
                  {overview.profile.headline && (
                    <p className="text-sm text-gray-600 mt-1">{overview.profile.headline}</p>
                  )}
                </div>
              </div>

              {overview.profile.targetRoles && overview.profile.targetRoles.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {ar ? "الأدوار المستهدفة" : "Target Roles"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {overview.profile.targetRoles.map((role, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {overview.profile.linkedinUrl && (
                <a
                  href={overview.profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  {ar ? "عرض ملف LinkedIn" : "View LinkedIn Profile"} →
                </a>
              )}
            </Card>
          )}

          {/* Development Plan */}
          {overview.developmentPlan && (
            <Card className="p-6 bg-white">
              <h2 className="text-lg font-bold mb-4">
                {ar ? "خطة التطوير الوظيفي" : "Career Development Plan"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {overview.developmentPlan.targetRole && (
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">
                      {ar ? "الدور المستهدف" : "Target Role"}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {overview.developmentPlan.targetRole}
                    </p>
                  </div>
                )}
                {overview.developmentPlan.timeline && (
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">
                      {ar ? "الإطار الزمني" : "Timeline"}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {overview.developmentPlan.timeline} {ar ? "شهر" : "months"}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1">
                    {ar ? "المهارات المطلوبة" : "Skills to Acquire"}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {overview.developmentPlan.skillsToAcquire?.length || 0}{" "}
                    {ar ? "مهارة" : "skills"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Active Goals */}
          {overview.goals?.items && overview.goals.items.length > 0 && (
            <Card className="p-6 bg-white">
              <h2 className="text-lg font-bold mb-4">
                {ar ? "الأهداف النشطة" : "Active Goals"}
              </h2>
              <div className="space-y-3">
                {overview.goals.items.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition border-l-4 border-l-blue-400"
                    onClick={() =>
                      setExpandedGoal(expandedGoal === goal.id ? null : goal.id)
                    }
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {goal.category}
                          </span>
                          <span className="inline-block px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs">
                            {ar ? (goal.priority === "high" ? "عالية" : goal.priority === "medium" ? "متوسطة" : "منخفضة") : goal.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full">
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2 transition-all"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {goal.progress}% {ar ? "مكتمل" : "complete"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Insights */}
          {overview.aiInsights && overview.aiInsights.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  {ar ? "رؤى ذكية من الذكاء الاصطناعي" : "AI Career Insights"}
                </h2>
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  {showInsights ? (ar ? "إخفاء" : "Hide") : (ar ? "عرض الكل" : "Show All")}
                </button>
              </div>

              <div className="space-y-3">
                {overview.aiInsights.slice(0, showInsights ? undefined : 2).map((insight) => (
                  <div
                    key={insight.id}
                    className="p-3 bg-white rounded-lg border border-purple-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {insight.title}
                        </h3>
                        {insight.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {insight.description}
                          </p>
                        )}
                      </div>
                      {insight.confidence && (
                        <span className="text-xs text-purple-600 font-semibold ml-2">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!aiLoading && !aiResponse && (
                <Button
                  onClick={() => {
                    trackEvent("ai_feature_used", { feature: "career_insights" });
                    generateAI(
                      `Generate personalized career insights for ${overview.student.name} based on their career goals and current progress.`
                    );
                  }}
                  className="mt-4 w-full"
                >
                  {ar ? "احصل على رؤى إضافية" : "Get More Insights"}
                </Button>
              )}

              {aiLoading && (
                <div className="mt-4 p-3 bg-purple-100 rounded-lg animate-pulse text-sm text-purple-800">
                  {ar ? "جاري توليد الرؤى..." : "Generating insights..."}
                </div>
              )}
            </Card>
          )}

          {/* Mock Interviews Summary */}
          {overview.mockInterviews?.total > 0 && (
            <Card className="p-6 bg-white">
              <h2 className="text-lg font-bold mb-4">
                {ar ? "آخر المقابلات التدريبية" : "Recent Mock Interviews"}
              </h2>
              <div className="space-y-3">
                {overview.mockInterviews.recent.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}{" "}
                        {ar ? "مقابلة" : "Interview"}
                      </h3>
                      {interview.targetRole && (
                        <p className="text-sm text-gray-600">
                          {ar ? "للدور:" : "For role:"} {interview.targetRole}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {interview.score && (
                        <div className="text-lg font-bold text-blue-600">
                          {interview.score}%
                        </div>
                      )}
                      {interview.completedAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(interview.completedAt).toLocaleDateString(
                            ar ? "ar" : "en"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">
              {ar ? "الإجراءات السريعة" : "Quick Actions"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-white hover:bg-blue-50 transition rounded-lg border border-blue-200 text-left cursor-pointer">
                <p className="font-semibold text-gray-900">
                  {ar ? "استكشف الوظائف" : "Explore Jobs"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {ar ? "ابحث عن الفرص المطابقة" : "Find matching opportunities"}
                </p>
              </div>
              <div className="p-4 bg-white hover:bg-green-50 transition rounded-lg border border-green-200 text-left cursor-pointer">
                <p className="font-semibold text-gray-900">
                  {ar ? "مقابلة تدريبية" : "Mock Interview"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {ar ? "تحضر للمقابلات الحقيقية" : "Prepare for real interviews"}
                </p>
              </div>
              <div className="p-4 bg-white hover:bg-purple-50 transition rounded-lg border border-purple-200 text-left cursor-pointer">
                <p className="font-semibold text-gray-900">
                  {ar ? "تحديث السيرة" : "Update Resume"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {ar ? "حسّن ملفك الشخصي" : "Enhance your profile"}
                </p>
              </div>
            </div>
          </Card>
        </div>
    </div>
  );
}

