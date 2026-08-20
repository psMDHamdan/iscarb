"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { useApp } from "@/lib/store";
import { useIscarbFetch } from "@/lib/use-iscarb-fetch";
import { useSession } from "@/lib/use-session";
import { DIMENSIONS } from "@/lib/assessment";
import { ArrowRight } from "lucide-react";

const DIMENSION_LABEL: Record<string, string> = Object.fromEntries(
  DIMENSIONS.map((d) => [d.id, d.label])
);

const DIMENSION_LABEL_AR: Record<string, string> = Object.fromEntries(
  DIMENSIONS.map((d) => [d.id, d.labelAr])
);

const DIMENSION_COLORS: Record<string, string> = {
  core_professionalism: "bg-emerald-100 text-emerald-800",
  business_digital: "bg-cyan-100 text-cyan-800",
  job_fit: "bg-amber-100 text-amber-800",
  growth_potential: "bg-purple-100 text-purple-800",
};

const BAND_COLORS: Record<string, string> = {
  weak: "bg-red-100 text-red-800",
  developing: "bg-amber-100 text-amber-800",
  proficient: "bg-blue-100 text-blue-800",
  strong: "bg-green-100 text-green-800",
};

interface ModuleItem {
  moduleId: string;
  title: string;
  titleAr: string | null;
  dimension: string;
  level: string;
  framework: string;
  status: "not_started" | "completed";
  score: number | null;
  band: string | null;
  passed: boolean | null;
  completedAt: string | null;
}

interface ModulesResponse {
  modules: ModuleItem[];
  specialization: string;
}

export function ModuleListView() {
  const { lang } = useApp();
  const { studentId } = useSession();
  const ar = lang === "ar";
  const [filter, setFilter] = useState<string>("all");

  const { data, loading } = useIscarbFetch<ModulesResponse>(
    studentId ? `/api/v1/assessment-modules?studentId=${studentId}` : null
  );

  const modules = data?.modules ?? [];
  const filtered = filter === "all" ? modules : modules.filter((m) => m.status === filter);

  return (
    <>
      <PageHeader
        title={ar ? "التقييمات" : "Assessments"}
        description={ar ? "اختر وحدة للبدء" : "Select a module to start"}
        eyebrow={data?.specialization}
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 px-1">
        {[
          { key: "all", label: ar ? "الكل" : "All" },
          { key: "not_started", label: ar ? "لم يبدأ" : "Not Started" },
          { key: "completed", label: ar ? "مكتمل" : "Completed" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      )}

      {/* Module Grid */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((mod) => (
            <motion.div
              key={mod.moduleId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={DIMENSION_COLORS[mod.dimension] ?? "bg-gray-100 text-gray-800"}>
                      {ar
                        ? DIMENSION_LABEL_AR[mod.dimension] ?? mod.dimension
                        : DIMENSION_LABEL[mod.dimension] ?? mod.dimension}
                    </Badge>
                    <Badge variant="outline">{mod.level}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">
                    {ar ? mod.titleAr || mod.title : mod.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{mod.framework}</p>
                  <div className="mt-auto">
                    {mod.status === "completed" ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-600">
                            {mod.score}/100
                          </span>
                          {mod.band && (
                            <Badge className={BAND_COLORS[mod.band.toLowerCase()] ?? "bg-gray-100 text-gray-800"}>
                              {mod.band}
                            </Badge>
                          )}
                        </div>
                        <Link href={`/student/results/${mod.moduleId}`}>
                          <Button variant="outline" size="sm">
                            {ar ? "عرض النتائج" : "View Results"}{" "}
                            <ArrowRight className="ms-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Link href={`/assessment/${mod.moduleId}`}>
                        <Button className="w-full">
                          {ar ? "بدء" : "Start"}
                          <ArrowRight className="ms-1 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {ar ? "لا توجد وحدات" : "No modules found"}
        </div>
      )}
    </>
  );
}
