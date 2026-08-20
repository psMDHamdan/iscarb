"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Microscope,
  FileText,
  DollarSign,
  BookOpen,
  Users,
  NotebookPen,
  Plus,
  ArrowRight,
  TrendingUp,
  Loader2,
  Calendar,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

interface ResearchStats {
  totalProjects: number;
  activeProjects: number;
  totalPublications: number;
  totalCitations: number;
  hIndex: number;
}

interface ProjectData {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string | null;
  budget: number | null;
  fundingSource: string | null;
}

interface PublicationData {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  citationCount: number;
  pubType: string;
}

export function ResearchWorkspaceView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: projectsRes, isLoading: projectsLoading, error: projectsError, refetch } = useApiQuery<any>(
    ["faculty", "research", "projects"],
    "/api/v1/faculty/research/projects",
  );
  const { data: pubsRes, isLoading: pubsLoading } = useApiQuery<any>(
    ["faculty", "research", "publications"],
    "/api/v1/faculty/research/publications",
  );
  const loading = projectsLoading || pubsLoading;
  const error = projectsError?.message ?? null;

  const stats = projectsRes?.stats ?? null;
  const projects = projectsRes?.projects ?? [];
  const publications = pubsRes?.publications ?? [];

  const quickActions = [
    { icon: FileText, label: ar ? "المنشورات" : "Publications", href: "/faculty/research/publications", color: "text-blue-500" },
    { icon: DollarSign, label: ar ? "المنح" : "Grants", href: "/faculty/research/grants", color: "text-green-500" },
    { icon: NotebookPen, label: ar ? "دفتر البحث" : "Notebook", href: "/faculty/research/notebook", color: "text-purple-500" },
    { icon: BookOpen, label: ar ? "الأدبيات" : "Literature", href: "/faculty/research/literature", color: "text-amber-500" },
    { icon: Users, label: ar ? "المتعاونون" : "Collaborators", href: "/faculty/research/collaborators", color: "text-[#0F7B8A]" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "مساحة البحث" : "Research Workspace"} description={ar ? "إدارة مشاريعك ومنشوراتك البحثية" : "Manage your research projects and publications"} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "مساحة البحث" : "Research Workspace"} description={ar ? "إدارة مشاريعك ومنشوراتك البحثية" : "Manage your research projects and publications"} />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const s = stats || { totalProjects: 0, activeProjects: 0, totalPublications: 0, totalCitations: 0, hIndex: 0 };
  const activeProjects = projects.filter(p => p.status === "active");

  return (
    <>
      <PageHeader
        title={ar ? "مساحة البحث" : "Research Workspace"}
        description={ar ? "إدارة مشاريعك ومنشوراتك البحثية" : "Manage your research projects and publications"}
        actions={
          <Button className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            {ar ? "مشروع جديد" : "New Project"}
          </Button>
        }
      />
      <div className="space-y-6 pb-12">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{ar ? "مشاريع نشطة" : "Active Projects"}</p>
              <p className="text-2xl font-bold text-[#0E6C3C]">{s.activeProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{ar ? "إجمالي المشاريع" : "Total Projects"}</p>
              <p className="text-2xl font-bold">{s.totalProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{ar ? "المنشورات" : "Publications"}</p>
              <p className="text-2xl font-bold">{s.totalPublications || publications.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{ar ? "الاستشهادات" : "Citations"}</p>
              <p className="text-2xl font-bold text-[#0F7B8A]">{s.totalCitations}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">h-index</p>
              <p className="text-2xl font-bold text-amber-500">{s.hIndex}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={`p-2 rounded-lg bg-muted/50 group-hover:scale-110 transition-transform ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Projects */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Microscope className="h-5 w-5 text-[#0E6C3C]" />
                {ar ? "المشاريع النشطة" : "Active Projects"}
              </CardTitle>
              <Link href="/faculty/research/projects" className="text-sm text-[#0E6C3C] hover:underline flex items-center gap-1">
                {ar ? "عرض الكل" : "View All"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد مشاريع نشطة" : "No active projects"}</p>
              ) : (
                <div className="space-y-4">
                  {activeProjects.slice(0, 5).map((project) => (
                    <div key={project.id} className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{project.title}</p>
                        <Badge className="bg-[#0E6C3C]/10 text-[#0E6C3C] text-xs">{project.status}</Badge>
                      </div>
                      {project.description && <p className="text-xs text-muted-foreground mb-2">{project.description.slice(0, 100)}</p>}
                      {project.fundingSource && <p className="text-xs text-muted-foreground">{ar ? "التمويل:" : "Funding:"} {project.fundingSource}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Publications */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                {ar ? "أحدث المنشورات" : "Recent Publications"}
              </CardTitle>
              <Link href="/faculty/research/publications" className="text-sm text-[#0E6C3C] hover:underline flex items-center gap-1">
                {ar ? "عرض الكل" : "View All"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {publications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد منشورات" : "No publications yet"}</p>
              ) : (
                <div className="space-y-3">
                  {publications.slice(0, 5).map((pub) => (
                    <div key={pub.id} className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <p className="font-medium text-sm mb-1">{pub.title}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{pub.journal} ({pub.year})</span>
                        <Badge variant="outline" className="text-xs">
                          <BarChart3 className="h-3 w-3 mr-1" /> {pub.citationCount}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
