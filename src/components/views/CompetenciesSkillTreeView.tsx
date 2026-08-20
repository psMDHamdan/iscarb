"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, Lock, CheckCircle2, PlayCircle, TrendingUp, Plus } from "lucide-react";

interface SkillNode {
  id: string;
  name: string;
  category: string;
  level: number;
  status: string;
  endorsementCount: number;
  children: SkillNode[];
}

interface SkillItem {
  id: string;
  name: string;
  category: string;
  level: number;
  status: string;
  parent: string | null;
  endorsementCount: number;
  createdAt: string;
}

interface SkillTreeData {
  tree: SkillNode[];
  skills: SkillItem[];
  total: number;
}

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; icon: any; color: string; badge: "default" | "secondary" | "outline" | "destructive" }> = {
  demonstrated: { label: "Demonstrated", labelAr: "مثبت", icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-200", badge: "default" },
  in_progress: { label: "In Progress", labelAr: "قيد التعلم", icon: PlayCircle, color: "text-blue-600 bg-blue-50 border-blue-200", badge: "secondary" },
  interested: { label: "Interested", labelAr: "مهتم", icon: TrendingUp, color: "text-amber-600 bg-amber-50 border-amber-200", badge: "outline" },
  discovered: { label: "Discovered", labelAr: "مكتشف", icon: Lock, color: "text-gray-500 bg-gray-50 border-gray-200", badge: "outline" },
};

function SkillCard({ skill, ar, depth = 0 }: { skill: SkillNode; ar: boolean; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const cfg = STATUS_CONFIG[skill.status] || STATUS_CONFIG.discovered;
  const Icon = cfg.icon;

  return (
    <div className={`ml-${depth > 0 ? 4 : 0}`}>
      <div
        className={`border rounded-lg p-4 mb-3 cursor-pointer transition-all hover:shadow-md ${cfg.color}`}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{skill.name}</h4>
              <p className="text-xs opacity-75 capitalize mt-0.5">{skill.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={cfg.badge} className="text-xs">
              {ar ? cfg.labelAr : cfg.label}
            </Badge>
            {skill.children.length > 0 && (
              <span className="text-xs opacity-60">{expanded ? "▲" : "▼"}</span>
            )}
          </div>
        </div>

        {skill.level > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="opacity-70">{ar ? "المستوى" : "Level"}</span>
              <span className="font-semibold">{skill.level}%</span>
            </div>
            <Progress value={skill.level} className="h-1.5" />
          </div>
        )}

        {skill.endorsementCount > 0 && (
          <p className="text-xs opacity-60 mt-2">
            ✓ {skill.endorsementCount} {ar ? "تأييدات" : "endorsements"}
          </p>
        )}
      </div>

      {expanded && skill.children.length > 0 && (
        <div className="ml-6 border-l-2 border-gray-200 pl-4">
          {skill.children.map((child) => (
            <SkillCard key={child.id} skill={child} ar={ar} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CompetenciesSkillTreeView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<SkillTreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/v1/student/competencies/skill-tree")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "شجرة المهارات" : "Skill Tree"}
          description={ar ? "تتبع تقدمك في تطوير المهارات بصريًا" : "Visually track your skill development progress"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-sm text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "شجرة المهارات" : "Skill Tree"} />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <p className="text-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                {ar ? "إعادة المحاولة" : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const stats = {
    total: data.total,
    demonstrated: data.skills.filter((s) => s.status === "demonstrated").length,
    inProgress: data.skills.filter((s) => s.status === "in_progress").length,
    avgLevel: data.skills.length > 0
      ? Math.round(data.skills.reduce((s, sk) => s + (sk.level || 0), 0) / data.skills.length)
      : 0,
  };

  const filters = ["all", "demonstrated", "in_progress", "interested", "discovered"];

  const filteredSkills = activeFilter === "all"
    ? data.skills
    : data.skills.filter((s) => s.status === activeFilter);

  return (
    <>
      <PageHeader
        title={ar ? "شجرة المهارات" : "Skill Tree"}
        description={ar ? "تصور هرمي لمهاراتك المكتشفة والمتطورة" : "Hierarchical view of your discovered and developing skills"}
      />

      <div className="space-y-6 pb-12">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: ar ? "إجمالي" : "Total", value: stats.total, color: "" },
            { label: ar ? "مثبتة" : "Demonstrated", value: stats.demonstrated, color: "text-green-600" },
            { label: ar ? "قيد التعلم" : "In Progress", value: stats.inProgress, color: "text-blue-600" },
            { label: ar ? "متوسط المستوى" : "Avg Level", value: `${stats.avgLevel}%`, color: "" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tree view (hierarchical) */}
        {data.tree.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "الشجرة الهرمية" : "Skill Hierarchy"}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.tree.map((root) => (
                <SkillCard key={root.id} skill={root} ar={ar} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Flat list with status filter */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg">{ar ? "جميع المهارات" : "All Skills"}</CardTitle>
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${activeFilter === f
                        ? "bg-iscarb-green text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                  >
                    {f === "all" ? (ar ? "الكل" : "All") : f === "in_progress" ? (ar ? "قيد التعلم" : "In Progress") : f}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSkills.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredSkills.map((skill) => {
                  const cfg = STATUS_CONFIG[skill.status] || STATUS_CONFIG.discovered;
                  const Icon = cfg.icon;
                  return (
                    <div key={skill.id} className={`border rounded-lg p-4 ${cfg.color}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" />
                          <h4 className="font-semibold text-sm">{skill.name}</h4>
                        </div>
                        <Badge variant={cfg.badge} className="text-xs">
                          {ar ? cfg.labelAr : cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs opacity-70 capitalize mb-2">{skill.category}</p>
                      {skill.level > 0 && (
                        <Progress value={skill.level} className="h-1.5" />
                      )}
                      {skill.endorsementCount > 0 && (
                        <p className="text-xs opacity-60 mt-2">✓ {skill.endorsementCount} {ar ? "تأييدات" : "endorsements"}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {ar ? "لا توجد مهارات في هذه الفئة" : "No skills in this category"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empty state */}
        {data.total === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{ar ? "لا توجد مهارات بعد" : "No skills yet"}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {ar ? "ابدأ بإضافة مهاراتك لتتبع تقدمك" : "Start adding skills to track your progress"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
