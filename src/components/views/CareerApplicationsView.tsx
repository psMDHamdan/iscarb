"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  Briefcase,
  Calendar,
  FileText,
  Zap,
  XCircle,
  CheckCircle,
} from "lucide-react";

interface Application {
  id: string;
  job: {
    id: string;
    title: string;
    titleAr: string;
    company: string;
    companyAr: string;
    location: string;
    locationAr: string;
  };
  status: string;
  appliedAt: string;
  reviewedAt: string | null;
  interviewedAt: string | null;
  decisionAt: string | null;
  coverLetter: string | null;
  aiMatchScore: number | null;
  feedback: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; variant: any; icon: any }> = {
  submitted: {
    label: "Submitted",
    labelAr: "مرسلة",
    variant: "outline",
    icon: FileText,
  },
  reviewed: {
    label: "Reviewed",
    labelAr: "تم المراجعة",
    variant: "secondary",
    icon: CheckCircle,
  },
  interviewing: {
    label: "Interviewing",
    labelAr: "مقابلة",
    variant: "default",
    icon: Briefcase,
  },
  offered: {
    label: "Offered",
    labelAr: "عرض",
    variant: "success",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    labelAr: "مرفوضة",
    variant: "destructive",
    icon: XCircle,
  },
  withdrawn: {
    label: "Withdrawn",
    labelAr: "منسحبة",
    variant: "secondary",
    icon: XCircle,
  },
  accepted: {
    label: "Accepted",
    labelAr: "مقبولة",
    variant: "success",
    icon: CheckCircle,
  },
};

export function CareerApplicationsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const fetchApplications = async (status: string = "all") => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      params.append("take", "100");

      const response = await fetch(
        `/api/v1/student/career/applications?${params.toString()}`
      );
      const result = await response.json();

      if (!result.success) throw new Error(result.error || "Failed to fetch applications");

      setApplications(result.data.applications);
      setStatusCounts(result.data.statusCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(statusFilter);
  }, [statusFilter]);

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm(ar ? "هل تريد سحب التطبيق؟" : "Are you sure you want to withdraw this application?")) {
      return;
    }

    setWithdrawingId(applicationId);
    try {
      const response = await fetch("/api/v1/student/career/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          action: "withdraw",
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: "withdrawn" } : app
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw application");
    } finally {
      setWithdrawingId(null);
    }
  };

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "الوظائف" : "Career", href: "/student/career" },
    { label: ar ? "الطلبات" : "Applications", href: "/student/career/applications" },
  ];

  const statuses = ["all", "submitted", "reviewed", "interviewing", "offered", "rejected", "accepted"];

  return (
    <>
      <PageHeader
        title={ar ? "طلبات التوظيف" : "Job Applications"}
        description={ar
          ? "تتبع طلباتك وحالتها والتغذية الراجعة من أصحاب العمل"
          : "Track your applications, statuses, and feedback from employers"}
        breadcrumbs={breadcrumbs}
      />

      <div className="space-y-6 pb-12">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto pb-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === status
                  ? "bg-[#0E6C3C] text-white shadow-md"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {status === "all"
                ? ar
                  ? "الكل"
                  : "All"
                : STATUS_CONFIG[status]?.[ar ? "labelAr" : "label"] || status}
              {statusCounts[status] && (
                <span className="ml-1.5 text-xs">({statusCounts[status]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C] mb-3" />
              <p className="text-sm text-muted-foreground">
                {ar ? "جاري التحميل..." : "Loading applications..."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-red-900 dark:text-red-200">
                  {ar ? "خطأ في التحميل" : "Error Loading Applications"}
                </h4>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => fetchApplications(statusFilter)}
                >
                  {ar ? "إعادة محاولة" : "Retry"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && applications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">
                {ar ? "لا توجد طلبات" : "No applications yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {ar
                  ? "ابدأ بتقديم طلبات للوظائف المتاحة"
                  : "Start by applying to available jobs"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        {!loading && !error && applications.length > 0 && (
          <div className="space-y-3">
            {applications.map((app) => {
              const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted;
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Company Icon */}
                      <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-sm">
                              {ar && app.job.titleAr ? app.job.titleAr : app.job.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {ar && app.job.companyAr ? app.job.companyAr : app.job.company}
                            </p>
                          </div>
                          <Badge variant={statusInfo.variant as any}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo[ar ? "labelAr" : "label"]}
                          </Badge>
                        </div>

                        {/* Application Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3 py-3 border-t border-b border-muted">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {ar ? "التقديم" : "Applied"}:{" "}
                              {new Date(app.appliedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {app.reviewedAt && (
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>
                                {ar ? "المراجعة" : "Reviewed"}:{" "}
                                {new Date(app.reviewedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {app.aiMatchScore !== null && (
                            <div className="flex items-center gap-2 text-xs">
                              <Zap className="h-3 w-3 text-yellow-600" />
                              <span>
                                {ar ? "المطابقة" : "Match"}:{" "}
                                {Math.round(app.aiMatchScore)}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Feedback */}
                        {app.feedback && (
                          <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-medium mb-1">
                              {ar ? "التغذية الراجعة" : "Feedback"}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {app.feedback}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {["submitted", "reviewed"].includes(app.status) && (
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleWithdraw(app.id)}
                            disabled={withdrawingId === app.id}
                            className="flex-1 sm:flex-none"
                          >
                            {withdrawingId === app.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              ar ? "سحب" : "Withdraw"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
