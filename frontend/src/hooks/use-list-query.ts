"use client";

import { useCallback } from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

/** The paging and search state every list screen keeps in the URL. */
export type ListQueryState = {
  q: string;
  page: number;
  perPage: number;
};

/** What a list screen reads and changes about its own query state. */
export type ListQueryController = ListQueryState & {
  params: Record<string, string | number>;
  setSearch: (value: string) => void;
  setPage: (value: number) => void;
  reset: () => void;
};

/** Rows requested per page when the URL names no other value. */
const DEFAULT_PER_PAGE = 20;

/**
 * Keeps a list's search term and page in the URL rather than in component state,
 * so a filtered list can be linked to, reloaded, and navigated back to unchanged.
 *
 * Changing the search resets the page, because staying on page four of a result
 * set that no longer has four pages shows an empty screen for no clear reason.
 */
export function useListQuery(perPage: number = DEFAULT_PER_PAGE): ListQueryController {
  const [state, setState] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      page: parseAsInteger.withDefault(1),
    },
    { history: "replace", clearOnDefault: true },
  );

  /** Applies a new search term and returns to the first page of results. */
  const setSearch = useCallback(
    (value: string) => {
      void setState({ q: value === "" ? null : value, page: null });
    },
    [setState],
  );

  /** Moves to another page of the current result set. */
  const setPage = useCallback(
    (value: number) => {
      void setState({ page: value <= 1 ? null : value });
    },
    [setState],
  );

  /** Clears the search and returns to the first page. */
  const reset = useCallback(() => {
    void setState({ q: null, page: null });
  }, [setState]);

  return {
    q: state.q,
    page: state.page,
    perPage,
    params: { q: state.q, page: state.page, per_page: perPage },
    setSearch,
    setPage,
    reset,
  };
}
