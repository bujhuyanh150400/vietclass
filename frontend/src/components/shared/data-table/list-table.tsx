import type { ReactNode } from "react";

import { AppButton } from "@/components/shared/app-button";
import { EmptyState } from "@/components/shared/data-table/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { DataTableState } from "./list-state";

/** Describes one domain column without exposing table layout classes. */
export type ListTableColumn<TRow> = {
  key: string;
  header: ReactNode;
  cell: (row: TRow) => ReactNode;
  width?: number;
  ariaSort?: "ascending" | "descending" | "none";
};

/** Renders the shared table layout and optional state placeholder used by a list. */
export function ListTable<TRow>({
  columns,
  rows = [],
  state,
  rowKey,
  ariaLabel,
  minWidth = 960,
  skeletonRows = 5,
}: {
  columns: ListTableColumn<TRow>[];
  rows?: TRow[];
  state?: DataTableState<TRow>;
  rowKey: (row: TRow) => string | number;
  ariaLabel: string;
  minWidth?: number;
  skeletonRows?: number;
}) {
  const hasColumnWidths = columns.some((column) => column.width !== undefined);

  if (state?.kind === "empty" || state?.kind === "error") {
    return (
      <div className="rounded-lg border bg-card">
        <EmptyState
          title={state.message}
          description={state.kind === "empty" ? state.description : undefined}
          icon={state.kind === "empty" ? state.icon : undefined}
          image={state.kind === "empty" ? state.image : undefined}
          action={
            state.kind === "error" && state.onRetry ? (
              <AppButton type="button" variant="outline" onClick={state.onRetry}>
                Thử lại
              </AppButton>
            ) : (
              state.kind === "empty" ? state.action : undefined
            )
          }
          className="py-16"
        />
      </div>
    );
  }

  const contentRows = state?.kind === "content" ? state.rows : rows;

  return (
    <Table aria-label={ariaLabel} className="table-fixed" style={{ minWidth }}>
      {hasColumnWidths ? (
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.key}
              style={
                column.width === undefined ? undefined : { width: `${column.width}%` }
              }
            />
          ))}
        </colgroup>
      ) : null}
      <TableHeader>
        <TableRow className="bg-vc-paper hover:bg-vc-paper [&_th]:h-[46px] [&_th]:border-b [&_th]:border-vc-rule [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-[11px] [&_th]:font-medium [&_th]:tracking-[0.06em] [&_th]:text-muted-foreground [&_th]:uppercase">
          {columns.map((column) => (
            <TableHead key={column.key} aria-sort={column.ariaSort}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {state?.kind === "loading"
          ? Array.from({ length: skeletonRows }, (_, row) => (
              <TableRow key={row} className="border-vc-rule">
                {columns.map((column, columnIndex) => (
                  <TableCell key={column.key} className="h-[72px] px-3">
                    <Skeleton
                      className={`h-3 rounded-control bg-vc-rule ${columnIndex === row % columns.length ? "w-1/2" : "w-4/5"}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : contentRows.map((row) => (
              <TableRow
                key={rowKey(row)}
                className="group border-vc-rule whitespace-normal hover:bg-vc-tint focus-within:bg-vc-tint has-aria-expanded:bg-vc-tint [&_td]:h-[72px] [&_td]:px-3"
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>{column.cell(row)}</TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
