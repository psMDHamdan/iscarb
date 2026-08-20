"use client";
import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Zap, Trophy, Users, Target, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommunityArenaView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ challengeId: "", teamName: "" });

  const labels = {
    title: ar ? "الساحة" : "Arena",
    description: ar ? "تنافس مع الآخرين في التحديات الشيقة" : "Compete with others in exciting challenges",
    activeChallenges: ar ? "التحديات النشطة" : "Active Challenges",
    myTeams: ar ? "فرقي" : "My Teams",
    difficulty: ar ? "الصعوبة" : "Difficulty",
    reward: ar ? "الجائزة" : "Reward",
    createTeam: ar ? "إنشاء فريق" : "Create Team",
    teamName: ar ? "اسم الفريق" : "Team Name",
    submit: ar ? "إنشاء" : "Create",
    company: ar ? "الشركة" : "Company",
    deadline: ar ? "الموعد النهائي" : "Deadline",
    teams: ar ? "الفرق" : "Teams",
    members: ar ? "أعضاء" : "Members",
    submitted: ar ? "مرسل" : "Submitted",
    pending: ar ? "قيد الإعداد" : "Pending",
    score: ar ? "النقاط" : "Score",
    joinTeam: ar ? "انضم للفريق" : "Join Team",
    noChallenges: ar ? "لا توجد تحديات متاحة" : "No challenges available",
    filterByDifficulty: ar ? "تصفية حسب الصعوبة" : "Filter by Difficulty",
    allDifficulties: ar ? "الكل" : "All",
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-50 text-green-700";
      case "intermediate":
        return "bg-yellow-50 text-yellow-700";
      case "hard":
        return "bg-red-50 text-red-700";
      case "expert":
        return "bg-purple-50 text-purple-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      apiEndpoint="/api/v1/student/community/arena"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: labels.title, href: "/student/community/arena" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{labels.activeChallenges}</p>
                    <p className="text-2xl font-bold">{data?.stats?.totalChallenges || 0}</p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{labels.myTeams}</p>
                    <p className="text-2xl font-bold">{data?.myTeams?.length || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{ar ? "معدل المشاركة" : "Participation"}</p>
                    <p className="text-2xl font-bold">{data?.stats?.participationRate || 0}%</p>
                  </div>
                  <Trophy className="h-8 w-8 text-orange-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Challenges */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{labels.activeChallenges}</CardTitle>
                <Dialog open={creating} onOpenChange={setCreating}>
                  <DialogTrigger asChild>
                    <Button size="sm">{labels.createTeam}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{labels.createTeam}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder={labels.teamName}
                        value={formData.teamName}
                        onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      />
                      <Button onClick={() => {
                        setCreating(false);
                        setFormData({ challengeId: "", teamName: "" });
                      }}>
                        {labels.submit}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.challenges && data.challenges.length > 0 ? (
                  data.challenges.map((challenge: any) => (
                    <div
                      key={challenge.id}
                      className="p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-1">{challenge.title}</h4>
                          <p className="text-sm text-muted-foreground">{challenge.company}</p>
                        </div>
                        <Badge className={cn("ml-2", getDifficultyColor(challenge.difficulty))}>
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 py-3 border-y text-xs">
                        {challenge.teams && (
                          <div>
                            <span className="text-muted-foreground">{labels.teams}:</span>
                            <p className="font-semibold">{challenge.teams}</p>
                          </div>
                        )}
                        {challenge.deadline && (
                          <div>
                            <span className="text-muted-foreground">{labels.deadline}:</span>
                            <p className="font-semibold">
                              {new Date(challenge.deadline).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                            </p>
                          </div>
                        )}
                        {challenge.reward && (
                          <div>
                            <span className="text-muted-foreground">{labels.reward}:</span>
                            <p className="font-semibold text-green-600">{challenge.reward}</p>
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="w-full">
                        {labels.joinTeam}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <p className="text-muted-foreground">{labels.noChallenges}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* My Teams */}
          {data?.myTeams?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{labels.myTeams}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.myTeams.map((team: any) => (
                    <div key={team.id} className="p-4 border border-border rounded-lg">
                      <h4 className="font-semibold mb-1">{team.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{team.challenge}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{team.memberCount} {ar ? "أعضاء" : "members"}</span>
                        <Badge variant={team.submission === "submitted" ? "default" : "secondary"}>
                          {team.submission === "submitted" ? ar ? "مرسل" : "Submitted" : ar ? "قيد الإعداد" : "Pending"}
                        </Badge>
                      </div>
                      {team.score && <p className="text-sm font-medium mt-2">{ar ? "النقاط" : "Score"}: {team.score}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </StudentPageTemplate>
  );
}
