"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Shield, Download, Trash2, Loader2 } from "lucide-react";

interface PrivacySettingsViewProps {
  ar: boolean;
}

export function PrivacySettingsView({ ar }: PrivacySettingsViewProps) {
  const { data: rawRes, isLoading: loading, refetch } = useApiQuery<any>(
    ["compliance", "consent"],
    "/api/v1/compliance/consent",
  );
  const consents = rawRes?.success ? rawRes.data : rawRes?.data ?? [];

  const exportData = async () => {
    try {
      const res = await fetch("/api/v1/compliance/gdpr/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-data-export.json";
      a.click();
    } catch (err) {
      console.error("Failed to export data:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4">{ar ? "الموافقات" : "Consent Records"}</h3>
        {consents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {ar ? "لا توجد موافقات مسجلة" : "No consent records"}
          </p>
        ) : (
          <div className="space-y-3">
            {consents.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{c.purpose}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.grantedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    c.granted
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {c.granted ? (ar ? "مُمنوح" : "Granted") : (ar ? "مُرفض" : "Denied")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">{ar ? "حقوقك" : "Your Rights"}</h3>
        <p className="text-sm text-muted-foreground">
          {ar
            ? "لديك حقوق وفقاً لقوانين حماية البيانات"
            : "You have rights under data protection laws"}
        </p>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            {ar ? "تصدير بياناتي" : "Export My Data"}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-muted text-red-600">
            <Trash2 className="h-4 w-4" />
            {ar ? "طلب حذف البيانات" : "Request Data Deletion"}
          </button>
        </div>
      </div>
    </div>
  );
}
