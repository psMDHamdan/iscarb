"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  Bookmark,
  Sparkles,
  Search,
  Plus,
  ArrowRight,
  Pin,
  Clock,
  Loader2,
  AlertTriangle,
  Brain,
  Network,
  Tag,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  tags: string[];
}

interface BookmarkData {
  id: string;
  title: string;
  entityType: string;
  tags: string[];
}

interface Prompt {
  id: string;
  title: string;
  category: string;
  usageCount: number;
}

export function KnowledgeWorkspaceView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: notesRes, isLoading: notesLoading, error: notesError, refetch } = useApiQuery<any>(
    ["faculty", "knowledge", "notes"],
    "/api/v1/faculty/knowledge/notes",
  );
  const { data: bookmarksRes, isLoading: bookmarksLoading } = useApiQuery<any>(
    ["faculty", "knowledge", "bookmarks"],
    "/api/v1/faculty/knowledge/bookmarks",
  );
  const { data: promptsRes, isLoading: promptsLoading } = useApiQuery<any>(
    ["faculty", "knowledge", "prompts"],
    "/api/v1/faculty/knowledge/prompts",
  );
  const loading = notesLoading || bookmarksLoading || promptsLoading;
  const error = notesError?.message ?? null;

  const notes = notesRes?.notes ?? [];
  const bookmarks = bookmarksRes?.bookmarks ?? [];
  const prompts = promptsRes?.prompts ?? [];

  const knowledgeModules = [
    { icon: FileText, label: ar ? "الملاحظات" : "Notes", href: "/faculty/knowledge/notes", color: "text-blue-500", stat: notes.length },
    { icon: Network, label: ar ? "الخرائط المعرفية" : "Knowledge Graph", href: "/faculty/knowledge/graph", color: "text-purple-500", stat: ar ? "تفاعلي" : "Interactive" },
    { icon: Sparkles, label: ar ? "الاستعلامات" : "Prompts", href: "/faculty/knowledge/prompts", color: "text-amber-500", stat: prompts.length },
    { icon: Search, label: ar ? "البحث" : "Search", href: "/faculty/knowledge/search", color: "text-[#0E6C3C]", stat: ar ? "متقدم" : "Advanced" },
    { icon: Bookmark, label: ar ? "الإشارات المرجعية" : "Bookmarks", href: "/faculty/knowledge/bookmarks", color: "text-rose-500", stat: bookmarks.length },
  ];

  const categoryColors: Record<string, string> = {
    teaching: "bg-[#0E6C3C]/10 text-[#0E6C3C]",
    research: "bg-blue-500/10 text-blue-600",
    analytics: "bg-purple-500/10 text-purple-600",
    general: "bg-gray-500/10 text-gray-600",
  };

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "مساحة المعرفة" : "Knowledge Workspace"} description={ar ? "مركزك الشامل للمعرفة والملاحظات" : "Your central hub for knowledge and notes"} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "مساحة المعرفة" : "Knowledge Workspace"} description={ar ? "مركزك الشامل للمعرفة والملاحظات" : "Your central hub for knowledge and notes"} />
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

  return (
    <>
      <PageHeader
        title={ar ? "مساحة المعرفة" : "Knowledge Workspace"}
        description={ar ? "مركزك الشامل للمعرفة والملاحظات" : "Your central hub for knowledge and notes"}
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {ar ? "جديد" : "New"}
          </Button>
        }
      />

      <div className="space-y-6 pb-12">
        {/* Knowledge Modules */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {knowledgeModules.map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={`p-2 rounded-lg bg-muted/50 group-hover:scale-110 transition-transform ${mod.color}`}>
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{mod.label}</span>
                  <Badge variant="outline" className="text-xs">{mod.stat}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Notes */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                {ar ? "أحدث الملاحظات" : "Recent Notes"}
              </CardTitle>
              <Link href="/faculty/knowledge/notes" className="text-sm text-blue-500 hover:underline">{ar ? "عرض الكل" : "View All"}</Link>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد ملاحظات" : "No notes yet"}</p>
              ) : (
                <div className="space-y-3">
                  {notes.slice(0, 5).map((note) => (
                    <div key={note.id} className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        {note.pinned && <Pin className="h-3 w-3 text-amber-500" />}
                        <p className="font-medium text-sm">{note.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs ${categoryColors[note.category] || categoryColors.general}`}>{note.category}</Badge>
                        {note.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompts & Bookmarks */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  {ar ? "الاستعلامات المحفوظة" : "Saved Prompts"}
                </CardTitle>
                <Link href="/faculty/knowledge/prompts" className="text-sm text-amber-500 hover:underline">{ar ? "عرض الكل" : "View All"}</Link>
              </CardHeader>
              <CardContent>
                {prompts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد استعلامات" : "No prompts yet"}</p>
                ) : (
                  <div className="space-y-2">
                    {prompts.slice(0, 4).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{p.title}</p>
                          <p className="text-xs text-muted-foreground">{p.usageCount} {ar ? "مرة" : "uses"}</p>
                        </div>
                        <Badge className={`text-xs ${categoryColors[p.category] || categoryColors.general}`}>{p.category}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-rose-500" />
                  {ar ? "الإشارات المرجعية" : "Bookmarks"}
                </CardTitle>
                <Link href="/faculty/knowledge/bookmarks" className="text-sm text-rose-500 hover:underline">{ar ? "عرض الكل" : "View All"}</Link>
              </CardHeader>
              <CardContent>
                {bookmarks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد إشارات" : "No bookmarks yet"}</p>
                ) : (
                  <div className="space-y-2">
                    {bookmarks.slice(0, 4).map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <p className="font-medium text-sm">{b.title}</p>
                        <Badge variant="outline" className="text-xs">{b.entityType}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
