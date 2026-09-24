import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type {
  Enrollment,
  EnrollmentStudentOption,
  Student,
  TransferClassOption,
} from "../types/academic";
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

/** Fetches one page of a class roster. */
export async function fetchEnrollments(
  classId: number,
  params: EnrollmentListRequest,
): Promise<Page<Enrollment>> {
  return browserRequestList<Enrollment>(`/api/v1/academic/classes/${classId}/enrollments`, { params });
}

/** Fetches the students who may still be added to a class. */
export async function fetchAvailableStudents(
  classId: number,
  params: AvailableStudentListRequest,
): Promise<Page<Student>> {
  return browserRequestList<Student>(
    `/api/v1/academic/classes/${classId}/available-students`,
    { params },
  );
}

/** Fetches paginated eligible and disabled student candidates for a class. */
export async function fetchEnrollmentStudentOptions(
  classId: number,
  params: EnrollmentStudentOptionsRequest,
): Promise<Page<EnrollmentStudentOption>> {
  return browserRequestList<EnrollmentStudentOption>(
    `/api/v1/academic/classes/${classId}/enrollment-student-options`,
    { params },
  );
}

/** Fetches paginated transfer candidates with their current eligibility reasons. */
export async function fetchTransferOptions(
  enrollmentId: number,
  params: TransferOptionsRequest,
): Promise<Page<TransferClassOption>> {
  return browserRequestList<TransferClassOption>(
    `/api/v1/academic/enrollments/${enrollmentId}/transfer-options`,
    { params },
  );
}

/** Enrols one or more students into a class. */
export async function enrolStudents(
  classId: number,
  body: EnrolStudentsRequest,
): Promise<Enrollment[]> {
  return browserRequest<Enrollment[]>(`/api/v1/academic/classes/${classId}/enrollments`, {
    method: "POST",
    body,
  });
}

/** Corrects the dates or note on one enrolment. */
export async function updateEnrollment(
  id: number,
  body: UpdateEnrollmentRequest,
): Promise<Enrollment> {
  return browserRequest<Enrollment>(`/api/v1/academic/enrollments/${id}`, { method: "PUT", body });
}

/** Moves a student to another class of the same subject. */
export async function transferEnrollment(
  id: number,
  body: TransferEnrollmentRequest,
): Promise<Enrollment> {
  return browserRequest<Enrollment>(`/api/v1/academic/enrollments/${id}/transfer`, {
    method: "POST",
    body,
  });
}

/** Ends a student's membership of a class. */
export async function leaveClass(id: number, body: LeaveClassRequest): Promise<Enrollment> {
  return browserRequest<Enrollment>(`/api/v1/academic/enrollments/${id}/leave`, {
    method: "POST",
    body,
  });
}
