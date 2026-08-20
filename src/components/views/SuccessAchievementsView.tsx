"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Trophy,
  AlertCircle,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface Achievement {
  id: string;
  title: string;
  description?: string;
  category: string;
  badgeIcon?: string;
  rarity: string;
  progress: number;
  requirement: string;
  earnedAt: string;
  sharedWithCohort: boolean;
}

interface AchievementStats {
  total: number;
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

export function SuccessAchievementsView() {
  const { lang } = useApp();
  const { trackEvent } = useAnalytics();
  const ar = lang === "ar";

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      trackEvent("page_view", { section: "success", page: "achievements" });

      const response = await fetch("/api/v1/student/achievements");
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      if (result.success) {
        setAchievements(result.data?.achievements || []);
        setStats(result.data?.stats || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      trackEvent("error", { section: "success", page: "achievements", error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (achievementId: string) => {
    try {
      const response = await fetch(`/api/v1/student/achievements/${achievementId}/share`, {
        method: "POST",
      });

      if (response.ok) {
        trackEvent("achievement_shared", { achievementId });
        fetchAchievements();
      }
    } catch (err) {
      console.error("Failed to share achievement:", err);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-r from-yellow-400 to-orange-400 text-white";
      case "epic":
        return "bg-gradient-to-r from-purple-400 to-pink-400 text-white";
      case "rare":
        return "bg-gradient-to-r from-blue-400 to-cyan-400 text-white";
      default:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900";
    }
  };

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "الإنجازات" : "Achievements", href: "/student/success/achievements" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "الإنجازات" : "Achievements"} breadcrumbs={breadcrumbs} />
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "الإنجازات" : "Achievements"}
        description={ar ? "اكتشف إنجازاتك" : "Discover your achievements"}
        breadcrumbs={breadcrumbs}
      />

      <div className="space-y-6 pb-12">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
                <p className="text-xs text-gray-600 mt-1">{ar ? "إجمالي" : "Total"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-gray-100 to-gray-200">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-gray-700">{stats.common}</div>
                <p className="text-xs text-gray-600 mt-1">{ar ? "عام" : "Common"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.rare}</div>
                <p className="text-xs text-blue-600 mt-1">{ar ? "نادر" : "Rare"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.epic}</div>
                <p className="text-xs text-purple-600 mt-1">{ar ? "أسطوري" : "Epic"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.legendary}</div>
                <p className="text-xs text-yellow-600 mt-1">{ar ? "أعظم" : "Legendary"}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {achievements.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={ar ? "لم تكتسب أي إنجازات بعد" : "No achievements yet"}
            description={ar ? "أكمل المهام والتحديات لكسب أول إنجاز" : "Complete tasks and challenges to earn your first achievement"}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="flex flex-col">
                <CardContent className="pt-6 flex flex-col flex-1">
                  <div className={`text-5xl text-center mb-3 ${getRarityColor(achievement.rarity)}`}>
                    {achievement.badgeIcon || "🏆"}
                  </div>
                  <h3 className="font-bold text-center text-sm line-clamp-2 mb-2">
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-gray-600 text-center mb-3 flex-1">
                    {achievement.description}
                  </p>
                  <div className="space-y-2">
                    <div className={`text-xs text-center font-bold px-2 py-1 rounded ${getRarityColor(achievement.rarity)}`}>
                      {ar
                        ? achievement.rarity === "legendary"
                          ? "أعظم"
                          : achievement.rarity === "epic"
                            ? "أسطوري"
                            : achievement.rarity === "rare"
                              ? "نادر"
                              : "عام"
                        : achievement.rarity}
                    </div>
                    {achievement.sharedWithCohort && (
                      <div className="text-xs text-center text-blue-600 font-medium">
                        {ar ? "مشارك" : "Shared"}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => handleShare(achievement.id)}
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      {ar ? "شارك" : "Share"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
