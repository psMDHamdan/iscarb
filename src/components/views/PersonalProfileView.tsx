'use client';
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { proxiedImageUrl } from "@/lib/image-proxy";

export function PersonalProfileView() {
  const { t, ar, dir } = useI18n();

  return (
    <StudentPageTemplate
      title="Public Profile"
      titleAr="الملف الشخصي العام"
      apiEndpoint="/api/iscarb/student/profile"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/profile" },
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
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={proxiedImageUrl(data?.profile?.avatar)} alt={data?.profile?.name} />
                    <AvatarFallback>{data?.profile?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl">{data?.profile?.name || "Student Name"}</CardTitle>
                <p className="text-muted-foreground">{data?.profile?.bio || "No bio available"}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{data?.profile?.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{data?.profile?.phone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{data?.profile?.location || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{data?.profile?.joined || "-"}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium mb-3">{ar ? "المهارات" : "Skills"}</h4>
                  <div className="flex flex-wrap gap-2">
                    {data?.skills?.map((skill: string, index: number) => (
                      <span key={index} className="px-3 py-1 rounded-full bg-iscarb-green/10 text-iscarb-green text-xs">
                        {skill}
                      </span>
                    ))}
                    {(!data?.skills || data.skills.length === 0) && (
                      <span className="text-sm text-muted-foreground">{ar ? "لا توجد مهارات مضافة" : "No skills added"}</span>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium mb-3">{ar ? "روابط التواصل" : "Social Links"}</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">{ar ? "LinkedIn" : "LinkedIn"}</Button>
                    <Button size="sm" variant="outline" className="flex-1">{ar ? "GitHub" : "GitHub"}</Button>
                    <Button size="sm" variant="outline" className="flex-1">{ar ? "Portfolio" : "Portfolio"}</Button>
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
