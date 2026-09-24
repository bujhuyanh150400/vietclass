import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { Option, Subject } from "../types/academic";
import type {
  SubjectListRequest,
  SubjectOptionRequest,
  SubjectRequest,
} from "../types/academic-requests";

/** Fetches one page of subjects. */
export async function fetchSubjects(params: SubjectListRequest): Promise<Page<Subject>> {
  return browserRequestList<Subject>("/api/v1/academic/subjects", { params });
}

/** Fetches the subjects a class may be assigned to. */
export async function fetchSubjectOptions(params: SubjectOptionRequest): Promise<Option[]> {
  return browserRequest<Option[]>("/api/v1/academic/subjects/options", { params });
}

/** Fetches one subject. */
export async function fetchSubject(id: number): Promise<Subject> {
  return browserRequest<Subject>(`/api/v1/academic/subjects/${id}`);
}

/** Creates a subject. */
export async function createSubject(body: SubjectRequest): Promise<Subject> {
  return browserRequest<Subject>("/api/v1/academic/subjects", { method: "POST", body });
}

/** Changes a subject's details, applicability, and active status. */
export async function updateSubject(id: number, body: SubjectRequest): Promise<Subject> {
  return browserRequest<Subject>(`/api/v1/academic/subjects/${id}`, { method: "PUT", body });
}

/** Locks or unlocks a subject for use by new classes. */
export async function setSubjectActive(id: number, isActive: boolean): Promise<Subject> {
  return browserRequest<Subject>(`/api/v1/academic/subjects/${id}/active`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
}

/** Removes a subject with no class references. */
export async function deleteSubject(id: number): Promise<void> {
  await browserRequest<undefined>(`/api/v1/academic/subjects/${id}`, { method: "DELETE" });
}
