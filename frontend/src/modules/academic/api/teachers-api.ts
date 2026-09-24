import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { Option, Teacher } from "../types/academic";
import type {
  CreateProfileSubmission,
  CreateTeacherRequest,
  TeacherListRequest,
  TeacherOptionRequest,
  UpdateTeacherRequest,
} from "../types/academic-requests";
import { profileCreateBody } from "./profile-create-body";

/** Fetches one page of teacher profiles. */
export async function fetchTeachers(params: TeacherListRequest): Promise<Page<Teacher>> {
  return browserRequestList<Teacher>("/api/v1/academic/teachers", { params });
}

/** Fetches the teachers a class may be assigned to. */
export async function fetchTeacherOptions(params: TeacherOptionRequest): Promise<Option[]> {
  return browserRequest<Option[]>("/api/v1/academic/teachers/options", { params });
}

/** Fetches one teacher profile. */
export async function fetchTeacher(id: number): Promise<Teacher> {
  return browserRequest<Teacher>(`/api/v1/academic/teachers/${id}`);
}

/** Creates a teacher profile together with its login account. */
export async function createTeacher(
  submission: CreateProfileSubmission<CreateTeacherRequest>,
): Promise<Teacher> {
  return browserRequest<Teacher>("/api/v1/academic/teachers", {
    method: "POST",
    body: profileCreateBody(submission),
  });
}

/** Changes a teacher profile. */
export async function updateTeacher(id: number, body: UpdateTeacherRequest): Promise<Teacher> {
  return browserRequest<Teacher>(`/api/v1/academic/teachers/${id}`, { method: "PUT", body });
}

/** Locks or unlocks a teacher's login account. */
export async function setTeacherAccountActive(id: number, isActive: boolean): Promise<Teacher> {
  return browserRequest<Teacher>(`/api/v1/academic/teachers/${id}/account`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
}

/** Replaces the password on a teacher's login account. */
export async function changeTeacherPassword(id: number, password: string): Promise<void> {
  await browserRequest<undefined>(`/api/v1/academic/teachers/${id}/password`, {
    method: "PATCH",
    body: { password },
  });
}
