"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { Check, Building2 } from "lucide-react";

export interface VisionContextItem {
  id: string;
  title?: string;
  initiative?: string;
  kind?: string | null;
  pillar?: string | null;
  description?: string;
  summary?: string;
  relevanceScore?: number | null;
  approved: boolean;
}

interface Props {
  context: VisionContextItem;
  onApprove?: () => void;
  onReject?: () => void;
  className?: string;
}

/** Saudi Vision 2030 context card matching BRD §14 specifications. */
export function VisionContextCard({ context, onApprove, onReject, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";

  if (!context) {
    return null;
  }

  const itemTitle = context.title || context.initiative || "Saudi Vision 2030 Context";
  const itemDesc = context.description || context.summary || "Saudi National Framework & Initiative.";
  const itemPillar = context.pillar || context.kind || "Vision 2030";

  return (
    <Card className={cn(
      "relative overflow-hidden border border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all duration-200 rounded-2xl bg-white text-slate-900", 
      className
    )}>
      <CardContent className="p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#0E6C3C] text-white font-bold text-[11px] flex items-center gap-1 shadow-xs">
              <span>🇸🇦</span> Vision 2030
            </Badge>
            <Badge variant="outline" className="text-[10px] capitalize font-mono text-emerald-800 border-emerald-200 bg-emerald-50/50">
              {itemPillar.replace(/_/g, " ")}
            </Badge>
          </div>

          <div>
            {context.approved ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                className="border-emerald-500/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs h-7.5 px-2.5 font-bold rounded-lg"
              >
                ✓ {ar ? "معتمد" : "Approved"}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onApprove}
                className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white text-xs h-7.5 px-2.5 font-bold rounded-lg shadow-xs"
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                {ar ? "اعتماد" : "Approve"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-sm text-slate-900 leading-snug flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-[#0F7B8A] shrink-0" />
            {itemTitle}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-normal pt-1">
            {itemDesc}
          </p>
        </div>

        {context.relevanceScore != null && (
          <div className="flex items-center justify-between pt-2 border-t border-emerald-100 text-[11px] text-slate-500">
            <span>{ar ? "درجة المواءمة المعيارية:" : "National Alignment Score:"}</span>
            <Badge variant="outline" className="font-mono text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50">
              {Math.round(context.relevanceScore * 100)}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
