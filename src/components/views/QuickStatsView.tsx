import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

export function QuickStatsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <StudentPageTemplate
      title="Quick Stats"
      titleAr="الإحصائيات السريعة"
      apiEndpoint="/api/v1/student/dashboard/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الإحصائيات" : "Stats", href: "/student/dashboard/quick-stats" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-iscarb-green/10 to-transparent rounded-lg border border-border/50">
              <div className="text-3xl font-bold text-iscarb-green">{data?.student?.readinessScore || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "درجة الجاهزية" : "Readiness"}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-iscarb-cyan/10 to-transparent rounded-lg border border-border/50">
              <div className="text-3xl font-bold text-iscarb-cyan">{data?.student?.currentStreak || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "الانتظام اليومي" : "Day Streak"}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-iscarb-gold/10 to-transparent rounded-lg border border-border/50">
              <div className="text-3xl font-bold text-iscarb-gold">{data?.competencies?.averageLevel || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "متوسط الكفاءة" : "Competency"}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-500/10 to-transparent rounded-lg border border-border/50">
              <div className="text-3xl font-bold text-orange-500">{data?.assessments?.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "التقييمات" : "Assessments"}</p>
            </div>
          </div>
        </div>
      )}
    </StudentPageTemplate>
  );
}
