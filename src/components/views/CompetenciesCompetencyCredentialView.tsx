"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

export function CompetenciesCompetencyCredentialView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="Credential Wallet"
      titleAr="Credential Wallet"
      apiEndpoint="/api/v1/student/competencies/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "Credential Wallet" : "Credential Wallet", href: "/student/competencies/competency" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <p className="text-muted-foreground text-center py-8">
            {ar ? "قيد التحميل..." : "Loading..."}
          </p>
        </div>
      )}
    </StudentPageTemplate>
  );
}
