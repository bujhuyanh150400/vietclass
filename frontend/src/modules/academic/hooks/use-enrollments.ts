"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryStates } from "nuqs";

import { useResourceList, type ResourceListViewModel } from "@/hooks/use-resource-list";

import {
  enrolStudents,
  fetchAvailableStudents,
  fetchEnrollmentStudentOptions,
  fetchEnrollments,
  fetchTransferOptions,
  leaveClass,
  transferEnrollment,
  updateEnrollment,
} from "../api";
import { academicQueryKeys } from "./academic-query-keys";
import type { Enrollment, Student } from "../types/academic";
import type {
  AvailableStudentListRequest,
  EnrolStudentsRequest,
  EnrollmentListRequest,
  EnrollmentStudentOptionsRequest,
  LeaveClassRequest,
  TransferEnrollmentRequest,
  TransferOptionsRequest,
  UpdateEnrollmentRequest,
} from "../types/academic-requests";

/** Load one class roster page for either currently active or already-left periods. */
export function useEnrollmentList(
  classId: number,
  rosterTab: "current" | "past" = "current",
): ResourceListViewModel<Enrollment> & { hasNote: boolean; setHasNote: (value: boolean) => void } {
  const [filters, setFilters] = useQueryStates(
    { notes: parseAsStringLiteral(["all", "noted"] as const).withDefault("all") },
    { history: "replace", clearOnDefault: true },
  );
  const noteFilter = filters.notes;
  const extraParams: Pick<EnrollmentListRequest, "active_only" | "left_only" | "has_note"> = {
    ...(rosterTab === "current" ? { active_only: 1 as const } : { left_only: 1 as const }),
    ...(noteFilter === "noted" ? { has_note: 1 as const } : {}),
  };
  const list = useResourceList<Enrollment, EnrollmentListRequest>({
    queryKey: (params) => academicQueryKeys.enrollments.list(classId, params),
    fetcher: (params) => fetchEnrollments(classId, params),
    emptyMessage: noteFilter === "noted"
      ? "Không có bản ghi ghi danh nào có ghi chú."
      : rosterTab === "current" ? "Lớp chưa có học sinh nào." : "Chưa có học sinh rời lớp.",
    extraParams,
  });

  return {
    ...list,
    hasNote: noteFilter === "noted",
    setHasNote: (value) => void setFilters({ notes: value ? "noted" : null }),
  };
}

/** Load the legacy eligible-only list, kept for callers that still use that contract. */
export function useAvailableStudents(classId: number, search: string, page: number) {
  const params: AvailableStudentListRequest = { q: search, page, per_page: 10 };

  return useQuery({
    queryKey: academicQueryKeys.enrollments.available(classId, params),
    queryFn: () => fetchAvailableStudents(classId, params),
    placeholderData: (previous) => previous,
  });
}

/** Load one paginated add-student page with ineligible rows and explicit reasons. */
export function useEnrollmentStudentOptions(classId: number, search: string, page: number) {
  const params: EnrollmentStudentOptionsRequest = { q: search, page, per_page: 10 };

  return useQuery({
    queryKey: academicQueryKeys.enrollments.studentOptions(classId, params),
    queryFn: () => fetchEnrollmentStudentOptions(classId, params),
    placeholderData: (previous) => previous,
  });
}

/** Load one paginated transfer destination page with current eligibility reasons. */
export function useTransferOptions(enrollmentId: number, search: string, page: number) {
  const params: TransferOptionsRequest = { q: search, page, per_page: 10 };

  return useQuery({
    queryKey: academicQueryKeys.enrollments.transferOptions(enrollmentId, params),
    queryFn: () => fetchTransferOptions(enrollmentId, params),
    placeholderData: (previous) => previous,
  });
}

/** Refresh every class, roster, student-class list, and history query a mutation may affect. */
function useEnrollmentInvalidation() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: academicQueryKeys.enrollments.root() });
    void queryClient.invalidateQueries({ queryKey: academicQueryKeys.classes.root() });
    void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.root() });
    void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.classesRoot() });
    void queryClient.invalidateQueries({ queryKey: academicQueryKeys.students.historyRoot() });
  };
}

/** Enrol one or more students into a class. */
export function useEnrolStudents(classId: number) {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: (body: EnrolStudentsRequest) => enrolStudents(classId, body),
    onSuccess: invalidate,
  });
}

/** Correct the dates or note on one enrollment. */
export function useUpdateEnrollment() {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateEnrollmentRequest }) =>
      updateEnrollment(id, body),
    onSuccess: invalidate,
  });
}

/** Move a student to another class of the same grade and complete subject set. */
export function useTransferEnrollment() {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: TransferEnrollmentRequest }) =>
      transferEnrollment(id, body),
    onSuccess: invalidate,
  });
}

/** End a student's membership of a class. */
export function useLeaveClass() {
  const invalidate = useEnrollmentInvalidation();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: LeaveClassRequest }) => leaveClass(id, body),
    onSuccess: invalidate,
  });
}

/** Re-export the legacy picker row type for the existing eligible-only contract. */
export type AvailableStudent = Student;
