'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
export function AnalyticsCareerView() {
  return (
    <StudentPageTemplate
      title="Career Analytics"
      titleAr="تحليلات المسار الوظيفي"
      apiEndpoint="/api/v1/student/analytics/career"
      breadcrumbs={[
        { label: "Home", href: "/student" },
        { label: "Analytics", href: "/student/analytics" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Job Matches: {data?.matchCount || 0}</p>
          {data?.jobMatches?.slice(0, 10).map((j: any) => (
            <div key={j.id} className="p-4 border rounded-lg">
              <p className="font-semibold">{j.jobTitle}</p>
            </div>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}