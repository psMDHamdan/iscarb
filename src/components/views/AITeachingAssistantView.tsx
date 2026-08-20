"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  BookOpen,
  Lightbulb,
  FileText,
  MessageSquare,
  ArrowRight,
  Wand2,
  HelpCircle,
  Library,
  ClipboardList,
  Bot,
  GraduationCap,
  Zap,
} from "lucide-react";
import Link from "next/link";

const assistantTabs = [
  {
    id: "generate",
    labelEn: "Generate",
    labelAr: "إنشاء",
    icon: Wand2,
    description: "Lesson plans, slides, notes",
    descriptionAr: "خطط الدروس، الشرائح، الملاحظات",
    href: "/faculty/ai-assistant/generate",
    color: "bg-violet-500/10 text-violet-500",
    features: [
      { en: "Lesson Plans", ar: "خطط الدروس" },
      { en: "Slide Decks", ar: "مجموعات الشرائح" },
      { en: "Study Notes", ar: "ملاحظات الدراسة" },
    ],
  },
  {
    id: "concepts",
    labelEn: "Explain",
    labelAr: "شرح",
    icon: HelpCircle,
    description: "Explain any concept clearly",
    descriptionAr: "شرح أي مفهوم بوضوح",
    href: "/faculty/ai-assistant/concepts",
    color: "bg-iscarb-cyan/10 text-iscarb-cyan",
    features: [
      { en: "Simple Explanations", ar: "شروحات بسيطة" },
      { en: "Analogies & Examples", ar: "تماثيل وأمثلة" },
      { en: "Common Misconceptions", ar: "مفاهيم خاطئة شائعة" },
    ],
  },
  {
    id: "resources",
    labelEn: "Recommend",
    labelAr: "توصيات",
    icon: Library,
    description: "Curated learning resources",
    descriptionAr: "موارد تعليمية منتقاة",
    href: "/faculty/ai-assistant/resources",
    color: "bg-emerald-500/10 text-emerald-500",
    features: [
      { en: "Textbooks & Articles", ar: "كتب ومقالات" },
      { en: "Video Tutorials", ar: "فيديوهات تعليمية" },
      { en: "Practice Tools", ar: "أدوات تدريبية" },
    ],
  },
  {
    id: "summarize",
    labelEn: "Summarize",
    labelAr: "تلخيص",
    icon: ClipboardList,
    description: "Summarize classes and sessions",
    descriptionAr: "تلخيص الفصول والجلسات",
    href: "/faculty/ai-assistant/summarize",
    color: "bg-amber-500/10 text-amber-500",
    features: [
      { en: "Class Summaries", ar: "ملخصات الفصول" },
      { en: "Key Topics", ar: "المواضيع الرئيسية" },
      { en: "Action Items", ar: "إجراءات مطلوبة" },
    ],
  },
  {
    id: "office",
    labelEn: "AI Office",
    labelAr: "المكتب الذكي",
    icon: MessageSquare,
    description: "Chat with AI assistant",
    descriptionAr: "تحدث مع المساعد الذكي",
    href: "/faculty/ai-assistant/office",
    color: "bg-rose-500/10 text-rose-500",
    features: [
      { en: "Student Q&A", ar: "أسئلة الطلاب" },
      { en: "Concept Help", ar: "مساعدة في المفاهيم" },
      { en: "24/7 Availability", ar: "متاح على مدار الساعة" },
    ],
  },
];

const recentGenerations = [
  {
    type: "Lesson Plan",
    typeAr: "خطة الدرس",
    topic: "Introduction to Machine Learning",
    topicAr: "مقدمة في تعلم الآلة",
    time: "Today, 10:30 AM",
    timeAr: "اليوم، 10:30 ص",
  },
  {
    type: "Slides",
    typeAr: "شرائح",
    topic: "Database Normalization",
    topicAr: "تطبيع قواعد البيانات",
    time: "Yesterday, 2:15 PM",
    timeAr: "أمس، 2:15 م",
  },
  {
    type: "Study Notes",
    typeAr: "ملاحظات",
    topic: "Object-Oriented Programming",
    topicAr: "البرمجة الكائنية التوجه",
    time: "2 days ago",
    timeAr: "منذ يومين",
  },
];

const usageStats = [
  { labelEn: "Generated Today", labelAr: "تم إنشاؤه اليوم", value: 12, icon: Sparkles },
  { labelEn: "Total This Week", labelAr: "إجمالي هذا الأسبوع", value: 47, icon: FileText },
  { labelEn: "Concepts Explained", labelAr: "مفاهيم تم شرحها", value: 23, icon: BookOpen },
  { labelEn: "Time Saved", labelAr: "الوقت المُوفر", value: "8.5h", icon: Zap },
];

export function AITeachingAssistantView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <>
      <PageHeader
        title={ar ? "مساعد التدريس بالذكاء الاصطناعي" : "AI Teaching Assistant"}
        description={ar ? "إنشاء وشرح وتوصية وتلخيص بمدعومة من الذكاء الاصطناعي" : "Generate, explain, recommend, and summarize — all AI-powered."}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/faculty/dashboard" },
          { label: ar ? "مساعد الذكاء الاصطناعي" : "AI Assistant", href: "/faculty/ai-assistant" },
        ]}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6 pb-12"
      >
        {/* Usage Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {usageStats.map((stat) => (
            <motion.div key={stat.labelEn} variants={item}>
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {ar ? stat.labelAr : stat.labelEn}
                      </p>
                      <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-iscarb-cyan/10 text-iscarb-cyan">
                      <stat.icon className="size-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Tool Tabs */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="size-5 text-iscarb-cyan" />
                <CardTitle className="text-lg">{ar ? "أدوات الذكاء الاصطناعي" : "AI Tools"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assistantTabs.map((tab) => (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className="group rounded-xl border border-border/50 p-5 transition-all hover:border-iscarb-cyan/50 hover:shadow-md hover:shadow-iscarb-cyan/5"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex size-11 items-center justify-center rounded-xl ${tab.color}`}>
                        <tab.icon className="size-5" />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-iscarb-cyan" />
                    </div>
                    <h3 className="mt-3 font-semibold">{ar ? tab.labelAr : tab.labelEn}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ar ? tab.descriptionAr : tab.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tab.features.map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {ar ? f.ar : f.en}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Generations */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-amber-500" />
                <CardTitle className="text-lg">{ar ? "الإنشاءات الأخيرة" : "Recent Generations"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {recentGenerations.map((gen, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {ar ? gen.typeAr : gen.type}
                    </Badge>
                    <span className="font-medium text-sm">{ar ? gen.topicAr : gen.topic}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{ar ? gen.timeAr : gen.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
