"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { ReadinessRing } from "@/components/iscarb/ReadinessRing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  FileText,
  MessageSquare,
  Trophy,
  Target,
  ArrowRight,
  LineChart,
  Search,
  Building,
  CheckSquare,
  Calendar,
  Award,
  Sparkles,
  Bot
} from "lucide-react";

export function CareerHubDashboardView() {
  const { lang, setView } = useApp();
  const ar = lang === "ar";

  return (
    <>
      <PageHeader
        title={ar ? "لوحة المسار المهني" : "Career Hub Dashboard"}
        description={ar ? "هل أنت مستعد للتوظيف؟" : "Am I ready to get hired?"}
      />
      
      <div className="space-y-6 pb-12">
        
        {/* Readiness Hero */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Main Readiness Score */}
          <Card className="border-border/60 bg-gradient-to-br from-background to-muted/20 md:col-span-1">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
              <h3 className="font-bold text-lg mb-6">{ar ? "الجاهزية المهنية" : "Career Readiness"}</h3>
              <ReadinessRing
                score={84}
                size={160}
                stroke={12}
                label={ar ? "جاهزية مهنية" : "Ready"}
                showAverageZone={false}
              />
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-iscarb-green border-iscarb-green/30">Top 15%</Badge>
                <Badge variant="outline" className="text-iscarb-cyan border-iscarb-cyan/30">Placement Ready</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown & AI Match */}
          <div className="space-y-6 md:col-span-2">
            
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold">{ar ? "تفصيل الجاهزية" : "Readiness Breakdown"}</h4>
                  <span className="text-xs text-muted-foreground">{ar ? "يتم التحديث بواسطة الذكاء الاصطناعي" : "Continuously updated by AI"}</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Technical Skills", score: 91, icon: Trophy },
                    { label: "Portfolio", score: 95, icon: Briefcase },
                    { label: "Resume", score: 88, icon: FileText },
                    { label: "Leadership", score: 82, icon: Target },
                    { label: "Communication", score: 75, icon: MessageSquare },
                    { label: "Interview", score: 63, icon: Bot, isWeak: true },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl border border-border/50 bg-background flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <item.icon className={`h-4 w-4 ${item.isWeak ? 'text-red-500' : 'text-iscarb-cyan'}`} />
                        <span className={`text-lg font-bold font-display ${item.isWeak ? 'text-red-500' : ''}`}>{item.score}%</span>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Skill Gap Highlight */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-xl border border-iscarb-gold/30 bg-gradient-to-br from-iscarb-gold/5 to-transparent p-5"
            >
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-iscarb-gold-soft flex items-center justify-center">
                  <LineChart className="h-5 w-5 text-iscarb-gold-dark" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">{ar ? "فجوة المهارات: مهندس تعلم الآلة" : "Skill Gap: Google ML Engineer"}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {ar ? "أنت متوافق بنسبة 74٪ مع هذا الدور." : "You are a 74% match for this role."} 
                    <span className="text-iscarb-ink dark:text-white font-medium ml-1">Missing: Docker, Cloud, System Design.</span>
                  </p>
                  <Button size="sm" className="bg-iscarb-gold text-white hover:bg-iscarb-gold-dark">
                    {ar ? "تغطية الفجوة في مسار التعلم" : "Bridge Gap in Learning Hub"}
                  </Button>
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>

        {/* Opportunities & Tracking */}
        <div className="grid gap-6 md:grid-cols-3">
          
          <div className="md:col-span-2 space-y-6">
            
            {/* Job Matches */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-lg flex items-center justify-between">
                  {ar ? "أفضل الفرص المهنية" : "Top Career Matches"}
                  <Button variant="ghost" size="sm" className="text-iscarb-cyan h-auto py-0">View All</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {[
                    { title: "Junior Data Scientist", company: "Aramco", type: "Full-time", match: 86, location: "Dhahran" },
                    { title: "AI Research Intern", company: "SDAIA", type: "Internship", match: 92, location: "Riyadh" },
                  ].map((job) => (
                    <div key={job.title} className="p-5 flex flex-col sm:flex-row justify-between gap-4 hover:bg-accent/50 transition-colors cursor-pointer group">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 rounded-xl border border-border/60 bg-background flex items-center justify-center shrink-0">
                          <Building className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-bold">{job.title}</h4>
                          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{job.company}</span>
                            <span>•</span>
                            <span>{job.location}</span>
                            <span>•</span>
                            <span>{job.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                        <div className="flex items-center gap-1.5 bg-iscarb-cyan/10 text-iscarb-cyan-dark px-2.5 py-1 rounded-md mb-2">
                          <Sparkles className="h-3 w-3" />
                          <span className="text-xs font-bold">{job.match}% Match</span>
                        </div>
                        <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs">Apply</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Application Pipeline */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-lg">{ar ? "خط سير الطلبات" : "Application Pipeline"}</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-muted/30">
                    <div className="text-3xl font-display font-bold">12</div>
                    <div className="text-xs text-muted-foreground mt-1 uppercase">Applied</div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10">
                    <div className="text-3xl font-display font-bold text-blue-600">3</div>
                    <div className="text-xs text-blue-600/70 font-semibold mt-1 uppercase">Reviewing</div>
                  </div>
                  <div className="p-4 rounded-xl bg-iscarb-gold-soft">
                    <div className="text-3xl font-display font-bold text-iscarb-gold-dark">1</div>
                    <div className="text-xs text-iscarb-gold-dark/70 font-semibold mt-1 uppercase">Interview</div>
                  </div>
                  <div className="p-4 rounded-xl bg-iscarb-green/10">
                    <div className="text-3xl font-display font-bold text-iscarb-green-dark">1</div>
                    <div className="text-xs text-iscarb-green-dark/70 font-semibold mt-1 uppercase">Offer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="space-y-6">
            
            {/* Upcoming Interviews */}
            <Card className="border-border/60 border-l-4 border-l-iscarb-gold">
              <CardContent className="p-5">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {ar ? "مقابلات قادمة" : "Upcoming Interviews"}
                </h4>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center justify-center rounded-lg bg-iscarb-gold-soft px-2 py-1 min-w-[3rem] text-iscarb-gold-dark">
                    <span className="text-xs font-bold uppercase">Nov</span>
                    <span className="text-lg font-bold leading-none">02</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold">Technical Round</div>
                    <div className="text-[11px] text-muted-foreground">SDAIA • 10:00 AM via Teams</div>
                    <Button variant="link" className="h-auto p-0 text-[11px] text-iscarb-cyan mt-1">Prep with AI Coach</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-border/60">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-iscarb-cyan-dark">
                  <Award className="h-4 w-4" />
                  <h4 className="font-bold text-sm uppercase tracking-wider">{ar ? "شهادات مقترحة" : "Recommended Certifications"}</h4>
                </div>
                <div className="space-y-3">
                  {["AWS Solutions Architect", "Google Data Engineer"].map((cert) => (
                    <div key={cert} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">{cert}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
          </div>

        </div>
      </div>
    </>
  );
}
