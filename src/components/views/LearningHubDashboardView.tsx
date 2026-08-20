"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  PlayCircle,
  Trophy,
  Flame,
  Clock,
  Calendar,
  Sparkles,
  FlaskConical,
  Award,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export function LearningHubDashboardView() {
  const { lang, setView } = useApp();
  const ar = lang === "ar";

  return (
    <>
      <PageHeader
        title={ar ? "لوحة التعلم" : "Learning Hub Dashboard"}
        description={ar ? "ماذا يجب أن أتعلم اليوم؟" : "What should I learn today?"}
      />
      <div className="space-y-6 pb-12">
        {/* iSCARB AI Hero Section - The Learning Loop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-iscarb-green/30 bg-gradient-to-br from-iscarb-green/5 to-iscarb-cyan/5 p-6 shadow-sm"
        >
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-iscarb-green/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E6C3C] to-[#0F7B8A] shadow-lg shadow-[#0E6C3C]/20">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-iscarb-green/10 text-iscarb-green">
                    iSCARB AI
                  </Badge>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {ar ? "توصية مخصصة" : "Personalized Recommendation"}
                  </span>
                </div>
                <p className="text-lg font-medium leading-relaxed text-iscarb-ink dark:text-white max-w-2xl">
                  {ar
                    ? "بناءً على تقييمك الأخير، حددنا فجوة في \"التفكير الخوارزمي\". نوصي ببدء مسار \"هياكل البيانات المتقدمة\" لتحسين جاهزيتك المهنية."
                    : "Based on your recent assessment, we identified a gap in \"Algorithmic Thinking\". We recommend starting the \"Advanced Data Structures\" path to improve your career readiness."}
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <Button className="bg-iscarb-green hover:bg-iscarb-green-dark">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {ar ? "ابدأ المسار الموصى به" : "Start Recommended Path"}
                  </Button>
                  <Button variant="outline" className="border-iscarb-green/20 text-iscarb-green hover:bg-iscarb-green/5">
                    {ar ? "عرض تحليل الكفاءة" : "View Competency Analysis"}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex shrink-0 gap-3">
              <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-background/50 p-4 min-w-[100px]">
                <Flame className="mb-1 h-6 w-6 text-orange-500" />
                <span className="font-display text-2xl font-bold">12</span>
                <span className="text-xs text-muted-foreground">{ar ? "يوم متتالي" : "Day Streak"}</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-background/50 p-4 min-w-[100px]">
                <Clock className="mb-1 h-6 w-6 text-blue-500" />
                <span className="font-display text-2xl font-bold">4.5</span>
                <span className="text-xs text-muted-foreground">{ar ? "ساعات هذا الأسبوع" : "Hrs this Week"}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Continue Learning */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">{ar ? "متابعة التعلم" : "Continue Learning"}</h3>
                <span className="text-sm text-iscarb-green font-medium cursor-pointer hover:underline">
                  {ar ? "عرض مساراتي" : "View My Paths"} <ArrowRight className="inline-block h-3 w-3 ml-1" />
                </span>
              </div>
              <Card className="border-border/60 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="h-32 w-full sm:w-48 shrink-0 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                      <span className="font-display text-4xl font-bold text-white/20">AI</span>
                    </div>
                    <div className="p-5 flex flex-col justify-between w-full">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "دورة تدريبية" : "Course"}</span>
                          <Badge variant="secondary">Module 3/8</Badge>
                        </div>
                        <h4 className="font-bold text-lg">Foundations of Generative AI</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">Introduction to Large Language Models and Prompt Engineering.</p>
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{ar ? "التقدم" : "Progress"}</span>
                            <span className="font-semibold">35%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-iscarb-cyan rounded-full" style={{ width: "35%" }} />
                          </div>
                        </div>
                        <Button size="sm" className="bg-iscarb-ink hover:bg-iscarb-ink/80 text-white">
                          <PlayCircle className="mr-1.5 h-4 w-4" /> {ar ? "استئناف" : "Resume"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Recommended Skills & Labs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/60">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 text-iscarb-gold-dark">
                    <Sparkles className="h-4 w-4" />
                    <h4 className="font-bold text-sm uppercase tracking-wider">{ar ? "مهارات مقترحة" : "Recommended Skills"}</h4>
                  </div>
                  <div className="space-y-3">
                    {["Cloud Architecture", "System Design", "Agile Methodologies"].map((skill) => (
                      <div key={skill} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                        <span className="text-sm font-medium">{skill}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="h-1.5 w-1.5 rounded-full bg-iscarb-gold" />
                          <span className="h-1.5 w-1.5 rounded-full bg-iscarb-gold" />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/60">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 text-iscarb-cyan-dark">
                    <FlaskConical className="h-4 w-4" />
                    <h4 className="font-bold text-sm uppercase tracking-wider">{ar ? "مختبرات مقترحة" : "Recommended Labs"}</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: "AWS VPC Configuration", type: "Simulation", duration: "45m" },
                      { title: "Docker Containerization", type: "Hands-on", duration: "1h 15m" }
                    ].map((lab) => (
                      <div key={lab.title} className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:border-iscarb-cyan/30 bg-background hover:bg-iscarb-cyan/5 transition-all cursor-pointer">
                        <div>
                          <div className="text-sm font-medium">{lab.title}</div>
                          <div className="text-[10px] text-muted-foreground">{lab.type} • {lab.duration}</div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="space-y-6">
            
            {/* Weekly Goal */}
            <Card className="border-border/60 bg-gradient-to-br from-background to-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold">{ar ? "هدف الأسبوع" : "Weekly Goal"}</h4>
                  <Trophy className="h-4 w-4 text-iscarb-gold" />
                </div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-display font-bold">4.5<span className="text-sm font-normal text-muted-foreground">/6 hrs</span></span>
                  <span className="text-xs font-medium text-iscarb-green flex items-center"><TrendingUp className="mr-1 h-3 w-3" /> On track</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-iscarb-gold rounded-full" style={{ width: "75%" }} />
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="border-border/60">
              <CardContent className="p-5">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {ar ? "المواعيد القادمة" : "Upcoming Deadlines"}
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 px-2 py-1 min-w-[3rem] text-red-600">
                      <span className="text-xs font-bold uppercase">Oct</span>
                      <span className="text-lg font-bold leading-none">24</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold">Capstone Project Draft</div>
                      <div className="text-[11px] text-muted-foreground">Software Engineering • 11:59 PM</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-2 py-1 min-w-[3rem]">
                      <span className="text-xs font-bold uppercase">Oct</span>
                      <span className="text-lg font-bold leading-none">28</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold">ML Model Accuracy Test</div>
                      <div className="text-[11px] text-muted-foreground">Practice Labs • Optional</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificates Progress */}
            <Card className="border-border/60">
              <CardContent className="p-5">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  {ar ? "تقدم الشهادات" : "Certificates Progress"}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-iscarb-green/10 flex items-center justify-center">
                      <Award className="h-5 w-5 text-iscarb-green" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold line-clamp-1">AWS Cloud Practitioner</span>
                        <span>80%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-iscarb-green rounded-full" style={{ width: "80%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </>
  );
}
