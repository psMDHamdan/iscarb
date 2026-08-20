"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, MapPin, Calendar, ExternalLink } from "lucide-react";

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  stipend?: string;
  status: "open" | "applied" | "closed";
}

export function CareerCareerInternshipsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <StudentPageTemplate
      title="Internships"
      titleAr="التدريب"
      apiEndpoint="/api/iscarb/internships"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التوظيف" : "Career", href: "/student/career" },
        { label: ar ? "التدريب" : "Internships", href: "/student/career/career/internships" },
      ]}
    >
      {(data: any) => {
        const internships: Internship[] = data?.data || data?.internships || [];
        return (
          <div className="space-y-4">
            {internships.length === 0 ? (
              <Card className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">{ar ? "لا توجد فرص تدريب" : "No internships available"}</p>
              </Card>
            ) : (
              internships.map((intern: Internship) => (
                <Card key={intern.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Briefcase className="h-5 w-5 text-[#0E6C3C]" />
                      <div>
                        <p className="font-medium">{intern.title}</p>
                        <p className="text-sm text-muted-foreground">{intern.company}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{intern.location}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{intern.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {intern.stipend && <p className="text-sm font-medium text-[#0E6C3C]">{intern.stipend}</p>}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        intern.status === "open" ? "bg-emerald-100 text-emerald-700" :
                        intern.status === "applied" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {intern.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
