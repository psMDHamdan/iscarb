"use client";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";

export function CommunityLeaderboardsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const labels = {
    title: ar ? "لوحة الترتيب" : "Leaderboard",
    rank: ar ? "الترتيب" : "Rank",
    name: ar ? "الاسم" : "Name",
    score: ar ? "النقاط" : "Score",
    badges: ar ? "الأوسمة" : "Badges",
    yourRank: ar ? "ترتيبك" : "Your Rank",
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      apiEndpoint="/api/v1/student/community/leaderboard"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: labels.title, href: "/student/community/leaderboards" },
      ]}
    >
      {(data: any) => (
        <div className="space-y-6">
          {data?.currentStudentRank && (
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{labels.yourRank}</p>
                    <p className="text-3xl font-bold">#{data.currentStudentRank.rank}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{data.currentStudentRank.score}</p>
                    <p className="text-sm text-muted-foreground">{labels.score}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data?.stats && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{data.stats.totalStudents}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{data.stats.averageScore}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Top Score</p>
                  <p className="text-2xl font-bold">{data.stats.topScore}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Top Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.leaderboard?.map((student: any) => (
                  <div key={student.studentId} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold">
                        {student.rank <= 3 ? (
                          <Trophy className="h-4 w-4" />
                        ) : (
                          student.rank
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{student.score}</p>
                      <Badge variant="outline" className="text-xs">{student.badges} badges</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </StudentPageTemplate>
  );
}
