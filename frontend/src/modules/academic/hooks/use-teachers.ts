"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changeTeacherPassword,
  createTeacher,
  fetchTeacher,
  fetchTeacherOptions,
  fetchTeachers,
  setTeacherAccountActive,
  updateTeacher,
} from "../api/academic-client-api";
import { academicQueryKeys } from "./academic-query-keys";
import { useResourceList, type ResourceListViewModel } from "./use-resource-list";
import type { Option, Teacher } from "../types/academic";

/**
 * Loads the teacher list for the current search and page.
 */
export function useTeacherList(): ResourceListViewModel<Teacher> {
  return useResourceList<Teacher>({
    queryKey: academicQueryKeys.teachers.list,
    fetcher: fetchTeachers,
    emptyMessage: "Chưa có giáo viên nào khớp với tìm kiếm.",
  });
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
  });
}

/**
 * Creates a teacher profile with its login account, then refreshes the list.
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: unknown) => createTeacher(body),
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
    mutationFn: (body: unknown) => updateTeacher(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.teachers.root() });
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
