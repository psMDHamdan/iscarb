"use client";

import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts";
import { Brain, Users, CheckCircle2, AlertCircle } from "lucide-react";

// Mock data for calibration dashboard
const MAD_DATA = [
  { module: "M01", mad: 5, status: "Calibrated" },
  { module: "M02", mad: 8, status: "Calibrated" },
  { module: "M03", mad: 16, status: "Needs Review" },
  { module: "M04", mad: 12, status: "Calibrated" },
  { module: "M05", mad: 20, status: "Needs Review" },
];

const SCATTER_DATA = [
  { human: 60, ai: 65 },
  { human: 75, ai: 72 },
  { human: 80, ai: 85 },
  { human: 40, ai: 45 },
  { human: 95, ai: 90 },
  { human: 85, ai: 85 },
  { human: 50, ai: 60 },
  { human: 70, ai: 65 },
];

export function CalibrationDashboardView() {
  const { t, ar } = useI18n();

  return (
    <>
      <PageHeader
        title={ar ? "لوحة معايرة الذكاء الاصطناعي" : "AI Calibration Dashboard"}
        description={ar ? "مراقبة دقة التصحيح الآلي والانحراف المعياري." : "Monitor AI grading accuracy and Mean Absolute Deviation (MAD)."}
      />

      <div className="mx-auto max-w-7xl px-4 pb-12 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Brain className="size-4" /> {ar ? "متوسط الانحراف (MAD)" : "Overall MAD"}
              </div>
              <div className="text-3xl font-bold font-display text-iscarb-green">12.4</div>
              <div className="text-xs text-muted-foreground">{ar ? "الهدف: أقل من 15" : "Target: < 15"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CheckCircle2 className="size-4" /> {ar ? "الوحدات المعايرة" : "Calibrated Modules"}
              </div>
              <div className="text-3xl font-bold font-display">12 / 15</div>
              <div className="text-xs text-muted-foreground">{ar ? "جاهز للإطلاق" : "Ready for production"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <AlertCircle className="size-4" /> {ar ? "معدل التراجع (Fallback)" : "Fallback Rate"}
              </div>
              <div className="text-3xl font-bold font-display text-amber-500">2.1%</div>
              <div className="text-xs text-muted-foreground">{ar ? "استخدام المصحح الاحتياطي" : "Deterministic scorer used"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="size-4" /> {ar ? "التقييمات اليدوية" : "Manual Reviews"}
              </div>
              <div className="text-3xl font-bold font-display">145</div>
              <div className="text-xs text-muted-foreground">{ar ? "هذا الشهر" : "This month"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{ar ? "الانحراف المعياري حسب الوحدة" : "MAD per Module"}</CardTitle>
              <CardDescription>{ar ? "الوحدات التي تتجاوز خط 15 تحتاج إلى مراجعة الـ Rubric." : "Modules crossing the 15-point line need rubric review."}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MAD_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="module" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="mad" fill="#1B4D46" name="MAD" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{ar ? "مقارنة الذكاء الاصطناعي بالمصحح البشري" : "AI vs Human Scoring Scatter"}</CardTitle>
              <CardDescription>{ar ? "كل نقطة تمثل تقييم طالب واحد." : "Each point represents one student submission."}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="human" name="Human Score" unit="%" domain={[0, 100]} />
                  <YAxis type="number" dataKey="ai" name="AI Score" unit="%" domain={[0, 100]} />
                  <ZAxis type="number" range={[50, 50]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Submissions" data={SCATTER_DATA} fill="#277066" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
