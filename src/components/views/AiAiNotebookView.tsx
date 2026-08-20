"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, Plus } from "lucide-react";

export function AiAiNotebookView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="AI Notebook"
      titleAr="دفتر الذكاء الاصطناعي"
      apiEndpoint="/api/v1/student/ai/notebook"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: "AI", href: "/student/ai" },
        { label: ar ? "الدفتر" : "Notebook", href: "/student/ai/ai/notebook" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "ملاحظات" : "Notes"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.notes?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "ملخصات" : "Summaries"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.summaries?.length || 0}</p>
              </CardContent>
            </Card>
          </div>
          {data?.notes?.map((note: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="font-medium text-sm">{note.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{note.content?.substring(0, 100)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}
