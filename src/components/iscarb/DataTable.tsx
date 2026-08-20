import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/iscarb/EmptyState";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  /** Unique column id; used as the cell value key when `render` is omitted. */
  key: string;
  /** Column header content (already localized). */
  header: ReactNode;
  /** Custom cell renderer; defaults to reading `row[key]`. */
  render?: (row: T) => ReactNode;
  /** Extra classes applied to both the header and body cells of this column. */
  className?: string;
}

/**
 * DataTable — the one sanctioned data-listing wrapper over ui/table. Typed
 * generic columns ({key, header, render?, className?}), an EmptyState
 * fallback so no screen ever shows a bare empty grid, and an optional
 * caption for assistive tech. Deliberately lean: no client-side sorting or
 * pagination — server components own data shape.
 *
 * Design-system tokens only; RTL-safe (ui/table uses logical properties).
 * Bilingual empty-state defaults via `lang`; pass `empty` to override.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
  lang = "en",
  className,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Stable key per row; defaults to the array index. */
  rowKey?: (row: T, index: number) => string | number;
  /** Accessible table summary, visually rendered below the table. */
  caption?: ReactNode;
  /** Replacement for the default EmptyState when `rows` is empty. */
  empty?: ReactNode;
  lang?: "en" | "ar";
  className?: string;
}) {
  const ar = lang === "ar";

  if (rows.length === 0) {
    return (
      empty ?? (
        <EmptyState
          icon={Inbox}
          title={ar ? "لا توجد بيانات بعد" : "Nothing here yet"}
          description={
            ar
              ? "ستظهر السجلات هنا فور توفرها."
              : "Records will appear here as soon as they exist."
          }
          className={className}
        />
      )
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={cn("px-4", column.className)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={rowKey ? rowKey(row, index) : index}>
              {columns.map((column) => (
                <TableCell key={column.key} className={cn("px-4", column.className)}>
                  {column.render
                    ? column.render(row)
                    : ((row as Record<string, unknown>)[column.key] as ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
