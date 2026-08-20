'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
export function AnalyticsAssessmentView() {
  return (
    <StudentPageTemplate
      title="Assessment Analytics"
      titleAr="تحليلات التقييم"
      apiEndpoint="/api/v1/student/analytics/assessment"
      breadcrumbs={[
        { label: "Home", href: "/student" },
        { label: "Analytics", href: "/student/analytics" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Average Score: {data?.stats?.averageScore || 0}%</p>
          {data?.assessments?.slice(0, 10).map((a: any) => (
            <div key={a.id} className="p-4 border rounded-lg">
              <p className="font-semibold">{a.module?.name}</p>
              <p className="text-sm">Score: {a.score}%</p>
            </div>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}