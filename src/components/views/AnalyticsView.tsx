"use client";

import { motion } from "framer-motion";
import { LineChart, Activity, Zap, TrendingUp, Clock, AlertTriangle, ShieldCheck, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/iscarb/PageHeader";

export function AnalyticsView() {
  const { lang } = useApp();
  const { t, ar } = useI18n();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const competencies = [
    { name: "Communication", score: 85, color: "bg-blue-500" },
    { name: "Leadership", score: 65, color: "bg-purple-500" },
    { name: "Problem Solving", score: 92, color: "bg-iscarb-green" },
    { name: "AI Literacy", score: 88, color: "bg-iscarb-cyan" },
    { name: "Programming", score: 70, color: "bg-orange-500" },
  ];

  return (
    <>
      <PageHeader
        title={ar ? "التحليلات والفجوات" : "Analytics & Skill Gaps"}
        description={ar ? "تحليل الكفاءات ومطابقة مهاراتك مع متطلبات سوق العمل." : "Competency analysis and mapping your skills to market requirements."}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Dashboard", href: "/student/dashboard" },
          { label: ar ? "التحليلات" : "Analytics", href: "/student/analytics" },
        ]}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-7xl space-y-6 pb-12 px-4"
      >
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Competency Map */}
          <motion.div variants={item} className="flex flex-col">
            <Card className="flex-1 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Target className="size-5 text-primary" />
                  <div>
                    <CardTitle className="font-display text-xl">{ar ? "خريطة الكفاءات الشاملة" : "Visual Competency Map"}</CardTitle>
                    <CardDescription>{ar ? "إجمالي مهاراتك عبر جميع التقييمات." : "Your aggregate skills across all assessments."}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {competencies.map((comp) => (
                  <div key={comp.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-foreground">{comp.name}</span>
                      <span className="font-bold">{comp.score}%</span>
                    </div>
                    <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted/50 border border-border/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${comp.score}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`h-full rounded-full ${comp.color} shadow-sm`}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Skill Gap Analysis (AI Powered) */}
          <motion.div variants={item} className="flex flex-col">
            <Card className="flex-1 border-iscarb-gold/30 bg-gradient-to-br from-iscarb-gold/5 to-background shadow-sm">
              <CardHeader className="pb-4 border-b border-iscarb-gold/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="size-5 text-iscarb-gold-dark" />
                    <div>
                      <CardTitle className="font-display text-xl text-iscarb-gold-dark">{ar ? "تحليل فجوة المهارات" : "Skill Gap Analysis"}</CardTitle>
                      <CardDescription>{ar ? "مدعوم بواسطة الذكاء الاصطناعي" : "Powered by AI Engine"}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-iscarb-gold text-iscarb-gold-dark border-iscarb-gold-dark/20 font-bold">
                    Target: AI Engineer
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="bg-background/80 p-5 rounded-xl border border-border/50 shadow-sm text-sm">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {ar ? "لتصبح مهندس ذكاء اصطناعي، أنت تمتلك أساساً قوياً في (محو الأمية الذكاء الاصطناعي)، ولكن هناك فجوات في المهارات التقنية المطلوبة في السوق." : "To become an AI Engineer, you have a strong foundation in AI Literacy, but there are gaps in market-required technical skills."}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">{ar ? "المهارات الحالية" : "Current Strong Skills"}</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-iscarb-green/10 text-iscarb-green hover:bg-iscarb-green/20"><ShieldCheck className="mr-1 size-3" /> Python Basics</Badge>
                        <Badge className="bg-iscarb-green/10 text-iscarb-green hover:bg-iscarb-green/20"><ShieldCheck className="mr-1 size-3" /> Problem Solving</Badge>
                        <Badge className="bg-iscarb-green/10 text-iscarb-green hover:bg-iscarb-green/20"><ShieldCheck className="mr-1 size-3" /> Machine Learning Concepts</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-bold text-destructive mb-2 uppercase tracking-wider">{ar ? "المهارات المفقودة (متطلبات السوق)" : "Missing Market Skills"}</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5"><AlertTriangle className="mr-1 size-3" /> Docker</Badge>
                        <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5"><AlertTriangle className="mr-1 size-3" /> Advanced SQL</Badge>
                        <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5"><AlertTriangle className="mr-1 size-3" /> Cloud Deployments (AWS/GCP)</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full font-bold bg-iscarb-gold-dark hover:bg-yellow-600 text-white shadow-md">
                  {ar ? "تحديث المسار لسد الفجوات" : "Update Learning Path to Close Gaps"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analytics Growth Over Time */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <LineChart className="size-5 text-primary" />
                  <CardTitle className="font-display text-xl">{ar ? "مسار النمو الكلي" : "Overall Growth Timeline"}</CardTitle>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-iscarb-green/10 text-iscarb-green px-3 py-1 rounded-full border border-iscarb-green/20">
                  <TrendingUp className="size-4" /> +12% Growth
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex h-[300px] w-full items-end justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-6">
                {[40, 45, 55, 60, 75, 82, 86].map((height, i) => (
                  <div key={i} className="group relative flex w-full flex-col justify-end">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold py-1 px-2 rounded transition-opacity">
                      {height}%
                    </div>
                    <div 
                      className="w-full rounded-t-md bg-primary/20 transition-all group-hover:bg-primary"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-xs font-bold text-muted-foreground px-2">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </>
  );
}
