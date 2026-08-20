"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

export function PersonalAccountNotificationsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="Notifications"
      titleAr="Notifications"
      apiEndpoint="/api/v1/student/personal/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "Notifications" : "Notifications", href: "/student/personal/account" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <p className="text-muted-foreground text-center py-8">
            {ar ? "قيد التحميل..." : "Loading..."}
          </p>
        </div>
      )}
    </StudentPageTemplate>
  );
}
