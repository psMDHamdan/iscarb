"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Zap, CheckCircle2, Clock } from "lucide-react";

export function AiAiAgentsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  
  return (
    <StudentPageTemplate
      title="Agents & Workflows"
      titleAr="الوكلاء وسير العمل"
      apiEndpoint="/api/v1/student/ai/agents"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: "AI", href: "/student/ai" },
        { label: ar ? "الوكلاء" : "Agents", href: "/student/ai/ai/agents" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{ar ? "وكلاء متاحون" : "Available Agents"}</p>
                <p className="text-2xl font-bold">{data?.stats?.availableAgents || data?.agents?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{ar ? "مهمات نشطة" : "Active Tasks"}</p>
                <p className="text-2xl font-bold">{data?.stats?.activeTasks || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{ar ? "مكتمل" : "Completed"}</p>
                <p className="text-2xl font-bold">{data?.stats?.completedTasks || 0}</p>
              </CardContent>
            </Card>
          </div>
          {data?.agents?.map((agent: any) => (
            <Card key={agent.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.description || agent.type}</p>
                  </div>
                </div>
                <Badge className={agent.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                  {agent.status || "active"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </StudentPageTemplate>
  );
}
