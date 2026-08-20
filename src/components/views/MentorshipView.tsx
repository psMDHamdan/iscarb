"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Target,
  Briefcase,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Loader2,
  AlertTriangle,
  UserCheck,
  MessageSquare,
} from "lucide-react";

interface MenteeSummary {
  totalMentees: number;
  activeMentees: number;
  totalSessions: number;
  upcomingMeetings: number;
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
}

interface MenteeData {
  id: string;
  studentName: string;
  studentEmail: string;
  status: string;
  focusAreas: string[];
  goalsCount: number;
  completedGoals: number;
  nextMeeting: string | null;
}

interface MeetingData {
  id: string;
  studentName: string;
  sessionType: string;
  scheduledAt: string;
  status: string;
}

export function MentorshipView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: menteesRes, isLoading: menteesLoading, error: menteesError, refetch } = useApiQuery<any>(
    ["faculty", "mentorship", "students"],
    "/api/v1/faculty/mentorship/students",
  );
  const { data: meetingsRes, isLoading: meetingsLoading } = useApiQuery<any>(
    ["faculty", "mentorship", "meetings"],
    "/api/v1/faculty/mentorship/meetings",
  );
  const loading = menteesLoading || meetingsLoading;
  const error = menteesError?.message ?? null;

  const stats = menteesRes?.stats ?? null;
  const mentees = menteesRes?.mentees ?? [];
  const meetings = meetingsRes?.meetings ?? meetingsRes ?? [];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "الإرشاد الأكاديمي" : "Mentorship Hub"} description={ar ? "إدارة وتتبع طلابك المُرشَدين" : "Manage and track your mentored students"} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "الإرشاد الأكاديمي" : "Mentorship Hub"} description={ar ? "إدارة وتتبع طلابك المُرشَدين" : "Manage and track your mentored students"} />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const s = stats || { totalMentees: 0, activeMentees: 0, totalSessions: 0, upcomingMeetings: 0, totalGoals: 0, completedGoals: 0, completionRate: 0 };

  return (
    <>
      <PageHeader
        title={ar ? "الإرشاد الأكاديمي" : "Mentorship Hub"}
        description={ar ? "إدارة وتتبع طلابك المُرشَدين" : "Manage and track your mentored students"}
        actions={
          <Button className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            {ar ? "إضافة طالب مُرشَد" : "Add Mentee"}
          </Button>
        }
      />
      <div className="space-y-6 pb-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0E6C3C]/10"><Users className="h-5 w-5 text-[#0E6C3C]" /></div>
                <div>
                  <p className="text-2xl font-bold">{s.totalMentees}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "إجمالي المُرشَدين" : "Total Mentees"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10"><UserCheck className="h-5 w-5 text-blue-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{s.activeMentees}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "نشط" : "Active"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10"><MessageSquare className="h-5 w-5 text-purple-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{s.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">{ar ? "الجلسات" : "Sessions"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10"><Target className="h-5 w-5 text-amber-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{s.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">{ar ? "معدل الإتمام" : "Goal Completion"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mentees */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><Users className="h-5 w-5 text-[#0E6C3C]" /> {ar ? "المُرشَدون" : "Mentees"}</span>
                <Link href="/faculty/mentorship/students" className="text-xs text-[#0E6C3C] hover:underline">{ar ? "عرض الكل" : "View All"}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mentees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا يوجد مُرشَدون بعد" : "No mentees yet"}</p>
              ) : (
                <div className="space-y-3">
                  {mentees.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{m.studentName}</p>
                        <p className="text-xs text-muted-foreground">{m.focusAreas.join(", ") || (ar ? "عام" : "General")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{m.completedGoals}/{m.goalsCount} {ar ? "أهداف" : "goals"}</p>
                        {m.nextMeeting && <p className="text-xs text-[#0E6C3C]">{ar ? "الاجتماع القادم" : "Next meeting"}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-500" /> {ar ? "الاجتماعات القادمة" : "Upcoming Meetings"}</span>
                <Link href="/faculty/mentorship/meetings" className="text-xs text-purple-500 hover:underline">{ar ? "عرض الكل" : "View All"}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد اجتماعات" : "No upcoming meetings"}</p>
              ) : (
                <div className="space-y-3">
                  {meetings.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{m.studentName}</p>
                        <p className="text-xs text-muted-foreground">{m.sessionType}</p>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{new Date(m.scheduledAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
