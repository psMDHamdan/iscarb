"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/lib/store";
import { ShieldCheck, BookOpen, Layers, FileText } from "lucide-react";

export interface AlignmentMatrixRow {
  clo?: { id: string; number: string; text: string; bloomLevel: string; weight: number } | null;
  source?: { id: string; locator: string; text: string; type: string } | null;
  artifact?: { id: string; slideNo: number; status: string; version: number } | null;
  assessment?: { id: string; slideNo: number; stem: string; difficulty: string } | null;
  outcome?: { id: string; standardOutcomeId: string | null; decision: string; rationale: string | null; sourceLocator: string | null } | null;

  // Optional flat properties fallback
  cloId?: string;
  cloNumber?: string;
  cloText?: string;
  sourceLocator?: string | null;
  slideNo?: number | null;
  artifactStatus?: string | null;
  outcomeId?: string | null;
  assessmentSlide?: number | null;
}

interface Props {
  rows: AlignmentMatrixRow[];
  className?: string;
}

function nonempty(value: string | null | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export type FormattedAlignmentRow = {
  cloNumber: string;
  cloText: string;
  locator: string;
  slideNo: number | null;
  artifactStatus: string | null;
  assessmentSlide: number | null;
  outcomeId: string | null;
};

/** Honest cell values — never invent CLO-n, slide:n, generated, or JAH-CS-* codes. */
export function formatAlignmentMatrixRow(r: AlignmentMatrixRow): FormattedAlignmentRow {
  const cloNumber = nonempty(r.clo?.number ?? r.cloNumber);
  const cloText = nonempty(r.clo?.text ?? r.cloText);
  return {
    cloNumber: cloNumber ?? "Unmapped CLO",
    cloText: cloText ?? "Unmapped CLO",
    locator: nonempty(r.source?.locator ?? r.sourceLocator) ?? "—",
    slideNo: r.artifact?.slideNo ?? r.slideNo ?? null,
    artifactStatus: nonempty(r.artifact?.status ?? r.artifactStatus),
    assessmentSlide: r.assessment?.slideNo ?? r.assessmentSlide ?? null,
    outcomeId: nonempty(r.outcome?.standardOutcomeId ?? r.outcomeId ?? undefined),
  };
}

export function boundOfficialOutcomeCount(rows: AlignmentMatrixRow[]): number {
  return rows.filter((r) => formatAlignmentMatrixRow(r).outcomeId).length;
}

export function officialJaheziahHeading(rows: AlignmentMatrixRow[], ar = false): string {
  const bound = boundOfficialOutcomeCount(rows);
  const n = rows.length;
  return ar
    ? `مصفوفة المواءمة الرسمية (${bound} / ${n} معرف مرتبط)`
    : `Official Jaheziah alignment matrix (${bound} / ${n} ids bound)`;
}

/** Executive 5-column Jaheziah national alignment matrix table matching BRD §14 specifications. */
export function AlignmentMatrixTable({ rows, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <div className={cn(className, "overflow-hidden rounded-2xl border border-border/80 shadow-lg bg-card")}>
      <Table>
        <TableHeader className="bg-muted/40 border-b">
          <TableRow>
            <TableHead className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
              {ar ? "مخرج التعلّم (CLO)" : "1. Course Learning Outcome"}
            </TableHead>
            <TableHead className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
              {ar ? "محدد المصدر" : "2. Source Locator"}
            </TableHead>
            <TableHead className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
              {ar ? "الشريحة والأثر" : "3. Slide Artifact"}
            </TableHead>
            <TableHead className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
              {ar ? "سؤال التقييم" : "4. Assessment Item"}
            </TableHead>
            <TableHead className="font-display font-bold text-xs uppercase tracking-wider text-[#0F7B8A] py-4">
              {ar ? "رمز ناتج جاهزية الرسمي" : "5. Official Jaheziah ID"}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                {ar ? "لا توجد صفوف مواءمة معتمدة بعد" : "No official alignment rows generated yet"}
              </TableCell>
            </TableRow>
          )}

          {rows.map((r, i) => {
            const cell = formatAlignmentMatrixRow(r);

            return (
              <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                <TableCell className="py-4">
                  <div className="space-y-1 max-w-xs">
                    <Badge className="bg-[#0F7B8A] text-white font-mono text-[10px]">
                      {cell.cloNumber}
                    </Badge>
                    <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                      {cell.cloText}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="py-4">
                  <Badge variant="outline" className="font-mono text-xs bg-muted/50 border-border">
                    <FileText className="h-3 w-3 mr-1 text-muted-foreground" />
                    {cell.locator}
                  </Badge>
                </TableCell>

                <TableCell className="py-4">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-xs bg-[#0F7B8A]/10 border-[#0F7B8A]/30 text-[#0F7B8A]">
                      <Layers className="h-3 w-3 mr-1" />
                      {cell.slideNo != null ? `Slide S${cell.slideNo}` : "—"}
                    </Badge>
                    {cell.artifactStatus ? (
                      <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                        {cell.artifactStatus}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell className="py-4">
                  {cell.assessmentSlide != null ? (
                    <Badge variant="outline" className="font-mono text-xs border-purple-500/30 text-purple-600 bg-purple-500/10">
                      <BookOpen className="h-3 w-3 mr-1" /> S{cell.assessmentSlide} MCQ
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="py-4">
                  {cell.outcomeId ? (
                    <Badge className="bg-emerald-600 text-white font-mono text-xs py-1 px-2.5 shadow-sm">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                      {cell.outcomeId}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {ar ? "لا يوجد معرف رسمي" : "No official outcome id"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
