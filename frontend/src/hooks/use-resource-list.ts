"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { DataTableState } from "@/components/shared/data-table";
import { useListQuery, type ListQueryController } from "@/hooks/use-list-query";
import { isApiClientError } from "@/lib/api/api-client-error";
import type { Page, PageMeta } from "@/lib/api/contracts";

/** The paging state a list falls back to before its first page has arrived. */
const EMPTY_META: PageMeta = { current_page: 1, per_page: 20, total: 0, last_page: 1 };

/** Everything a list screen needs to render itself and change what it shows. */
export type ResourceListViewModel<TRow> = {
  query: ListQueryController;
  state: DataTableState<TRow>;
  meta: PageMeta;
  isFetching: boolean;
};

/**
 * Turns one paginated endpoint into the single view model a list screen renders.
 *
 * Loading, empty, failure, and content are collapsed into one discriminated value
 * so a screen cannot show two of them at once, and the search and page live in the
 * URL so a filtered list can be linked to and navigated back to.
 *
 * A previous page stays on screen while the next one loads, which stops the table
 * from collapsing to a skeleton every time a filter changes.
 */
export function useResourceList<TRow, TParams extends object = Record<string, string | number>>({
  queryKey,
  fetcher,
  emptyMessage,
  extraParams,
  perPage,
}: {
  queryKey: (params: TParams) => readonly unknown[];
  fetcher: (params: TParams) => Promise<Page<TRow>>;
  emptyMessage: string;
  extraParams?: Partial<TParams>;
  perPage?: number;
}): ResourceListViewModel<TRow> {
  const listQuery = useListQuery(perPage);
  const params = { ...listQuery.params, ...extraParams } as TParams;

  const query = useQuery({
    queryKey: queryKey(params),
    queryFn: () => fetcher(params),
    placeholderData: (previous) => previous,
  });

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    query: listQuery,
    meta: query.data?.meta ?? EMPTY_META,
    isFetching: query.isFetching,
    state: toState(query.data, query.isPending, query.error, emptyMessage, refetch),
  };
}

/**
 * Chooses which of the four list states applies, preferring already-loaded rows so
 * a background refresh never blanks the table.
 */
function toState<TRow>(
  page: Page<TRow> | undefined,
  isPending: boolean,
  error: unknown,
  emptyMessage: string,
  onRetry: () => void,
): DataTableState<TRow> {
  if (page !== undefined) {
    return page.data.length === 0
      ? { kind: "empty", message: emptyMessage }
      : { kind: "content", rows: page.data };
  }

  if (isPending) {
    return { kind: "loading" };
  }

  return {
    kind: "error",
    message: isApiClientError(error)
      ? error.message
      : "Không tải được dữ liệu. Vui lòng thử lại.",
    onRetry,
  };
}
