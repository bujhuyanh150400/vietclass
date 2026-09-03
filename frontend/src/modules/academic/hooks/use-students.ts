"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsNumberLiteral,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import { useResourceList, type ResourceListViewModel } from "@/hooks/use-resource-list";

import {
  changeStudentPassword,
  createStudent,
  fetchStudent,
  fetchStudents,
  setStudentAccountActive,
  updateStudent,
  type StudentListParams,
} from "../api";
import { academicQueryKeys } from "./academic-query-keys";
import type { GradeLevel, Student, StudentStatus } from "../types/academic";
import type {
  CreateStudentRequest,
  UpdateStudentRequest,
} from "../types/academic-requests";
import { GRADE_LEVELS } from "../utils/labels";
import {
  STUDENT_LIST_SORTS,
  STUDENT_LIST_VIEWS,
  STUDENT_TABLE_PAGE_SIZES,
  activeStudentFilterCount,
  buildStudentListParams,
  resolveStudentPageSize,
  type StudentFilterState,
  type StudentListSort,
  type StudentListView,
} from "../utils/student-list-controls";

/** Every study status accepted by the student list endpoint. */
const STUDENT_STATUSES = [0, 1, 2] as const;

/** The controls and mutations the student list view can invoke. */
export type StudentListViewModel = ResourceListViewModel<Student> & {
  filters: StudentFilterState;
  filterCount: number;
  sort: StudentListSort;
  view: StudentListView;
  tablePageSize: number;
  toggleGradeLevel: (gradeLevel: GradeLevel) => void;
  toggleStatus: (status: StudentStatus) => void;
  setAccountActive: (isActive: boolean | null) => void;
  setSort: (sort: StudentListSort) => void;
  setView: (view: StudentListView) => void;
  setTablePageSize: (pageSize: number) => void;
  clearFilters: () => void;
  clearConditions: () => void;
};

/**
 * Loads the student list for the current search and page.
 */
export function useStudentList(): StudentListViewModel {
  const [controls, setControls] = useQueryStates(
    {
      grade_level: parseAsArrayOf(parseAsNumberLiteral(GRADE_LEVELS)).withDefault([]),
      status: parseAsArrayOf(parseAsNumberLiteral(STUDENT_STATUSES)).withDefault([]),
      is_active: parseAsBoolean,
      sort: parseAsStringLiteral(STUDENT_LIST_SORTS).withDefault("newest"),
      view: parseAsStringLiteral(STUDENT_LIST_VIEWS).withDefault("table"),
      per_page: parseAsNumberLiteral(STUDENT_TABLE_PAGE_SIZES).withDefault(20),
    },
    { history: "replace", clearOnDefault: true },
  );

  const filters: StudentFilterState = {
    gradeLevels: controls.grade_level,
    statuses: controls.status,
    isActive: controls.is_active,
  };
  const pageSize = resolveStudentPageSize(controls.view, controls.per_page);
  const list = useResourceList<Student, StudentListParams>({
    queryKey: academicQueryKeys.students.list,
    fetcher: fetchStudents,
    emptyMessage: "Chưa có học sinh nào khớp với tìm kiếm.",
    extraParams: buildStudentListParams({ ...filters, sort: controls.sort }),
    perPage: pageSize,
  });

  /** Toggles one grade filter and returns the collection to its first page. */
  const toggleGradeLevel = useCallback(
    (gradeLevel: GradeLevel) => {
      const next = controls.grade_level.includes(gradeLevel)
        ? controls.grade_level.filter((value) => value !== gradeLevel)
        : [...controls.grade_level, gradeLevel].sort((left, right) => left - right);

      void setControls({ grade_level: next.length === 0 ? null : next });
      list.query.setPage(1);
    },
    [controls.grade_level, list.query, setControls],
  );

  /** Toggles one study-status filter and returns the collection to its first page. */
  const toggleStatus = useCallback(
    (status: StudentStatus) => {
      const next = controls.status.includes(status)
        ? controls.status.filter((value) => value !== status)
        : [...controls.status, status].sort((left, right) => left - right);

      void setControls({ status: next.length === 0 ? null : next });
      list.query.setPage(1);
    },
    [controls.status, list.query, setControls],
  );

  /** Applies or clears the account-state filter immediately. */
  const setAccountActive = useCallback(
    (isActive: boolean | null) => {
      void setControls({ is_active: isActive });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  /** Applies one sort choice immediately and returns to the first page. */
  const setSort = useCallback(
    (sort: StudentListSort) => {
      void setControls({ sort: sort === "newest" ? null : sort });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  /** Switches the collection layout while keeping every active condition. */
  const setView = useCallback(
    (view: StudentListView) => {
      void setControls({ view: view === "table" ? null : view });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  /** Stores the preferred table page size and returns to the first page. */
  const setTablePageSize = useCallback(
    (requestedPageSize: number) => {
      const next = resolveStudentPageSize("table", requestedPageSize);
      void setControls({ per_page: next === 20 ? null : next });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  /** Clears student filters without changing keyword, sort, view, or table density. */
  const clearFilters = useCallback(() => {
    void setControls({ grade_level: null, status: null, is_active: null });
    list.query.setPage(1);
  }, [list.query, setControls]);

  /** Clears keyword, filters, and sort while preserving view and table density. */
  const clearConditions = useCallback(() => {
    list.query.reset();
    void setControls({
      grade_level: null,
      status: null,
      is_active: null,
      sort: null,
    });
  }, [list.query, setControls]);

  return {
    ...list,
    filters,
    filterCount: activeStudentFilterCount(filters),
    sort: controls.sort,
    view: controls.view,
    tablePageSize: controls.per_page,
    toggleGradeLevel,
    toggleStatus,
    setAccountActive,
    setSort,
    setView,
    setTablePageSize,
    clearFilters,
    clearConditions,
  };
}

/**
 * Loads one student profile, used by the edit screen to fill its form.
 */
export function useStudent(id: number) {
  return useQuery({
    queryKey: academicQueryKeys.students.detail(id),
    queryFn: () => fetchStudent(id),
  });
}

/**
 * Creates a student profile with its login account, then refreshes the list.
 */
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateStudentRequest) => createStudent(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.root() });
    },
  });
}

/**
 * Changes a student profile and refreshes the list.
 */
export function useUpdateStudent(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateStudentRequest) => updateStudent(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.root() });
    },
  });
}

/**
 * Locks or unlocks a student's login account.
 *
 * The enrolment caches are refreshed too, because a locked account is one the class
 * roster may no longer offer as available to add.
 */
export function useSetStudentAccountActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setStudentAccountActive(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.enrollments.root() });
    },
  });
}

/**
 * Replaces a student's account password.
 */
export function useChangeStudentPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      changeStudentPassword(id, password),
  });
}
