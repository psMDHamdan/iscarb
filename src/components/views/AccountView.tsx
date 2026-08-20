"use client";

import { motion } from "framer-motion";
import { User, Shield, Globe, Bell, Mail, Key, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/iscarb/PageHeader";

export function AccountView() {
  const { lang, setLang } = useApp();
  const { t, ar } = useI18n();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <>
      <PageHeader
        title={ar ? "إعدادات الحساب" : "Account Settings"}
        description={ar ? "إدارة ملفك الشخصي وتفضيلات النظام" : "Manage your profile and system preferences."}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Dashboard", href: "/student/dashboard" },
          { label: ar ? "الحساب" : "Account", href: "/student/account" },
        ]}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-5xl space-y-6 pb-12"
      >
        {/* Profile Card */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-iscarb-green/10 text-iscarb-green">
                  <User className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{ar ? "الملف الشخصي" : "Profile Information"}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {ar ? "معلوماتك الشخصية الأساسية" : "Your basic personal information"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {ar ? "الاسم الكامل" : "Full Name"}
                  </label>
                  <div className="font-medium text-foreground">Hamdan Al-Ghamdi</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {ar ? "البريد الإلكتروني" : "Email Address"}
                  </label>
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    hamdan@iscarb.edu.sa
                    <CheckCircle2 className="size-4 text-iscarb-green" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {ar ? "الرقم الجامعي" : "Student ID"}
                  </label>
                  <div className="font-medium text-foreground">2023049182</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {ar ? "الكلية" : "College"}
                  </label>
                  <div className="font-medium text-foreground">Computer Science & Information Technology</div>
                </div>
              </div>
              <div className="mt-6">
                <Button variant="outline" className="border-iscarb-green/30 text-iscarb-green hover:bg-iscarb-green/10">
                  {ar ? "تحديث الملف" : "Update Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferences Card */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-iscarb-cyan/10 text-iscarb-cyan">
                  <Globe className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{ar ? "التفضيلات" : "Preferences"}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {ar ? "تخصيص تجربة الاستخدام" : "Customize your interface experience"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="space-y-0.5">
                  <div className="font-medium">{ar ? "لغة الواجهة" : "Interface Language"}</div>
                  <div className="text-sm text-muted-foreground">
                    {ar ? "تغيير لغة النظام (عربي / إنجليزي)" : "Change the system language (Arabic / English)"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    variant={lang === "en" ? "default" : "outline"}
                    className={lang === "en" ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90" : ""}
                    onClick={() => setLang("en")}
                  >
                    English
                  </Button>
                  <Button 
                    variant={lang === "ar" ? "default" : "outline"}
                    className={lang === "ar" ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90 font-arabic" : "font-arabic"}
                    onClick={() => setLang("ar")}
                  >
                    عربي
                  </Button>
                  <Button 
                    variant={lang === "fr" ? "default" : "outline"}
                    className={lang === "fr" ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90" : ""}
                    onClick={() => setLang("fr")}
                  >
                    Français
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security & Privacy */}
        <motion.div variants={item} className="grid gap-6 sm:grid-cols-2">
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-iscarb-gold/10 text-iscarb-gold-dark">
                  <Shield className="size-5" />
                </div>
                <CardTitle className="text-lg">{ar ? "الخصوصية" : "Privacy"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {ar ? "إدارة إعدادات مشاركة البيانات وظهور ملفك للمدراء." : "Manage data sharing and recruiter visibility settings."}
              </p>
              <Button variant="outline" className="w-full">
                {ar ? "إعدادات الخصوصية" : "Privacy Settings"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <Key className="size-5" />
                </div>
                <CardTitle className="text-lg">{ar ? "الأمان" : "Security"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {ar ? "تحديث كلمة المرور وإعدادات التحقق بخطوتين." : "Update password and two-factor authentication."}
              </p>
              <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                {ar ? "تغيير كلمة المرور" : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}
