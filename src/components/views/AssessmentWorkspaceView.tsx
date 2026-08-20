"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileQuestion, Code, Mic, BarChart3, Plus, ChevronRight,
  Brain, CheckCircle2, Clock, Users, Trophy, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { useApp } from "@/lib/store";

const tabs = [
  { id: "quiz-builder", labelEn: "Quiz Builder", labelAr: "منشئ الاختبارات", icon: FileQuestion },
  { id: "coding", labelEn: "Coding", labelAr: "البرمجة", icon: Code },
  { id: "viva", labelEn: "Viva", labelAr: "الامتحان الشفهي", icon: Mic },
  { id: "gradebook", labelEn: "Gradebook", labelAr: "سجل الدرجات", icon: BarChart3 },
];

const mockQuizzes: any[] = [];
const mockCoding: any[] = [];
const mockViva: any[] = [];
const mockGradebook: any[] = [];

export function AssessmentWorkspaceView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [activeTab, setActiveTab] = useState("quiz-builder");
  const [quizzes, setQuizzes] = useState(mockQuizzes);
  const [coding, setCoding] = useState(mockCoding);
  const [viva, setViva] = useState(mockViva);
  const [gradebook, setGradebook] = useState(mockGradebook);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch assessment data from API
    Promise.all([
      fetch("/api/iscarb/assessment/catalog").then(r => r.json()).catch(() => ({ assessments: [] })),
      fetch("/api/v1/faculty/assessment/gradebook").then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([catalogRes, gradebookRes]) => {
      if (catalogRes.assessments) {
        setQuizzes(catalogRes.assessments.slice(0, 5));
      }
      if (gradebookRes.data) {
        setGradebook(gradebookRes.data.slice(0, 5));
      }
    }).finally(() => setLoading(false));
  }, []);

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
        title={ar ? "مساحة التقييم" : "Assessment Workspace"}
        description={ar ? "إنشاء الاختبارات، تقييم البرمجة، الامتحانات الشفهية، وسجل الدرجات" : "Create quizzes, grade coding, run viva exams, and manage the gradebook."}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Dashboard", href: "/faculty/dashboard" },
          { label: ar ? "التقييم" : "Assessment", href: "/faculty/assessment" },
        ]}
      />

      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6 pb-12">
        {/* Stats */}
        <motion.div variants={item} className="grid gap-4 sm:grid-cols-4">
          {[
            { label: ar ? "اختبارات" : "Quizzes", value: String(quizzes.length), icon: FileQuestion, color: "iscarb-cyan" },
            { label: ar ? "تمارين برمجة" : "Coding Tasks", value: String(coding.length), icon: Code, color: "iscarb-green" },
            { label: ar ? "امتحانات شفهية" : "Viva Exams", value: String(viva.length), icon: Mic, color: "iscarb-gold" },
            { label: ar ? "سجل الدرجات" : "Gradebook", value: String(gradebook.length), icon: Trophy, color: "destructive" },
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
              {/* Quiz Builder Tab */}
              {activeTab === "quiz-builder" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{ar ? "منشئ الاختبارات" : "Quiz Builder"}</h3>
                    <Button size="sm" className="bg-iscarb-cyan hover:bg-iscarb-cyan/90">
                      <Plus className="mr-2 size-4" />{ar ? "اختبار جديد" : "New Quiz"}
                    </Button>
                  </div>
                  {mockQuizzes.map((q) => (
                    <div key={q.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-iscarb-cyan/10 text-iscarb-cyan">
                          <FileQuestion className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium">{q.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {q.questions} {ar ? "سؤال" : "questions"} &middot; {q.submissions} {ar ? "تقديم" : "submissions"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {q.submissions > 0 && (
                          <span className="text-sm font-medium text-iscarb-green">{q.avgScore}%</span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          q.status === "published" ? "bg-iscarb-green/10 text-iscarb-green" : "bg-muted text-muted-foreground"
                        }`}>{q.status}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Coding Tab */}
              {activeTab === "coding" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{ar ? "تقييمات البرمجة" : "Coding Assessments"}</h3>
                    <Button size="sm" className="bg-iscarb-green hover:bg-iscarb-green/90">
                      <Plus className="mr-2 size-4" />{ar ? "تمرين جديد" : "New Challenge"}
                    </Button>
                  </div>
                  {mockCoding.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-iscarb-green/10 text-iscarb-green">
                          <Code className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium">{c.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {ar ? "الصعوبة:" : "Difficulty:"} {c.difficulty} &middot; {c.passed}/{c.submissions} {ar ? "ناجح" : "passed"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-iscarb-green" style={{ width: `${(c.passed / c.submissions) * 100}%` }} />
                        </div>
                        <span className="text-sm font-medium">{Math.round((c.passed / c.submissions) * 100)}%</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Viva Tab */}
              {activeTab === "viva" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{ar ? "الامتحانات الشفهية" : "Viva Assessments"}</h3>
                    <Button size="sm" className="bg-iscarb-gold hover:bg-iscarb-gold/90">
                      <Plus className="mr-2 size-4" />{ar ? "امتحان شفهي جديد" : "New Viva"}
                    </Button>
                  </div>
                  {mockViva.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-iscarb-gold/10 text-iscarb-gold-dark">
                          <Mic className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium">{v.title}</p>
                          <p className="text-sm text-muted-foreground">
                            <Clock className="mr-1 inline size-3" />{v.scheduled} &middot; {v.students} {ar ? "طالب" : "students"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          v.status === "scheduled" ? "bg-iscarb-cyan/10 text-iscarb-cyan" : "bg-muted text-muted-foreground"
                        }`}>{v.status}</span>
                        <Button variant="outline" size="sm">{ar ? "تفاصيل" : "Details"}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Gradebook Tab */}
              {activeTab === "gradebook" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{ar ? "سجل الدرجات" : "Gradebook"}</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Brain className="mr-2 size-4" />{ar ? "تصحيح بالذكاء الاصطناعي" : "AI Grade"}
                      </Button>
                      <Button size="sm" className="bg-iscarb-cyan hover:bg-iscarb-cyan/90">
                        {ar ? "تصدير" : "Export"}
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">{ar ? "الطالب" : "Student"}</th>
                          <th className="pb-3 pr-4 font-medium">{ar ? "المعرف" : "ID"}</th>
                          <th className="pb-3 pr-4 text-center font-medium">{ar ? "اختبارات" : "Quizzes"}</th>
                          <th className="pb-3 pr-4 text-center font-medium">{ar ? "برمجة" : "Coding"}</th>
                          <th className="pb-3 pr-4 text-center font-medium">{ar ? "شفهي" : "Viva"}</th>
                          <th className="pb-3 text-center font-medium">{ar ? "المجموع" : "Overall"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockGradebook.map((s) => (
                          <tr key={s.id} className="border-b border-border/30 hover:bg-muted/20">
                            <td className="py-3 pr-4 font-medium">{s.name}</td>
                            <td className="py-3 pr-4 text-muted-foreground">{s.id2}</td>
                            <td className="py-3 pr-4 text-center">{s.quizzes}</td>
                            <td className="py-3 pr-4 text-center">{s.coding}</td>
                            <td className="py-3 pr-4 text-center">{s.viva}</td>
                            <td className="py-3 text-center">
                              <span className={`font-semibold ${
                                s.overall >= 90 ? "text-iscarb-green" : s.overall >= 70 ? "text-iscarb-cyan" : "text-destructive"
                              }`}>{s.overall}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
