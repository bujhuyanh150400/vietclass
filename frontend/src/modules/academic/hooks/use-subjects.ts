"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSubject,
  deleteSubject,
  fetchSubject,
  fetchSubjectOptions,
  fetchSubjects,
  setSubjectActive,
  updateSubject,
} from "../api/academic-client-api";
import { academicQueryKeys } from "./academic-query-keys";
import { useResourceList, type ResourceListViewModel } from "./use-resource-list";
import type { Option, Subject } from "../types/academic";

/**
 * Loads the subject list for the current search and page.
 */
export function useSubjectList(): ResourceListViewModel<Subject> {
  return useResourceList<Subject>({
    queryKey: academicQueryKeys.subjects.list,
    fetcher: fetchSubjects,
    emptyMessage: "Chưa có môn học nào khớp với tìm kiếm.",
  });
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
  });
}

/**
 * Creates a subject and refreshes every cached page of the list.
 */
export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: unknown) => createSubject(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
    },
  });
}

/**
 * Changes a subject and refreshes every cached page of the list.
 */
export function useUpdateSubject(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: unknown) => updateSubject(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.subjects.root() });
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
