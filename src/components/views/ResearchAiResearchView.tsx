"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

export function ResearchAiResearchView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="Research Coach"
      titleAr="Research Coach"
      apiEndpoint="/api/v1/student/research/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "Research Coach" : "Research Coach", href: "/student/research/ai" },
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
