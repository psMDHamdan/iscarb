"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, AlertCircle, Trophy, Star, Lock, Shield } from "lucide-react";

interface BadgeItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  iconUrl: string | null;
  earnedAt: string | null;
  points: number;
  verified: boolean;
  status: string;
  rarity: "legendary" | "epic" | "common";
}

interface BadgesData {
  badges: BadgeItem[];
  grouped: Record<string, BadgeItem[]>;
  categories: string[];
  stats: {
    total: number;
    verified: number;
    totalPoints: number;
    byRarity: { legendary: number; epic: number; common: number };
  };
}

const RARITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; labelAr: string }> = {
  legendary: { color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/10", border: "border-yellow-300", label: "Legendary", labelAr: "أسطوري" },
  epic: { color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/10", border: "border-purple-300", label: "Epic", labelAr: "ملحمي" },
  common: { color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-800/30", border: "border-gray-200", label: "Common", labelAr: "عادي" },
};

function BadgeCard({ badge, ar, locked = false }: { badge: BadgeItem; ar: boolean; locked?: boolean }) {
  const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;

  const cardContent = (
    <div className={`border rounded-xl p-4 text-center transition-all ${locked ? "opacity-50 grayscale" : "hover:shadow-md"} ${rarity.bg} ${rarity.border}`}>
      {/* Icon */}
      <div className="flex justify-center mb-3 relative">
        {badge.iconUrl ? (
          <img src={badge.iconUrl} alt={badge.name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${rarity.bg} border ${rarity.border}`}>
            {locked ? (
              <Lock className={`h-6 w-6 ${rarity.color}`} />
            ) : badge.category === "achievement" ? (
              <Trophy className={`h-6 w-6 ${rarity.color}`} />
            ) : (
              <Star className={`h-6 w-6 ${rarity.color}`} />
            )}
          </div>
        )}
        {badge.verified && !locked && (
          <div className="absolute -top-1 -right-1">
            <Shield className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {/* Name */}
      <h4 className="font-semibold text-sm mb-1 leading-tight">{badge.name}</h4>

      {/* Description */}
      {badge.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{badge.description}</p>
      )}

      {/* Rarity badge */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <Badge variant="outline" className={`text-[10px] capitalize ${rarity.color}`}>
          {ar ? rarity.labelAr : rarity.label}
        </Badge>
      </div>

      {/* Points */}
      <p className={`text-xs font-bold ${rarity.color}`}>{badge.points} {ar ? "نقطة" : "pts"}</p>

      {/* Earned date */}
      {badge.earnedAt && !locked && (
        <p className="text-[10px] text-muted-foreground mt-1">
          {new Date(badge.earnedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
        </p>
      )}
    </div>
  );

  if (locked && badge.description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{cardContent}</div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs font-semibold mb-1">{ar ? "معايير الكسب" : "Criteria to earn"}</p>
            <p className="text-xs">{badge.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}

export function CompetenciesCompetencyBadgesView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<BadgesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    fetch("/api/v1/student/competencies/badges")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "الأوسمة والإنجازات" : "Badges & Achievements"}
          description={ar ? "عرض الأوسمة المكتسبة والمتاحة" : "View earned and available badges"}
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
        <PageHeader title={ar ? "الأوسمة والإنجازات" : "Badges & Achievements"} />
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

  const earned = data.badges.filter((b) => b.status !== "locked");
  const available = data.badges.filter((b) => b.status === "locked");
  const filtered = activeCategory === "all"
    ? earned
    : earned.filter((b) => b.category === activeCategory);

  return (
    <>
      <PageHeader
        title={ar ? "الأوسمة والإنجازات" : "Badges & Achievements"}
        description={ar ? "عرض شامل لجميع الأوسمة المكتسبة والمتاحة" : "Comprehensive view of all earned and available badges"}
      />

      <div className="space-y-6 pb-12">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: ar ? "إجمالي الأوسمة" : "Total Badges", value: data.stats.total, color: "" },
            { label: ar ? "أسطورية" : "Legendary", value: data.stats.byRarity.legendary, color: "text-yellow-600" },
            { label: ar ? "ملحمية" : "Epic", value: data.stats.byRarity.epic, color: "text-purple-600" },
            { label: ar ? "إجمالي النقاط" : "Total Points", value: `${data.stats.totalPoints} pts`, color: "text-iscarb-green" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Category filter */}
        {data.categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {["all", ...data.categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${activeCategory === cat
                    ? "bg-iscarb-green text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {cat === "all" ? (ar ? "الكل" : "All") : cat}
              </button>
            ))}
          </div>
        )}

        {/* Earned Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              {ar ? "الأوسمة المكتسبة" : "Earned Badges"}
              <Badge variant="secondary" className="ml-auto">{earned.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length > 0 ? (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} ar={ar} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {ar ? "لا توجد أوسمة في هذه الفئة" : "No badges in this category yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available / Locked Badges */}
        {available.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-400" />
                {ar ? "الأوسمة المتاحة" : "Available Badges"}
                <span className="text-xs text-muted-foreground">{ar ? "(مرر لرؤية المعايير)" : "(hover to see criteria)"}</span>
                <Badge variant="outline" className="ml-auto">{available.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {available.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} ar={ar} locked />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {data.badges.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{ar ? "لا توجد أوسمة بعد" : "No badges yet"}</h3>
              <p className="text-sm text-muted-foreground">
                {ar ? "أكمل المهام والتقييمات لكسب الأوسمة" : "Complete tasks and assessments to earn badges"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
