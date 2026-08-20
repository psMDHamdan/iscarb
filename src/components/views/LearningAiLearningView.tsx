"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot, Brain, Sparkles, Send, Loader2, BookOpen, Lightbulb,
  FileText, ArrowRight, GraduationCap, Target, Zap, Star, CheckCircle,
} from "lucide-react";

export function LearningAiLearningView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [practice, setPractice] = useState<any[]>([]);

  const explain = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setExplanation("");
    try {
      const r = await fetch("/api/v1/student/learning/ai-learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), type: "explanation" }),
      });
      const d = await r.json();
      setExplanation(d.data?.content || d.explanation || d.content || (ar ? "هذا مفهوم مهم في مسيرتك التعليمية." : "This is an important concept in your learning journey."));
    } catch {
      setExplanation(ar ? "عذراً، حدث خطأ. حاول مرة أخرى." : "Sorry, something went wrong.");
    }
    finally { setLoading(false); }
  };

  const generatePractice = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/v1/student/learning/ai-practice-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const d = await r.json();
      setPractice(d.questions || d.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">{ar ? "التعلم بالذكاء الاصطناعي" : "AI Learning"}</h1>
          <p className="text-xs text-muted-foreground">{ar ? "مدرسك الذكي لشرح أي موضوع" : "Your AI tutor to explain any topic"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Topic Input */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-iscarb-cyan" />
                <span className="text-sm font-semibold">{ar ? "اكتب موضوعاً لتتعلم عنه" : "Ask me anything to learn"}</span>
              </div>
              <div className="flex gap-2">
                <Input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && explain()}
                  placeholder={ar ? "مثال: الخوارزميات، الذكاء الاصطناعي..." : "e.g., Algorithms, AI, Data Structures..."} className="h-10" />
                <Button onClick={explain} disabled={loading || !topic.trim()} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {ar ? "اشرح" : "Explain"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Explanation */}
          {explanation && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-gradient-to-br from-iscarb-cyan/5 to-transparent border-iscarb-cyan/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" />{topic}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed whitespace-pre-wrap">{explanation}</CardContent>
              </Card>
            </motion.div>
          )}

          {/* Practice */}
          {practice.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-iscarb-cyan" />{ar ? "أسئلة تدريبية" : "Practice Questions"}</h3>
              {practice.map((q: any, i: number) => (
                <Card key={i} className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">{i + 1}. {q.question || q}</p>
                    {q.options && <div className="mt-2 space-y-1">{q.options.map((o: string, oi: number) => (
                      <div key={oi} className="text-xs p-2 rounded-lg bg-muted/50 hover:bg-accent cursor-pointer">{o}</div>
                    ))}</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Topics */}
          <div className="flex flex-wrap gap-2">
            {[ar ? "الخوارزميات" : "Algorithms", ar ? "هياكل البيانات" : "Data Structures", ar ? "التعلم الآلي" : "Machine Learning", ar ? "قواعد البيانات" : "Databases"].map((t, i) => (
              <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-accent text-xs py-1.5" onClick={() => { setTopic(t); }}>{t}</Badge>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-purple-50/30 to-transparent">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <p className="text-xs font-medium">{ar ? "توليد أسئلة تدريبية" : "Generate Practice"}</p>
              <Button size="sm" variant="outline" onClick={generatePractice} disabled={loading || !topic} className="mt-2 w-full text-xs">
                {ar ? "توليد أسئلة" : "Generate Questions"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold">{ar ? "مهارات يمكنك تعلمها" : "Skills to Learn"}</p>
              {[ar ? "تحليل البيانات" : "Data Analysis", ar ? "التفكير النقدي" : "Critical Thinking", ar ? "البرمجة" : "Programming"].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-accent">
                  <GraduationCap className="h-3 w-3 text-iscarb-cyan" />{s}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
