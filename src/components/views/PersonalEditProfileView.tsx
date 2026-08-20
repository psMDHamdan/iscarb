import { useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function PersonalEditProfileView() {
  const { t, ar, dir } = useI18n();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const program = formData.get("program") as string;
    
    try {
      const res = await fetch("/api/iscarb/student/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, program })
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setMessage({ type: 'success', text: ar ? "تم تحديث الملف الشخصي بنجاح وجارٍ إعداد تقييمك" : "Profile updated successfully. Your assessment is being generated." });
    } catch (err) {
      setMessage({ type: 'error', text: ar ? "فشل في تحديث الملف الشخصي" : "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudentPageTemplate
      title="Edit Profile"
      titleAr="تعديل الملف الشخصي"
      apiEndpoint="/api/iscarb/student/profile"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "الملف الشخصي" : "Profile", href: "/student/profile" },
        { label: ar ? "تعديل" : "Edit", href: "/student/account/profile-edit" },
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
                <CardTitle className="text-lg">{ar ? "تعديل بيانات الملف الشخصي" : "Edit Profile Information"}</CardTitle>
              </CardHeader>
              <CardContent>
                {message && (
                  <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-iscarb-green/10 text-iscarb-green-dark' : 'bg-red-50 text-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "الاسم" : "Name"}</label>
                    <Input name="name" defaultValue={data?.profile?.name || data?.data?.name} className="max-w-md" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "التخصص / المسار" : "Specialization / Major"}</label>
                    <Input name="program" defaultValue={data?.profile?.specialty || data?.data?.specialty} className="max-w-md" required />
                    <p className="text-xs text-muted-foreground mt-1">
                      {ar ? "سيؤدي تحديث التخصص إلى إعادة توليد تقييم التوظيف الخاص بك." : "Updating your specialization will regenerate your employability assessment."}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "البريد الإلكتروني" : "Email"}</label>
                    <Input defaultValue={data?.profile?.email || data?.data?.email} className="max-w-md" disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "الهاتف" : "Phone"}</label>
                    <Input defaultValue={data?.profile?.phone} className="max-w-md" disabled placeholder="Not available" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "العنوان" : "Location"}</label>
                    <Input defaultValue={data?.profile?.location} className="max-w-md" disabled placeholder="Not available" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "نبذة تعريفية" : "Bio"}</label>
                    <Textarea defaultValue={data?.profile?.bio} className="max-w-md" rows={4} disabled placeholder="Not available" />
                  </div>
                  <div className="pt-4 flex gap-2">
                    <Button type="submit" className="flex-1 max-w-[200px]" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {ar ? "حفظ التغييرات" : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </StudentPageTemplate>
  );
}
