"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { parseAsBoolean, parseAsNumberLiteral, parseAsStringLiteral, useQueryStates } from "nuqs";

import { useResourceList, type ResourceListViewModel } from "@/hooks/use-resource-list";

import {
  createSubject,
  deleteSubject,
  fetchSubject,
  fetchSubjectOptions,
  fetchSubjects,
  setSubjectActive,
  updateSubject,
  type SubjectListParams,
} from "../api";
import { academicQueryKeys } from "./academic-query-keys";
import type { GradeLevel, Option, Subject } from "../types/academic";
import type { SubjectRequest } from "../types/academic-requests";
import { GRADE_LEVELS } from "../utils/labels";
import {
  SUBJECT_LIST_SORTS,
  SUBJECT_LIST_VIEWS,
  SUBJECT_TABLE_PAGE_SIZES,
  activeSubjectFilterCount,
  buildSubjectListParams,
  type SubjectFilterState,
  type SubjectListSort,
  type SubjectListView,
} from "../utils/subject-list-controls";

/** List data plus the URL-backed catalogue controls. */
export type SubjectListViewModel = ResourceListViewModel<Subject> & {
  filters: SubjectFilterState;
  filterCount: number;
  sort: SubjectListSort;
  view: SubjectListView;
  tablePageSize: number;
  setGradeLevel: (gradeLevel: GradeLevel | null) => void;
  setActive: (isActive: boolean | null) => void;
  setSort: (sort: SubjectListSort) => void;
  setView: (view: SubjectListView) => void;
  setTablePageSize: (pageSize: number) => void;
  clearFilters: () => void;
  clearConditions: () => void;
};

/**
 * Loads the subject list for the current search and page.
 */
export function useSubjectList(): SubjectListViewModel {
  const [controls, setControls] = useQueryStates({
    grade_level: parseAsNumberLiteral(GRADE_LEVELS),
    is_active: parseAsBoolean,
    sort: parseAsStringLiteral(SUBJECT_LIST_SORTS).withDefault("newest"),
    view: parseAsStringLiteral(SUBJECT_LIST_VIEWS).withDefault("table"),
    per_page: parseAsNumberLiteral(SUBJECT_TABLE_PAGE_SIZES).withDefault(10),
  }, { history: "replace", clearOnDefault: true });
  const filters: SubjectFilterState = { gradeLevel: controls.grade_level, isActive: controls.is_active };
  const list = useResourceList<Subject, SubjectListParams>({
    queryKey: academicQueryKeys.subjects.list,
    fetcher: fetchSubjects,
    emptyMessage: "Chưa có môn học nào khớp với tìm kiếm.",
    extraParams: buildSubjectListParams({ ...filters, sort: controls.sort }),
    perPage: controls.per_page,
  });

  /** Updates a filter and returns the reader to the first result page. */
  const setGradeLevel = useCallback((gradeLevel: GradeLevel | null) => {
    void setControls({ grade_level: gradeLevel });
    list.query.setPage(1);
  }, [list.query, setControls]);
  const setActive = useCallback((isActive: boolean | null) => {
    void setControls({ is_active: isActive });
    list.query.setPage(1);
  }, [list.query, setControls]);
  const setSort = useCallback((sort: SubjectListSort) => {
    void setControls({ sort: sort === "newest" ? null : sort });
    list.query.setPage(1);
  }, [list.query, setControls]);
  const setView = useCallback((view: SubjectListView) => {
    void setControls({ view: view === "table" ? null : view });
  }, [setControls]);
  const setTablePageSize = useCallback((pageSize: number) => {
    if (!SUBJECT_TABLE_PAGE_SIZES.includes(pageSize as (typeof SUBJECT_TABLE_PAGE_SIZES)[number])) return;
    void setControls({ per_page: pageSize === 10 ? null : pageSize as (typeof SUBJECT_TABLE_PAGE_SIZES)[number] });
    list.query.setPage(1);
  }, [list.query, setControls]);
  const clearFilters = useCallback(() => {
    void setControls({ grade_level: null, is_active: null });
    list.query.setPage(1);
  }, [list.query, setControls]);
  const clearConditions = useCallback(() => {
    list.query.reset();
    void setControls({ grade_level: null, is_active: null, sort: null });
  }, [list.query, setControls]);

  return {
    ...list,
    filters,
    filterCount: activeSubjectFilterCount(filters),
    sort: controls.sort,
    view: controls.view,
    tablePageSize: controls.per_page,
    setGradeLevel,
    setActive,
    setSort,
    setView,
    setTablePageSize,
    clearFilters,
    clearConditions,
  };
}

/**
 * Loads one subject, used by the edit screen to fill its form.
 */
export function useSubject(id: number) {
  return useQuery({
    queryKey: academicQueryKeys.subjects.detail(id),
    queryFn: () => fetchSubject(id),
  });
}

/**
 * Loads the subjects a class may be assigned to.
 */
export function useSubjectOptions(search = "") {
  return useQuery<Option[]>({
    queryKey: academicQueryKeys.subjects.options(search),
    queryFn: () => fetchSubjectOptions({ q: search, limit: 50 }),
    // Keeps the previous matches on screen while the next term is in flight, so a
    // picker narrows rather than blanking to a loading line on every keystroke.
    placeholderData: (previous) => previous,
  });
}

/**
 * Creates a subject and refreshes every cached page of the list.
 */
export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SubjectRequest) => createSubject(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
    },
  });
}

/**
 * Changes a subject and refreshes every cached page of the list.
 *
 * The class and student caches are refreshed too, because both name a class by its
 * subject: renaming one here would otherwise leave the old name printed on class
 * rows and on the classes listed against each student.
 */
export function useUpdateSubject(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SubjectRequest) => updateSubject(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.classes.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.root() });
    },
  });
}

/**
 * Locks or unlocks a subject. The list is refreshed rather than patched in place,
 * because the running-class count shown beside each subject is decided by the API.
 */
export function useSetSubjectActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setSubjectActive(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
    },
  });
}

/**
 * Removes a subject and refreshes every cached page of the list.
 */
export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSubject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
    },
  });
}
