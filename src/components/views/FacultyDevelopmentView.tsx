"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/lib/use-api-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Brain,
  Award,
  Wrench,
  Plus,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle2,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

interface DevStats {
  totalTrainings: number;
  completed: number;
  inProgress: number;
  totalHours: number;
  certificates: number;
}

interface Skill {
  name: string;
  level: number;
  category: string;
  lastUpdated: string;
}

export function FacultyDevelopmentView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawData, isLoading: loading, error, refetch } = useApiQuery<{ stats?: DevStats; training?: Skill[] }>(["faculty", "development", "training"], "/api/v1/faculty/development/training");

  const stats = rawData?.stats ?? null;
  const skills = rawData?.training ?? [];

  const quickActions = [
    { icon: BookOpen, label: ar ? "التدريب" : "Training", href: "/faculty/development/training", color: "text-[#0E6C3C]" },
    { icon: Brain, label: ar ? "التدريب بالذكاء الاصطناعي" : "AI Training", href: "/faculty/development/ai-training", color: "text-purple-500" },
    { icon: BarChart3, label: ar ? "المهارات" : "Skills", href: "/faculty/development/skills", color: "text-[#0F7B8A]" },
  ];

  const catColors: Record<string, string> = {
    pedagogy: "bg-[#0E6C3C]/10 text-[#0E6C3C]",
    technical: "bg-blue-500/10 text-blue-600",
    research: "bg-purple-500/10 text-purple-600",
    mentorship: "bg-amber-500/10 text-amber-600",
    general: "bg-gray-500/10 text-gray-600",
  };

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "التطوير المهني" : "Professional Development"} description={ar ? "تطوير مهاراتك وشهاداتك" : "Grow your skills and certifications"} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "التطوير المهني" : "Professional Development"} description={ar ? "تطوير مهاراتك وشهاداتك" : "Grow your skills and certifications"} />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const s = stats || { totalTrainings: 0, completed: 0, inProgress: 0, totalHours: 0, certificates: 0 };

  return (
    <>
      <PageHeader
        title={ar ? "التطوير المهني" : "Professional Development"}
        description={ar ? "تطوير مهاراتك وشهاداتك" : "Grow your skills and certifications"}
      />
      <div className="space-y-6 pb-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-3">
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <span className="text-sm font-medium">{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.totalTrainings}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "إجمالي التدريب" : "Total Trainings"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0E6C3C]/10">
                  <CheckCircle2 className="h-5 w-5 text-[#0E6C3C]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.completed}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "مكتمل" : "Completed"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.totalHours}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "ساعات" : "Hours"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.certificates}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "شهادات" : "Certificates"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-[#0E6C3C]" />
              {ar ? "المهارات" : "Skills"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد بيانات مهارات" : "No skills data yet"}</p>
            ) : (
              <div className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <Badge className={`text-xs ${catColors[skill.category] || catColors.general}`}>{skill.category}</Badge>
                      </div>
                      <span className="text-sm font-bold">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
