'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
export function AnalyticsWellnessView() {
  return (
    <StudentPageTemplate
      title="Wellness Analytics"
      titleAr="تحليلات الصحة النفسية"
      apiEndpoint="/api/v1/student/analytics/wellness"
      breadcrumbs={[
        { label: "Home", href: "/student" },
        { label: "Analytics", href: "/student/analytics" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Wellness Score</p>
            <p className="text-2xl font-bold">{data?.wellnessScore || 0}%</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Sleep Average</p>
            <p className="text-2xl font-bold">{data?.sleep?.average || 0}h</p>
          </div>
        </div>
      )}
    </StudentPageTemplate>
  );
}