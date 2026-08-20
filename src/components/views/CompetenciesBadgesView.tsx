"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Trophy, Star, Award } from "lucide-react";

export function CompetenciesBadgesView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "competencies", "badges"],
    "/api/v1/student/competencies/badges",
  );
  const data = rawRes?.data ?? rawRes;
  const error = queryError?.message ?? null;

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "الأوسمة والإنجازات" : "Badges & Achievements"}
          description={ar ? "عرض جميع الأوسمة التي كسبتها" : "View all badges you've earned"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green" />
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "الأوسمة والإنجازات" : "Badges & Achievements"} />
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const { badges, stats } = data;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold":
        return "text-yellow-600";
      case "silver":
        return "text-gray-400";
      case "bronze":
        return "text-amber-700";
      default:
        return "text-blue-600";
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "gold":
        return ar ? "ذهبي" : "Gold";
      case "silver":
        return ar ? "فضي" : "Silver";
      case "bronze":
        return ar ? "برونزي" : "Bronze";
      default:
        return ar ? "عام" : "General";
    }
  };

  return (
    <>
      <PageHeader
        title={ar ? "الأوسمة والإنجازات" : "Badges & Achievements"}
        description={ar ? "عرض شامل لجميع الأوسمة والإنجازات التي كسبتها" : "Comprehensive view of all badges and achievements earned"}
      />

      <div className="space-y-6 pb-12">
        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "إجمالي الأوسمة" : "Total Badges"}
                </p>
                <p className="text-2xl font-bold mt-2">{stats?.total || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "ذهبية" : "Gold"}
                </p>
                <p className="text-2xl font-bold mt-2 text-yellow-600">{stats?.gold || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "فضية" : "Silver"}
                </p>
                <p className="text-2xl font-bold mt-2 text-gray-400">{stats?.silver || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  {ar ? "نقاط" : "Points"}
                </p>
                <p className="text-2xl font-bold mt-2">{stats?.totalPoints || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges Grid */}
        {badges && badges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{ar ? "الأوسمة المكتسبة" : "Earned Badges"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.map((badge: any) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow text-center"
                  >
                    <div className={`h-16 w-16 flex items-center justify-center rounded-full mb-3 ${getTierColor(badge.tier)} text-opacity-10 bg-current`}>
                      {badge.tier === "gold" || badge.tier === "silver" ? (
                        <Trophy className="h-8 w-8" />
                      ) : (
                        <Award className="h-8 w-8" />
                      )}
                    </div>
                    <h4 className="font-semibold text-sm line-clamp-2">{badge.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="outline" className={getTierColor(badge.tier)}>
                        {getTierLabel(badge.tier)}
                      </Badge>
                      {badge.points && (
                        <Badge variant="secondary">{badge.points}pt</Badge>
                      )}
                    </div>
                    {badge.earnedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(badge.earnedAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!badges || badges.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{ar ? "لا توجد أوسمة بعد" : "No Badges Yet"}</h3>
              <p className="text-sm text-muted-foreground">
                {ar ? "ابدأ في تطوير مهاراتك واكسب الأوسمة من خلال إنجازاتك" : "Start developing your skills and earn badges through your achievements"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
