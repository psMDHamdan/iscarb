"use client";

import { motion } from "framer-motion";
import { FileText, Download, Share2, FileCheck, FileBadge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/iscarb/PageHeader";

export function DocumentsView() {
  const { lang } = useApp();
  const { t, ar } = useI18n();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const docs = [
    {
      id: 1,
      title: ar ? "السجل الأكاديمي الموحد" : "Unified Academic Transcript",
      type: "PDF",
      date: "2026-07-01",
      icon: FileText,
      color: "bg-iscarb-green/10 text-iscarb-green",
      status: "Official",
    },
    {
      id: 2,
      title: ar ? "شهادة إتمام التقييم الأساسي" : "Core Assessment Certificate",
      type: "PDF",
      date: "2026-06-15",
      icon: FileBadge,
      color: "bg-iscarb-gold/10 text-iscarb-gold-dark",
      status: "Verified",
    },
    {
      id: 3,
      title: ar ? "تقرير الكفاءات المهنية" : "Professional Competency Report",
      type: "PDF",
      date: "2026-06-10",
      icon: FileCheck,
      color: "bg-iscarb-cyan/10 text-iscarb-cyan",
      status: "Verified",
    }
  ];

  return (
    <>
      <PageHeader
        title={ar ? "المستندات" : "Documents"}
        description={ar ? "الوصول إلى سجلاتك وشهاداتك الرسمية." : "Access your official transcripts, certificates, and reports."}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Dashboard", href: "/student/dashboard" },
          { label: ar ? "المستندات" : "Documents", href: "/student/documents" },
        ]}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-5xl space-y-6 pb-12"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <motion.div key={doc.id} variants={item}>
              <Card className="h-full border-border/50 bg-background/50 backdrop-blur-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${doc.color}`}>
                      <doc.icon className="size-5" />
                    </div>
                    <Badge variant="secondary" className="bg-muted">
                      {doc.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-base leading-tight">
                    {doc.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{doc.date}</p>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                      <Download className="mr-2 size-3.5" />
                      {ar ? "تحميل" : "Download"}
                    </Button>
                    <Button size="sm" variant="outline" className="shrink-0">
                      <Share2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
