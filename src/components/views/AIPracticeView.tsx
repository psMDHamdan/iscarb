"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { authHeaders } from "@/lib/client-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, ArrowRight, Send, Sparkles, Brain, RotateCcw } from "lucide-react";
import { useSession } from "@/lib/use-session";

type State = "setup" | "generating" | "question" | "scoring" | "results";

interface Module {
  code: string;
  title: string;
  scenario: string;
  instructions: string;
  rubric: Array<{ criterion: string; weight: number; descriptor: string }>;
  framework: string;
  specialization: string;
}

interface ScoringResult {
  score: number;
  band: string; // lowercase: "weak" | "developing" | "proficient" | "strong"
  passed: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
  perCriterionJson: string; // JSON-serialized perCriterion array
}

const BAND_COLORS: Record<string, string> = {
  weak: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  developing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  proficient: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  strong: "bg-iscarb-green text-white dark:bg-iscarb-green/80",
};

export function AIPracticeView() {
  const { t, ar } = useI18n();
  const { studentId } = useSession();
  const [state, setState] = useState<State>("setup");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [module, setModule] = useState<Module | null>(null);
  const [response, setResponse] = useState("");
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const topicParam = params.get("topic");
      if (topicParam) setTopic(topicParam);
    }
  }, []);

  const generateQuestion = async () => {
    if (!topic.trim()) {
      setError(ar ? "يرجى إدخال موضوع" : "Please enter a topic");
      return;
    }
    setError("");
    setState("generating");
    try {
      const res = await fetch("/api/iscarb/assessment/ai-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ topic, difficulty }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to generate");
      setModule(data.module);
      setState("question");
    } catch (err) {
      setError((err as Error).message || (ar ? "فشل في التوليد" : "Generation failed"));
      setState("setup");
    }
  };

  const submitResponse = async () => {
    if (!response.trim()) {
      setError(ar ? "يرجى كتابة إجابة" : "Please write a response");
      return;
    }
    if (!module) return;
    setError("");
    setState("scoring");
    try {
      const res = await fetch("/api/iscarb/assessment/score", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          specialization: module.specialization,
          moduleCode: module.code,
          response,
          // Scoring loads the full module from the server practice store — never send moduleDef.
          ...(studentId ? { studentId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || `Scoring failed (${res.status})`);
      // score API returns perCriterion as an array directly (not perCriterionJson)
      setResult({
        score: data.score,
        band: data.band,
        passed: data.passed,
        feedback: data.feedback,
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        perCriterionJson: Array.isArray(data.perCriterion)
          ? JSON.stringify(data.perCriterion)
          : data.perCriterionJson || "[]",
      });
      setState("results");
    } catch (err) {
      setError((err as Error).message || (ar ? "فشل في التقييم" : "Scoring failed"));
      setState("question");
    }
  };

  const reset = () => {
    setState("setup");
    setTopic("");
    setModule(null);
    setResponse("");
    setResult(null);
    setError("");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-iscarb-green/10 to-emerald-50 mb-4">
            <Brain className="h-5 w-5 text-iscarb-green" />
            <span className="text-sm font-semibold text-iscarb-green-dark">
              {ar ? "تدريب بالذكاء الاصطناعي" : "AI-Powered Practice"}
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">
            {ar ? "تدريب ذكي مخصص لك" : "Personalized Practice"}
          </h1>
          <p className="text-muted-foreground">
            {ar
              ? "أنشئ أسئلة تقييم مخصصة لأي موضوع في ثوانٍ"
              : "Generate custom assessment questions for any topic in seconds"}
          </p>
        </div>

        {state === "setup" && (
          <Card>
            <CardHeader>
              <CardTitle>{ar ? "اختر موضوعاً للتدريب" : "Choose Your Practice Topic"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {ar ? "الموضوع" : "Topic"}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={ar ? "مثلاً: إدارة المشاريع، التواصل الفعال..." : "e.g. Project Management, Effective Communication..."}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-iscarb-green"
                  onKeyDown={(e) => e.key === "Enter" && generateQuestion()}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {ar ? "المستوى" : "Difficulty"}
                </label>
                <div className="flex gap-2">
                  {["easy", "medium", "hard"].map((d) => (
                    <Badge
                      key={d}
                      variant={difficulty === d ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2"
                      onClick={() => setDifficulty(d)}
                    >
                      {d === "easy" ? (ar ? "سهل" : "Easy") : d === "medium" ? (ar ? "متوسط" : "Medium") : (ar ? "صعب" : "Hard")}
                    </Badge>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={generateQuestion} className="w-full bg-iscarb-green hover:bg-iscarb-green-dark text-white gap-2">
                <Sparkles className="h-4 w-4" />
                {ar ? "إنشاء سؤال" : "Generate Question"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {state === "generating" && (
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-iscarb-green mx-auto mb-4" />
              <p className="text-muted-foreground">{ar ? "جاري التوليد..." : "Generating your question..."}</p>
            </CardContent>
          </Card>
        )}

        {state === "question" && module && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-iscarb-green/10 to-emerald-50 border-b">
              <CardTitle>{module.title}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{module.framework}</Badge>
                <Badge>{ar ? "15 دقيقة" : "15 min"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h3 className="font-semibold mb-2">{ar ? "السيناريو" : "Scenario"}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border">
                  {module.scenario}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{ar ? "التعليمات" : "Instructions"}</h3>
                <p className="text-sm">{module.instructions}</p>
              </div>
              <div>
                <label className="font-semibold mb-2 block">{ar ? "إجابتك" : "Your Response"}</label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder={ar ? "اكتب إجابتك هنا..." : "Write your response here..."}
                  rows={8}
                  className="resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3">
                <Button onClick={reset} variant="outline" className="flex-1">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {ar ? "إعادة" : "Reset"}
                </Button>
                <Button onClick={submitResponse} className="flex-1 bg-iscarb-green hover:bg-iscarb-green-dark text-white">
                  <Send className="mr-2 h-4 w-4" />
                  {ar ? "إرسال" : "Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {state === "scoring" && (
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-iscarb-green mx-auto mb-4" />
              <p className="text-muted-foreground">{ar ? "جاري التقييم..." : "Scoring your response..."}</p>
            </CardContent>
          </Card>
        )}

        {state === "results" && result && module && (
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>{ar ? "نتائجك" : "Your Results"}</CardTitle>
                <CheckCircle2 className={`h-6 w-6 ${result.passed ? "text-iscarb-green" : "text-red-500"}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="text-center">
                <div className="text-5xl font-display font-bold mb-2">{Math.round(result.score)}%</div>
                <div className="flex gap-2 justify-center">
                  <Badge className={BAND_COLORS[result.band?.toLowerCase() ?? "weak"] || BAND_COLORS.weak}>{result.band}</Badge>
                  <Badge className={result.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                    {result.passed ? (ar ? "ناجح" : "Passed") : (ar ? "لم ينجح" : "Failed")}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{ar ? "الملاحظات" : "Feedback"}</h3>
                <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border">{result.feedback}</p>
              </div>
              {result.strengths.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-emerald-700">{ar ? "نقاط القوة" : "Strengths"}</h3>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.improvements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-amber-700">{ar ? "نقاط التحسين" : "Improvements"}</h3>
                  <ul className="space-y-1">
                    {result.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.perCriterionJson && (() => {
                try {
                  const criteria = JSON.parse(result.perCriterionJson) as Array<{ criterion: string; score: number; max: number }>;
                  return criteria.length > 0 ? (
                    <div>
                      <h3 className="font-semibold mb-3">{ar ? "تفاصيل المعايير" : "Criterion Breakdown"}</h3>
                      <div className="space-y-3">
                        {criteria.map((c, i) => {
                          const pct = c.max > 0 ? Math.round((c.score / c.max) * 100) : 0;
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium capitalize">{c.criterion.replace(/_/g, " ")}</span>
                                <span className="tabular-nums text-muted-foreground">{Math.round(c.score)} / {c.max}</span>
                              </div>
                              <Progress value={pct} className="h-2" indicatorClassName={pct >= 60 ? "bg-iscarb-green" : pct >= 40 ? "bg-amber-400" : "bg-red-400"} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null;
                } catch {
                  return null;
                }
              })()}
              {/* Rubric reveal — shown only after scoring */}
              {module && module.rubric && module.rubric.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-sm">
                    {ar ? "معايير التقييم المستخدمة" : "Scoring Rubric Used"}
                  </h3>
                  <div className="space-y-2">
                    {module.rubric.map((c, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs rounded-lg bg-muted/30 p-3">
                        <Badge variant="outline" className="shrink-0 font-mono">{c.weight}pts</Badge>
                        <div>
                          <div className="font-semibold capitalize">{c.criterion.replace(/_/g, " ")}</div>
                          <div className="text-muted-foreground">{c.descriptor}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button onClick={reset} variant="outline" className="flex-1">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {ar ? "جرب موضوعاً آخر" : "Try Another Topic"}
                </Button>
                <Button onClick={() => window.location.href = "/assessment/employability"} className="flex-1 bg-iscarb-cyan hover:bg-iscarb-cyan-dark text-white">
                  {ar ? "الذهاب للتقييم الكامل" : "Go to Full Assessment"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
