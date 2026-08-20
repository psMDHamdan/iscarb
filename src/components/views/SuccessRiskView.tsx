"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  TrendingDown,
  Shield,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface RiskIndicator {
  id: string;
  riskCategory: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  score: number;
  indicators: string;
  mitigationPlan?: string;
  status: string;
  lastAssessmentDate: string;
}

interface RiskStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  lastUpdated: string;
}

export function SuccessRiskView() {
  const { lang } = useApp();
  const { trackEvent } = useAnalytics();
  const ar = lang === "ar";

  const [risks, setRisks] = useState<RiskIndicator[]>([]);
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      trackEvent("page_view", { section: "success", page: "risk" });

      const response = await fetch("/api/v1/student/success/risk");
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      if (result.success) {
        setRisks(result.data?.risks || []);
        setStats(result.data?.stats || null);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      trackEvent("error", { section: "success", page: "risk", error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-800";
      case "high":
        return "bg-orange-50 border-orange-200 text-orange-800";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-green-50 border-green-200 text-green-800";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      default:
        return "🟢";
    }
  };

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "كشف الخطر" : "Risk Detection", href: "/student/success/risk" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "كشف الخطر" : "Risk Detection"} breadcrumbs={breadcrumbs} />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "كشف الخطر" : "At-Risk Detection"}
        description={ar ? "مراقبة ومعالجة العوامل المؤثرة على النجاح" : "Monitor and address risk factors"}
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

        {/* Risk Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
                <p className="text-xs text-gray-600 mt-1">{ar ? "إجمالي المخاطر" : "Total Risks"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <p className="text-xs text-red-600 mt-1">{ar ? "حرج" : "Critical"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
                <p className="text-xs text-orange-600 mt-1">{ar ? "عالي" : "High"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-lime-50 border-yellow-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
                <p className="text-xs text-yellow-600 mt-1">{ar ? "متوسط" : "Medium"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{stats.low}</div>
                <p className="text-xs text-green-600 mt-1">{ar ? "منخفض" : "Low"}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Risk Items */}
        <div className="space-y-3">
          {risks.length === 0 ? (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-12 text-center pb-12">
                <Shield className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-700 font-medium">{ar ? "لا توجد مخاطر مكتشفة" : "No risks detected"}</p>
                <p className="text-xs text-green-600 mt-1">
                  {ar ? "أنت على الطريق الصحيح!" : "You're on the right track!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            risks.map((risk) => (
              <Card key={risk.id} className={`border-l-4 ${getRiskColor(risk.riskLevel)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getRiskIcon(risk.riskLevel)}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{risk.riskCategory}</h3>
                        <p className="text-sm text-gray-600 mt-1">{risk.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">{risk.score}/100</div>
                      <div className="w-20 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${
                            risk.riskLevel === "critical"
                              ? "bg-red-500"
                              : risk.riskLevel === "high"
                                ? "bg-orange-500"
                                : risk.riskLevel === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                          }`}
                          style={{ width: `${risk.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {risk.mitigationPlan && (
                    <div className="mt-4 p-3 bg-blue-50 border-l-2 border-blue-400 rounded">
                      <p className="text-xs font-medium text-blue-900 mb-1">
                        {ar ? "خطة التخفيف" : "Mitigation Plan"}
                      </p>
                      <p className="text-xs text-blue-700">{risk.mitigationPlan}</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ar ? "آخر تقييم:" : "Last assessed:"}{" "}
                    {new Date(risk.lastAssessmentDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Action Steps */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              {ar ? "خطوات التحسين" : "Improvement Steps"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm font-medium text-blue-900">1. {ar ? "تحديد الأسباب الجذرية" : "Identify Root Causes"}</p>
              <p className="text-xs text-blue-700 mt-1">
                {ar ? "افهم لماذا تحتاج إلى التحسين" : "Understand why improvement is needed"}
              </p>
            </div>
            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-sm font-medium text-green-900">2. {ar ? "وضع خطة عمل" : "Create Action Plan"}</p>
              <p className="text-xs text-green-700 mt-1">
                {ar ? "حدد الخطوات الملموسة" : "Define concrete steps to take"}
              </p>
            </div>
            <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
              <p className="text-sm font-medium text-orange-900">3. {ar ? "المراقبة المنتظمة" : "Monitor Progress"}</p>
              <p className="text-xs text-orange-700 mt-1">
                {ar ? "تابع التقدم بانتظام" : "Check your progress regularly"}
              </p>
            </div>
            <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
              <p className="text-sm font-medium text-purple-900">4. {ar ? "طلب المساعدة" : "Seek Support"}</p>
              <p className="text-xs text-purple-700 mt-1">
                {ar ? "تواصل مع المدربين والمستشارين" : "Connect with coaches and counselors"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
