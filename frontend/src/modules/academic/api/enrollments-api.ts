import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { StudentListParams } from "./students-api";
import type { Enrollment, Student } from "../types/academic";
import type {
  EnrolStudentsRequest,
  LeaveClassRequest,
  TransferEnrollmentRequest,
  UpdateEnrollmentRequest,
} from "../types/academic-requests";

/** Query parameters accepted by the enrollment list endpoint. */
export type EnrollmentListParams = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "enrolled_at" | "left_at";
  direction?: "asc" | "desc";
  active_only?: boolean | 0 | 1;
};

/** Fetches one page of a class roster. */
export async function fetchEnrollments(
  classId: number,
  params: EnrollmentListParams,
): Promise<Page<Enrollment>> {
  return browserRequestList<Enrollment>(`/api/v1/classes/${classId}/enrollments`, { params });
}

/** Fetches the students who may still be added to a class. */
export async function fetchAvailableStudents(
  classId: number,
  params: StudentListParams,
): Promise<Page<Student>> {
  return browserRequestList<Student>(
    `/api/v1/classes/${classId}/available-students`,
    { params },
  );
}

/** Enrols one or more students into a class. */
export async function enrolStudents(
  classId: number,
  body: EnrolStudentsRequest,
): Promise<Enrollment[]> {
  return browserRequest<Enrollment[]>(`/api/v1/classes/${classId}/enrollments`, {
    method: "POST",
    body,
  });
}

/** Corrects the dates or note on one enrolment. */
export async function updateEnrollment(
  id: number,
  body: UpdateEnrollmentRequest,
): Promise<Enrollment> {
  return browserRequest<Enrollment>(`/api/v1/enrollments/${id}`, { method: "PUT", body });
}

/** Moves a student to another class of the same subject. */
export async function transferEnrollment(
  id: number,
  body: TransferEnrollmentRequest,
): Promise<Enrollment> {
  return browserRequest<Enrollment>(`/api/v1/enrollments/${id}/transfer`, {
    method: "POST",
    body,
  });
}

/** Ends a student's membership of a class. */
export async function leaveClass(id: number, body: LeaveClassRequest): Promise<Enrollment> {
  return browserRequest<Enrollment>(`/api/v1/enrollments/${id}/leave`, {
    method: "POST",
    body,
  });
}
