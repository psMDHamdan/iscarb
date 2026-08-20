'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, GraduationCap, User } from "lucide-react";
import { proxiedImageUrl } from "@/lib/image-proxy";

export function PersonalPersonalStudentView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Student ID"
      titleAr="بطاقة الطالب"
      apiEndpoint="/api/v1/student/personal/student-id"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/personal" },
        { label: ar ? "بطاقة الطالب" : "Student ID", href: "/student/personal/student-id" },
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
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">{ar ? "بطاقة الطالب الرقمية" : "Digital Student ID Card"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-iscarb-green to-blue-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm opacity-80">{ar ? "جامعة iSCARB" : "iSCARB University"}</div>
                      <div className="text-xs opacity-70">{ar ? "رقم الطالب:" : "Student ID:"} {data?.studentId || "-"}</div>
                    </div>
                    <Avatar className="h-16 w-16 border-2 border-white">
                      <AvatarImage src={proxiedImageUrl(data?.avatar)} alt={data?.name} />
                      <AvatarFallback>{data?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-xl font-bold">{data?.name || "Student Name"}</div>
                    <div className="text-sm opacity-90">{data?.program || "-"}</div>
                  </div>
                  <div className="flex justify-center mb-4">
                    <QRCodeSVG value={JSON.stringify({ studentId: data?.studentId, name: data?.name })} size={120} />
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-70 mb-2">{ar ? "صالح حتى:" : "Valid until:"} {data?.validUntil || "-"}</div>
                    <div className={`text-xs font-bold px-3 py-1 rounded-full ${data?.isValid ? "bg-green-500" : "bg-red-500"}`}>
                      {data?.isValid ? (ar ? "نشط" : "Active") : (ar ? "منتهي" : "Expired")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
