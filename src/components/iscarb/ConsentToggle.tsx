"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { notify } from "@/lib/notify";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

interface ConsentResponse {
  studentId: string;
  discoverable: boolean;
  records: { granted: boolean; grantedAt: string; revokedAt: string | null; purpose: string }[];
}

/**
 * Recruiter-discoverability consent toggle (P1 fix): the PDPL-compliant
 * consent API (PATCH /api/iscarb/consent — transactional flag + ConsentRecord
 * + AuditLog) existed with no UI calling it ("orphaned API"). This is that
 * UI: a Topbar control any student session can reach, with the explicit
 * PDPL framing (what it does, that it's revocable) rather than a bare switch.
 */
export function ConsentToggle() {
  const { ar, lang } = useI18n();
  const selectedStudentId = useApp((s) => s.selectedStudentId);
  const { data } = useApiQuery<ConsentResponse>(
    ["consent", selectedStudentId ?? ""],
    `/api/iscarb/consent?studentId=${selectedStudentId}`,
    { enabled: !!selectedStudentId },
  );

  const toggle = useApiMutation<{ ok: boolean; discoverable: boolean }, { studentId: string; discoverable: boolean }>(
    "/api/iscarb/consent",
    {
      method: "PATCH",
      invalidateKeys: (vars) => [["consent", vars.studentId]],
      onSuccess: (r) =>
        notify.ok(
          lang,
          r.discoverable
            ? { en: "You're now discoverable to recruiters", ar: "أنت الآن ظاهر لجهات التوظيف" }
            : { en: "Recruiter discoverability turned off", ar: "تم إيقاف الظهور لجهات التوظيف" },
        ),
    },
  );

  if (!selectedStudentId) return null;
  const discoverable = data?.discoverable ?? false;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label={L(ar, "Recruiter visibility settings", "إعدادات الظهور لجهات التوظيف")}
          title={L(ar, "Recruiter visibility", "الظهور لجهات التوظيف")}
        >
          {discoverable ? <ShieldCheck className="h-[18px] w-[18px] text-iscarb-green" /> : <ShieldOff className="h-[18px] w-[18px] text-muted-foreground" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{L(ar, "Visible to recruiters", "ظاهر لجهات التوظيف")}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {L(
                ar,
                "When on, your profile (readiness, skills, career mapping) is searchable in the Recruiter Portal. You can revoke this any time.",
                "عند التفعيل، يصبح ملفّك (الجاهزية، المهارات، التصنيف الوظيفي) قابلاً للبحث في بوابة التوظيف. يمكنك إلغاء هذا في أي وقت.",
              )}
            </p>
          </div>
          <Switch
            checked={discoverable}
            disabled={toggle.isPending}
            onCheckedChange={(checked) => toggle.mutate({ studentId: selectedStudentId, discoverable: checked })}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {L(ar, "Governed by PDPL — every change is recorded as a revocable consent record.", "محكوم بنظام حماية البيانات الشخصية — كل تغيير يُسجَّل كموافقة قابلة للإلغاء.")}
        </p>
      </PopoverContent>
    </Popover>
  );
}

export default ConsentToggle;
