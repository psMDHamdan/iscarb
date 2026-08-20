"use client";

import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageCircle,
  Calendar,
  GraduationCap
} from "lucide-react";

export function CommunityDashboardView() {
  const { lang, setView } = useApp();
  const ar = lang === "ar";

  return (
    <>
      <PageHeader
        title={ar ? "لوحة المجتمع" : "Community Dashboard"}
        description={ar ? "تواصل وتفاعل مع شبكتك" : "Connect and engage with your network"}
      />
      <div className="space-y-6 pb-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-blue-500" /> {ar ? "نقاشات نشطة" : "Active Discussions"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="text-sm font-medium hover:text-iscarb-cyan cursor-pointer transition-colors">Has anyone taken CS401 with Dr. Smith?</div>
                <div className="text-sm font-medium hover:text-iscarb-cyan cursor-pointer transition-colors">Looking for teammates for upcoming hackathon</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-green-500" /> {ar ? "أحداث قادمة" : "Upcoming Events"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30 px-2 py-1 min-w-[3rem] text-green-600">
                  <span className="text-xs font-bold uppercase">Nov</span>
                  <span className="text-lg font-bold leading-none">12</span>
                </div>
                <div>
                  <div className="text-sm font-bold">Tech Career Fair</div>
                  <div className="text-[11px] text-muted-foreground">Main Campus • 10:00 AM</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-purple-500" /> {ar ? "أنديتي ومجموعاتي" : "My Clubs & Groups"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer">
                <span className="text-sm font-medium">AI Enthusiasts Club</span>
                <Badge variant="secondary">Member</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer">
                <span className="text-sm font-medium">CS Study Group</span>
                <Badge variant="secondary">Admin</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
