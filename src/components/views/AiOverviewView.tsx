"use client";

import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, MessageSquare, Bot, Zap, Clock, Calendar, TrendingUp } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useRouter } from "next/navigation";

export function AiOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const router = useRouter();

  const { data, isLoading: loading, error } = useApiQuery<{
    data: { stats: any; activeAgents: number; recentConversations: any[] }
  }>(["ai", "overview"], "/api/v1/student/ai/overview");

  if (loading) return (
    <><PageHeader title={ar ? "نظرة عامة على الذكاء الاصطناعي" : "AI Overview"} />
      <div className="space-y-3">{[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}</div></>
  );
  if (error || !data?.data) return errorState(ar);

  const { stats, activeAgents, recentConversations } = data.data;

  return (
    <>
      <PageHeader title={ar ? "نظرة عامة على الذكاء الاصطناعي" : "AI Overview"}
        description={ar ? `المكالمات اليوم: ${stats.callsToday} | الرموز المستخدمة: ${stats.tokensUsedToday}` : `Calls Today: ${stats.callsToday} | Tokens Used: ${stats.tokensUsedToday}`} />

      <div className="space-y-6 pb-12">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-iscarb-green/30 bg-iscarb-green/5">
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 text-iscarb-green mx-auto mb-2" />
              <p className="text-3xl font-bold text-iscarb-green">{stats.callsToday}</p>
              <p className="text-sm text-muted-foreground mt-1">{ar ? "المكالمات اليوم" : "Calls Today"}</p>
              <Progress value={(stats.callsToday / 100) * 100} className="h-1 mt-2 bg-iscarb-green/20" />
            </CardContent>
          </Card>
          <Card className="border-iscarb-cyan/30 bg-iscarb-cyan/5">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-iscarb-cyan mx-auto mb-2" />
              <p className="text-3xl font-bold text-iscarb-cyan">{stats.tokensUsedToday}</p>
              <p className="text-sm text-muted-foreground mt-1">{ar ? "الرموز المستخدمة" : "Tokens Used"}</p>
              <Progress value={(stats.tokensUsedToday / 10000) * 100} className="h-1 mt-2 bg-iscarb-cyan/20" />
            </CardContent>
          </Card>
          <Card className="border-blue-300 bg-blue-50/50">
            <CardContent className="p-6 text-center">
              <Bot className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-600">{activeAgents}</p>
              <p className="text-sm text-muted-foreground mt-1">{ar ? "الوكلاء النشطين" : "Active Agents"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversations */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-iscarb-green" />
              {ar ? "المحادثات الأخيرة" : "Recent Conversations"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentConversations.length > 0 ? (
              <div className="divide-y divide-border/40">
                {recentConversations.map((conv: any) => (
                  <div
                    key={conv.id}
                    className="p-4 hover:bg-accent/50 transition-colors cursor-pointer flex items-center justify-between"
                    onClick={() => router.push(`/student/ai-assistant?conversation=${conv.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{conv.agentName}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {conv.messageCount} {ar ? "رسالة" : "messages"}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">{conv.lastMessage}</p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{ar ? "لا توجد محادثات بعد" : "No conversations yet"}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => router.push("/student/ai-assistant")}
                >
                  {ar ? "ابدأ محادثة" : "Start Conversation"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/student/ai/agents")}>
            <CardContent className="p-6">
              <Bot className="h-5 w-5 text-iscarb-green mb-3" />
              <h4 className="font-semibold mb-2">{ar ? "الوكلاء" : "Agents"}</h4>
              <p className="text-xs text-muted-foreground mb-3">{ar ? "إدارة الوكلاء الاصطناعيين وتشغيلهم" : "Manage and run AI agents"}</p>
              <Button size="sm" variant="outline" className="w-full text-xs">
                {ar ? "إدارة الوكلاء" : "Manage Agents"}
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/student/ai/insights")}>
            <CardContent className="p-6">
              <TrendingUp className="h-5 w-5 text-iscarb-cyan mb-3" />
              <h4 className="font-semibold mb-2">{ar ? "الرؤى" : "Insights"}</h4>
              <p className="text-xs text-muted-foreground mb-3">{ar ? "رؤية الاتصالات عبر المجالات" : "Cross-domain insight connections"}</p>
              <Button size="sm" variant="outline" className="w-full text-xs">
                {ar ? "عرض الرؤى" : "View Insights"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function errorState(ar: boolean) {
  return (
    <><PageHeader title={ar ? "نظرة عامة على الذكاء الاصطناعي" : "AI Overview"} />
      <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
      </CardContent></Card></>
  );
}
