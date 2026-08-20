"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, MapPin, Building2, Clock } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  postedAt: string;
}

export function CareerCareerJobsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <StudentPageTemplate
      title="Jobs"
      titleAr="الوظائف"
      apiEndpoint="/api/iscarb/jobs"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التوظيف" : "Career", href: "/student/career" },
        { label: ar ? "الوظائف" : "Jobs", href: "/student/career/career/jobs" },
      ]}
    >
      {(data: any) => {
        const jobs: Job[] = data?.data || data?.jobs || [];
        return (
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <Card className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">{ar ? "لا توجد وظائف" : "No jobs available"}</p>
              </Card>
            ) : (
              jobs.map((job: Job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Building2 className="h-5 w-5 text-[#0E6C3C]" />
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {job.salary && <p className="text-sm font-medium text-[#0E6C3C]">{job.salary}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(job.postedAt).toLocaleDateString()}</p>
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
