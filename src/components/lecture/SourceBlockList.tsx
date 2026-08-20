"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { AlertCircle, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

export interface SourceBlockView {
  id: string;
  locator: string;
  type: string;
  text: string;
  criticality: "critical" | "normal" | "low";
  status: string;
}

interface Props {
  blocks: SourceBlockView[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  className?: string;
}

const CRIT_TONE: Record<string, string> = {
  critical: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400",
  normal: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  low: "border-border bg-muted/30 text-muted-foreground opacity-70",
};

const STATUS_ICONS: Record<string, any> = {
  mapped: CheckCircle2,
  omitted: XCircle,
  unresolved: HelpCircle,
};

const STATUS_COLORS: Record<string, string> = {
  mapped: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  omitted: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  unresolved: "text-muted-foreground bg-muted/50",
};

export function SourceBlockList({ blocks, selectedIds, onToggleSelection, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <div className={cn("space-y-3", className)}>
      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center flex flex-col items-center gap-3 bg-muted/10">
          <div className="p-3 bg-muted rounded-full">
            <HelpCircle className="h-6 w-6 text-muted-foreground opacity-50" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {ar ? "لا توجد كتل مصدر بعد — ارفع ملفًا أولاً" : "No source blocks yet — upload a file first"}
          </p>
        </div>
      )}
      
      {blocks.map((b) => {
        const StatusIcon = STATUS_ICONS[b.status] || HelpCircle;
        const isSelected = selectedIds.has(b.id);
        const isCritical = b.criticality === "critical";

        return (
          <div 
            key={b.id} 
            onClick={() => onToggleSelection(b.id)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer flex gap-4 bg-white",
              isSelected 
                ? "border-emerald-500 bg-emerald-50/30 shadow-md ring-1 ring-emerald-500/20" 
                : "border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-0.5",
              isCritical && !isSelected && "border-red-200 hover:border-red-300"
            )}
          >
            {/* Checkbox side */}
            <div className="pt-1 shrink-0">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(b.id)}
                className={cn(
                  "data-[state=checked]:bg-[#0F7B8A] data-[state=checked]:border-[#0F7B8A]",
                  isCritical && !isSelected && "border-red-500/50"
                )}
              />
            </div>

            {/* Content side */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className={cn("capitalize flex items-center gap-1.5 px-2.5 py-0.5", STATUS_COLORS[b.status])}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {b.status}
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px] bg-muted/50">{b.locator}</Badge>
                <Badge variant="outline" className="capitalize text-muted-foreground">{b.type}</Badge>
                <Badge variant="outline" className={cn("capitalize flex items-center gap-1", CRIT_TONE[b.criticality])}>
                  {isCritical && <AlertCircle className="h-3 w-3" />}
                  {b.criticality}
                </Badge>
              </div>
              <p className={cn(
                "text-sm leading-relaxed", 
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}>
                {b.text}
              </p>
            </div>
            
            {/* Critical left-border highlight */}
            {isCritical && (
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 transition-colors",
                isSelected ? "bg-[#0F7B8A]" : "bg-red-500/50 group-hover:bg-red-500"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
