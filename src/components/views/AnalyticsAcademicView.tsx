'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
export function AnalyticsAcademicView() {
  return (
    <StudentPageTemplate
      title="Academic Analytics"
      titleAr="تحليلات الأداء الأكاديمي"
      apiEndpoint="/api/v1/student/analytics/academic"
      breadcrumbs={[
        { label: "Home", href: "/student" },
        { label: "Analytics", href: "/student/analytics" },
      ]}
      aiFeature={{
        label: "AI Academic Insights",
        labelAr: "رؤى الذكاء الاصطناعي الأكاديمية",
        endpoint: "/api/v1/student/ai/chat",
      }}
    >
      {(data: any) => (
        <div className="space-y-4">
          {data?.courses?.map((c: any) => (
            <div key={c.id} className="p-4 border rounded-lg">
              <p className="font-semibold">{c.course?.name}</p>
              <p className="text-sm text-gray-600">Grade: {c.finalGrade || "N/A"}</p>
            </div>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}