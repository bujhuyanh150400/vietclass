import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type {
  GradeLevel,
  Student,
  StudentStatus,
} from "../types/academic";
import type {
  CreateStudentRequest,
  UpdateStudentRequest,
} from "../types/academic-requests";

/** Query parameters accepted by the student list endpoint. */
export type StudentListParams = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "full_name" | "grade_level" | "created_at";
  direction?: "asc" | "desc";
  is_active?: boolean | 0 | 1;
  [key: `status[${number}]`]: StudentStatus;
  [key: `grade_level[${number}]`]: GradeLevel;
};

/** Fetches one page of student profiles. */
export async function fetchStudents(params: StudentListParams): Promise<Page<Student>> {
  return browserRequestList<Student>("/api/v1/students", { params });
}

/** Fetches one student profile. */
export async function fetchStudent(id: number): Promise<Student> {
  return browserRequest<Student>(`/api/v1/students/${id}`);
}

/** Creates a student profile together with its login account. */
export async function createStudent(body: CreateStudentRequest): Promise<Student> {
  return browserRequest<Student>("/api/v1/students", { method: "POST", body });
}

/** Changes a student profile. */
export async function updateStudent(id: number, body: UpdateStudentRequest): Promise<Student> {
  return browserRequest<Student>(`/api/v1/students/${id}`, { method: "PUT", body });
}

/** Locks or unlocks a student's login account. */
export async function setStudentAccountActive(id: number, isActive: boolean): Promise<Student> {
  return browserRequest<Student>(`/api/v1/students/${id}/account`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
}

/** Replaces the password on a student's login account. */
export async function changeStudentPassword(id: number, password: string): Promise<void> {
  await browserRequest<undefined>(`/api/v1/students/${id}/password`, {
    method: "PATCH",
    body: { password },
  });
}
