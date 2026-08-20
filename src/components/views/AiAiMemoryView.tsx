"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Database, Clock } from "lucide-react";

export function AiAiMemoryView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="AI Memory"
      titleAr="ذاكرة الذكاء الاصطناعي"
      apiEndpoint="/api/v1/student/ai/memory"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: "AI", href: "/student/ai" },
        { label: ar ? "الذاكرة" : "Memory", href: "/student/ai/ai/memory" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "ذاكرة التعلم" : "Learning Memory"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.stats?.totalMemories || data?.memories?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "مفضلات" : "Bookmarks"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.stats?.bookmarks || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "آخر نشاط" : "Last Active"}</p>
                </div>
                <p className="text-sm font-medium">{data?.stats?.lastActive || "-"}</p>
              </CardContent>
            </Card>
          </div>
          {data?.memories?.map((mem: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="font-medium text-sm">{mem.title || mem.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{mem.category || mem.type}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}
