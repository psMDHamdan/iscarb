'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
export function AiWorkflowsView() {
  return (
    <StudentPageTemplate
      title="Workflows"
      titleAr="سير العمل"
      apiEndpoint="/api/v1/student/ai/workflows"
      breadcrumbs={[
        { label: "Home", href: "/student" },
        { label: "AI", href: "/student/ai" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Active Workflows: {data?.stats?.active || 0}</p>
          {data?.workflows?.slice(0, 10).map((w: any) => (
            <div key={w.id} className="p-4 border rounded-lg">
              <p className="font-semibold">{w.name}</p>
            </div>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}