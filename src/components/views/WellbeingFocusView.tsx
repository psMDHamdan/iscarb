"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

export function WellbeingFocusView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="Focus Sessions"
      titleAr="Focus Sessions"
      apiEndpoint="/api/v1/student/wellbeing/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "Focus Sessions" : "Focus Sessions", href: "/student/wellbeing/focus" },
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
