"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle, Send, Loader2, Bot, User, Target, Clock,
  Flame, Sparkles, Lightbulb, ArrowRight, CheckCircle2,
  Zap, BookOpen, Coffee, TrendingUp, Star,
} from "lucide-react";

interface ChatMessage { role: "user" | "assistant"; content: string; }

export function LearningStudyCoachView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: ar ? "مرحباً! أنا مدرب دراستك الذكي. كيف يمكنني مساعدتك اليوم؟" : "Hi! I'm your AI study coach. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<{ label: string; done: boolean }[]>([]);
  const [streak, setStreak] = useState(0);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/v1/student/learning/study-coach")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { setGoals(d.goals || []); setStreak(d.streak || 0); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const r = await fetch("/api/v1/student/learning/study-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const d = await r.json();
      setMessages(prev => [...prev, { role: "assistant", content: d.reply || d.message || (ar ? "فكرة رائعة! دعنا نخطط لذلك." : "Great idea! Let's plan that out.") }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: ar ? "عذراً، حدث خطأ. حاول مرة أخرى." : "Sorry, something went wrong. Try again." }]);
    }
    finally { setSending(false); }
  };

  if (loading) return <LoadingSkeleton ar={ar} />;

  const quickActions = [
    { icon: Target, label: ar ? "خطة اليوم" : "Plan Today", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Clock, label: ar ? "جدول المذاكرة" : "Study Schedule", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: Lightbulb, label: ar ? "نصيحة دراسية" : "Study Tip", color: "text-amber-600", bg: "bg-amber-50" },
    { icon: Zap, label: ar ? "تحفيز" : "Motivate Me", color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-iscarb-cyan to-blue-500">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">{ar ? "مدرب الدراسة" : "Study Coach"}</h1>
          <p className="text-xs text-muted-foreground">{ar ? "مدربك الشخصي للدراسة" : "Your personal AI study coach"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat */}
        <div className="lg:col-span-2 space-y-4">
          {/* Streak */}
          {streak > 0 && (
            <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-amber-200">
              <CardContent className="p-3 flex items-center gap-3">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-semibold">{ar ? `سلسلة دراسية: ${streak} يوم` : `Study streak: ${streak} days`}</span>
                <Badge variant="secondary" className="ml-auto"><Star className="h-3 w-3 mr-1" />{ar ? "استمر!" : "Keep going!"}</Badge>
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          <Card className="flex flex-col h-[400px]">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2"><MessageCircle className="h-4 w-4 text-iscarb-cyan" />{ar ? "المحادثة" : "Chat"}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`p-2 rounded-full ${m.role === "assistant" ? "bg-iscarb-cyan/10" : "bg-muted"}`}>
                    {m.role === "assistant" ? <Bot className="h-4 w-4 text-iscarb-cyan" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${m.role === "assistant" ? "bg-muted/50" : "bg-iscarb-cyan/10"}`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {ar ? "جاري التفكير..." : "Thinking..."}
                </div>
              )}
              <div ref={chatEnd} />
            </CardContent>
            <div className="p-3 border-t flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder={ar ? "اكتب رسالتك..." : "Type your message..."} className="h-9 text-sm" />
              <Button size="sm" onClick={sendMessage} disabled={sending || !input.trim()} className="h-9">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((a, i) => (
              <Button key={i} variant="outline" className={`h-auto py-3 flex-col gap-1 ${a.bg} border-0 hover:shadow-md`}>
                <a.icon className={`h-4 w-4 ${a.color}`} />
                <span className="text-[10px] font-medium">{a.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Goals Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-iscarb-cyan" />{ar ? "أهداف اليوم" : "Today's Goals"}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {goals.length > 0 ? goals.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/50">
                  <div className={`p-0.5 rounded-full ${g.done ? "bg-emerald-500 text-white" : "border border-muted-foreground/30"}`}>
                    {g.done && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <span className={g.done ? "line-through text-muted-foreground" : ""}>{g.label}</span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-4">{ar ? "لا توجد أهداف بعد" : "No goals yet"}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50/30 to-transparent">
            <CardContent className="p-4 text-center">
              <Lightbulb className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-xs font-medium">{ar ? "نصيحة اليوم" : "Today's Tip"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{ar ? "قسم وقت دراستك إلى جلسات قصيرة بفواصل منتظمة لتحسين التركيز." : "Break your study time into short sessions with regular breaks."}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return <div className="mx-auto max-w-5xl px-4 py-8"><Skeleton className="h-10 w-48 mb-6" /><div className="grid gap-6 lg:grid-cols-3"><div className="lg:col-span-2"><Skeleton className="h-[400px] rounded-xl" /></div><Skeleton className="h-48 rounded-xl" /></div></div>;
}
