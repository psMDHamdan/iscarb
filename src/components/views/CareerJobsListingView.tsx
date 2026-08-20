"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useStudentData } from "@/hooks/useStudentData";
import { useAnalytics } from "@/hooks/useAnalytics";
import { AlertCircle, Loader2, MapPin, DollarSign, Briefcase, Star, ArrowUpRight } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: { min: number; max: number; currency: string };
  jobType: string;
  description: string;
  requirements: string[];
  aiMatchScore: number;
  matchReasons: string[];
  posted: string;
  deadline?: string;
  applied?: boolean;
}

interface JobsResponse {
  success: boolean;
  studentId: string;
  data: Job[];
  pagination: { count: number; skip: number; limit: number; total: number };
  summary: {
    averageMatchScore: number;
    topMatches: Array<{ id: string; title: string; score: number }>;
    appliedCount: number;
  };
}

const getMatchColor = (score: number) => {
  if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-300";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-gray-100 text-gray-800 border-gray-300";
};

const getMatchLabel = (score: number, ar: boolean) => {
  if (score >= 80) return ar ? "مطابقة ممتازة" : "Excellent Match";
  if (score >= 60) return ar ? "مطابقة جيدة" : "Good Match";
  if (score >= 40) return ar ? "مطابقة معقولة" : "Fair Match";
  return ar ? "مطابقة منخفضة" : "Low Match";
};

export function CareerJobsListingView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [filters, setFilters] = useState({ salaryMin: 0, salaryMax: 200000, location: "", type: "" });
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const query = new URLSearchParams({
    salaryMin: filters.salaryMin.toString(),
    salaryMax: filters.salaryMax.toString(),
    ...(filters.location && { location: filters.location }),
    ...(filters.type && { type: filters.type }),
  });

  const { data, loading, error } = useStudentData<JobsResponse>(
    `/api/v1/student/career/jobs?${query}`
  );
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent("page_view", { section: "career", page: "jobs" });
  }, [trackEvent]);

  const handleApplyJob = (jobId: string, jobTitle: string) => {
    trackEvent("job_apply_clicked", { jobId, jobTitle });
  };

  if (loading) {
    return (
      <div className={`min-h-full bg-gradient-to-br from-amber-50 to-orange-50 p-6 ${ar ? "rtl" : "ltr"}`}>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-full bg-gradient-to-br from-amber-50 to-orange-50 p-6 ${ar ? "rtl" : "ltr"}`}>
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error || "Failed to load job listings"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full bg-gradient-to-br from-amber-50 to-orange-50 p-6 ${ar ? "rtl" : "ltr"}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          title={ar ? "فرص العمل" : "Job Opportunities"}
          description={ar ? "اكتشف الوظائف التي تتطابق مع ملفك الشخصي" : "Discover jobs matched to your profile"}
        />

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{ar ? "إجمالي الفرص" : "Total Opportunities"}</p>
                <p className="text-2xl font-bold text-amber-600">{data.pagination.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{ar ? "متوسط التطابق" : "Avg Match Score"}</p>
                <p className="text-2xl font-bold text-orange-600">{data.summary.averageMatchScore}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{ar ? "التطبيقات" : "Applications"}</p>
                <p className="text-2xl font-bold text-green-600">{data.summary.appliedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{ar ? "مطابقات ممتازة" : "Excellent Matches"}</p>
                <p className="text-2xl font-bold text-blue-600">{data.summary.topMatches.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>{ar ? "المرشحات" : "Filters"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ar ? "الراتب الأدنى" : "Min Salary"}
                </label>
                <input
                  type="number"
                  value={filters.salaryMin}
                  onChange={(e) => setFilters({ ...filters, salaryMin: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ar ? "الراتب الأقصى" : "Max Salary"}
                </label>
                <input
                  type="number"
                  value={filters.salaryMax}
                  onChange={(e) => setFilters({ ...filters, salaryMax: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ar ? "الموقع" : "Location"}
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder={ar ? "اختياري" : "Optional"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ar ? "نوع الوظيفة" : "Job Type"}
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">{ar ? "جميع الأنواع" : "All Types"}</option>
                  <option value="full-time">{ar ? "دوام كامل" : "Full-time"}</option>
                  <option value="part-time">{ar ? "دوام جزئي" : "Part-time"}</option>
                  <option value="contract">{ar ? "عقد" : "Contract"}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {data.data.length === 0 ? (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                {ar ? "لم يتم العثور على فرص وظيفية مطابقة" : "No matching job opportunities found"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.data.map((job) => (
              <Card
                key={job.id}
                className="cursor-pointer hover:shadow-lg transition border-l-4 border-l-amber-600"
                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getMatchColor(job.aiMatchScore)}`}>
                          {job.aiMatchScore}% - {getMatchLabel(job.aiMatchScore, ar)}
                        </span>
                      </div>
                      <p className="text-gray-600 font-medium mb-3">{job.company}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()} {job.salary.currency}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {job.jobType}
                        </div>
                      </div>

                      <p className="text-gray-700 line-clamp-2">{job.description}</p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{ar ? "منشور منذ" : "Posted"}</p>
                        <p className="text-sm font-medium text-gray-900">{job.posted}</p>
                      </div>
                      {job.applied && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          {ar ? "تم التقديم" : "Applied"}
                        </span>
                      )}
                    </div>
                  </div>

                  {expandedJob === job.id && (
                    <div className="border-t pt-4 space-y-4 mt-4">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">{ar ? "سبب التطابق" : "Match Reasons"}</h4>
                        <div className="space-y-2">
                          {job.matchReasons.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700">{reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">{ar ? "المتطلبات" : "Requirements"}</h4>
                        <div className="space-y-2">
                          {job.requirements.slice(0, 5).map((req, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <ArrowUpRight className="w-3 h-3 text-gray-500 mt-1 flex-shrink-0" />
                              <p className="text-sm text-gray-700">{req}</p>
                            </div>
                          ))}
                          {job.requirements.length > 5 && (
                            <p className="text-sm text-gray-500">
                              {ar ? "و" : "and"} {job.requirements.length - 5} {ar ? "متطلبات أخرى" : "more requirements"}
                            </p>
                          )}
                        </div>
                      </div>

                      {job.deadline && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-sm text-orange-900">
                            <span className="font-medium">{ar ? "آخر موعد للتقديم:" : "Application Deadline:"}</span> {job.deadline}
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyJob(job.id, job.title);
                        }}
                        disabled={job.applied}
                        className={`w-full ${job.applied ? "bg-gray-400" : "bg-amber-600 hover:bg-amber-700"} text-white`}
                      >
                        {job.applied ? (
                          <>
                            <Star className="w-4 h-4 mr-2 fill-current" />
                            {ar ? "تم التقديم بالفعل" : "Already Applied"}
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            {ar ? "تقديم الطلب" : "Apply Now"}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {data.pagination.total > data.pagination.limit && (
          <div className="flex justify-center gap-2">
            <Button variant="outline">{ar ? "السابق" : "Previous"}</Button>
            <Button variant="outline">{ar ? "التالي" : "Next"}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
