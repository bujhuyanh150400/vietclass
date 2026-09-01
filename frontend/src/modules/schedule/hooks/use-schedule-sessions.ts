"use client";

import { useCallback } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";

import { isApiClientError } from "@/lib/api/api-client-error";

import {
  fetchClassOptions,
  fetchScheduleSession,
  fetchScheduleSessions,
} from "../api/schedule-client-api";
import { MAX_RANGE_DAYS, exceedsMaxRange } from "../utils/calendar-range";
import { scheduleQueryKeys } from "./schedule-query-keys";
import type { Option, ScheduleSession, ScheduleSessionQuery } from "../types/schedule";

/** What the calendar screen renders, and why it is empty when it is. */
export type ScheduleSessionsViewModel = {
  /** Every session in the window, or an empty list while none is loaded. */
  sessions: ScheduleSession[];
  /** True only before the first answer for the current window arrives. */
  isPending: boolean;
  /** True while any fetch is in flight, including a refresh over shown sessions. */
  isFetching: boolean;
  /** The refusal to show a reader, whether the client or the server produced it. */
  errorMessage: string | null;
  /** Asks the API for this window again, after a failure. */
  retry: () => void;
};

/**
 * Loads every session in one date window, projected and written alike.
 *
 * Both bounds are required, so a `null` query means the screen does not yet know which
 * days it is showing — the calendar reports its own visible span once it has laid
 * itself out — and no request is made until it does. Asking without a window would be
 * refused anyway, and guessing one here would make this hook disagree with the grid.
 *
 * **The 92-day limit is the server's rule** (`SCHEDULE-013`), and it is checked here
 * only so a request certain to be refused is never sent: a window that is too wide
 * short-circuits into the same shape a refusal would produce, with wording that tells
 * the reader what to do about it. The check does not replace the server's — a window
 * that slips through, or any other refusal, is surfaced with the server's own message,
 * because only the server knows why it said no.
 *
 * Previously loaded sessions stay on screen while the next window loads, so stepping
 * through weeks never blanks the grid.
 */
export function useScheduleSessions(
  query: ScheduleSessionQuery | null,
): ScheduleSessionsViewModel {
  const tooWide = query !== null && exceedsMaxRange(query);

  const result = useQuery({
    // The key still needs a value while no window exists; the placeholder is never
    // fetched under, because `skipToken` below is what stops the request.
    queryKey: scheduleQueryKeys.sessions.list(query ?? { from: "", to: "" }),
    // `skipToken` rather than `enabled`, so the absent window narrows the type here
    // instead of being asserted away under a flag TypeScript cannot read.
    queryFn:
      query === null || tooWide ? skipToken : () => fetchScheduleSessions(query),
    placeholderData: (previous) => previous,
  });

  const retry = useCallback(() => {
    void result.refetch();
  }, [result]);

  if (tooWide) {
    return {
      sessions: [],
      isPending: false,
      isFetching: false,
      errorMessage: `Khoảng ngày rộng hơn ${MAX_RANGE_DAYS} ngày nên không xem được một lần. Hãy chọn khoảng hẹp hơn.`,
      retry,
    };
  }

  return {
    sessions: result.data ?? [],
    isPending: query !== null && result.data === undefined && result.error === null,
    isFetching: result.isFetching,
    errorMessage:
      result.error === null
        ? null
        : isApiClientError(result.error)
          ? result.error.message
          : "Không tải được lịch học. Vui lòng thử lại.",
    retry,
  };
}

/**
 * Loads one written session by its identifier.
 *
 * Only a written session has an identifier, so this is never called for a projected
 * one. The calendar itself does not use it: the window read already carries every field
 * a cell or a detail view needs, and the detail endpoint answers with the very same
 * shape, so re-reading one session would cost a round trip for data already on screen.
 * It exists because the phase's read contract has two endpoints and this module is the
 * one place either of them is called from.
 */
export function useScheduleSession(id: number) {
  return useQuery<ScheduleSession>({
    queryKey: scheduleQueryKeys.sessions.detail(id),
    queryFn: () => fetchScheduleSession(id),
  });
}

/**
 * Loads the classes the calendar may be narrowed to.
 *
 * The endpoint lists only classes still running, so a finished class cannot be picked
 * even though the calendar shows its past lessons. That is why the names in a cell come
 * from the session payload and never from this list.
 */
export function useClassOptions(search = "") {
  return useQuery<Option[]>({
    queryKey: scheduleQueryKeys.classOptions(search),
    queryFn: () => fetchClassOptions({ q: search, limit: 50 }),
  });
}
