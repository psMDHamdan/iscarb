"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Award,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ReadinessAssessment {
  id: string;
  assessmentType: string;
  categories: string;
  overallScore: number;
  gaps: string;
  recommendations: string;
  assessmentDate: string;
}

export function SuccessReadinessView() {
  const { lang } = useApp();
  const { trackEvent } = useAnalytics();
  const ar = lang === "ar";

  const [assessments, setAssessments] = useState<ReadinessAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<ReadinessAssessment | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      trackEvent("page_view", { section: "success", page: "readiness" });

      const response = await fetch("/api/v1/student/readiness");
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      if (result.success) {
        setAssessments(result.data || []);
        if (result.data?.length > 0) {
          setSelectedAssessment(result.data[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      trackEvent("error", { section: "success", page: "readiness", error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50";
    if (score >= 60) return "bg-blue-50";
    if (score >= 40) return "bg-yellow-50";
    return "bg-red-50";
  };

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "تقييم الجاهزية" : "Readiness", href: "/student/success/readiness" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "تقييم الجاهزية" : "Readiness Assessment"} breadcrumbs={breadcrumbs} />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "تقييم الجاهزية" : "Readiness Assessment"}
        description={ar ? "تقييم جاهزيتك للمستقبل" : "Assess your readiness for success"}
        breadcrumbs={breadcrumbs}
      />

      <div className="space-y-6 pb-12">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">{ar ? "التقييمات" : "Assessments"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {assessments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{ar ? "لا توجد تقييمات" : "No assessments"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assessments.map((assessment) => (
                    <button
                      key={assessment.id}
                      onClick={() => setSelectedAssessment(assessment)}
                      className={`w-full text-left p-3 rounded-lg border transition ${selectedAssessment?.id === assessment.id
                          ? "bg-blue-50 border-blue-300"
                          : "hover:bg-gray-50"
                        }`}
                    >
                      <p className="text-sm font-medium">{assessment.assessmentType}</p>
                      <p className={`text-lg font-bold mt-1 ${getScoreColor(assessment.overallScore)}`}>
                        {assessment.overallScore}%
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedAssessment && (
            <div className="lg:col-span-2 space-y-4">
              <Card className={getScoreBgColor(selectedAssessment.overallScore)}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${getScoreColor(selectedAssessment.overallScore)}`}>
                      {selectedAssessment.overallScore}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedAssessment.categories && (
                <Card>
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      {ar ? "الفئات" : "Categories"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {typeof selectedAssessment.categories === "string" &&
                        Object.entries(JSON.parse(selectedAssessment.categories || "{}")).map(
                          ([key, value]: [string, any]) => (
                            <div key={key} className="flex items-center justify-between">
                              <p className="font-medium text-sm capitalize">{key.replace(/_/g, " ")}</p>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gray-800">{value}%</div>
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedAssessment.recommendations && (
                <Card>
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      {ar ? "التوصيات" : "Recommendations"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {typeof selectedAssessment.recommendations === "string" &&
                        JSON.parse(selectedAssessment.recommendations || "[]").map(
                          (rec: string, idx: number) => (
                            <div key={idx} className="flex gap-2 text-sm text-gray-700">
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </div>
                          )
                        )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
