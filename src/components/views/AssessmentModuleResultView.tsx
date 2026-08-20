"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, FileText, Target, TrendingUp } from "lucide-react";
import { ReadinessRing } from "@/components/iscarb/ReadinessRing";

export function AssessmentModuleResultView({ moduleId }: { moduleId: string }) {
  const { ar } = useI18n();
  const router = useRouter();
  
  const [data, setData] = useState<{ module: any, result: any } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("latest_assessment_result");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.module.code === moduleId) {
          setData(parsed);
        }
      } catch (e) {
        console.error("Failed to parse result", e);
      }
    }
  }, [moduleId]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">{ar ? "جاري تحميل النتائج..." : "Loading Results..."}</h2>
      </div>
    );
  }

  const { module, result } = data;
  const score = result.score || 0;
  const pass = score >= 60;

  const handleDownloadReport = async () => {
    // Generate PDF report
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${module.code}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Failed to download report", error);
      alert("Failed to generate PDF report.");
    }
  };

  return (
    <>
      <PageHeader
        title={ar ? "نتائج التقييم" : "Assessment Results"}
        description={module.title}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Dashboard", href: "/student/dashboard" },
          { label: ar ? "دليل التقييمات" : "Assessment Catalog", href: "/assessment/catalog" },
          { label: ar ? "النتائج" : "Results", href: "#" },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-6">
          
          <div className="md:col-span-1 space-y-6">
            <Card className="border-border/60 bg-background/50">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <ReadinessRing score={score} size={200} showLabel label={ar ? "النتيجة" : "Score"} />
                <h3 className="text-xl font-bold mt-4 font-display">
                  {pass ? (ar ? "تم الاجتياز بنجاح" : "Successfully Passed") : (ar ? "بحاجة للتحسين" : "Needs Improvement")}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {pass ? (ar ? "تهانينا! لقد حققت درجة الاجتياز." : "Congratulations! You met the passing threshold.") : (ar ? "لم تصل لدرجة الاجتياز (60). حاول مرة أخرى." : "You did not meet the passing threshold (60). Try again.")}
                </p>
                <Button onClick={handleDownloadReport} className="w-full mt-6 bg-iscarb-green hover:bg-iscarb-green-dark text-white">
                  <FileText className="mr-2 size-4" /> {ar ? "تحميل تقرير PDF" : "Download PDF Report"}
                </Button>
                <Button variant="outline" onClick={() => router.push("/assessment/catalog")} className="w-full mt-3">
                  <ArrowLeft className="mr-2 size-4" /> {ar ? "العودة للدليل" : "Back to Catalog"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="border-iscarb-green/30 bg-gradient-to-br from-iscarb-green/5 to-transparent">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Target className="size-5 text-iscarb-green" />
                  {ar ? "تحليل الذكاء الاصطناعي" : "AI Feedback Analysis"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-base leading-relaxed whitespace-pre-wrap">{result.feedback}</p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border/60">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-500" />
                    {ar ? "نقاط القوة" : "Strengths"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3">
                    {result.strengths?.map((strength: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="size-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                        <span className="leading-tight">{strength}</span>
                      </li>
                    )) || <li className="text-sm text-muted-foreground">No specific strengths identified.</li>}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="size-4 text-orange-500" />
                    {ar ? "مجالات التحسين" : "Improvements"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3">
                    {result.improvements?.map((imp: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="size-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                        <span className="leading-tight">{imp}</span>
                      </li>
                    )) || <li className="text-sm text-muted-foreground">No specific improvements identified.</li>}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

        </motion.div>
      </div>
    </>
  );
}
