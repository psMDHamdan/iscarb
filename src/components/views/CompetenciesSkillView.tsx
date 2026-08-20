"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

export function CompetenciesSkillView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="Skill Tree"
      titleAr="Skill Tree"
      apiEndpoint="/api/v1/student/competencies/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "Skill Tree" : "Skill Tree", href: "/student/competencies/skill-tree" },
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
