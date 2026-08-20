"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
}

export function CareerCareerInterviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <StudentPageTemplate
      title="Interview Prep"
      titleAr="التحضير للمقابلات"
      apiEndpoint="/api/iscarb/interview-prep"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "التوظيف" : "Career", href: "/student/career" },
        { label: ar ? "المقابلات" : "Interview Prep", href: "/student/career/career/interview" },
      ]}
    >
      {(data: any) => {
        const questions: InterviewQuestion[] = data?.data || data?.questions || [];
        const difficultyConfig = {
          easy: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          medium: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          hard: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
        };
        return (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <Card className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">{ar ? "لا توجد أسئلة" : "No interview questions available"}</p>
              </Card>
            ) : (
              questions.map((q: InterviewQuestion) => {
                const config = difficultyConfig[q.difficulty];
                return (
                  <Card key={q.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{q.category}</p>
                          <p className="font-medium">{q.question}</p>
                        </div>
                        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                          <config.icon className="h-3 w-3" />
                          {q.difficulty}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
