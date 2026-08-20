'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, FileText, Download, Trash2, Upload } from "lucide-react";

export function PersonalPersonalDocumentsView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Documents"
      titleAr="الوثائق"
      apiEndpoint="/api/v1/student/personal/documents"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "الوثائق" : "Documents", href: "/student/personal/documents" },
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{ar ? "الوثائق المرفقة" : "Attached Documents"}</h3>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                {ar ? "رفع جديد" : "Upload New"}
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {data?.documents?.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">{doc.size} • {doc.uploaded}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!data?.documents || data.documents.length === 0) && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">{ar ? "لا توجد وثائق مرفقة" : "No documents attached"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
