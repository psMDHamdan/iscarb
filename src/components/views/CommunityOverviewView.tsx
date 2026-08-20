"use client";

import { useState, useEffect } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Calendar, TrendingUp, Clock } from "lucide-react";

interface CommunityStats {
  activeMembers: number;
  activeDiscussions: number;
  upcomingEvents: number;
  activeGroups: number;
}

interface Discussion {
  id: string;
  title: string;
  author: string;
  replies: number;
  timestamp: string;
}

interface ActiveGroup {
  id: string;
  name: string;
  members: number;
  role: "member" | "admin";
}

interface CommunityOverviewData {
  stats: CommunityStats;
  recentDiscussions: Discussion[];
  activeGroups: ActiveGroup[];
}

export function CommunityOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const labels = {
    title: ar ? "نظرة عامة على المجتمع" : "Community Overview",
    activeMembers: ar ? "الأعضاء النشطين" : "Active Members",
    discussions: ar ? "النقاشات النشطة" : "Active Discussions",
    events: ar ? "الأحداث القادمة" : "Upcoming Events",
    groups: ar ? "المجموعات النشطة" : "Active Groups",
    recentDiscussions: ar ? "النقاشات الأخيرة" : "Recent Discussions",
    activeGroups: ar ? "المجموعات الخاصة بي" : "My Active Groups",
    noDiscussions: ar ? "لا توجد نقاشات بعد" : "No discussions yet",
    noGroups: ar ? "لم تنضم لأي مجموعات بعد" : "You haven't joined any groups yet",
    replies: ar ? "رد" : "reply",
    repliesPl: ar ? "ردود" : "replies",
    members: ar ? "عضو" : "member",
    membersPl: ar ? "أعضاء" : "members",
  };

  return (
    <StudentPageTemplate
      title={labels.title}
      titleAr={labels.title}
      apiEndpoint="/api/v1/student/community/overview"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "نظرة عامة" : "Overview", href: "/student/community/overview" },
      ]}
    >
      {(data: CommunityOverviewData) => (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{labels.activeMembers}</p>
                    <p className="text-2xl font-bold">{data?.stats?.activeMembers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{labels.discussions}</p>
                    <p className="text-2xl font-bold">{data?.stats?.activeDiscussions || 0}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{labels.events}</p>
                    <p className="text-2xl font-bold">{data?.stats?.upcomingEvents || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{labels.groups}</p>
                    <p className="text-2xl font-bold">{data?.stats?.activeGroups || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-cyan-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Discussions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{labels.recentDiscussions}</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.recentDiscussions && data.recentDiscussions.length > 0 ? (
                <div className="space-y-3">
                  {data.recentDiscussions.map((discussion: Discussion) => (
                    <div
                      key={discussion.id}
                      className="p-3 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{discussion.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {discussion.replies} {discussion.replies === 1 ? labels.replies : labels.repliesPl}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{discussion.author}</span>
                        <Clock className="h-3 w-3" />
                        <span>{discussion.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">{labels.noDiscussions}</p>
              )}
            </CardContent>
          </Card>

          {/* Active Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{labels.activeGroups}</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.activeGroups && data.activeGroups.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.activeGroups.map((group: ActiveGroup) => (
                    <div
                      key={group.id}
                      className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{group.name}</h4>
                        <Badge variant={group.role === "admin" ? "default" : "secondary"}>
                          {group.role === "admin" ? "Admin" : "Member"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {group.members} {group.members === 1 ? labels.members : labels.membersPl}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">{labels.noGroups}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </StudentPageTemplate>
  );
}
