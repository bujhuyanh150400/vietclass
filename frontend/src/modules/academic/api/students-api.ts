import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type {
  EnrollmentHistoryEntry,
  Student,
  StudentClass,
} from "../types/academic";
import type {
  CreateProfileSubmission,
  CreateStudentRequest,
  StudentClassesRequest,
  StudentEnrollmentHistoryRequest,
  StudentListRequest,
  UpdateStudentRequest,
} from "../types/academic-requests";
import { profileCreateBody } from "./profile-create-body";

/** Fetches one page of student profiles. */
export async function fetchStudents(params: StudentListRequest): Promise<Page<Student>> {
  return browserRequestList<Student>("/api/v1/academic/students", { params });
}

/** Fetches one page of distinct current and historical classes for a student. */
export async function fetchStudentClasses(
  id: number,
  params: StudentClassesRequest,
): Promise<Page<StudentClass>> {
  return browserRequestList<StudentClass>(`/api/v1/academic/students/${id}/classes`, { params });
}

/** Fetches one page of a student's immutable and legacy history for one class. */
export async function fetchStudentEnrollmentHistory(
  id: number,
  params: StudentEnrollmentHistoryRequest,
): Promise<Page<EnrollmentHistoryEntry>> {
  return browserRequestList<EnrollmentHistoryEntry>(
    `/api/v1/academic/students/${id}/enrollment-events`,
    { params },
  );
}

/** Fetches one student profile. */
export async function fetchStudent(id: number): Promise<Student> {
  return browserRequest<Student>(`/api/v1/academic/students/${id}`);
}

/** Creates a student profile together with its login account. */
export async function createStudent(
  submission: CreateProfileSubmission<CreateStudentRequest>,
): Promise<Student> {
  return browserRequest<Student>("/api/v1/academic/students", {
    method: "POST",
    body: profileCreateBody(submission),
  });
}

/** Changes a student profile. */
export async function updateStudent(id: number, body: UpdateStudentRequest): Promise<Student> {
  return browserRequest<Student>(`/api/v1/academic/students/${id}`, { method: "PUT", body });
}

/** Locks or unlocks a student's login account. */
export async function setStudentAccountActive(id: number, isActive: boolean): Promise<Student> {
  return browserRequest<Student>(`/api/v1/academic/students/${id}/account`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
}

/** Replaces the password on a student's login account. */
export async function changeStudentPassword(id: number, password: string): Promise<void> {
  await browserRequest<undefined>(`/api/v1/academic/students/${id}/password`, {
    method: "PATCH",
    body: { password },
  });
}
