"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
import type { Option, Subject } from "../types/academic";
import type { SubjectRequest } from "../types/academic-requests";

/**
 * Loads the subject list for the current search and page.
 */
export function useSubjectList(): ResourceListViewModel<Subject> {
  return useResourceList<Subject, SubjectListParams>({
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
