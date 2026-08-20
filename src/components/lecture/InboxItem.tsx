"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  AlertTriangle,
  Check,
  RefreshCw,
  Edit3,
  Ban,
  ShieldAlert,
  Layers,
  Link2,
  FileText,
  HelpCircle,
} from "lucide-react";

export interface DecisionItem {
  type: "artifact" | "alignment" | "claim" | "coverage";
  id: string;
  slideNo?: number;
  message: string;
  severity: "error" | "warning";
  actions: ("approve" | "reject" | "regenerate" | "edit" | "omit" | "waive")[];
}

interface Props {
  item: DecisionItem;
  onAction: (action: string, reason?: string, editedContent?: unknown) => void;
  busy?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<DecisionItem["type"], { labelEn: string; labelAr: string; icon: any; color: string }> = {
  artifact: { labelEn: "Slide Content", labelAr: "محتوى الشريحة", icon: Layers, color: "text-[#0F7B8A] bg-[#0F7B8A]/10 border-[#0F7B8A]/30" },
  alignment: { labelEn: "Jaheziah Link", labelAr: "مواءمة جاهزية", icon: Link2, color: "text-purple-600 bg-purple-500/10 border-purple-500/30" },
  claim: { labelEn: "Quality Gate", labelAr: "بوابة الجودة", icon: ShieldAlert, color: "text-red-600 bg-red-500/10 border-red-500/30" },
  coverage: { labelEn: "Source Coverage", labelAr: "تغطية المصدر", icon: FileText, color: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
};

/** Executive decision item card matching BRD §12 specifications. */
export function InboxItem({ item, onAction, busy, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [reason, setReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState<"omit" | "waive" | null>(null);

  const typeInfo = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.artifact;
  const TypeIcon = typeInfo.icon;

  const handleActionClick = (act: string) => {
    if (act === "omit" || act === "waive") {
      if (!showReasonInput) {
        setShowReasonInput(act as "omit" | "waive");
        return;
      }
      onAction(act, reason || "Faculty justification recorded.");
      setShowReasonInput(null);
      setReason("");
      return;
    }
    onAction(act);
  };

  return (
    <Card className={cn("border border-border/80 shadow-sm hover:border-[#0F7B8A]/40 transition-all rounded-xl overflow-hidden", className)}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className={`p-2.5 rounded-xl border shrink-0 ${typeInfo.color}`}>
              <TypeIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`text-xs font-semibold ${typeInfo.color}`}>
                  {typeInfo[ar ? "labelAr" : "labelEn"]}
                </Badge>
                {item.slideNo != null && (
                  <Badge variant="outline" className="font-mono text-xs bg-muted">
                    Slide S{item.slideNo}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase font-bold tracking-wider",
                    item.severity === "error"
                      ? "border-red-500/40 text-red-600 bg-red-500/10"
                      : "border-amber-500/40 text-amber-600 bg-amber-500/10"
                  )}
                >
                  {item.severity === "error" ? "High Priority" : "Warning"}
                </Badge>
              </div>

              <p className="text-sm font-semibold text-foreground leading-relaxed pt-0.5">
                {item.message}
              </p>
            </div>
          </div>
        </div>

        {/* Reason Input Box for Omit / Waive */}
        {showReasonInput && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
              {ar ? `مبرر القرار (${showReasonInput === "omit" ? "استبعاد" : "إعفاء"}):` : `Faculty Justification (${showReasonInput.toUpperCase()}):`}
            </label>
            <div className="flex gap-2">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={ar ? "اكتب مبرر الاستبعاد التربوي..." : "Enter pedagogical justification..."}
                className="text-xs h-9 bg-background"
              />
              <Button
                size="sm"
                onClick={() => handleActionClick(showReasonInput)}
                disabled={busy || !reason.trim()}
                className="bg-amber-600 text-white shrink-0 h-9"
              >
                {ar ? "تأكيد" : "Confirm"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowReasonInput(null)}
                className="h-9 shrink-0"
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/40">
          {item.actions.includes("approve") && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => handleActionClick("approve")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 shadow-sm"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {ar ? "اعتماد" : "Approve"}
            </Button>
          )}

          {item.actions.includes("regenerate") && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handleActionClick("regenerate")}
              className="text-xs h-8 px-3 border-border hover:bg-muted"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-[#0F7B8A]" />
              {ar ? "إعادة توليد" : "Regenerate"}
            </Button>
          )}

          {item.actions.includes("edit") && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handleActionClick("edit")}
              className="text-xs h-8 px-3 border-border hover:bg-muted"
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5 text-purple-600" />
              {ar ? "تحرير" : "Edit"}
            </Button>
          )}

          {item.actions.includes("omit") && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => handleActionClick("omit")}
              className="text-xs h-8 px-3 text-amber-600 hover:bg-amber-500/10"
            >
              <Ban className="mr-1.5 h-3.5 w-3.5" />
              {ar ? "استبعاد" : "Omit"}
            </Button>
          )}

          {item.actions.includes("waive") && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => handleActionClick("waive")}
              className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground"
            >
              <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
              {ar ? "إعفاء" : "Waive"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
