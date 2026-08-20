'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Type, Eye, MousePointer } from "lucide-react";

export function PersonalPersonalAccessibilityView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Accessibility"
      titleAr="إمكانية الوصول"
      apiEndpoint="/api/v1/student/personal/accessibility"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "إمكانية الوصول" : "Accessibility", href: "/student/personal/accessibility" },
      ]}
    >
      {(data: any, loading: boolean, error: string | null) => {
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
              <p className="text-sm text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</p>
            </div>
          );
        }

        if (error) {
          return (
            <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-red-900 dark:text-red-200">
                  {ar ? "خطأ في التحميل" : "Error Loading Page"}
                </h4>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "حجم الخط" : "Font Size"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Slider defaultValue={[1]} max={1.5} step={0.1} />
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">{ar ? "صغير" : "Small"}</span>
                    <span className="text-xs text-muted-foreground">{ar ? "كبير" : "Large"}</span>
                  </div>
                  <div className="p-4 border rounded">
                    <p className="text-sm">{ar ? "معاينة النص: Lorem ipsum dolor sit amet" : "Text preview: Lorem ipsum dolor sit amet"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "تباين عالي" : "High Contrast"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{ar ? "تشغيل تباين عالي" : "Enable high contrast"}</div>
                    <div className="text-xs text-muted-foreground">{ar ? "تحسين الرؤية للألوان" : "Improve color visibility"}</div>
                  </div>
                  <Switch defaultChecked={data?.accessibility?.highContrast} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "تقليل الحركة" : "Reduced Motion"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{ar ? "تقليل الحركة والمؤثرات" : "Reduce motion and animations"}</div>
                    <div className="text-xs text-muted-foreground">{ar ? "تقليل حركات CSS و Transitions" : "Reduce CSS animations and transitions"}</div>
                  </div>
                  <Switch defaultChecked={data?.accessibility?.reducedMotion} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "قارئ الشاشة" : "Screen Reader"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{ar ? "تفعيل تلميحات قارئ الشاشة" : "Enable screen reader hints"}</div>
                    <div className="text-xs text-muted-foreground">{ar ? "تحسينات لقارئات الشاشة" : "Screen reader enhancements"}</div>
                  </div>
                  <Switch defaultChecked={data?.accessibility?.screenReaderHints} />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
