"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "@/lib/use-session";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, ChevronRight, ArrowRight, Clock, FileText } from "lucide-react";
import {
  listEmployabilityAttempts,
  type EmployabilityAttemptSnapshot,
} from "@/lib/assessment/attempt-report-store";

const BAND_COLORS: Record<string, string> = {
  strong: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  proficient: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  developing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  weak: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

function formatAttemptWhen(iso: string, ar: boolean) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(ar ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    time: d.toLocaleTimeString(ar ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export default function ResultsPage() {
  const { lang } = useApp();
  const { studentId } = useSession();
  const ar = lang === "ar";

  const [attempts, setAttempts] = useState<EmployabilityAttemptSnapshot[] | null>(null);

  useEffect(() => {
    if (!studentId) {
      setAttempts([]);
      return;
    }
    setAttempts(listEmployabilityAttempts(studentId));
  }, [studentId]);

  const loading = attempts === null;
  const list = attempts ?? [];

  return (
    <>
      <PageHeader
        title={ar ? "النتائج" : "Results"}
        description={
          ar
            ? "كل محاولة تقييم لها تقريرها الخاص. اختر محاولة لعرض التفاصيل."
            : "Each exam attempt has its own report. Select an attempt to view details."
        }
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Dashboard", href: "/student/dashboard" },
          { label: ar ? "النتائج" : "Results", href: "/student/results" },
        ]}
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-12" dir={ar ? "rtl" : "ltr"}>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : list.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-iscarb-green/20 bg-gradient-to-b from-white to-iscarb-green/5 dark:from-card dark:to-iscarb-green/10 p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)] isolate">
              {/* Decorative background elements */}
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-iscarb-cyan/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-iscarb-green/10 blur-3xl" />

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-iscarb-green/20 to-iscarb-cyan/20 ring-4 ring-white dark:ring-background shadow-inner"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-card shadow-sm">
                  <FileText className="h-8 w-8 text-iscarb-green" />
                </div>
              </motion.div>

              <h3 className="font-display text-2xl font-bold tracking-tight text-iscarb-ink dark:text-white">
                {ar ? "لا توجد محاولات بعد" : "No assessment results yet"}
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {ar
                  ? "قم بإجراء تقييم القابلية للتوظيف الأول الخاص بك للحصول على رؤى مفصلة حول مهاراتك، وإمكانيات نموك، ومدى ملاءمتك الوظيفية."
                  : "Take your first employability assessment to unlock detailed insights into your skills, growth potential, and job fit."}
              </p>
              
              <div className="mt-8 flex justify-center">
                <Button
                  asChild
                  size="lg"
                  className="group relative h-14 overflow-hidden rounded-full bg-iscarb-green px-8 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-iscarb-green-dark hover:shadow-xl hover:ring-4 hover:ring-iscarb-green/20"
                >
                  <Link href="/assessment/employability">
                    <span className="relative z-10 flex items-center gap-2">
                      <Target className="size-5 transition-transform group-hover:rotate-12" />
                      {ar ? "بدء التقييم الآن" : "Start Your First Assessment"}
                      <ArrowRight className="size-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </span>
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] transition-transform duration-700 ease-in-out group-hover:translate-x-[100%]" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
            className="space-y-3"
          >
            {list.map((attempt, index) => {
              const when = formatAttemptWhen(attempt.computedAt, ar);
              const attemptNumber = list.length - index;
              return (
                <motion.li
                  key={attempt.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <Link
                    href={`/student/results/${attempt.id}`}
                    className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-iscarb-green/40"
                  >
                    <Card className="border-border/70 transition-all hover:-translate-y-0.5 hover:border-iscarb-green/40 hover:shadow-md">
                      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-iscarb-green-soft/80 text-iscarb-green-dark">
                          <span className="text-lg font-display font-bold leading-none">
                            {Math.round(attempt.profile.composite)}
                          </span>
                          <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">
                            /100
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-iscarb-ink dark:text-white">
                              {ar ? `محاولة ${attemptNumber}` : `Attempt ${attemptNumber}`}
                            </p>
                            <Badge
                              className={
                                BAND_COLORS[attempt.profile.band] ??
                                "bg-muted text-muted-foreground"
                              }
                            >
                              {attempt.profile.band}
                            </Badge>
                            {attempt.timedOut && (
                              <Badge variant="outline" className="gap-1 text-amber-700">
                                <Clock className="size-3" />
                                {ar ? "انتهى الوقت" : "Timed out"}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {attempt.specialization || (ar ? "عام" : "General")}
                            {" · "}
                            {when.date} · {when.time}
                          </p>
                        </div>

                        <div className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-iscarb-green sm:flex">
                          {ar ? "عرض التقرير" : "View report"}
                          <ChevronRight className="size-4" />
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground sm:hidden" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </>
  );
}
