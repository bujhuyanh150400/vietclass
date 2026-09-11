"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useResourceList, type ResourceListViewModel } from "@/hooks/use-resource-list";

import {
  changeClassStatus,
  createClass,
  fetchClass,
  fetchClassOptions,
  fetchClasses,
  updateClass,
  type ClassListParams,
} from "../api";
import { academicQueryKeys } from "./academic-query-keys";
import type { ClassStatus, Option, SchoolClass } from "../types/academic";
import type {
  CreateClassRequest,
  UpdateClassRequest,
} from "../types/academic-requests";

/**
 * Loads the class list for the current search and page.
 */
export function useClassList(): ResourceListViewModel<SchoolClass> {
  return useResourceList<SchoolClass, ClassListParams>({
    queryKey: academicQueryKeys.classes.list,
    fetcher: fetchClasses,
    emptyMessage: "Chưa có lớp học nào khớp với tìm kiếm.",
  });
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
      // A new class changes how many running classes teach its subject, which is
      // what decides whether that subject can still be locked.
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
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
    },
  });
}
