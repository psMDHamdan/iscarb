"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle, AlertCircle, ArrowRight, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/iscarb/PageHeader";

export function MyAssessmentsView() {
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

  const assessments = [
    {
      id: 1,
      title: ar ? "تقييم الجاهزية الأساسي" : "Core Readiness Assessment",
      type: "Mandatory",
      dueDate: "2026-07-20",
      status: "inprogress",
      progress: 45,
      icon: Clock,
    },
    {
      id: 2,
      title: ar ? "تقييم الكفاءة التقنية" : "Technical Competency Profile",
      type: "Optional",
      dueDate: "2026-07-25",
      status: "pending",
      progress: 0,
      icon: AlertCircle,
    },
    {
      id: 3,
      title: ar ? "تقييم المهارات الناعمة" : "Soft Skills Evaluation",
      type: "Mandatory",
      dueDate: "2026-06-30",
      status: "completed",
      progress: 100,
      icon: CheckCircle,
    },
    {
      id: 4,
      title: "Advanced Python Challenge",
      type: "Optional",
      dueDate: "2026-08-01",
      status: "pending",
      progress: 0,
      icon: AlertCircle,
    }
  ];

  return (
    <>
      <PageHeader
        title={ar ? "تقييماتي" : "My Assessments"}
        description={ar ? "إدارة التقييمات المعينة والمكتملة." : "Manage your assigned and completed assessments."}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/student/dashboard" },
          { label: ar ? "تقييماتي" : "My Assessments", href: "/student/my-assessments" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-12">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-background/50 p-4 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder={ar ? "بحث..." : "Search assessments..."} className="pl-9 bg-background" />
            </div>
            <Button variant="outline" className="w-full sm:w-auto font-bold">
              <Filter className="mr-2 size-4" /> {ar ? "تصفية" : "Filter"}
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6 bg-background border border-border/50 shadow-sm p-1 rounded-lg">
              <TabsTrigger value="all" className="font-bold px-6">{ar ? "الكل" : "All"}</TabsTrigger>
              <TabsTrigger value="pending" className="font-bold px-6">{ar ? "معلق" : "Pending"}</TabsTrigger>
              <TabsTrigger value="inprogress" className="font-bold px-6">{ar ? "قيد التقدم" : "In Progress"}</TabsTrigger>
              <TabsTrigger value="completed" className="font-bold px-6">{ar ? "مكتمل" : "Completed"}</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0 outline-none">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.map((a) => (
                  <AssessmentCard key={a.id} assessment={a} ar={ar} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="pending" className="mt-0 outline-none">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.filter(a => a.status === 'pending').map((a) => (
                  <AssessmentCard key={a.id} assessment={a} ar={ar} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="inprogress" className="mt-0 outline-none">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.filter(a => a.status === 'inprogress').map((a) => (
                  <AssessmentCard key={a.id} assessment={a} ar={ar} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-0 outline-none">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.filter(a => a.status === 'completed').map((a) => (
                  <AssessmentCard key={a.id} assessment={a} ar={ar} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

        </motion.div>
      </div>
    </>
  );
}

function AssessmentCard({ assessment, ar }: { assessment: any, ar: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-iscarb-green/10 border-iscarb-green/20 text-iscarb-green-dark";
      case "inprogress": return "bg-iscarb-cyan/10 border-iscarb-cyan/20 text-iscarb-cyan-dark";
      case "pending": return "bg-amber-500/10 border-amber-500/20 text-amber-600";
      default: return "bg-muted border-border text-foreground";
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return ar ? "مكتمل" : "Completed";
      case "inprogress": return ar ? "قيد التقدم" : "In Progress";
      case "pending": return ar ? "معلق" : "Pending";
      default: return status;
    }
  };

  const Icon = assessment.icon;

  return (
    <Card className="flex flex-col h-full border-border/50 bg-background/50 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${getStatusColor(assessment.status)}`}>
            {getStatusLabel(assessment.status)}
          </Badge>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{assessment.type}</Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{assessment.title}</CardTitle>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mt-2">
          <Icon className="size-3" />
          {ar ? "تاريخ التسليم: " : "Due: "}{assessment.dueDate}
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col flex-1">
        <div className="mb-6">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span>{ar ? "مكتمل" : "Progress"}</span>
            <span>{assessment.progress}%</span>
          </div>
          <Progress value={assessment.progress} className="h-1.5" indicatorClassName={assessment.status === 'completed' ? 'bg-iscarb-green' : 'bg-iscarb-cyan'} />
        </div>
        <div className="mt-auto">
          <Button 
            className={`w-full font-bold ${assessment.status === 'completed' ? '' : 'bg-iscarb-green hover:bg-iscarb-green-dark text-white'}`}
            variant={assessment.status === 'completed' ? 'outline' : 'default'}
          >
            {assessment.status === 'completed' ? (ar ? "عرض النتائج" : "View Results") : (assessment.progress > 0 ? (ar ? "متابعة" : "Resume") : (ar ? "البدء" : "Start"))}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
