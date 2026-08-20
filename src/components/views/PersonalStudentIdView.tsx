'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { User, GraduationCap } from "lucide-react";
import { QRCodeSVG as QRCode } from "qrcode.react";

export function PersonalStudentIdView() {
  const { ar } = useI18n();

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
      {(data: any) => {
        const isValid = data?.validityStatus !== 'Expired';

        return (
          <div className="flex justify-center">
            <Card className="w-full max-w-sm overflow-hidden shadow-xl">
              {/* iSCARB brand gradient header */}
              <div className="bg-gradient-to-r from-[#0E6C3C] to-[#1a9e5a] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest opacity-80">iSCARB</p>
                    <p className="text-lg font-bold mt-0.5">
                      {ar ? "بطاقة الطالب الرسمية" : "Official Student ID"}
                    </p>
                  </div>
                  <GraduationCap className="h-10 w-10 opacity-60" />
                </div>
              </div>

              <CardContent className="p-6">
                {/* Photo placeholder + name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-20 w-20 rounded-xl bg-[#0E6C3C]/10 flex items-center justify-center border-2 border-[#0E6C3C]/20 shrink-0">
                    <User className="h-10 w-10 text-[#0E6C3C]/60" />
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-tight">{data?.name || "—"}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{data?.program || "—"}</p>
                    <Badge
                      className="mt-2"
                      variant={isValid ? "default" : "destructive"}
                    >
                      {isValid ? (ar ? "ساري المفعول" : "Valid") : (ar ? "منتهي" : "Expired")}
                    </Badge>
                  </div>
                </div>

                {/* ID details */}
                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ar ? "رقم الطالب" : "Student ID"}</span>
                    <span className="font-mono font-semibold">{data?.studentId || "—"}</span>
                  </div>
                  {data?.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{ar ? "البريد" : "Email"}</span>
                      <span className="text-xs truncate max-w-[180px]">{data.email}</span>
                    </div>
                  )}
                  {data?.validUntil && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{ar ? "صالح حتى" : "Valid Until"}</span>
                      <span>{data.validUntil}</span>
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex justify-center pt-2 border-t">
                  <QRCode value={data?.studentId || 'iscarb'} size={120} />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
