"use client";
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Award, Calendar, Briefcase } from "lucide-react";

export function CommunityChallengesView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [difficulty, setDifficulty] = useState("all");

  const labels = {
    title: ar ? "التحديات والمسابقات" : "Challenges & Competitions",
    description: ar ? "اختبر مهاراتك في تحديات الشركات الحقيقية" : "Test your skills in real company challenges",
    filters: ar ? "المرشحات" : "Filters",
    difficulty: ar ? "الصعوبة" : "Difficulty",
    submit: ar ? "إرسال" : "Submit",
    deadline: ar ? "الموعد النهائي" : "Deadline",
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      apiEndpoint="/api/v1/student/community/challenges"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: labels.title, href: "/student/community/challenges" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {["all", "beginner", "intermediate", "advanced", "expert"].map((d) => (
                  <Button
                    key={d}
                    variant={difficulty === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficulty(d)}
                    className="capitalize"
                  >
                    {ar ? (d === "all" ? "الكل" : d) : d}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Challenges List */}
          <div className="space-y-4">
            {data?.challenges?.map((challenge: any) => (
              <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Briefcase className="h-4 w-4" />
                        <span>{challenge.company}</span>
                        <span>•</span>
                        <span>{challenge.sector}</span>
                      </div>
                    </div>
                    <Badge>{challenge.difficulty}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  {challenge.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {challenge.skills.map((skill: string) => (
                        <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-4 text-sm">
                      {challenge.reward && (
                        <span className="font-medium text-green-600">
                          <Award className="h-4 w-4 inline mr-1" />
                          {challenge.reward}
                        </span>
                      )}
                      {challenge.deadline && (
                        <span className="text-muted-foreground">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {new Date(challenge.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button size="sm">{ar ? "الاطلاع" : "View"}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </StudentPageTemplate>
  );
}
