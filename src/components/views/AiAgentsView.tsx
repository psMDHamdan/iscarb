"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle, Bot, Play, Zap, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-query";

export function AiAgentsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const { data, isLoading: loading, error, refetch } = useApiQuery<{
    data: { agents: any[]; sessions: any[]; studentAgents: any[]; stats: any }
  }>(["ai", "agents"], "/api/v1/student/ai/agents");

  const { mutate: updateAgent } = useApiMutation<{ success: boolean; data: any }>(
    (data) => ({ url: "/api/v1/student/ai/agents", method: "PUT", body: data })
  );

  const { mutate: triggerAgent } = useApiMutation<{ success: boolean; data: any }>(
    (data) => ({ url: "/api/v1/student/ai/agents", method: "POST", body: data })
  );

  const handleToggleAgent = async (agentId: string, enabled: boolean) => {
    const result = await updateAgent({ agentId, enabled });
    if (result?.success) refetch();
  };

  const handleTriggerAgent = async (agentId: string) => {
    const result = await triggerAgent({ agentId, input: "Triggered manually" });
    if (result?.success) {
      refetch();
      // In a real app, navigate to the new conversation
    }
  };

  if (loading) return (
    <><PageHeader title={ar ? "الوكلاء الاصطناعيون" : "AI Agents"} />
      <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}</div></>
  );
  if (error || !data?.data) return errorState(ar);

  const { agents, studentAgents, stats } = data.data;

  return (
    <>
      <PageHeader title={ar ? "الوكلاء الاصطناعيون" : "AI Agents"}
        description={ar ? `${stats.availableAgents} متاح | ${stats.activeSessions} نشط` : `${stats.availableAgents} available | ${stats.activeSessions} active`} />

      <div className="space-y-6 pb-12">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <Bot className="h-6 w-6 text-iscarb-green mb-2" />
              <p className="text-2xl font-bold text-iscarb-green">{stats.availableAgents}</p>
              <p className="text-xs text-muted-foreground">{ar ? "متاح" : "Available"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Zap className="h-6 w-6 text-iscarb-cyan mb-2" />
              <p className="text-2xl font-bold text-iscarb-cyan">{stats.activeSessions}</p>
              <p className="text-xs text-muted-foreground">{ar ? "جلسات نشطة" : "Active Sessions"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Play className="h-6 w-6 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-600">{stats.personalAgents}</p>
              <p className="text-xs text-muted-foreground">{ar ? "وكلاء شخصيين" : "Personal Agents"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent: any) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 border-b border-border/40 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-iscarb-green" />
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">{agent.type}</Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>

                {/* Status Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">{ar ? "الحالة" : "Status"}</span>
                  <Switch
                    checked={agent.enabled}
                    onCheckedChange={(checked) => handleToggleAgent(agent.id, checked)}
                    className="data-[state=checked]:bg-iscarb-green"
                  />
                </div>

                {/* Last Run */}
                {agent.lastRunAt && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {ar ? "آخر تشغيل:" : "Last Run:"} {new Date(agent.lastRunAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {ar ? "تشغيل" : "Run"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => handleTriggerAgent(agent.id)}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {ar ? "تشغيل يدوي" : "Trigger"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Student Agents */}
        {studentAgents.length > 0 && (
          <Card>
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-base">{ar ? "الوكلاء الشخصيون" : "Personal Agents"}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {studentAgents.map((agent: any) => (
                <div key={agent.id} className="p-3 rounded-lg bg-accent/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-iscarb-green flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {agent.enabled ? (ar ? "مفعل" : "Enabled") : (ar ? "معطل" : "Disabled")}
                    </Badge>
                    <Switch
                      checked={agent.enabled}
                      onCheckedChange={(checked) => handleToggleAgent(agent.id, checked)}
                      className="data-[state=checked]:bg-iscarb-green"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function errorState(ar: boolean) {
  return (
    <><PageHeader title={ar ? "الوكلاء الاصطناعيون" : "AI Agents"} />
      <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
      </CardContent></Card></>
  );
}
