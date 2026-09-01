"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { DataTableState } from "@/components/shared/data-table";
import { isApiClientError } from "@/lib/api/api-client-error";

import {
  closeScheduleTemplate,
  createScheduleTemplate,
  deleteScheduleTemplate,
  fetchRoomOptions,
  fetchScheduleTemplates,
  fetchTeacherOptions,
  reviseScheduleTemplate,
  setScheduleTemplateTeachers,
} from "../api/schedule-client-api";
import { scheduleQueryKeys } from "./schedule-query-keys";
import type { Option, ScheduleTemplate } from "../types/schedule";

/** What the fixed-schedule table renders, and whether a background refresh is running. */
export type ScheduleTemplateListViewModel = {
  state: DataTableState<ScheduleTemplate>;
  isFetching: boolean;
};

/**
 * Loads every fixed schedule of one class and collapses the four states a list can
 * be in into the single value the table renders.
 *
 * There is no paging, no search, and no page state in the URL, because the API
 * answers this endpoint with a whole collection and no `meta`: a class has a
 * handful of weekly slots, and the weekday-then-time order is worth more than
 * cutting it into pages would be. That is why this does not use the shared
 * `useResourceList`, which is built for a paginated endpoint.
 */
export function useScheduleTemplateList(classId: number): ScheduleTemplateListViewModel {
  const query = useQuery({
    queryKey: scheduleQueryKeys.templates.list(classId),
    queryFn: () => fetchScheduleTemplates(classId),
    placeholderData: (previous) => previous,
  });

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    isFetching: query.isFetching,
    state: toState(query.data, query.isPending, query.error, refetch),
  };
}

/**
 * Chooses which of the four list states applies, preferring already-loaded rows so
 * a background refresh never blanks the table.
 */
function toState(
  rows: ScheduleTemplate[] | undefined,
  isPending: boolean,
  error: unknown,
  onRetry: () => void,
): DataTableState<ScheduleTemplate> {
  if (rows !== undefined) {
    return rows.length === 0
      ? { kind: "empty", message: "Lớp này chưa khai lịch cố định nào." }
      : { kind: "content", rows };
  }

  if (isPending) {
    return { kind: "loading" };
  }

  return {
    kind: "error",
    message: isApiClientError(error)
      ? error.message
      : "Không tải được lịch cố định. Vui lòng thử lại.",
    onRetry,
  };
}

/**
 * Loads the active rooms a slot may be placed in.
 */
export function useRoomOptions(search = "") {
  return useQuery<Option[]>({
    queryKey: scheduleQueryKeys.roomOptions(search),
    queryFn: () => fetchRoomOptions({ q: search, limit: 50 }),
  });
}

/**
 * Loads the working teachers a slot may be staffed with, in either role.
 */
export function useTeacherOptions(search = "") {
  return useQuery<Option[]>({
    queryKey: scheduleQueryKeys.teacherOptions(search),
    queryFn: () => fetchTeacherOptions({ q: search, limit: 50 }),
  });
}

/**
 * Opens a weekly slot for a class and refreshes every cached schedule list.
 */
export function useCreateScheduleTemplate(classId: number) {
  const invalidate = useInvalidateScheduleTemplates();

  return useMutation({
    mutationFn: (body: unknown) => createScheduleTemplate(classId, body),
    onSuccess: invalidate,
  });
}

/**
 * Revises a slot, which closes the running version and opens a new one, then
 * refreshes the lists so both rows appear.
 */
export function useReviseScheduleTemplate() {
  const invalidate = useInvalidateScheduleTemplates();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) => reviseScheduleTemplate(id, body),
    onSuccess: invalidate,
  });
}

/**
 * Replaces a slot's whole teacher list and refreshes every cached schedule list.
 */
export function useSetScheduleTemplateTeachers() {
  const invalidate = useInvalidateScheduleTemplates();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) =>
      setScheduleTemplateTeachers(id, body),
    onSuccess: invalidate,
  });
}

/**
 * Closes a slot on a given last day and refreshes every cached schedule list.
 */
export function useCloseScheduleTemplate() {
  const invalidate = useInvalidateScheduleTemplates();

  return useMutation({
    mutationFn: ({ id, endDate }: { id: number; endDate: string }) =>
      closeScheduleTemplate(id, endDate),
    onSuccess: invalidate,
  });
}

/**
 * Removes a slot that has not started applying yet and refreshes the lists.
 */
export function useDeleteScheduleTemplate() {
  const invalidate = useInvalidateScheduleTemplates();

  return useMutation({
    mutationFn: (id: number) => deleteScheduleTemplate(id),
    onSuccess: invalidate,
  });
}

/**
 * Returns the refresh every schedule mutation performs, so the five of them cannot
 * drift apart on what a successful write invalidates.
 */
function useInvalidateScheduleTemplates(): () => Promise<void> {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: scheduleQueryKeys.templates.root(),
      refetchType: "all",
    });
  }, [queryClient]);
}
