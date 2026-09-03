import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { Option, Teacher, TeacherStatus } from "../types/academic";
import type {
  CreateTeacherRequest,
  UpdateTeacherRequest,
} from "../types/academic-requests";

/** Query parameters accepted by the teacher list endpoint. */
export type TeacherListParams = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "full_name" | "joined_at" | "created_at";
  direction?: "asc" | "desc";
  is_active?: boolean | 0 | 1;
  [key: `status[${number}]`]: TeacherStatus;
};

/** Query parameters accepted by the teacher option endpoint. */
export type TeacherOptionParams = {
  q?: string;
  limit?: number;
};

/** Fetches one page of teacher profiles. */
export async function fetchTeachers(params: TeacherListParams): Promise<Page<Teacher>> {
  return browserRequestList<Teacher>("/api/v1/teachers", { params });
}

/** Fetches the teachers a class may be assigned to. */
export async function fetchTeacherOptions(params: TeacherOptionParams): Promise<Option[]> {
  return browserRequest<Option[]>("/api/v1/teachers/options", { params });
}

/** Fetches one teacher profile. */
export async function fetchTeacher(id: number): Promise<Teacher> {
  return browserRequest<Teacher>(`/api/v1/teachers/${id}`);
}

/** Creates a teacher profile together with its login account. */
export async function createTeacher(body: CreateTeacherRequest): Promise<Teacher> {
  return browserRequest<Teacher>("/api/v1/teachers", { method: "POST", body });
}

/** Changes a teacher profile. */
export async function updateTeacher(id: number, body: UpdateTeacherRequest): Promise<Teacher> {
  return browserRequest<Teacher>(`/api/v1/teachers/${id}`, { method: "PUT", body });
}

/** Locks or unlocks a teacher's login account. */
export async function setTeacherAccountActive(id: number, isActive: boolean): Promise<Teacher> {
  return browserRequest<Teacher>(`/api/v1/teachers/${id}/account`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
}

/** Replaces the password on a teacher's login account. */
export async function changeTeacherPassword(id: number, password: string): Promise<void> {
  await browserRequest<undefined>(`/api/v1/teachers/${id}/password`, {
    method: "PATCH",
    body: { password },
  });
}
