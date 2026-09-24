"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import { useResourceList, type ResourceListViewModel } from "@/hooks/use-resource-list";

import {
  changeClassStatus,
  createClass,
  fetchClass,
  fetchClassOptions,
  fetchClasses,
  updateClass,
} from "../api";
import { academicQueryKeys } from "./academic-query-keys";
import type { ClassStatus, GradeLevel, Option, SchoolClass } from "../types/academic";
import type {
  ClassListRequest,
  CreateClassRequest,
  UpdateClassRequest,
} from "../types/academic-requests";
import { GRADE_LEVELS } from "../utils/labels";
import {
  activeClassFilterCount,
  buildClassListParams,
  CLASS_LIST_SORTS,
  CLASS_LIST_VIEWS,
  CLASS_TABLE_PAGE_SIZES,
  resolveClassPageSize,
  type ClassListSort,
  type ClassListView,
} from "../utils/class-list-controls";

/**
 * Loads the class list for the current search and page.
 */
export type ClassListViewModel = ResourceListViewModel<SchoolClass> & {
  statusFilter: ClassStatus | null;
  gradeFilter: GradeLevel | null;
  filterCount: number;
  sort: ClassListSort;
  view: ClassListView;
  tablePageSize: number;
  setStatusFilter: (value: ClassStatus | null) => void;
  setGradeFilter: (value: GradeLevel | null) => void;
  setSort: (value: ClassListSort) => void;
  setView: (value: ClassListView) => void;
  setTablePageSize: (value: number) => void;
  clearFilters: () => void;
  clearConditions: () => void;
};

/** Load classes with URL-persisted filters, sorting, and table/card controls. */
export function useClassList(): ClassListViewModel {
  const [controls, setControls] = useQueryStates(
    {
      status: parseAsInteger,
      grade: parseAsInteger,
      sort: parseAsStringLiteral(CLASS_LIST_SORTS).withDefault("created-desc"),
      view: parseAsStringLiteral(CLASS_LIST_VIEWS).withDefault("table"),
      per_page: parseAsNumberLiteral(CLASS_TABLE_PAGE_SIZES).withDefault(10),
    },
    { history: "replace", clearOnDefault: true },
  );
  const statusFilter: ClassStatus | null = controls.status === 0 || controls.status === 1 ? controls.status : null;
  const gradeFilter: GradeLevel | null = GRADE_LEVELS.includes(controls.grade as GradeLevel)
    ? controls.grade as GradeLevel
    : null;
  const pageSize = resolveClassPageSize(controls.view, controls.per_page);
  const list = useResourceList<SchoolClass, ClassListRequest>({
    queryKey: academicQueryKeys.classes.list,
    fetcher: fetchClasses,
    emptyMessage: "Chưa có lớp học nào khớp với bộ lọc.",
    extraParams: buildClassListParams({
      status: statusFilter,
      gradeLevel: gradeFilter,
      sort: controls.sort,
    }),
    perPage: pageSize,
  });

  /** Change one filter and return to the first result page. */
  function updateFilter(next: { status?: ClassStatus | null; grade?: GradeLevel | null }): void {
    void setControls(next);
    list.query.setPage(1);
  }

  /** Apply one server-side sort choice and return to the first result page. */
  function setSort(value: ClassListSort): void {
    void setControls({ sort: value === "created-desc" ? null : value });
    list.query.setPage(1);
  }

  /** Change between the table and card layouts without dropping list conditions. */
  function setView(value: ClassListView): void {
    void setControls({ view: value === "table" ? null : value });
    list.query.setPage(1);
  }

  /** Store a table page size; card view always requests twenty classes. */
  function setTablePageSize(value: number): void {
    const next = resolveClassPageSize("table", value);
    void setControls({ per_page: next === 10 ? null : next });
    list.query.setPage(1);
  }

  /** Clear just the filters, leaving search, sort, and view intact. */
  function clearFilters(): void {
    void setControls({ status: null, grade: null });
    list.query.setPage(1);
  }

  /** Clear every active condition while preserving view and page-size preferences. */
  function clearConditions(): void {
    list.query.reset();
    void setControls({ status: null, grade: null, sort: null });
  }

  return {
    ...list,
    statusFilter,
    gradeFilter,
    filterCount: activeClassFilterCount(statusFilter, gradeFilter),
    sort: controls.sort,
    view: controls.view,
    tablePageSize: resolveClassPageSize("table", controls.per_page),
    setStatusFilter: (value) => updateFilter({ status: value }),
    setGradeFilter: (value) => updateFilter({ grade: value }),
    setSort,
    setView,
    setTablePageSize,
    clearFilters,
    clearConditions,
  };
}

/**
 * Loads one class, used by the edit and detail screens.
 */
export function useClass(id: number) {
  return useQuery({
    queryKey: academicQueryKeys.classes.detail(id),
    queryFn: () => fetchClass(id),
  });
}

/**
 * Loads the classes still running, for a transfer target picker.
 */
export function useClassOptions(search = "") {
  return useQuery<Option[]>({
    queryKey: academicQueryKeys.classes.options(search),
    queryFn: () => fetchClassOptions({ q: search, limit: 50 }),
    // Keeps the previous matches on screen while the next term is in flight, so a
    // picker narrows rather than blanking to a loading line on every keystroke.
    placeholderData: (previous) => previous,
  });
}

/**
 * Creates a class and refreshes the list.
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateClassRequest) => createClass(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.classes.root() });
      // A new class changes subject class counts and the teacher's active assignment list.
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.teachers.root() });
    },
  });
}

/**
 * Changes a class and refreshes the list.
 *
 * The student caches go too: a student profile names the classes it attends by
 * code and subject, so moving a class to another subject leaves every enrolled
 * student reporting the old one.
 */
export function useUpdateClass(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateClassRequest) => updateClass(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.classes.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.classesRoot() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.historyRoot() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.teachers.root() });
    },
  });
}

/**
 * Moves a class between the running and finished states.
 *
 * Finishing a class closes every enrolment it still has, so the roster caches are
 * refreshed alongside the class itself, as is the subject list whose running-class
 * counts have just changed.
 *
 * The student caches are refreshed for the same reason as the rosters: closing the
 * enrolments takes the class out of every enrolled student's current classes, and
 * a cached student list would otherwise keep presenting a finished class as one
 * they still attend.
 */
export function useChangeClassStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ClassStatus }) =>
      changeClassStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.classes.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.enrollments.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.classesRoot() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.historyRoot() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.teachers.root() });
    },
  });
}
