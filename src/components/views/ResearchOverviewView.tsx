"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, TrendingUp, BookOpen, FileText, Lightbulb } from "lucide-react";
import Link from "next/link";

export function ResearchOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/student/research/overview");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load research overview");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "نظرة عامة على البحث" : "Research Overview"}
          description={ar ? "لوحة معلومات بحثك الشاملة" : "Your comprehensive research dashboard"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader
          title={ar ? "نظرة عامة على البحث" : "Research Overview"}
          description={ar ? "لوحة معلومات بحثك الشاملة" : "Your comprehensive research dashboard"}
        />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <p className="text-sm mt-1">{error || "No data available"}</p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const stats = data.stats || {};

  return (
    <>
      <PageHeader
        title={ar ? "نظرة عامة على البحث" : "Research Overview"}
        description={ar ? "لوحة معلومات بحثك الشاملة" : "Your comprehensive research dashboard"}
      />

      <div className="space-y-8 pb-12">
        {/* Key Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "المشاريع" : "Projects"}</p>
                  <p className="text-2xl font-bold">{stats.totalProjects || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-iscarb-green/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "المنشورات" : "Publications"}</p>
                  <p className="text-2xl font-bold">{stats.totalPublications || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "الأوراق البحثية" : "Papers"}</p>
                  <p className="text-2xl font-bold">{stats.totalPapers || 0}</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-600/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "الأفكار النشطة" : "Active Ideas"}</p>
                  <p className="text-2xl font-bold">{stats.activeIdeas || 0}</p>
                </div>
                <Lightbulb className="h-8 w-8 text-yellow-600/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        {data.projects && data.projects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{ar ? "المشاريع البحثية الحالية" : "Active Research Projects"}</h3>
              <Link href="/student/research/projects">
                <Button variant="outline" size="sm">{ar ? "عرض الكل" : "View All"}</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {data.projects.map((project: any) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{project.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{project.description?.substring(0, 100)}</p>
                      </div>
                      <Badge>{project.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{ar ? "تاريخ البدء" : "Start Date"}</p>
                        <p className="text-sm font-medium">{project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{ar ? "الميزانية" : "Budget"}</p>
                        <p className="text-sm font-medium">${project.budget?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{ar ? "المهام المعلقة" : "Pending Tasks"}</p>
                        <p className="text-sm font-medium">{project.tasks?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Publications */}
        {data.publications && data.publications.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{ar ? "آخر المنشورات" : "Recent Publications"}</h3>
              <Link href="/student/research/publications">
                <Button variant="outline" size="sm">{ar ? "عرض الكل" : "View All"}</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {data.publications.map((pub: any) => (
                <Card key={pub.id}>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm">{pub.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{pub.journal}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline">{pub.status}</Badge>
                      {pub.publishedDate && <span className="text-xs text-muted-foreground">{new Date(pub.publishedDate).getFullYear()}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Access */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{ar ? "وصول سريع" : "Quick Access"}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/student/research/research-coach">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <BookOpen className="h-8 w-8 text-iscarb-green mb-3" />
                  <h4 className="font-semibold">{ar ? "مدرب البحث" : "Research Coach"}</h4>
                  <p className="text-xs text-muted-foreground mt-2">{ar ? "احصل على نصائح وإرشادات شخصية" : "Get personalized research guidance"}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/student/research/literature">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <FileText className="h-8 w-8 text-blue-600 mb-3" />
                  <h4 className="font-semibold">{ar ? "مراجعة أدبية" : "Literature Review"}</h4>
                  <p className="text-xs text-muted-foreground mt-2">{ar ? "اكتشف الأوراق والدراسات ذات الصلة" : "Discover relevant papers"}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/student/research/innovation">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Lightbulb className="h-8 w-8 text-yellow-600 mb-3" />
                  <h4 className="font-semibold">{ar ? "ابتكار" : "Innovation"}</h4>
                  <p className="text-xs text-muted-foreground mt-2">{ar ? "شارك الأفكار والمشاريع الجديدة" : "Share innovative ideas"}</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
