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
  type EnrollmentListParams,
  type StudentListParams,
} from "../api";
import { academicQueryKeys } from "./academic-query-keys";
import type { Enrollment, Student } from "../types/academic";
import type {
  EnrolStudentsRequest,
  LeaveClassRequest,
  TransferEnrollmentRequest,
  UpdateEnrollmentRequest,
} from "../types/academic-requests";

/**
 * Loads one class roster for the current search and page, including the periods
 * students have already left.
 */
export function useEnrollmentList(classId: number): ResourceListViewModel<Enrollment> {
  return useResourceList<Enrollment, EnrollmentListParams>({
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
  const params: StudentListParams = { q: search, page, per_page: 10 };

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
    // A student reports the classes they currently attend, so enrolling, transferring,
    // or ending a membership changes what the student list shows about them. Without
    // this, that column serves the pre-change answer for as long as the query stays
    // fresh. The account toggle already invalidates enrolments for the mirror-image
    // reason.
    void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.root() });
  };
}

/**
 * Enrols one or more students into a class.
 */
export function useEnrolStudents(classId: number) {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: (body: EnrolStudentsRequest) => enrolStudents(classId, body),
    onSuccess: invalidate,
  });
}

/**
 * Corrects the dates or note on one enrolment.
 */
export function useUpdateEnrollment() {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateEnrollmentRequest }) =>
      updateEnrollment(id, body),
    onSuccess: invalidate,
  });
}

/**
 * Moves a student to another class of the same subject.
 */
export function useTransferEnrollment() {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: TransferEnrollmentRequest }) =>
      transferEnrollment(id, body),
    onSuccess: invalidate,
  });
}

/**
 * Ends a student's membership of a class.
 */
export function useLeaveClass() {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: LeaveClassRequest }) => leaveClass(id, body),
    onSuccess: invalidate,
  });
}

/** Re-exported so the roster dialog can type the students it lists. */
export type AvailableStudent = Student;
