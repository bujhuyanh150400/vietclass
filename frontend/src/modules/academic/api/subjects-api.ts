import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { Option, Subject } from "../types/academic";
import type { SubjectRequest } from "../types/academic-requests";

/** Query parameters accepted by the subject list endpoint. */
export type SubjectListParams = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "name" | "created_at";
  direction?: "asc" | "desc";
  is_active?: boolean | 0 | 1;
};

/** Query parameters accepted by the subject option endpoint. */
export type SubjectOptionParams = {
  q?: string;
  limit?: number;
};

/** Fetches one page of subjects. */
export async function fetchSubjects(params: SubjectListParams): Promise<Page<Subject>> {
  return browserRequestList<Subject>("/api/v1/subjects", { params });
}

/** Fetches the subjects a class may be assigned to. */
export async function fetchSubjectOptions(params: SubjectOptionParams): Promise<Option[]> {
  return browserRequest<Option[]>("/api/v1/subjects/options", { params });
}

/** Fetches one subject. */
export async function fetchSubject(id: number): Promise<Subject> {
  return browserRequest<Subject>(`/api/v1/subjects/${id}`);
}

/** Creates a subject. */
export async function createSubject(body: SubjectRequest): Promise<Subject> {
  return browserRequest<Subject>("/api/v1/subjects", { method: "POST", body });
}

/** Changes a subject's name or description. */
export async function updateSubject(id: number, body: SubjectRequest): Promise<Subject> {
  return browserRequest<Subject>(`/api/v1/subjects/${id}`, { method: "PUT", body });
}

/** Locks or unlocks a subject for use by new classes. */
export async function setSubjectActive(id: number, isActive: boolean): Promise<Subject> {
  return browserRequest<Subject>(`/api/v1/subjects/${id}/active`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
}

/** Removes a subject with no class references. */
export async function deleteSubject(id: number): Promise<void> {
  await browserRequest<undefined>(`/api/v1/subjects/${id}`, { method: "DELETE" });
}
