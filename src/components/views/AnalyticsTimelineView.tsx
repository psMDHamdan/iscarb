'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
export function AnalyticsTimelineView() {
  return (
    <StudentPageTemplate
      title="Activity Timeline"
      titleAr="الجدول الزمني للأنشطة"
      apiEndpoint="/api/v1/student/analytics/timeline"
      breadcrumbs={[
        { label: "Home", href: "/student" },
        { label: "Analytics", href: "/student/analytics" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-4">
          {data?.events?.map((e: any) => (
            <div key={e.id} className="p-4 border rounded-lg">
              <p className="font-semibold">{e.title}</p>
              <p className="text-sm text-gray-600">{new Date(e.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}