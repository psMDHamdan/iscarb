"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Shield, TrendingDown } from "lucide-react";

export function SuccessSuccessRiskView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="Risk Assessment"
      titleAr="تقييم المخاطر"
      apiEndpoint="/api/v1/student/success/risk"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "النجاح" : "Success", href: "/student/success" },
        { label: ar ? "المخاطر" : "Risk", href: "/student/success/risk" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "مخاطر نشطة" : "Active Risks"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.activeRisks || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "محفوظ" : "Mitigated"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.mitigated || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "مستوى المخاطر" : "Risk Level"}</p>
                </div>
                <p className="text-2xl font-bold capitalize">{data?.riskLevel || "low"}</p>
              </CardContent>
            </Card>
          </div>
          {data?.risks?.map((risk: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="font-medium text-sm">{risk.title || risk.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{risk.category}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}
