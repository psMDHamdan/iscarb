"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/lib/use-api-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Award,
  GraduationCap,
  Wrench,
  Users,
  BookOpen,
  Trophy,
  Clock,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface PortfolioStats {
  totalPublications: number;
  totalCitations: number;
  totalCertifications: number;
  activeCertifications: number;
  totalAwards: number;
  totalWorkshops: number;
  totalTrainingHours: number;
}

export function FacultyPortfolioView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: stats, isLoading: loading, error, refetch } = useApiQuery<PortfolioStats>(["portfolio"], "/api/v1/faculty/portfolio/stats");

  const sections = [
    { icon: FileText, label: ar ? "المنشورات" : "Publications", href: "/faculty/portfolio/publications", count: stats?.totalPublications ?? 0, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { icon: GraduationCap, label: ar ? "الشهادات" : "Certifications", href: "/faculty/portfolio/certifications", count: stats?.activeCertifications ?? 0, color: "text-[#0E6C3C]", bgColor: "bg-[#0E6C3C]/10" },
    { icon: Award, label: ar ? "الجوائز" : "Awards", href: "/faculty/portfolio/awards", count: stats?.totalAwards ?? 0, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { icon: Wrench, label: ar ? "الورش والتدريب" : "Workshops", href: "/faculty/portfolio/workshops", count: stats?.totalWorkshops ?? 0, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "المحفظة المهنية" : "Professional Portfolio"} description={ar ? "ملخص شامل لإنجازاتك المهنية" : "A comprehensive overview of your professional achievements"} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "المحفظة المهنية" : "Professional Portfolio"} description={ar ? "ملخص شامل لإنجازاتك المهنية" : "A comprehensive overview of your professional achievements"} />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "المحفظة المهنية" : "Professional Portfolio"}
        description={ar ? "ملخص شامل لإنجازاتك المهنية" : "A comprehensive overview of your professional achievements"}
      />
      <div className="space-y-6 pb-12">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalPublications ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "المنشورات" : "Publications"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0E6C3C]/10">
                  <Trophy className="h-5 w-5 text-[#0E6C3C]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalCitations ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "الاستشهادات" : "Citations"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalAwards ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "الجوائز" : "Awards"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalTrainingHours ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "ساعات التدريب" : "Training Hours"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${section.bgColor}`}>
                        <section.icon className={`h-6 w-6 ${section.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{section.label}</h3>
                        <p className="text-sm text-muted-foreground">{section.count} {ar ? "عنصر" : "items"}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
