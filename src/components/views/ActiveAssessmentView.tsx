"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Send,
  PlayCircle
} from "lucide-react";
import { authHeaders } from "@/lib/client-auth";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";

// Result payload returned by POST /api/iscarb/assessment/batch-score.
// percentile is null when the live cohort is too small to rank against — the
// UI must never fabricate a rank, so the line is hidden unless it is a number.
interface ScoreResult {
  composite?: number | null;
  band?: string | null;
  percentile?: number | null;
}

// ─── Main component ────────────────────────────────────────────────────────

export function ActiveAssessmentView() {
  const { ar } = useI18n();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [modules, setModules] = useState<AssessmentModuleSpec[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScoring, setIsScoring] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 47 });
  const [scenarios, setScenarios] = useState<Record<string, { scenario: string; instructions: string; questionType?: string; choices?: string[] }>>({});
  
  const [specialization, setSpecialization] = useState("Computer Science"); // Default for start screen
  const [result, setResult] = useState<ScoreResult | null>(null);

  // Initialization
  const fetchAttemptState = async (isPolling = false) => {
    try {
      const attRes = await fetch(`/api/iscarb/assessment/attempt`, { headers: authHeaders() });
      if (attRes.ok) {
        const { attempt } = await attRes.json();
        if (attempt) {
          setAttemptId(attempt.id);
          setAnswers(attempt.answers || {});
          setSpecialization(attempt.specialization || "Computer Science");
          
          if (attempt.preparing) {
            setPreparing(true);
            setProgress(attempt.progress || { done: 0, total: 47 });
            setLoading(false);
          } else {
            setPreparing(false);
            // Map the returned modules to the old scenarios state shape
            const newScenarios: Record<string, any> = {};
            if (Array.isArray(attempt.modules)) {
               attempt.modules.forEach((mod: any) => {
                 newScenarios[mod.code] = {
                   scenario: mod.scenario,
                   instructions: mod.instructions,
                   questionType: mod.choices ? "mcq" : "text",
                   choices: mod.choices,
                 };
               });
            }
            setScenarios(newScenarios);
            await loadModules(attempt.specialization || "Computer Science");
          }
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const found = await fetchAttemptState();
      if (!found && !cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Poll while preparing
  useEffect(() => {
    if (preparing && attemptId) {
      const interval = setInterval(async () => {
        const res = await fetch(`/api/iscarb/assessment/attempt`, { headers: authHeaders() });
        if (res.ok) {
          const { attempt } = await res.json();
          if (attempt) {
            if (!attempt.preparing) {
              setPreparing(false);
              const newScenarios: Record<string, any> = {};
              if (Array.isArray(attempt.modules)) {
                 attempt.modules.forEach((mod: any) => {
                   newScenarios[mod.code] = {
                     scenario: mod.scenario,
                     instructions: mod.instructions,
                     questionType: mod.choices ? "mcq" : "text",
                     choices: mod.choices,
                   };
                 });
              }
              setScenarios(newScenarios);
              await loadModules(attempt.specialization || "Computer Science");
              setLoading(false);
            } else {
              setProgress(attempt.progress || { done: 0, total: 47 });
            }
          }
        }
      }, 2500);
      return () => clearInterval(interval);
    } else if (!preparing && attemptId && modules.length === 0) {
      setLoading(false);
    }
  }, [preparing, attemptId]);

  const loadModules = async (spec: string) => {
    const res = await fetch(`/api/iscarb/assessment/modules?specialization=${encodeURIComponent(spec)}`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to load modules");
    const data = await res.json();
    setModules(data.modules);
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/iscarb/assessment/attempt`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ specialization }),
      });
      if (!res.ok) throw new Error("Failed to start attempt");
      const { attemptId: newId, preparing: isPrep, progress: prepProg } = await res.json();
      setAttemptId(newId);
      
      if (isPrep) {
        setPreparing(true);
        setProgress(prepProg || { done: 0, total: 47 });
      } else {
        await fetchAttemptState();
      }
    } catch (e) {
      setError("Could not start assessment.");
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (moduleCode: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [moduleCode]: answer }));
    if (!attemptId) return;
    try {
      await fetch(`/api/iscarb/assessment/save-answer`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ attemptId, moduleCode, answer }),
      });
    } catch (e) {
      console.error("Failed to auto-save", e);
    }
  };

  const handleNext = () => {
    if (currentIndex < modules.length - 1) {
      setCurrentIndex(c => c + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
    }
  };

  const handleSubmit = async () => {
    setIsScoring(true);
    try {
      const res = await fetch(`/api/iscarb/assessment/batch-score`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ attemptId }),
      });
      if (!res.ok) throw new Error("Scoring failed");
      const data = await res.json();
      setResult((data?.profile as ScoreResult) ?? null);
    } catch (e) {
      setError("Failed to submit assessment.");
      setIsScoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-8 animate-spin text-iscarb-green" />
        <p className="text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Welcome / Start Screen
  if (!attemptId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-8">
        <h1 className="text-4xl font-display font-bold">iSCARB Employability Assessment</h1>
        <p className="text-lg text-muted-foreground">
          You are about to begin the full 47-module readiness assessment. This will cover Core Professionalism, Business & Digital, Job-Fit, and Growth Potential.
        </p>
        <div className="flex flex-col items-center gap-4">
          <Label>Your Target Job-Fit Track (Auto-detected from Major)</Label>
          <input 
            type="text" 
            value={specialization} 
            onChange={(e) => setSpecialization(e.target.value)}
            className="px-4 py-2 bg-background border rounded-md text-center"
          />
        </div>
        <Button size="lg" onClick={handleStart} className="bg-iscarb-green hover:bg-iscarb-green/90 text-white gap-2">
          <PlayCircle className="size-5" />
          {ar ? "ابدأ التقييم" : "Start Assessment"}
        </Button>
      </div>
    );
  }

  // Pre-generation / Preparing Screen
  if (preparing) {
    const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center max-w-lg mx-auto">
        <Loader2 className="size-16 animate-spin text-iscarb-cyan" />
        <h2 className="text-3xl font-display font-bold">{ar ? "جاري تحضير التقييم..." : "Preparing Your Assessment..."}</h2>
        <p className="text-muted-foreground">
          {ar
            ? "يقوم الذكاء الاصطناعي بتخصيص 47 سيناريو مخصص لتخصصك. لن يبدأ الاختبار حتى نضمن جودة جميع الأسئلة."
            : `AI is pre-generating and verifying 47 personalized scenarios for your track. The test will not start until all questions are fully generated and validated.`}
        </p>
        <div className="w-full space-y-2 pt-4">
          <div className="flex justify-between text-sm font-medium">
            <span>{ar ? "التقدم" : "Progress"}</span>
            <span>{progress.done} / {progress.total}</span>
          </div>
          <Progress value={pct} className="h-2" indicatorClassName="bg-iscarb-cyan" />
        </div>
      </div>
    );
  }

  if (isScoring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <Loader2 className="size-16 animate-spin text-iscarb-cyan" />
        <h2 className="text-3xl font-display font-bold">{ar ? "جارٍ التصحيح..." : "Scoring in Progress..."}</h2>
        <p className="text-muted-foreground max-w-md">
          {ar
            ? "محرك التقييم لدينا يراجع جميع إجاباتك. قد يستغرق ذلك حتى دقيقتين. يرجى عدم إغلاق هذه النافذة."
            : "Our grading engine is evaluating all responses in a single deterministic batch. This may take up to 2 minutes. Please do not close this window."}
        </p>
      </div>
    );
  }

  // Result / completion screen after scoring succeeds.
  if (result) {
    const composite = typeof result.composite === "number" ? Math.round(result.composite) : null;
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-6">
        <h1 className="text-4xl font-display font-bold text-iscarb-green">
          {ar ? "تم إكمال التقييم" : "Assessment Complete"}
        </h1>
        <p className="text-muted-foreground">
          {ar
            ? "تم تسجيل نتيجتك ويمكنك الآن الاطلاع عليها في لوحة التحكم."
            : "Your result has been recorded. You can review the full report from your dashboard."}
        </p>
        {composite !== null && (
          <div className="inline-flex flex-col items-center gap-1 rounded-2xl border border-iscarb-green/30 bg-iscarb-green/5 px-10 py-6">
            <span className="text-sm text-muted-foreground">{ar ? "الدرجة الكلية" : "Overall Score"}</span>
            <span className="text-6xl font-bold font-display">{composite}%</span>
            {result.band && <Badge variant="outline" className="bg-background">{result.band}</Badge>}
          </div>
        )}
        {typeof result.percentile === "number" && (
          <p className="text-lg font-medium">
            {ar
              ? `أفضل من ${result.percentile}% من المرشحين`
              : `Better than ${result.percentile}% of candidates`}
          </p>
        )}
        <div className="pt-4">
          <Button
            size="lg"
            className="bg-iscarb-green hover:bg-iscarb-green/90 text-white"
            onClick={() => {
              window.location.href = "/student/dashboard";
            }}
          >
            {ar ? "الانتقال إلى لوحة التحكم" : "Go to Dashboard"}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    );
  }

  const activeMod = modules[currentIndex];
  if (!activeMod) return null;

  const dynamic = scenarios[activeMod.code];
  const isGenerating = !dynamic;
  const currentAnswer = answers[activeMod.code] || "";
  const progressPct = ((currentIndex + 1) / modules.length) * 100;

  return (
    <>
      <PageHeader
        title={ar ? "التقييم الشامل" : "Comprehensive Assessment"}
        description={`${ar ? "وحدة" : "Module"} ${currentIndex + 1} / ${modules.length}`}
        breadcrumbs={[]}
      />

      <div className="mx-auto max-w-4xl px-4 pb-12">
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>{ar ? "التقدم" : "Progress"}</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} className="h-2" indicatorClassName="bg-iscarb-green" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeMod.code}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Scenario Card */}
            <Card className="border-iscarb-green/30 bg-gradient-to-r from-iscarb-green/5 to-transparent min-h-[200px]">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold font-display flex items-center gap-2">
                      <Badge variant="secondary">{activeMod.code}</Badge>
                      {activeMod.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{activeMod.framework}</p>
                  </div>
                  <Badge variant="outline" className="bg-background">
                    {activeMod.dimension.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isGenerating ? (
                  <div className="flex items-center gap-3 text-muted-foreground py-8">
                    <Loader2 className="size-5 animate-spin" />
                    <span>{ar ? "جاري إنشاء سيناريو مخصص..." : "Generating custom scenario..."}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-lg leading-relaxed whitespace-pre-wrap">
                      {dynamic.scenario}
                    </p>
                    {dynamic.instructions && (
                      <p className="mt-4 text-sm text-muted-foreground border-t pt-4">
                        <span className="font-semibold text-foreground">
                          {ar ? "المطلوب: " : "Task: "}
                        </span>
                        {dynamic.instructions}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Response Form */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-lg font-bold">
                  {ar ? "إجابتك" : "Your Response"}
                </CardTitle>
                <CardDescription>
                  {dynamic?.questionType === "mcq" 
                    ? "Select the most appropriate action."
                    : "Write your detailed response below. Your progress is auto-saved."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {dynamic?.questionType === "mcq" && dynamic.choices ? (
                  <RadioGroup value={currentAnswer} onValueChange={(val) => saveAnswer(activeMod.code, val)}>
                    <div className="space-y-3">
                      {dynamic.choices.map((choice, i) => (
                        <div key={i} className="flex items-center space-x-3 border p-4 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => saveAnswer(activeMod.code, choice)}>
                          <RadioGroupItem value={choice} id={`choice-${i}`} />
                          <Label htmlFor={`choice-${i}`} className="flex-1 cursor-pointer">{choice}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <Textarea
                    className="min-h-[250px] resize-none text-base leading-relaxed bg-background/50 focus:bg-background transition-colors p-4"
                    placeholder={ar ? "اكتب هنا..." : "Type your response here..."}
                    value={currentAnswer}
                    onChange={(e) => saveAnswer(activeMod.code, e.target.value)}
                    disabled={isGenerating}
                  />
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentIndex === 0 || isGenerating}
                  >
                    <ArrowLeft className="mr-2 size-4" />
                    {ar ? "السابق" : "Previous"}
                  </Button>

                  {currentIndex === modules.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isGenerating || !currentAnswer.trim()}
                      className="bg-iscarb-cyan hover:bg-iscarb-cyan-dark text-white"
                    >
                      {ar ? "إنهاء التقييم" : "Submit Assessment"}
                      <Send className="ml-2 size-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={isGenerating || !currentAnswer.trim()}
                      className="bg-iscarb-green hover:bg-iscarb-green/90 text-white"
                    >
                      {ar ? "التالي" : "Next"}
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
