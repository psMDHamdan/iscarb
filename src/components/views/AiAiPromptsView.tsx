"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Code, MessageSquare } from "lucide-react";

export function AiAiPromptsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="AI Prompts"
      titleAr="موجهات الذكاء الاصطناعي"
      apiEndpoint="/api/v1/student/ai/prompts"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: "AI", href: "/student/ai" },
        { label: ar ? "الموجهات" : "Prompts", href: "/student/ai/ai/prompts" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "محفوظات" : "Saved"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.prompts?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "كود" : "Code"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.codePrompts || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">{ar ? "محادثة" : "Chat"}</p>
                </div>
                <p className="text-2xl font-bold">{data?.chatPrompts || 0}</p>
              </CardContent>
            </Card>
          </div>
          {data?.prompts?.map((prompt: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="font-medium text-sm">{prompt.title || prompt.name}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{prompt.template?.substring(0, 80)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}
