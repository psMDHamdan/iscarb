"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Calendar, FileText, Layers, Clock, Plus, ChevronRight,
  GraduationCap, Target, Zap, CheckCircle2, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/lib/use-api-query";

const tabs = [
  { id: "curriculum", labelEn: "Curriculum", labelAr: "المنهج", icon: Layers },
  { id: "lessons", labelEn: "Lessons", labelAr: "الدروس", icon: BookOpen },
  { id: "resources", labelEn: "Resources", labelAr: "الموارد", icon: FileText },
  { id: "content", labelEn: "Content", labelAr: "المحتوى", icon: Zap },
  { id: "timeline", labelEn: "Timeline", labelAr: "الجدول الزمني", icon: Calendar },
];

// No mock data - all data comes from PostgreSQL via API

export function TeachingWorkspaceView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [activeTab, setActiveTab] = useState("curriculum");
  const { data: teachingData, isLoading: teachingLoading } = useApiQuery<{ data?: any[] }>(["faculty", "teaching"], "/api/v1/faculty/teaching");
  const { data: knowledgeData, isLoading: knowledgeLoading } = useApiQuery<{ data?: any[] }>(["faculty", "knowledge"], "/api/v1/faculty/knowledge");

  const loading = teachingLoading || knowledgeLoading;
  const plans = (teachingData?.data ?? []).slice(0, 5);
  const resources = (knowledgeData?.data ?? []).slice(0, 5);
  const timeline: any[] = [];
  const content: any[] = [];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      <PageHeader
        title={ar ? "مساحة التدريس" : "Teaching Workspace"}
        description={ar ? "إدارة المناهج، الدروس، الموارد، والمحتوى التعليمي" : "Manage curriculum, lessons, resources, and teaching content."}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Dashboard", href: "/faculty/dashboard" },
          { label: ar ? "التدريس" : "Teaching", href: "/faculty/teaching" },
        ]}
      />

      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6 pb-12">
        {/* Stats Row */}
        <motion.div variants={item} className="grid gap-4 sm:grid-cols-4">
          {[
            { label: ar ? "خطط التدريس" : "Teaching Plans", value: String(plans.length), icon: BookOpen, color: "iscarb-cyan" },
            { label: ar ? "الموارد التعليمية" : "Learning Resources", value: String(resources.length), icon: FileText, color: "iscarb-green" },
            { label: ar ? "عناصر المحتوى" : "Content Items", value: String(content.length), icon: Layers, color: "iscarb-gold" },
            { label: ar ? "أحداث الجدول" : "Timeline Events", value: String(timeline.length), icon: Calendar, color: "destructive" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg bg-${stat.color}/10 text-${stat.color}`}>
                    <stat.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <div className="flex overflow-x-auto border-b border-border/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-iscarb-cyan text-iscarb-cyan"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="size-4" />
                  {ar ? tab.labelAr : tab.labelEn}
                </button>
              ))}
            </div>

            <CardContent className="p-6">
              {/* Curriculum Tab */}
              {activeTab === "curriculum" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{ar ? "المناهج الدراسية" : "Curriculum Plans"}</h3>
                    <Button size="sm" className="bg-iscarb-cyan hover:bg-iscarb-cyan/90">
                      <Plus className="mr-2 size-4" />{ar ? "إضافة خطة" : "Add Plan"}
                    </Button>
                  </div>
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-iscarb-cyan/10 text-iscarb-cyan">
                          <GraduationCap className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium">{plan.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {ar ? "النوع:" : "Type:"} {plan.type} &middot; {ar ? "الأهداف:" : "Objectives:"} {plan.objectives}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          plan.status === "published" ? "bg-iscarb-green/10 text-iscarb-green" :
                          plan.status === "scheduled" ? "bg-iscarb-gold/10 text-iscarb-gold-dark" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {ar ? (plan.status === "published" ? "منشور" : plan.status === "scheduled" ? "مجدول" : "مسودة") : plan.status}
                        </span>
                        <span className="text-sm text-muted-foreground">{plan.date}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lessons Tab */}
              {activeTab === "lessons" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{ar ? "خطط الدروس" : "Lesson Plans"}</h3>
                    <Button size="sm" className="bg-iscarb-cyan hover:bg-iscarb-cyan/90">
                      <Plus className="mr-2 size-4" />{ar ? "درس جديد" : "New Lesson"}
                    </Button>
                  </div>
                  {plans.filter(p => p.type === "lesson").map((plan) => (
                    <div key={plan.id} className="rounded-lg border border-border/50 p-4 hover:bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{plan.title}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-iscarb-cyan/10 px-2 py-0.5 text-xs text-iscarb-cyan">
                              {ar ? `${plan.objectives} أهداف` : `${plan.objectives} objectives`}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{plan.date}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">{ar ? "تعديل" : "Edit"}</Button>
                          <Button size="sm" className="bg-iscarb-green hover:bg-iscarb-green/90">{ar ? "نشر" : "Publish"}</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === "resources" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{ar ? "الموارد التعليمية" : "Learning Resources"}</h3>
                    <Button size="sm" className="bg-iscarb-cyan hover:bg-iscarb-cyan/90">
                      <Plus className="mr-2 size-4" />{ar ? "إضافة مورد" : "Add Resource"}
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {resources.map((res) => (
                      <Card key={res.id} className="border-border/50 bg-background/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <FileText className="size-5 text-iscarb-cyan" />
                            <span className={`rounded-full px-2 py-0.5 text-xs ${
                              res.visibility === "public" ? "bg-iscarb-green/10 text-iscarb-green" : "bg-muted text-muted-foreground"
                            }`}>{res.visibility}</span>
                          </div>
                          <p className="font-medium">{res.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{res.type}</p>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {res.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Tab */}
              {activeTab === "content" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{ar ? "عناصر المحتوى" : "Content Items"}</h3>
                    <Button size="sm" className="bg-iscarb-cyan hover:bg-iscarb-cyan/90">
                      <Plus className="mr-2 size-4" />{ar ? "إضافة محتوى" : "Add Content"}
                    </Button>
                  </div>
                  {content.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-iscarb-gold/10 text-iscarb-gold-dark">
                          <Zap className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.type} &middot; v{item.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.aiGenerated && (
                          <span className="rounded-full bg-iscarb-purple/10 px-2 py-0.5 text-xs text-purple-400">
                            {ar ? "مولّد بالذكاء الاصطناعي" : "AI Generated"}
                          </span>
                        )}
                        <Button variant="ghost" size="sm">{ar ? "فتح" : "Open"}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{ar ? "الجدول الزمني للتدريس" : "Teaching Timeline"}</h3>
                    <Button size="sm" className="bg-iscarb-cyan hover:bg-iscarb-cyan/90">
                      <Plus className="mr-2 size-4" />{ar ? "إضافة حدث" : "Add Event"}
                    </Button>
                  </div>
                  <div className="relative ml-4 border-l-2 border-border/50 pl-6">
                    {timeline.map((ev, i) => (
                      <div key={ev.id} className="relative mb-6 last:mb-0">
                        <div className={`absolute -left-[31px] top-1 size-4 rounded-full border-2 ${
                          ev.completed ? "border-iscarb-green bg-iscarb-green" : "border-iscarb-cyan bg-background"
                        }`} />
                        <div className="rounded-lg border border-border/50 p-4 hover:bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{ev.title}</p>
                              <p className="text-sm text-muted-foreground">{ev.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs ${
                                ev.type === "milestone" ? "bg-iscarb-cyan/10 text-iscarb-cyan" : "bg-iscarb-gold/10 text-iscarb-gold-dark"
                              }`}>{ev.type}</span>
                              {!ev.completed && (
                                <Button variant="ghost" size="sm">
                                  <CheckCircle2 className="size-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}
