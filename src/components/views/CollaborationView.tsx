"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  FileText,
  Bell,
  Users,
  Search,
  Plus,
  ArrowRight,
  Pin,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface Discussion {
  id: string;
  title: string;
  category: string;
  pinned: boolean;
  createdAt: string;
}

interface Resource {
  id: string;
  title: string;
  resourceType: string;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  priority: string;
  createdAt: string;
}

export function CollaborationView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: discRes, isLoading: discLoading, error: discError, refetch } = useApiQuery<any>(
    ["faculty", "collaboration", "discussions"],
    "/api/v1/faculty/collaboration/discussions",
  );
  const { data: resRes, isLoading: resLoading } = useApiQuery<any>(
    ["faculty", "collaboration", "resources"],
    "/api/v1/faculty/collaboration/resources",
  );
  const { data: annRes, isLoading: annLoading } = useApiQuery<any>(
    ["faculty", "collaboration", "announcements"],
    "/api/v1/faculty/collaboration/announcements",
  );
  const loading = discLoading || resLoading || annLoading;
  const error = discError?.message ?? null;

  const discussions = discRes?.discussions ?? discRes ?? [];
  const resources = resRes?.resources ?? resRes ?? [];
  const announcements = annRes?.announcements ?? annRes ?? [];

  const categoryColors: Record<string, string> = {
    projects: "bg-blue-500/10 text-blue-600",
    events: "bg-purple-500/10 text-purple-600",
    curriculum: "bg-[#0E6C3C]/10 text-[#0E6C3C]",
    general: "bg-gray-500/10 text-gray-600",
  };

  const resourceTypeColors: Record<string, string> = {
    document: "bg-blue-500/10 text-blue-600",
    presentation: "bg-orange-500/10 text-orange-600",
    template: "bg-[#0E6C3C]/10 text-[#0E6C3C]",
    video: "bg-red-500/10 text-red-600",
  };

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "التعاون" : "Collaboration"} description={ar ? "المناقشات والموارد والإعلانات" : "Discussions, resources, and announcements"} />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" /></div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "التعاون" : "Collaboration"} description={ar ? "المناقشات والموارد والإعلانات" : "Discussions, resources, and announcements"} />
        <Card><CardContent className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
        </CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "التعاون" : "Collaboration"}
        description={ar ? "المناقشات والموارد والإعلانات" : "Discussions, resources, and announcements"}
        actions={
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />{ar ? "جديد" : "New"}</Button>
        }
      />
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Discussions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5 text-blue-500" />{ar ? "المناقشات" : "Discussions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {discussions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد مناقشات" : "No discussions yet"}</p>
              ) : (
                <div className="space-y-3">
                  {discussions.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        {d.pinned && <Pin className="h-3 w-3 text-amber-500" />}
                        <p className="font-medium text-sm">{d.title}</p>
                      </div>
                      <Badge className={`text-xs ${categoryColors[d.category] || categoryColors.general}`}>{d.category}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5 text-amber-500" />{ar ? "الإعلانات" : "Announcements"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد إعلانات" : "No announcements"}</p>
              ) : (
                <div className="space-y-3">
                  {announcements.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-3 rounded-lg border">
                      <p className="font-medium text-sm">{a.title}</p>
                      <Badge variant={a.priority === "high" ? "destructive" : "outline"} className="text-xs mt-1">{a.priority}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resources */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-green-500" />{ar ? "الموارد المشتركة" : "Shared Resources"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد موارد" : "No resources yet"}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resources.slice(0, 6).map((r) => (
                  <div key={r.id} className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <p className="font-medium text-sm">{r.title}</p>
                    <Badge className={`text-xs mt-1 ${resourceTypeColors[r.resourceType] || resourceTypeColors.document}`}>{r.resourceType}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
