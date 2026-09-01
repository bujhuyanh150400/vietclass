"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useResourceList, type ResourceListViewModel } from "@/hooks/use-resource-list";

import {
  changeStudentPassword,
  createStudent,
  fetchStudent,
  fetchStudents,
  setStudentAccountActive,
  updateStudent,
} from "../api/academic-client-api";
import { academicQueryKeys } from "./academic-query-keys";
import type { Student } from "../types/academic";

/**
 * Loads the student list for the current search and page.
 */
export function useStudentList(): ResourceListViewModel<Student> {
  return useResourceList<Student>({
    queryKey: academicQueryKeys.students.list,
    fetcher: fetchStudents,
    emptyMessage: "Chưa có học sinh nào khớp với tìm kiếm.",
  });
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
    mutationFn: (body: unknown) => createStudent(body),
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
    mutationFn: (body: unknown) => updateStudent(id, body),
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
