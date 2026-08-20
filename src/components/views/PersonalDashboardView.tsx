"use client";

import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Shield,
  Award
} from "lucide-react";

export function PersonalDashboardView() {
  const { lang, setView } = useApp();
  const ar = lang === "ar";

  return (
    <>
      <PageHeader
        title={ar ? "لوحة التحكم الشخصية" : "Personal Dashboard"}
        description={ar ? "إدارة هويتك وتفضيلاتك الرقمية" : "Manage your digital identity and preferences"}
      />
      <div className="space-y-6 pb-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><User className="h-4 w-4 text-iscarb-cyan" /> {ar ? "اكتمال الملف الشخصي" : "Profile Completion"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
               <div className="flex justify-between text-sm font-medium">
                  <span>{ar ? "التقدم" : "Progress"}</span>
                  <span className="text-iscarb-cyan">85%</span>
               </div>
               <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-iscarb-cyan rounded-full" style={{ width: "85%" }} />
               </div>
               <p className="text-xs text-muted-foreground mt-2">Add a profile picture to reach 95%.</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-green-500" /> {ar ? "حالة الأمان" : "Security Status"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
               <div className="text-sm font-medium text-green-600 mb-1">Your account is secure.</div>
               <div className="text-xs text-muted-foreground">Last login: Today at 9:41 AM from Dhahran, SA</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
