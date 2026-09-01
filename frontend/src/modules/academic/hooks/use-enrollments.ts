"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useResourceList, type ResourceListViewModel } from "@/hooks/use-resource-list";

import {
  enrolStudents,
  fetchAvailableStudents,
  fetchEnrollments,
  leaveClass,
  transferEnrollment,
  updateEnrollment,
} from "../api/academic-client-api";
import { academicQueryKeys } from "./academic-query-keys";
import type { Enrollment, Student } from "../types/academic";

/**
 * Loads one class roster for the current search and page, including the periods
 * students have already left.
 */
export function useEnrollmentList(classId: number): ResourceListViewModel<Enrollment> {
  return useResourceList<Enrollment>({
    queryKey: (params) => academicQueryKeys.enrollments.list(classId, params),
    fetcher: (params) => fetchEnrollments(classId, params),
    emptyMessage: "Lớp chưa có học sinh nào.",
  });
}

/**
 * Loads the students who may still be added to one class.
 *
 * This has its own paging separate from the roster's, because it is browsed inside
 * a dialog while the roster stays where it was underneath.
 */
export function useAvailableStudents(classId: number, search: string, page: number) {
  const params = { q: search, page, per_page: 10 };

  return useQuery({
    queryKey: academicQueryKeys.enrollments.available(classId, params),
    queryFn: () => fetchAvailableStudents(classId, params),
    placeholderData: (previous) => previous,
  });
}

/** Refreshes everything one enrolment change can affect. */
function useEnrollmentInvalidation() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: academicQueryKeys.enrollments.root() });
    // A class carries its own headcount, so its list and detail are stale too.
    void queryClient.invalidateQueries({ queryKey: academicQueryKeys.classes.root() });
  };
}

/**
 * Enrols one or more students into a class.
 */
export function useEnrolStudents(classId: number) {
  const invalidate = useEnrollmentInvalidation();

  return useMutation<Enrollment[], unknown, unknown>({
    mutationFn: (body: unknown) => enrolStudents(classId, body),
    onSuccess: invalidate,
  });
}

/**
 * Corrects the dates or note on one enrolment.
 */
export function useUpdateEnrollment() {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) => updateEnrollment(id, body),
    onSuccess: invalidate,
  });
}

/**
 * Moves a student to another class of the same subject.
 */
export function useTransferEnrollment() {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) => transferEnrollment(id, body),
    onSuccess: invalidate,
  });
}

/**
 * Ends a student's membership of a class.
 */
export function useLeaveClass() {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) => leaveClass(id, body),
    onSuccess: invalidate,
  });
}

/** Re-exported so the roster dialog can type the students it lists. */
export type AvailableStudent = Student;
