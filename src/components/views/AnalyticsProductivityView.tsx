'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
export function AnalyticsProductivityView() {
  return (
    <StudentPageTemplate
      title="Productivity Analytics"
      titleAr="تحليلات الإنتاجية"
      apiEndpoint="/api/v1/student/analytics/productivity"
      breadcrumbs={[
        { label: "Home", href: "/student" },
        { label: "Analytics", href: "/student/analytics" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Study Hours</p>
            <p className="text-2xl font-bold">{data?.dailyStats?.studyHours || 0}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Tasks Completed</p>
            <p className="text-2xl font-bold">{data?.dailyStats?.tasksCompleted || 0}</p>
          </div>
        </div>
      )}
    </StudentPageTemplate>
  );
}