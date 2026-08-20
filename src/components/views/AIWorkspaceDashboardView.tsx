"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Zap,
  MessageSquare,
  GraduationCap,
  Briefcase,
  Activity,
  PlayCircle,
  ArrowRight
} from "lucide-react";

export function AIWorkspaceDashboardView() {
  const { lang, setView } = useApp();
  const ar = lang === "ar";

  return (
    <>
      <PageHeader
        title={ar ? "لوحة الذكاء الاصطناعي (مركز القيادة)" : "AI Dashboard (Mission Control)"}
        description={ar ? "مساحة عملك المدعومة بالذكاء الاصطناعي" : "Your AI-powered workspace"}
      />
      
      <div className="space-y-6 pb-12">
        {/* Hero Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* AI Usage & Productivity */}
          <Card className="border-border/60 bg-gradient-to-br from-background to-iscarb-cyan/5 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">{ar ? "درجة الإنتاجية" : "Productivity Score"}</h3>
                <Activity className="h-5 w-5 text-iscarb-cyan" />
              </div>
              <div className="flex flex-col items-center justify-center text-center mb-6">
                <span className="font-display text-5xl font-bold text-iscarb-cyan-dark">92%</span>
                <span className="text-sm text-muted-foreground mt-1">Excellent</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{ar ? "استخدام اليوم" : "Today's Usage"}</span>
                  <span className="font-bold">2.4 hrs</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{ar ? "المهام المؤتمتة" : "Automated Tasks"}</span>
                  <span className="font-bold">14</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions / Suggested Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 relative overflow-hidden rounded-xl border border-iscarb-gold/30 bg-gradient-to-br from-iscarb-gold/5 to-transparent p-6 shadow-sm"
          >
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-iscarb-gold/10 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-iscarb-gold-soft">
                  <Bot className="h-5 w-5 text-iscarb-gold-dark" />
                </div>
                <Badge variant="secondary" className="bg-iscarb-gold/10 text-iscarb-gold">Suggested Tasks</Badge>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">{ar ? "مهام مقترحة لك" : "Recommended for You"}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                   <div className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background transition-colors cursor-pointer flex flex-col justify-between">
                     <span className="text-sm font-medium mb-2">{ar ? "مراجعة السيرة الذاتية" : "Review Resume with AI"}</span>
                     <Button size="sm" variant="outline" className="w-full text-xs">Start Review</Button>
                   </div>
                   <div className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background transition-colors cursor-pointer flex flex-col justify-between">
                     <span className="text-sm font-medium mb-2">{ar ? "تحضير للمقابلة" : "Mock Interview Prep"}</span>
                     <Button size="sm" variant="outline" className="w-full text-xs">Start Session</Button>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Coaches & Tools */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Study Coach */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-500" /> {ar ? "مدرب الدراسة" : "Study Coach"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
               <p className="text-sm text-muted-foreground mb-4">Your daily study plan is ready. Focus on Data Structures today.</p>
               <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white"><PlayCircle className="h-4 w-4 mr-2" /> Start Studying</Button>
            </CardContent>
          </Card>

          {/* Career Coach */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-green-500" /> {ar ? "المرشد المهني" : "Career Coach"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
               <p className="text-sm text-muted-foreground mb-4">You have a 74% match for ML Engineer roles. Let's close the gap.</p>
               <Button className="w-full bg-green-500 hover:bg-green-600 text-white"><ArrowRight className="h-4 w-4 mr-2" /> View Advice</Button>
            </CardContent>
          </Card>

           {/* Recent Chats */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-purple-500" /> {ar ? "محادثات أخيرة" : "Recent Chats"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                <div className="p-3 hover:bg-accent/50 transition-colors cursor-pointer text-sm font-medium">Explain Quantum Computing</div>
                <div className="p-3 hover:bg-accent/50 transition-colors cursor-pointer text-sm font-medium">Fix Python Index Error</div>
                <div className="p-3 hover:bg-accent/50 transition-colors cursor-pointer text-sm font-medium">Draft email to professor</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
