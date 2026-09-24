"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import { useResourceList, type ResourceListViewModel } from "@/hooks/use-resource-list";

import {
  changeTeacherPassword,
  createTeacher,
  fetchTeacher,
  fetchTeacherOptions,
  fetchTeachers,
  setTeacherAccountActive,
  updateTeacher,
} from "../api";
import { academicQueryKeys } from "./academic-query-keys";
import type { Option, Teacher } from "../types/academic";
import {
  TEACHER_LIST_SORTS,
  TEACHER_LIST_VIEWS,
  TEACHER_TABLE_PAGE_SIZES,
  activeTeacherFilterCount,
  buildTeacherListParams,
  type TeacherFilterState,
  type TeacherListSort,
  type TeacherListView,
} from "../utils/teacher-list-controls";
import type {
  CreateProfileSubmission,
  CreateTeacherRequest,
  TeacherListRequest,
  UpdateTeacherRequest,
} from "../types/academic-requests";

/** The controls and mutations the teacher list view can invoke. */
export type TeacherListViewModel = ResourceListViewModel<Teacher> & {
  filters: TeacherFilterState;
  filterCount: number;
  sort: TeacherListSort;
  view: TeacherListView;
  tablePageSize: number;
  setSubject: (subjectId: number | null) => void;
  setClass: (classId: number | null) => void;
  setAccountActive: (isActive: boolean | null) => void;
  setJoinedFrom: (value: string) => void;
  setJoinedTo: (value: string) => void;
  setSort: (sort: TeacherListSort) => void;
  setView: (view: TeacherListView) => void;
  setTablePageSize: (pageSize: number) => void;
  clearFilters: () => void;
  clearConditions: () => void;
};

/** Loads the teacher directory for the current search, filters, and page. */
export function useTeacherList(): TeacherListViewModel {
  const [controls, setControls] = useQueryStates(
    {
      subject_id: parseAsInteger,
      class_id: parseAsInteger,
      is_active: parseAsBoolean,
      joined_from: parseAsString.withDefault(""),
      joined_to: parseAsString.withDefault(""),
      sort: parseAsStringLiteral(TEACHER_LIST_SORTS).withDefault("newest"),
      view: parseAsStringLiteral(TEACHER_LIST_VIEWS).withDefault("table"),
      per_page: parseAsInteger.withDefault(20),
    },
    { history: "replace", clearOnDefault: true },
  );

  const filters: TeacherFilterState = {
    subjectId: controls.subject_id,
    classId: controls.class_id,
    isActive: controls.is_active,
    joinedFrom: controls.joined_from,
    joinedTo: controls.joined_to,
  };
  const tablePageSize = TEACHER_TABLE_PAGE_SIZES.includes(
    controls.per_page as (typeof TEACHER_TABLE_PAGE_SIZES)[number],
  )
    ? controls.per_page
    : 20;
  const list = useResourceList<Teacher, TeacherListRequest>({
    queryKey: academicQueryKeys.teachers.list,
    fetcher: fetchTeachers,
    emptyMessage: "Chưa có giáo viên nào khớp với điều kiện.",
    extraParams: buildTeacherListParams({ ...filters, sort: controls.sort }),
    perPage: tablePageSize,
  });

  const setSubject = useCallback(
    (subjectId: number | null) => {
      void setControls({ subject_id: subjectId });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  const setClass = useCallback(
    (classId: number | null) => {
      void setControls({ class_id: classId });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  const setAccountActive = useCallback(
    (isActive: boolean | null) => {
      void setControls({ is_active: isActive });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  const setJoinedFrom = useCallback(
    (value: string) => {
      void setControls({ joined_from: value || null });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  const setJoinedTo = useCallback(
    (value: string) => {
      void setControls({ joined_to: value || null });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  const setSort = useCallback(
    (sort: TeacherListSort) => {
      void setControls({ sort: sort === "newest" ? null : sort });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  const setView = useCallback(
    (view: TeacherListView) => {
      void setControls({ view: view === "table" ? null : view });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  const setTablePageSize = useCallback(
    (pageSize: number) => {
      if (!TEACHER_TABLE_PAGE_SIZES.includes(pageSize as (typeof TEACHER_TABLE_PAGE_SIZES)[number])) {
        return;
      }

      void setControls({ per_page: pageSize === 20 ? null : pageSize });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );

  const clearFilters = useCallback(() => {
    void setControls({
      subject_id: null,
      class_id: null,
      is_active: null,
      joined_from: null,
      joined_to: null,
    });
    list.query.setPage(1);
  }, [list.query, setControls]);

  const clearConditions = useCallback(() => {
    list.query.reset();
    void setControls({
      subject_id: null,
      class_id: null,
      is_active: null,
      joined_from: null,
      joined_to: null,
      sort: null,
    });
  }, [list.query, setControls]);

  return {
    ...list,
    filters,
    filterCount: activeTeacherFilterCount(filters),
    sort: controls.sort,
    view: controls.view,
    tablePageSize,
    setSubject,
    setClass,
    setAccountActive,
    setJoinedFrom,
    setJoinedTo,
    setSort,
    setView,
    setTablePageSize,
    clearFilters,
    clearConditions,
  };
}

/**
 * Loads one teacher profile, used by the edit screen to fill its form.
 */
export function useTeacher(id: number) {
  return useQuery({
    queryKey: academicQueryKeys.teachers.detail(id),
    queryFn: () => fetchTeacher(id),
  });
}

/**
 * Loads the teachers a class may be assigned to.
 */
export function useTeacherOptions(search = "") {
  return useQuery<Option[]>({
    queryKey: academicQueryKeys.teachers.options(search),
    queryFn: () => fetchTeacherOptions({ q: search, limit: 50 }),
    // Keeps the previous matches on screen while the next term is in flight, so a
    // picker narrows rather than blanking to a loading line on every keystroke.
    placeholderData: (previous) => previous,
  });
}

/** Load a searchable teacher page including inactive rows for disabled-role hints. */
export function useTeacherPickerOptions(search: string, page: number) {
  const params: TeacherListRequest = {
    q: search.trim(),
    page,
    per_page: 10,
    sort: "full_name",
    direction: "asc",
  };

  return useQuery({
    queryKey: academicQueryKeys.teachers.picker(search, page),
    queryFn: () => fetchTeachers(params),
    placeholderData: (previous) => previous,
  });
}

/**
 * Creates a teacher profile with its login account, then refreshes the list.
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submission: CreateProfileSubmission<CreateTeacherRequest>) => createTeacher(submission),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.teachers.root() });
    },
  });
}

/**
 * Changes a teacher profile and refreshes the list.
 */
export function useUpdateTeacher(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateTeacherRequest) => updateTeacher(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.teachers.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.classes.root() });
    },
  });
}

/**
 * Locks or unlocks a teacher's login account and refreshes the list.
 */
export function useSetTeacherAccountActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setTeacherAccountActive(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.teachers.root() });
    },
  });
}

/**
 * Replaces a teacher's account password. Nothing cached changes, because the list
 * never reports a credential.
 */
export function useChangeTeacherPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      changeTeacherPassword(id, password),
  });
}
