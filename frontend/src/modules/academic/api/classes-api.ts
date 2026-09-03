import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { ClassStatus, Option, SchoolClass, GradeLevel } from "../types/academic";
import type {
  CreateClassRequest,
  UpdateClassRequest,
} from "../types/academic-requests";

/** Query parameters accepted by the class list endpoint. */
export type ClassListParams = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "code" | "name" | "start_at" | "created_at";
  direction?: "asc" | "desc";
  [key: `status[${number}]`]: ClassStatus;
  [key: `subject_id[${number}]`]: number;
  [key: `teacher_id[${number}]`]: number;
  [key: `grade_level[${number}]`]: GradeLevel;
};

/** Query parameters accepted by the class option endpoint. */
export type ClassOptionParams = {
  q?: string;
  limit?: number;
};

/** Fetches one page of classes. */
export async function fetchClasses(params: ClassListParams): Promise<Page<SchoolClass>> {
  return browserRequestList<SchoolClass>("/api/v1/classes", { params });
}

/** Fetches the classes still running. */
export async function fetchClassOptions(params: ClassOptionParams): Promise<Option[]> {
  return browserRequest<Option[]>("/api/v1/classes/options", { params });
}

/** Fetches one class. */
export async function fetchClass(id: number): Promise<SchoolClass> {
  return browserRequest<SchoolClass>(`/api/v1/classes/${id}`);
}

/** Creates a class. */
export async function createClass(body: CreateClassRequest): Promise<SchoolClass> {
  return browserRequest<SchoolClass>("/api/v1/classes", { method: "POST", body });
}

/** Changes a class. */
export async function updateClass(id: number, body: UpdateClassRequest): Promise<SchoolClass> {
  return browserRequest<SchoolClass>(`/api/v1/classes/${id}`, { method: "PUT", body });
}

/** Moves a class between the running and finished states. */
export async function changeClassStatus(id: number, status: ClassStatus): Promise<SchoolClass> {
  return browserRequest<SchoolClass>(`/api/v1/classes/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}
