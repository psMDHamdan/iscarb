"use client";

import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2, Circle, ArrowRight, Sparkles, Target, BookOpen, Upload, Brain, Briefcase, Rocket, Clock, Award, Zap, BarChart3, Star, PartyPopper } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Profile Setup": BookOpen,
  "Upload Documents": Upload,
  "Set Interests": Target,
  "Set Career Goals": Briefcase,
  "AI Introduction": Brain,
};

const stepDescriptions: Record<string, string> = {
  "Profile Setup": "Complete your student profile with personal information and preferences",
  "Upload Documents": "Upload required academic documents and identification",
  "Set Interests": "Tell us about your academic interests and preferred subjects",
  "Set Career Goals": "Define your career aspirations and target industries",
  "AI Introduction": "Get introduced to iSCARB AI features and capabilities",
};

const stepDescriptionsAr: Record<string, string> = {
  "Profile Setup": "أكمل ملفك الشخصي بالمعلومات والتفضيلات",
  "Upload Documents": "رفع المستندات الأكاديمية المطلوبة والهوية",
  "Set Interests": "أخبرنا عن اهتماماتك الأكاديمية والمواد المفضلة",
  "Set Career Goals": "حدد تطلعاتك المهنية والصناعات المستهدفة",
  "AI Introduction": "تعرف على ميزات وإمكانيات iSCARB AI",
};

const stepLinks: Record<string, string> = {
  "Profile Setup": "/student/settings",
  "Upload Documents": "/student/documents",
  "Set Interests": "/student/onboarding",
  "Set Career Goals": "/student/career",
  "AI Introduction": "/student/ai-insights",
};

// Quick tips based on completion progress
function getCompletionTips(completedSteps: number, totalSteps: number, ar: boolean): string[] {
  if (completedSteps === 0) {
    return ar
      ? ["ابدأ بملء ملفك الشخصي للحصول على توصيات مخصصة", "كل خطوة تقربك من تجربة iSCARB الكاملة"]
      : ["Start with your profile to get personalized recommendations", "Each step gets you closer to the full iSCARB experience"];
  }
  if (completedSteps < totalSteps / 2) {
    return ar
      ? ["تقدم رائع! استمر في إكمال الخطوات المتبقية", "يمكنك تخطي الخطوات والعودة إليها لاحقاً"]
      : ["Great progress! Keep going with the remaining steps", "You can skip steps and come back later"];
  }
  if (completedSteps < totalSteps) {
    return ar
      ? ["أنت على وشك الانتهاء! بعض الخطوات المتبقية فقط", "بعد الإكمال، استكشف لوحة التحكم والميزات المتقدمة"]
      : ["Almost there! Just a few steps remaining", "After completion, explore the dashboard and advanced features"];
  }
  return ar
    ? ["أهلاً بك في iSCARB! ابدأ باستكشاف لوحة التحكم", "تفقد الرؤى الذكية والتوصيات المخصصة"]
    : ["Welcome to iSCARB! Start exploring the dashboard", "Check out AI insights and personalized recommendations"];
}

export function DashboardOnboardingView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data, isLoading: loading, error } = useApiQuery<{
    data: {
      steps: { title: string; titleAr: string; description: string; completed: boolean; link?: string }[];
      completedSteps: number;
      totalSteps: number;
      progress: number;
    }
  }>(
    ["dashboard", "onboarding"],
    "/api/v1/student/dashboard/onboarding"
  );

  const onboardingData = data?.data;
  const tips = onboardingData
    ? getCompletionTips(onboardingData.completedSteps, onboardingData.totalSteps, ar)
    : [];

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "ابدأ رحلتك" : "Getting Started"}
          description={ar ? "دليل البدء السريع لمنصة iSCARB" : "Quick start guide for iSCARB platform"}
        />
        <div className="space-y-4">
          <Card>
            <CardContent className="p-12 flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
              <p className="text-sm text-muted-foreground">{ar ? "جاري تحميل خطوات البدء..." : "Loading onboarding steps..."}</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !onboardingData) {
    return (
      <>
        <PageHeader title={ar ? "ابدأ رحلتك" : "Getting Started"} />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{ar ? "خطأ في تحميل خطوات البدء" : "Error Loading Onboarding"}</h4>
              <p className="text-sm mt-1 text-muted-foreground">
                {error instanceof Error ? error.message : (ar ? "تعذر تحميل خطوات البدء" : "Could not load onboarding steps")}
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
                {ar ? "إعادة تحميل" : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const { steps, completedSteps, totalSteps, progress } = onboardingData;
  const isComplete = completedSteps === totalSteps;

  return (
    <>
      <PageHeader
        title={isComplete ? (ar ? "أهلاً بك! 🎉" : "Welcome! 🎉") : (ar ? "ابدأ رحلتك" : "Getting Started")}
        description={isComplete
          ? (ar ? "لقد أكملت جميع خطوات البدء. ابدأ باستكشاف المنصة!" : "You've completed all onboarding steps. Start exploring!")
          : (ar ? "أكمل الخطوات التالية للبدء" : "Complete the following steps to get started")
        }
      />

      <div className="space-y-6 pb-12">
        {/* Progress Overview */}
        <Card
          className={`border-2 ${
            isComplete
              ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50"
              : "bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50"
          }`}
        >
          <CardContent className="p-6">
            {isComplete ? (
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 animate-pulse">
                  <PartyPopper className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
                    {ar ? "أهلاً بك في iSCARB!" : "Welcome to iSCARB!"}
                  </h3>
                  <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                    {ar ? "جميع خطوات البدء مكتملة. ابدأ رحلتك التعليمية!" : "All onboarding steps completed. Start your learning journey!"}
                  </p>
                </div>
                <Badge className="bg-emerald-500 text-white text-xs px-3 py-1 animate-bounce">
                  <Sparkles className="h-3 w-3 mr-1" />{ar ? "اكتمل" : "Complete"}
                </Badge>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-iscarb-cyan" />
                    <h3 className="font-semibold text-sm">{ar ? "تقدم البدء" : "Onboarding Progress"}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-iscarb-cyan/10 text-iscarb-cyan text-xs font-semibold">
                    <Award className="h-3 w-3 mr-1" />
                    {completedSteps} / {totalSteps} {ar ? "خطوات" : "steps"}
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-iscarb-cyan via-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {ar
                      ? `تبقت ${totalSteps - completedSteps} خطوات لإكمال الإعداد`
                      : `${totalSteps - completedSteps} steps remaining`
                    }
                  </p>
                  <p className="text-xs font-semibold text-iscarb-cyan">{progress}%</p>
                </div>

                {/* Tips */}
                {tips.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200/30">
                    <div className="flex items-start gap-2">
                      <Star className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">{tips[0]}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Row */}
        {!isComplete && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50">
              <BarChart3 className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold text-blue-600">{completedSteps}</p>
              <p className="text-[9px] text-muted-foreground truncate">{ar ? "منجز" : "Done"}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
              <Clock className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-bold text-amber-600">{totalSteps - completedSteps}</p>
              <p className="text-[9px] text-muted-foreground truncate">{ar ? "متبقي" : "Left"}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50">
              <Target className="h-4 w-4 mx-auto mb-1 text-purple-500" />
              <p className="text-lg font-bold text-purple-600">{progress}%</p>
              <p className="text-[9px] text-muted-foreground truncate">{ar ? "تقدم" : "Progress"}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50">
              <Zap className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-lg font-bold text-emerald-600">{totalSteps}</p>
              <p className="text-[9px] text-muted-foreground truncate">{ar ? "كل الخطوات" : "Total"}</p>
            </div>
          </div>
        )}

        {/* Steps List */}
        {steps && steps.length > 0 ? (
          <div className="space-y-3">
            {steps.map((step: any, idx: number) => {
              const Icon = stepIcons[step.title] || Circle;
              const isCompleted = step.completed;
              const stepTitle = ar && step.titleAr ? step.titleAr : step.title;
              const stepDesc = ar && stepDescriptionsAr[step.title]
                ? stepDescriptionsAr[step.title]
                : (step.description || stepDescriptions[step.title] || "");
              const stepLink = step.link || stepLinks[step.title] || "#";

              return (
                <Card
                  key={idx}
                  className={`transition-all duration-300 ${
                    isCompleted
                      ? "opacity-60 hover:opacity-80 border-green-200/50"
                      : "hover:shadow-md hover:-translate-y-0.5 border-border/60"
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0 mt-1">
                        {/* Step number */}
                        <span className="absolute -top-1 -right-1 text-[8px] font-bold text-muted-foreground/40">
                          {idx + 1}
                        </span>
                        {isCompleted ? (
                          <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-full bg-muted/30 border-2 border-dashed border-muted-foreground/30">
                            <Circle className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {stepTitle}
                          </h3>
                          {isCompleted && (
                            <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-600 bg-emerald-50">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />{ar ? "مكتمل" : "Done"}
                            </Badge>
                          )}
                          {!isCompleted && idx === completedSteps && (
                            <Badge variant="secondary" className="text-[9px] bg-iscarb-cyan/10 text-iscarb-cyan">
                              {ar ? "التالي" : "Next"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{stepDesc}</p>
                      </div>

                      <Button
                        size="sm"
                        className={`shrink-0 text-xs ${
                          isCompleted
                            ? "bg-muted text-muted-foreground hover:bg-muted/80"
                            : "bg-iscarb-cyan hover:bg-iscarb-cyan/90 text-white"
                        }`}
                        onClick={() => {
                          if (stepLink && stepLink !== "#" && typeof window !== "undefined") {
                            window.location.href = stepLink;
                          }
                        }}
                      >
                        {isCompleted
                          ? (ar ? "عرض" : "View")
                          : (ar ? "ابدأ" : "Start")}
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 flex flex-col items-center text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {ar ? "لا توجد خطوات إعداد متاحة" : "No onboarding steps available"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {ar ? "جميع الخطوات مكتملة!" : "All steps are complete!"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
