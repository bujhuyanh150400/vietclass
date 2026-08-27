"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PageMeta } from "@/lib/api/contracts";

/**
 * Renders the pager under a list: which rows are being shown, out of how many, and
 * the controls to step through pages.
 *
 * It renders nothing while there is only one page, because a pager that can never
 * be used is noise. Presentational: it reports the requested page upward.
 */
export function DataTablePagination({
  meta,
  onPageChange,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
}) {
  if (meta.last_page <= 1) {
    return null;
  }

  const firstRow = (meta.current_page - 1) * meta.per_page + 1;
  const lastRow = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Hiển thị {firstRow}–{lastRow} trên tổng {meta.total}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
          Trang trước
        </Button>

        <span className="text-sm tabular-nums">
          {meta.current_page} / {meta.last_page}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          Trang sau
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
