'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
export function AnalyticsCompetencyView() {
  return (
    <StudentPageTemplate
      title="Competency Analytics"
      titleAr="تحليلات الكفاءات"
      apiEndpoint="/api/v1/student/analytics/competency"
      breadcrumbs={[
        { label: "Home", href: "/student" },
        { label: "Analytics", href: "/student/analytics" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-4">
          {data?.competencies?.map((c: any) => (
            <div key={c.id} className="p-4 border rounded-lg">
              <p className="font-semibold">{c.title}</p>
            </div>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}