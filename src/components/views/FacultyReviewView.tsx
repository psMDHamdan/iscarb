"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, XCircle, Clock, Search, Filter, AlertCircle, FileText, User, ChevronRight, Brain, ClipboardCheck, Loader2 } from "lucide-react";

type Submission = {
  id: string;
  studentName: string;
  studentId: string;
  assessmentTitle: string;
  submittedAt: string;
  status: string;
  content: string;
  aiScore: number;
  rubric: { criterion: string; weight: number; score: number }[];
  feedback: string;
  strengths: string[];
  improvements: string[];
};

export function FacultyReviewView() {
  const { t, ar } = useI18n();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/iscarb/assessment/review")
      .then(res => res.json())
      .then(data => {
        if (data.submissions) setSubmissions(data.submissions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeSub = submissions.find(s => s.id === activeSubmissionId);

  const handleSelect = (sub: Submission) => {
    setActiveSubmissionId(sub.id);
    setFeedback(sub.feedback || "");
    const initialScores: Record<string, number> = {};
    sub.rubric.forEach(r => initialScores[r.criterion] = r.score);
    setRubricScores(initialScores);
  };

  const handleScoreChange = (criterion: string, value: number) => {
    setRubricScores(prev => ({ ...prev, [criterion]: value }));
  };

  const handleAction = async (status: "approved" | "rejected") => {
    if (!activeSub) return;
    setSubmitting(true);
    
    const newScore = Math.round(activeSub.rubric.reduce((acc, r) => acc + (rubricScores[r.criterion] || 0) * r.weight, 0));
    const newRubric = activeSub.rubric.map(r => ({ ...r, score: rubricScores[r.criterion] || 0 }));
    
    try {
      await fetch("/api/iscarb/assessment/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId: activeSub.id,
          approved: status === "approved",
          newScore,
          newFeedback: feedback,
          newRubric
        })
      });
      setSubmissions(prev => prev.filter(s => s.id !== activeSub.id));
      setActiveSubmissionId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const overallScore = activeSub 
    ? Math.round(activeSub.rubric.reduce((acc, r) => acc + (rubricScores[r.criterion] || 0) * r.weight, 0)) 
    : 0;

  return (
    <>
      <PageHeader
        title={ar ? "المراجعة اليدوية للتقييمات" : "Manual Assessment Review"}
        description={ar ? "مراجعة وتقييم إجابات الطلاب التي تتطلب تدخلاً بشرياً." : "Review and grade student submissions requiring human intervention."}
      />

      <div className="mx-auto max-w-7xl px-4 pb-12 flex flex-col md:flex-row gap-6">
        
        {/* Submissions List */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">{ar ? "قيد المراجعة" : "Pending Review"} ({submissions.length})</h2>
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {loading ? (
                 <div className="p-8 text-center text-muted-foreground border rounded-xl border-dashed">
                   <Loader2 className="mx-auto size-8 mb-2 animate-spin text-iscarb-green/50" />
                   <p>{ar ? "جاري التحميل..." : "Loading..."}</p>
                 </div>
              ) : submissions.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center text-muted-foreground border rounded-xl border-dashed">
                  <CheckCircle2 className="mx-auto size-8 mb-2 text-iscarb-green/50" />
                  <p>{ar ? "تمت مراجعة جميع التقييمات" : "All submissions reviewed"}</p>
                </motion.div>
              ) : (
                submissions.map((sub) => (
                  <motion.div
                    key={sub.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-colors hover:border-iscarb-green/50 ${activeSubmissionId === sub.id ? 'border-iscarb-green ring-1 ring-iscarb-green/20 bg-iscarb-green/5' : ''}`}
                      onClick={() => handleSelect(sub)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-sm truncate pr-2">{sub.studentName}</div>
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                            {ar ? "بانتظار المراجعة" : "Pending"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-3 line-clamp-1">{sub.assessmentTitle}</div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2">
                          <div className="flex items-center gap-1"><Clock className="size-3" /> {new Date(sub.submittedAt).toLocaleDateString()}</div>
                          <div className="flex items-center gap-1 text-iscarb-cyan-dark"><Brain className="size-3" /> AI: {sub.aiScore}%</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Grading Interface */}
        <div className="w-full md:w-2/3">
          {activeSub ? (
            <Card className="h-full border-border/50 shadow-sm flex flex-col">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{activeSub.assessmentTitle}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      <User className="size-4" /> {activeSub.studentName} ({activeSub.studentId})
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-display text-iscarb-green">{overallScore}%</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{ar ? "الدرجة النهائية" : "Final Score"}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                    <FileText className="size-4" /> {ar ? "إجابة الطالب" : "Student Submission"}
                  </h3>
                  <div className="p-4 rounded-xl bg-muted/30 border text-sm leading-relaxed whitespace-pre-wrap">
                    {activeSub.content}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    {ar ? "معايير التقييم" : "Grading Rubric"}
                  </h3>
                  <div className="space-y-6">
                    {activeSub.rubric.map((r) => (
                      <div key={r.criterion} className="space-y-3">
                        <div className="flex justify-between items-center text-sm font-medium">
                          <span>{r.criterion} <span className="text-muted-foreground text-xs ml-1">(Weight: {r.weight * 100}%)</span></span>
                          <span className="font-bold tabular-nums text-iscarb-green">{rubricScores[r.criterion] || 0} / 100</span>
                        </div>
                        <Slider 
                          value={[rubricScores[r.criterion] || 0]} 
                          max={100} 
                          step={1}
                          onValueChange={(vals) => handleScoreChange(r.criterion, vals[0])}
                          className="py-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {ar ? "ملاحظات للطالب" : "Feedback for Student"}
                  </h3>
                  <Textarea 
                    placeholder={ar ? "أضف ملاحظات بناءة للمساعدة في التحسين..." : "Provide constructive feedback to help them improve..."}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="resize-none h-24"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 p-4 flex justify-end gap-3">
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleAction("rejected")} disabled={submitting}>
                    <XCircle className="mr-2 size-4" /> {ar ? "رفض" : "Reject"}
                  </Button>
                  <Button className="bg-iscarb-green hover:bg-iscarb-green-dark text-white" onClick={() => handleAction("approved")} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />} {ar ? "اعتماد وإرسال" : "Approve & Submit"}
                  </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] rounded-xl border border-dashed flex flex-col items-center justify-center text-muted-foreground">
              <ClipboardCheck className="size-12 mb-4 opacity-20" />
              <p>{ar ? "اختر تقييماً من القائمة للبدء بالمراجعة" : "Select a submission from the list to begin review"}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
