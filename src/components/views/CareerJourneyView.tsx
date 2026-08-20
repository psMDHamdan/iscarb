"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStudentData } from "@/hooks/useStudentData";
import { useAnalytics } from "@/hooks/useAnalytics";
import { AlertCircle, Loader2, Target, TrendingUp, Calendar } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: "planned" | "in-progress" | "completed" | "delayed";
  progress: number;
  category: string;
}

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  type: string;
}

interface CareerJourneyData {
  studentId: string;
  timeline: TimelineEvent[];
  milestones: Milestone[];
  currentPhase: string;
  overallProgress: number;
  nextMilestone?: Milestone;
  prediction: {
    estimatedGraduationDate: string;
    projectedCareers: string[];
    readinessTrend: string;
  };
}

const statusColors = {
  completed: "bg-green-100 text-green-800 border-green-300",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-300",
  planned: "bg-gray-100 text-gray-800 border-gray-300",
  delayed: "bg-red-100 text-red-800 border-red-300",
};

const statusLabels = {
  completed: { en: "Completed", ar: "مكتمل" },
  "in-progress": { en: "In Progress", ar: "قيد التنفيذ" },
  planned: { en: "Planned", ar: "مخطط" },
  delayed: { en: "Delayed", ar: "متأخر" },
};

export function CareerJourneyView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data, loading, error } = useStudentData<CareerJourneyData>(
    "/api/v1/student/career/journey"
  );
  const { trackEvent } = useAnalytics();
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("page_view", { section: "career", page: "journey" });
  }, [trackEvent]);

  if (loading) {
    return (
      <div className={`min-h-full bg-gradient-to-br from-purple-50 to-indigo-50 p-6 ${ar ? "rtl" : "ltr"}`}>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-full bg-gradient-to-br from-purple-50 to-indigo-50 p-6 ${ar ? "rtl" : "ltr"}`}>
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error || "Failed to load career journey"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full bg-gradient-to-br from-purple-50 to-indigo-50 p-6 ${ar ? "rtl" : "ltr"}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          title={ar ? "مسيرتك المهنية" : "Career Journey"}
          description={ar ? "تتبع تقدمك نحو أهدافك المهنية" : "Track your progress toward career goals"}
        />

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-purple-600">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{ar ? "المرحلة الحالية" : "Current Phase"}</p>
                <p className="text-lg font-bold text-gray-900">{data.currentPhase}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{ar ? "التقدم الكلي" : "Overall Progress"}</p>
                <p className="text-2xl font-bold text-blue-600">{data.overallProgress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${data.overallProgress}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{ar ? "تاريخ التخرج المتوقع" : "Est. Graduation"}</p>
                <p className="text-lg font-bold text-green-600">{data.prediction.estimatedGraduationDate}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-600">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{ar ? "اتجاه الاستعداد" : "Readiness Trend"}</p>
                <p className="text-lg font-bold text-indigo-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {ar ? (data.prediction.readinessTrend === "increasing" ? "تصاعدي" : "مستقر") :
                     data.prediction.readinessTrend === "increasing" ? "Increasing" : "Stable"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {data.nextMilestone && (
          <Card className="border-2 border-indigo-200 bg-indigo-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-indigo-900">{ar ? "الهدف التالي" : "Next Milestone"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{data.nextMilestone.title}</h3>
                  <p className="text-gray-700 mt-1">{data.nextMilestone.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{ar ? "التاريخ المستهدف" : "Target Date"}</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {data.nextMilestone.targetDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{ar ? "التقدم" : "Progress"}</p>
                    <p className="text-2xl font-bold text-indigo-600">{data.nextMilestone.progress}%</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${data.nextMilestone.progress}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{ar ? "جميع الأهداف" : "All Milestones"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900">{milestone.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded border ${statusColors[milestone.status]}`}>
                          {statusLabels[milestone.status][ar ? "ar" : "en"]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                      {expandedMilestone === milestone.id && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{ar ? "الفئة:" : "Category:"}</span> {milestone.category}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{ar ? "التاريخ المستهدف:" : "Target Date:"}</span> {milestone.targetDate}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">{ar ? "التقدم:" : "Progress:"}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${milestone.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-700">{milestone.progress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ar ? "المسار الزمني" : "Career Timeline"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.timeline.map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                    {idx < data.timeline.length - 1 && <div className="w-0.5 h-12 bg-gray-300"></div>}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-gray-500">{event.date}</p>
                    <p className="font-bold text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ar ? "المسارات الوظيفية المتوقعة" : "Projected Career Paths"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {data.prediction.projectedCareers.map((career, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                  <p className="font-bold text-gray-900">{career}</p>
                  <p className="text-sm text-gray-600 mt-2">{ar ? "مسار وظيفي متوقع بناءً على ملفك الشخصي" : "Projected career path based on your profile"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
