import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/index";

import { EmptyState } from "./empty-state";

/** One column of a data table: how to head it and how to render a row's cell. */
export type DataTableColumn<TRow> = {
  key: string;
  header: ReactNode;
  cell: (row: TRow) => ReactNode;
  /** Extra classes for this column's cells, for width or alignment. */
  className?: string;
  /** Hides the column below the small breakpoint, for secondary detail. */
  hideOnMobile?: boolean;
};

/** The states a list can be in, kept as one value so no two can be shown at once. */
export type DataTableState<TRow> =
  | { kind: "loading" }
  | { kind: "error"; message: string; onRetry?: () => void }
  | {
      kind: "empty";
      message: string;
      description?: string;
      icon?: LucideIcon;
      image?: string;
      action?: ReactNode;
    }
  | { kind: "content"; rows: TRow[] };

/**
 * Renders one list as a table, or the loading, empty, and failure state standing in
 * for it. The state arrives as a single discriminated value so the caller cannot
 * accidentally render rows and a spinner at the same time.
 *
 * Purely presentational: it renders what it is handed and reports clicks upward.
 */
export function DataTable<TRow>({
  columns,
  state,
  rowKey,
  onRowClick,
  skeletonRows = 5,
}: {
  columns: DataTableColumn<TRow>[];
  state: DataTableState<TRow>;
  rowKey: (row: TRow) => string | number;
  onRowClick?: (row: TRow) => void;
  skeletonRows?: number;
}) {
  // Empty has no row shape to preserve, so it replaces the table outright — the
  // header would only repeat the "there's nothing here" message the row used to
  // carry, taking up space without saying anything new.
  if (state.kind === "empty") {
    return (
      <div className="rounded-lg border bg-card">
        <EmptyState
          title={state.message}
          description={state.description}
          icon={state.icon}
          image={state.image}
          action={state.action}
          className="py-16"
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(column.hideOnMobile && "hidden sm:table-cell", column.className)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.kind === "loading" ? (
            <DataTableSkeletonRows columns={columns} rows={skeletonRows} />
          ) : null}

          {state.kind === "error" ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-40 text-center align-middle">
                <DataTableMessage state={state} />
              </TableCell>
            </TableRow>
          ) : null}

          {state.kind === "content"
            ? state.rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(column.hideOnMobile && "hidden sm:table-cell", column.className)}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : null}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Fills the table with placeholder rows of the same geometry as real ones, so the
 * layout does not jump once the data arrives.
 */
function DataTableSkeletonRows<TRow>({
  columns,
  rows,
}: {
  columns: DataTableColumn<TRow>[];
  rows: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, index) => (
        <TableRow key={index} aria-hidden="true" className="hover:bg-transparent">
          {columns.map((column) => (
            <TableCell
              key={column.key}
              className={cn(column.hideOnMobile && "hidden sm:table-cell", column.className)}
            >
              <Skeleton className="h-4 w-2/3" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/** Explains why the request failed and offers a retry, when one is available. */
function DataTableMessage<TRow>({
  state,
}: {
  state: Extract<DataTableState<TRow>, { kind: "error" }>;
}) {
  return (
    <div className="grid justify-items-center gap-3">
      <p className="text-sm text-muted-foreground">{state.message}</p>
      {state.onRetry ? (
        <button
          type="button"
          onClick={state.onRetry}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Thử lại
        </button>
      ) : null}
    </div>
  );
}
