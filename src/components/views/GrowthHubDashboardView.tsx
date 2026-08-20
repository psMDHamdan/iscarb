"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Swords,
  Laptop,
  Users,
  Trophy,
  Rocket,
  Banknote,
  Crown,
  Medal,
  ArrowRight,
  Bot,
  Zap,
  Target
} from "lucide-react";

export function GrowthHubDashboardView() {
  const { lang, setView } = useApp();
  const ar = lang === "ar";

  return (
    <>
      <PageHeader
        title={ar ? "لوحة النمو (مركز القيادة)" : "Growth Dashboard (Mission Control)"}
        description={ar ? "بناء، منافسة، إطلاق" : "Build, Compete, Launch"}
      />
      
      <div className="space-y-6 pb-12">
        
        {/* Gamification & AI Hero */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* XP & Rank */}
          <Card className="border-border/60 bg-gradient-to-br from-background to-iscarb-gold/5 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">{ar ? "المستوى 12: مبتكر" : "Level 12: Innovator"}</h3>
                <Crown className="h-5 w-5 text-iscarb-gold" />
              </div>
              <div className="flex flex-col items-center justify-center text-center mb-6">
                <span className="font-display text-5xl font-bold text-iscarb-gold-dark">12,450</span>
                <span className="text-sm text-muted-foreground uppercase tracking-widest mt-1">XP Points</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{ar ? "الترتيب العام" : "Global Rank"}</span>
                  <span className="font-bold">#42</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{ar ? "ترتيب الدفعة" : "Cohort Rank"}</span>
                  <span className="font-bold">#5</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Growth Coach Recommendation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 relative overflow-hidden rounded-xl border border-iscarb-cyan/30 bg-gradient-to-br from-iscarb-cyan/5 to-transparent p-6 shadow-sm"
          >
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-iscarb-cyan/10 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-iscarb-cyan-soft">
                  <Bot className="h-5 w-5 text-iscarb-cyan-dark" />
                </div>
                <Badge variant="secondary" className="bg-iscarb-cyan/10 text-iscarb-cyan">iSCARB AI Coach</Badge>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">{ar ? "اقتراح للنمو: هاكاثون الذكاء الاصطناعي" : "Growth Suggestion: AI Healthcare Hackathon"}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
                  {ar
                    ? "ملفك الشخصي يفتقر إلى مشاريع عملية في الذكاء الاصطناعي. الانضمام إلى هذا الهاكاثون القادم سيضيف 500 نقطة خبرة وشهادة معتمدة مباشرة إلى ملفك المهني."
                    : "Your portfolio is missing practical AI projects. Joining this upcoming hackathon will add 500 XP and a verified project directly to your Career Portfolio."}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <Button className="bg-iscarb-cyan text-white hover:bg-iscarb-cyan-dark">
                  <Zap className="mr-2 h-4 w-4" /> {ar ? "انضمام الآن" : "Join Hackathon"}
                </Button>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" /> {ar ? "البحث عن فريق" : "Find a Team"}
                </Button>
              </div>
            </div>
          </motion.div>
          
        </div>

        {/* Action Widgets */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Active Challenges */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Swords className="h-4 w-4 text-orange-500" /> {ar ? "تحديات نشطة" : "Active Challenges"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                <div className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between mb-1">
                    <h5 className="font-bold text-sm group-hover:text-iscarb-cyan transition-colors">Daily Algorithm Sprint</h5>
                    <Badge variant="outline" className="text-xs">Medium</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Optimize a Graph Traversal algorithm in Python.</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-orange-500 font-medium flex items-center gap-1"><Target className="h-3 w-3" /> +50 XP</span>
                    <span>2 hours left</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Progress (Capstone/Startup) */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Rocket className="h-4 w-4 text-purple-500" /> {ar ? "مشاريعك" : "My Projects"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold">FinTech Capstone Prototype</span>
                  <span className="text-purple-500">60%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: "60%" }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Next milestone: UX Wireframes due in 3 days.</p>
              </div>
            </CardContent>
          </Card>

          {/* Funding & Grants */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Banknote className="h-4 w-4 text-green-600" /> {ar ? "فرص تمويل" : "Funding Opportunities"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                <div className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="font-bold text-sm">University Innovation Grant</h5>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Up to 50,000 SAR for AI-driven student startups.</p>
                  <div className="flex justify-between items-center">
                    <Badge className="bg-green-600/10 text-green-700 hover:bg-green-600/20 shadow-none border-0">Open</Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}
