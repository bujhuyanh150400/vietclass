"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageMeta } from "@/lib/api/contracts";
import { cn } from "@/lib/utils/index";

/** How many page buttons and ellipses the numbered pager will ever render. */
const MAX_PAGE_SLOTS = 7;

/**
 * Chooses which page numbers the numbered pager shows, collapsing the rest into
 * ellipses.
 *
 * A list of two hundred pages cannot render a button each, and a row whose width
 * changes on every step is hard to aim at, so the result always holds the same
 * number of slots: the first and last page, a window around the current one, and
 * an ellipsis wherever pages were skipped.
 */
function pageSlots(currentPage: number, lastPage: number): (number | "gap")[] {
  if (lastPage <= MAX_PAGE_SLOTS) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  const shown = new Set<number>([1, lastPage, currentPage, currentPage - 1, currentPage + 1]);

  // Near either end there is no gap to collapse on that side, so the freed slots
  // extend the window inward instead of leaving the row short.
  if (currentPage <= 4) {
    [2, 3, 4, 5].forEach((page) => shown.add(page));
  }

  if (currentPage >= lastPage - 3) {
    for (let page = lastPage - 4; page < lastPage; page += 1) {
      shown.add(page);
    }
  }

  const pages = [...shown]
    .filter((page) => page >= 1 && page <= lastPage)
    .sort((left, right) => left - right);

  return pages.flatMap((page, index) => {
    const previous = pages[index - 1];

    return previous !== undefined && page - previous > 1
      ? (["gap", page] as (number | "gap")[])
      : [page];
  });
}

/**
 * Renders the pager under a list: which rows are being shown, out of how many, and
 * the controls to step through pages.
 *
 * Two shapes, because two kinds of list need different things. By default it is a
 * previous/next pair with the page count between them, and it renders nothing
 * while there is only one page, because a pager that can never be used is noise.
 * Passing `numbered` switches to the row of page buttons a list sheet carries
 * along its bottom edge, which stays put even on a single page — there it is
 * still reporting the total, and a footer that appears and disappears as the
 * result count crosses one page would shift the rows above it.
 *
 * Presentational: it reports the requested page and page size upward.
 */
export function DataTablePagination({
  meta,
  onPageChange,
  numbered = false,
  unit,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  /** Renders the page-button row instead of the previous/next pair. */
  numbered?: boolean;
  /** What is being counted, for the "1–10 trên 24 học sinh" summary. */
  unit?: string;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
}) {
  if (!numbered && meta.last_page <= 1) {
    return null;
  }

  const firstRow = (meta.current_page - 1) * meta.per_page + 1;
  const lastRow = Math.min(meta.current_page * meta.per_page, meta.total);
  const onFirstPage = meta.current_page <= 1;
  const onLastPage = meta.current_page >= meta.last_page;

  if (!numbered) {
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
            disabled={onFirstPage}
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
            disabled={onLastPage}
            onClick={() => onPageChange(meta.current_page + 1)}
          >
            Trang sau
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  const showPageSize =
    pageSize !== undefined && pageSizeOptions !== undefined && onPageSizeChange !== undefined;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <span aria-live="polite" className="tabular-nums">
          {meta.total === 0 ? 0 : `${firstRow}–${lastRow}`} trên {meta.total}
          {unit ? ` ${unit}` : ""}
        </span>

        {showPageSize ? (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span>Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger
                size="sm"
                aria-label="Số mục hiển thị mỗi trang"
                className="w-[76px] rounded-control border-vc-control font-mono"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>/ trang</span>
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-[3px]">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-9 rounded-control"
          aria-label="Trang trước"
          disabled={onFirstPage}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>

        {pageSlots(meta.current_page, meta.last_page).map((slot, index) =>
          slot === "gap" ? (
            <span
              key={`gap-${index}`}
              aria-hidden="true"
              className="grid size-9 place-items-center"
            >
              …
            </span>
          ) : (
            <Button
              key={slot}
              type="button"
              variant={slot === meta.current_page ? "outline" : "ghost"}
              size="icon-sm"
              className={cn(
                "size-9 rounded-control font-mono tabular-nums",
                slot === meta.current_page && "border-vc-control bg-background text-foreground",
              )}
              aria-label={`Trang ${slot}`}
              aria-current={slot === meta.current_page ? "page" : undefined}
              onClick={() => onPageChange(slot)}
            >
              {slot}
            </Button>
          ),
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-9 rounded-control"
          aria-label="Trang sau"
          disabled={onLastPage}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
