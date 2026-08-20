"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, FileText, Loader2, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataExportViewProps {
  ar: boolean;
}

export function DataExportView({ ar }: DataExportViewProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportOptions = [
    {
      id: "json",
      label: "JSON",
      desc: ar ? "تصدير كامل البيانات بتنسيق JSON" : "Full data export in JSON format",
      icon: FileJson,
      format: "application/json",
      endpoint: "/api/v1/compliance/gdpr/export",
    },
    {
      id: "csv",
      label: "CSV",
      desc: ar ? "تصدير البيانات بتنسيق CSV" : "Export data in CSV format",
      icon: FileSpreadsheet,
      format: "text/csv",
      endpoint: "/api/v1/compliance/gdpr/export?format=csv",
    },
    {
      id: "pdf",
      label: "PDF",
      desc: ar ? "تقرير شامل بصيغة PDF" : "Comprehensive report in PDF format",
      icon: FileText,
      format: "application/pdf",
      endpoint: "/api/v1/compliance/gdpr/export?format=pdf",
    },
  ];

  const handleExport = async (option: typeof exportOptions[0]) => {
    setExporting(option.id);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch(option.endpoint);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-export.${option.id}`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess(option.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(ar ? "فشل التصدير. حاول مرة أخرى." : "Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-200 text-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-2">{ar ? "تصدير البيانات" : "Export Your Data"}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {ar
            ? "قم بتصدير جميع بياناتك المخزنة على المنصة"
            : "Export all your data stored on the platform"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isExporting = exporting === option.id;
            const isSuccess = success === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleExport(option)}
                disabled={isExporting}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                  isSuccess
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-border hover:border-[#0E6C3C]/30 hover:bg-muted/30"
                )}
              >
                {isExporting ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
                ) : isSuccess ? (
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-emerald-600" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="text-center">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-2">{ar ? "حذف البيانات" : "Data Deletion"}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {ar
            ? "طلب حذف جميع بياناتك من المنصة. هذا الإجراء لا يمكن التراجع عنه."
            : "Request deletion of all your data from the platform. This action cannot be undone."}
        </p>
        <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <AlertTriangle className="h-4 w-4" />
          {ar ? "طلب حذف الحساب" : "Request Account Deletion"}
        </button>
      </div>
    </div>
  );
}
