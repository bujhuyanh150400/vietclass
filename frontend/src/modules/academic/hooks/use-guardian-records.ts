"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { parseAsNumberLiteral, parseAsStringLiteral, useQueryStates } from "nuqs";

import { useResourceList, type ResourceListViewModel } from "@/hooks/use-resource-list";

import {
  createGuardian,
  deleteGuardian,
  fetchGuardian,
  fetchGuardians,
  fetchGuardianOptions,
  updateGuardian,
  type GuardianListParams,
} from "../api/guardians-api";
import type { DeleteGuardianRequest, GuardianRequest } from "../types/academic-requests";
import type { Guardian, Student } from "../types/academic";
import {
  buildGuardianListParams,
  buildGuardianStudentFetchPlan,
  GUARDIAN_OPTION_LIMIT,
  type GuardianListSort,
  type GuardianListView,
} from "../utils/guardian-list-controls";
import { fetchStudent, fetchStudents } from "../api/students-api";
import { academicQueryKeys } from "./academic-query-keys";

/** Exposes guardian list records together with ListSheet-compatible controls. */
export type GuardianListViewModel = ResourceListViewModel<Guardian> & {
  sort: GuardianListSort;
  view: GuardianListView;
  setSort: (sort: GuardianListSort) => void;
  setView: (view: GuardianListView) => void;
  clearConditions: () => void;
};

/** Loads the guardian list and keeps search, sort, view, and paging in the URL. */
export function useGuardianRecords(): GuardianListViewModel {
  const [controls, setControls] = useQueryStates({
    sort: parseAsStringLiteral(["newest", "date-asc", "name-asc", "name-desc"] as const).withDefault("newest"),
    view: parseAsStringLiteral(["table", "grid"] as const).withDefault("table"),
    per_page: parseAsNumberLiteral([20, 50, 100, 200] as const).withDefault(20),
  }, { history: "replace", clearOnDefault: true });
  const list = useResourceList<Guardian, GuardianListParams>({
    queryKey: academicQueryKeys.guardians.list,
    fetcher: fetchGuardians,
    emptyMessage: "Chưa có hồ sơ phụ huynh phù hợp.",
    extraParams: buildGuardianListParams({ sort: controls.sort }),
    perPage: controls.per_page,
  });
  const setSort = useCallback((sort: GuardianListSort) => {
    void setControls({ sort: sort === "newest" ? null : sort });
    list.query.setPage(1);
  }, [list.query, setControls]);
  const setView = useCallback((view: GuardianListView) => {
    void setControls({ view: view === "table" ? null : view });
    list.query.setPage(1);
  }, [list.query, setControls]);
  const clearConditions = useCallback(() => {
    list.query.reset();
    void setControls({ sort: null });
  }, [list.query, setControls]);

  return { ...list, sort: controls.sort, view: controls.view, setSort, setView, clearConditions };
}

/** Loads one guardian detail record. */
export function useGuardianRecord(id: number) {
  return useQuery({
    queryKey: academicQueryKeys.guardians.detail(id),
    queryFn: () => fetchGuardian(id),
    enabled: id > 0,
  });
}

/** Loads student records for selecting guardian roster links. */
export function useStudentOptions(linkedStudentIds: readonly number[] = []) {
  const fetchPlan = buildGuardianStudentFetchPlan(linkedStudentIds);

  return useQuery({
    queryKey: ["academic", "students", "guardian-options", fetchPlan] as const,
    queryFn: async (): Promise<Student[]> => fetchPlan.length > 0
      ? Promise.all(fetchPlan.map((id) => fetchStudent(id)))
      : (await fetchStudents({ per_page: 200 })).data,
  });
}

/** Loads existing guardian choices for replacement selection. */
export function useGuardianOptions() {
  return useQuery({
    queryKey: academicQueryKeys.guardians.options("all"),
    queryFn: () => fetchGuardianOptions({ limit: GUARDIAN_OPTION_LIMIT }),
  });
}

/** Creates a guardian and invalidates all dependent academic roots. */
export function useCreateGuardian() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GuardianRequest) => createGuardian(body),
    onSuccess: () => invalidateGuardianRoots(queryClient),
  });
}

/** Updates a guardian and invalidates all dependent academic roots. */
export function useUpdateGuardian(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GuardianRequest) => updateGuardian(id, body),
    onSuccess: () => invalidateGuardianRoots(queryClient),
  });
}

/** Deletes a guardian and invalidates all dependent academic roots. */
export function useDeleteGuardian(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DeleteGuardianRequest) => deleteGuardian(id, body),
    onSuccess: () => invalidateGuardianRoots(queryClient),
  });
}

/** Invalidate guardian, student, and option summaries after a roster mutation. */
function invalidateGuardianRoots(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: academicQueryKeys.guardians.root() });
  void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.root() });
}
