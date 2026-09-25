import { Skeleton } from "@/components/ui/skeleton";

import type { ListView } from "./view-popover";

/** Describes the table geometry a list skeleton must reserve while loading. */
export type ListSkeletonTable = {
  columnTemplate: string;
  columnCount: number;
  rowCount?: number;
  rowHeight?: number;
  shortCycle?: number;
};

/** Renders the shared table/card loading state for an Academic list. */
export function ListSkeleton({
  view,
  label,
  table,
  cardCount = 6,
  cardGridClassName = "grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3",
}: {
  view: ListView;
  label: string;
  table: ListSkeletonTable;
  cardCount?: number;
  cardGridClassName?: string;
}) {
  const cards = (
    <div className={cardGridClassName} aria-hidden="true">
      {Array.from({ length: cardCount }, (_, index) => (
        <ListSkeletonCard key={index} />
      ))}
    </div>
  );

  if (view === "grid") {
    return (
      <div role="status" aria-label={label}>
        {cards}
      </div>
    );
  }

  return (
    <div role="status" aria-label={label}>
      <div className="hidden px-4 lg:block" aria-hidden="true">
        <div
          className="grid min-h-[46px] items-center gap-3 border-b border-vc-rule"
          style={{ gridTemplateColumns: table.columnTemplate }}
        >
          {Array.from({ length: table.columnCount }, (_, column) => (
            <Skeleton key={column} className="h-2.5 w-3/4 rounded-control bg-vc-rule" />
          ))}
        </div>
        {Array.from({ length: table.rowCount ?? 6 }, (_, row) => (
          <div
            key={row}
            className="grid items-center gap-3 border-b border-vc-rule last:border-b-0"
            style={{
              gridTemplateColumns: table.columnTemplate,
              minHeight: table.rowHeight ?? 72,
            }}
          >
            {Array.from({ length: table.columnCount }, (_, column) => (
              <Skeleton
                key={column}
                className={`h-3 rounded-control bg-vc-rule ${column === row % (table.shortCycle ?? table.columnCount) ? "w-1/2" : "w-4/5"}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="lg:hidden">{cards}</div>
    </div>
  );
}

/** Renders the neutral card placeholder shared by every Academic list. */
function ListSkeletonCard() {
  return (
    <div className="grid gap-3.5 rounded-panel border border-vc-rule bg-card p-3.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="grid gap-2">
          <Skeleton className="h-5 w-2/3 rounded-control bg-vc-rule" />
          <Skeleton className="h-2.5 w-1/3 rounded-control bg-vc-rule" />
        </div>
        <Skeleton className="size-8 rounded-control bg-vc-rule" />
      </div>
      <div className="grid gap-2 border-y border-vc-rule py-3">
        <Skeleton className="h-3 w-2/5 rounded-control bg-vc-rule" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-control bg-vc-rule" />
          <Skeleton className="h-7 w-20 rounded-control bg-vc-rule" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-20 rounded-control bg-vc-rule" />
          <Skeleton className="h-3 w-5 rounded-control bg-vc-rule" />
        </div>
        <Skeleton className="h-7 w-32 rounded-control bg-vc-rule" />
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-28 rounded-control bg-vc-rule" />
          <Skeleton className="h-3 w-5 rounded-control bg-vc-rule" />
        </div>
        <Skeleton className="h-7 w-28 rounded-control bg-vc-rule" />
      </div>
    </div>
  );
}
