'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
export function AnalyticsLearningView() {
  return (
    <StudentPageTemplate
      title="Learning Analytics"
      titleAr="تحليلات التعلم"
      apiEndpoint="/api/v1/student/analytics/learning"
      breadcrumbs={[
        { label: "Home", href: "/student" },
        { label: "Analytics", href: "/student/analytics" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Study Entries: {data?.stats?.totalEntries || 0}</p>
          {data?.memories?.slice(0, 10).map((m: any) => (
            <div key={m.id} className="p-4 border rounded-lg">
              <p className="font-semibold">{m.concept}</p>
            </div>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}