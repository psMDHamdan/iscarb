'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
export function AnalyticsAiView() {
  return (
    <StudentPageTemplate
      title="AI Analytics"
      titleAr="تحليلات الذكاء الاصطناعي"
      apiEndpoint="/api/v1/student/analytics/ai"
      breadcrumbs={[
        { label: "Home", href: "/student" },
        { label: "Analytics", href: "/student/analytics" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Total Sessions: {data?.totalSessions || 0}</p>
          {data?.recentActivity?.slice(0, 10).map((r: any) => (
            <div key={r.id} className="p-4 border rounded-lg">
              <p className="font-semibold">{r.agent?.name}</p>
            </div>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}