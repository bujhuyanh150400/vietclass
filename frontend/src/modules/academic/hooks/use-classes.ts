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
 */
export function useUpdateClass(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateClassRequest) => updateClass(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.classes.root() });
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
    },
  });
}

/**
 * Moves a class between the running and finished states.
 *
 * Finishing a class closes every enrolment it still has, so the roster caches are
 * refreshed alongside the class itself, as is the subject list whose running-class
 * counts have just changed.
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
    },
  });
}
