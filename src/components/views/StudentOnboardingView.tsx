"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Loader2,
    AlertCircle,
    CheckCircle2,
    Circle,
    Rocket,
    User,
    FileText,
    Star,
    Target,
    Bot,
    ArrowRight,
    PartyPopper,
} from "lucide-react";
import { useApiQuery, useApiMutation } from "@/hooks/use-api-query";

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "Profile Setup": User,
    "إعداد الملف الشخصي": User,
    "Upload Documents": FileText,
    "رفع المستندات": FileText,
    "Set Interests": Star,
    "تعيين الاهتمامات": Star,
    "Set Career Goals": Target,
    "تعيين أهداف المهنة": Target,
    "AI Introduction": Bot,
    "مقدمة الذكاء الاصطناعي": Bot,
};

const STEP_KEYS: Record<string, string> = {
    "Profile Setup": "profileSetup",
    "Upload Documents": "uploadDocuments",
    "Set Interests": "setInterests",
    "Set Career Goals": "setGoals",
    "AI Introduction": "aiIntroduction",
};

const STEP_LINKS: Record<string, string> = {
    "Profile Setup": "/student/settings/profile",
    "Upload Documents": "/student/personal/documents",
    "Set Interests": "/student/onboarding",
    "Set Career Goals": "/student/goals",
    "AI Introduction": "/student/ai",
};

interface OnboardingData {
    steps: {
        title: string;
        titleAr: string;
        description: string;
        completed: boolean;
    }[];
    completedSteps: number;
    totalSteps: number;
    progress: number;
    isComplete: boolean;
}

interface OnboardingResponse {
    success: boolean;
    data: OnboardingData;
}

export function StudentOnboardingView() {
    const { lang } = useApp();
    const ar = lang === "ar";
    const [completingStep, setCompletingStep] = useState<string | null>(null);

    const { data, isLoading, error, refetch } = useApiQuery<OnboardingResponse>(
        ["student", "onboarding"],
        "/api/v1/student/onboarding"
    );

    const mutation = useApiMutation<OnboardingResponse, { stepKey: string }>(
        "/api/v1/student/onboarding",
        { method: "POST" }
    );

    const handleCompleteStep = useCallback(
        async (stepTitle: string) => {
            const stepKey = STEP_KEYS[stepTitle];
            if (!stepKey) return;
            setCompletingStep(stepTitle);
            try {
                await mutation.mutateAsync({ stepKey });
                await refetch();
            } finally {
                setCompletingStep(null);
            }
        },
        [mutation, refetch]
    );

    if (isLoading) {
        return (
            <>
                <PageHeader
                    title={ar ? "الإعداد الأولي" : "Onboarding"}
                    description={ar ? "ابدأ رحلتك مع iSCARB" : "Get started with your iSCARB journey"}
                />
                <Card>
                    <CardContent className="p-12 flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
                        <p className="text-sm text-muted-foreground">
                            {ar ? "جاري التحميل..." : "Loading your onboarding checklist..."}
                        </p>
                    </CardContent>
                </Card>
            </>
        );
    }

    if (error || !data?.data) {
        return (
            <>
                <PageHeader title={ar ? "الإعداد الأولي" : "Onboarding"} />
                <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                    <CardContent className="p-5 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">
                                {ar ? "خطأ في التحميل" : "Error Loading Onboarding"}
                            </h4>
                            <p className="text-sm mt-1 text-muted-foreground">
                                {error instanceof Error
                                    ? error.message
                                    : ar
                                        ? "تعذر تحميل بيانات الإعداد"
                                        : "Could not load onboarding data"}
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-3"
                                onClick={() => window.location.reload()}
                            >
                                {ar ? "إعادة تحميل" : "Retry"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </>
        );
    }

    const { steps, completedSteps, totalSteps, progress, isComplete } = data.data;

    if (isComplete) {
        return (
            <>
                <PageHeader
                    title={ar ? "الإعداد الأولي" : "Onboarding"}
                    description={ar ? "مرحباً بك في iSCARB!" : "Welcome to iSCARB!"}
                />
                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20">
                    <CardContent className="p-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                            <PartyPopper className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                            {ar ? "تم الإعداد بنجاح!" : "Onboarding Complete!"}
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            {ar
                                ? "لقد أكملت جميع خطوات الإعداد. يمكنك الآن الاستفادة الكاملة من جميع ميزات iSCARB."
                                : "You've completed all onboarding steps. You can now take full advantage of all iSCARB features."}
                        </p>
                        <Button
                            className="mt-6 bg-iscarb-green hover:bg-iscarb-green-dark text-white gap-2"
                            onClick={() => (window.location.href = "/student/dashboard")}
                        >
                            <Rocket className="h-4 w-4" />
                            {ar ? "انتقل إلى لوحة التحكم" : "Go to Dashboard"}
                        </Button>
                    </CardContent>
                </Card>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title={ar ? "الإعداد الأولي" : "Onboarding"}
                description={
                    ar
                        ? "أكمل هذه الخطوات للبدء بتجربة iSCARB الكاملة"
                        : "Complete these steps to unlock your full iSCARB experience"
                }
            />

            <div className="space-y-6 pb-12">
                {/* Progress Overview */}
                <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 to-transparent">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="font-semibold text-base">
                                    {ar ? "تقدمك في الإعداد" : "Your Onboarding Progress"}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {ar
                                        ? `أكملت ${completedSteps} من ${totalSteps} خطوات`
                                        : `${completedSteps} of ${totalSteps} steps completed`}
                                </p>
                            </div>
                            <Badge
                                variant="secondary"
                                className="text-lg font-bold bg-iscarb-cyan/10 text-iscarb-cyan px-3 py-1"
                            >
                                {progress}%
                            </Badge>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {ar
                                ? `${totalSteps - completedSteps} خطوات متبقية لإكمال الإعداد`
                                : `${totalSteps - completedSteps} step${totalSteps - completedSteps !== 1 ? "s" : ""} remaining`}
                        </p>
                    </CardContent>
                </Card>

                {/* Step Checklist */}
                <Card>
                    <CardHeader className="pb-3 border-b border-border/40">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-iscarb-cyan" />
                            {ar ? "خطوات الإعداد" : "Setup Checklist"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {steps.map((step, idx) => {
                                const title = ar ? step.titleAr : step.title;
                                const Icon = STEP_ICONS[step.title] || Circle;
                                const stepKey = STEP_KEYS[step.title];
                                const href = STEP_LINKS[step.title] || "#";
                                const isCompleting = completingStep === step.title;

                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-4 px-5 py-4 transition-colors ${step.completed
                                                ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                                                : "hover:bg-muted/30"
                                            }`}
                                    >
                                        {/* Step number / check */}
                                        <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${step.completed
                                                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                                                    : "bg-muted"
                                                }`}
                                        >
                                            {step.completed ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                            ) : (
                                                <span className="text-sm font-bold text-muted-foreground">
                                                    {idx + 1}
                                                </span>
                                            )}
                                        </div>

                                        {/* Icon */}
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${step.completed
                                                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                                                    : "bg-iscarb-cyan/10"
                                                }`}
                                        >
                                            <Icon
                                                className={`h-4 w-4 ${step.completed ? "text-emerald-600" : "text-iscarb-cyan"
                                                    }`}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-sm font-semibold ${step.completed
                                                        ? "line-through text-muted-foreground"
                                                        : ""
                                                    }`}
                                            >
                                                {title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {step.description}
                                            </p>
                                        </div>

                                        {/* Action */}
                                        {step.completed ? (
                                            <Badge
                                                variant="secondary"
                                                className="shrink-0 bg-emerald-100 text-emerald-700 text-xs"
                                            >
                                                {ar ? "مكتمل" : "Done"}
                                            </Badge>
                                        ) : (
                                            <div className="flex gap-2 shrink-0">
                                                {stepKey && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                                        disabled={isCompleting}
                                                        onClick={() => handleCompleteStep(step.title)}
                                                    >
                                                        {isCompleting ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        )}
                                                        <span className="ml-1">
                                                            {ar ? "تحديد كمكتمل" : "Mark done"}
                                                        </span>
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    className="bg-iscarb-cyan hover:bg-iscarb-cyan/90 text-white text-xs gap-1"
                                                    onClick={() => (window.location.href = href)}
                                                >
                                                    {ar ? "ابدأ" : "Start"}
                                                    <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Encouragement */}
                {completedSteps > 0 && completedSteps < totalSteps && (
                    <Card className="border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Star className="h-5 w-5 text-amber-500 shrink-0" />
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                {ar
                                    ? `رائع! أكملت ${completedSteps} خطوة. استمر في التقدم لفتح جميع ميزات iSCARB.`
                                    : `Great progress! You've completed ${completedSteps} step${completedSteps !== 1 ? "s" : ""}. Keep going to unlock the full iSCARB experience.`}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
