"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, MapPin, TrendingUp, Target } from "lucide-react";

export function CareerCareerView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="Career Explorer"
      titleAr="استكشاف المسار المهني"
      apiEndpoint="/api/v1/student/career/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "المهنة" : "Career", href: "/student/career" },
        { label: ar ? "استكشاف" : "Explorer", href: "/student/career/career-explorer" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-iscarb-green" />
                  <p className="text-xs text-muted-foreground">{ar ? "المسارات" : "Career Paths"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.paths?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "المهارات" : "Skills Matched"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.skillsMatched || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "الفرص" : "Opportunities"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.opportunities || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-purple-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "الجاهزية" : "Readiness"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.readiness || 0}%</p>
              </CardContent>
            </Card>
          </div>
          
          {data?.paths?.map((path: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="font-medium text-sm">{path.title || path.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{path.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}
