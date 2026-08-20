'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, HelpCircle, MessageCircle, FileText } from "lucide-react";

export function PersonalPersonalHelpView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Help & Support"
      titleAr="المساعدة والدعم"
      apiEndpoint="/api/v1/student/personal/help"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "مساعدة" : "Help", href: "/student/personal/help" },
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
                <CardTitle className="text-lg">{ar ? "الأسئلة الشائعة" : "Frequently Asked Questions"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.faq?.map((item: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <h4 className="font-medium text-sm mb-1">{item.question}</h4>
                      <p className="text-xs text-muted-foreground">{item.answer}</p>
                    </div>
                  ))}
                  {(!data?.faq || data.faq.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">{ar ? "لا توجد أسئلة شائعة" : "No FAQs available"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ar ? "اتصل بالدعم" : "Contact Support"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {ar ? "دردشة حية" : "Live Chat"}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    {ar ? "نموذج الدعم" : "Support Form"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
