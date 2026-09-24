import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { ClassStatus, Option, SchoolClass } from "../types/academic";
import type {
  ClassListRequest,
  ClassOptionRequest,
  CreateClassRequest,
  UpdateClassRequest,
} from "../types/academic-requests";

/** Fetches one page of classes. */
export async function fetchClasses(params: ClassListRequest): Promise<Page<SchoolClass>> {
  return browserRequestList<SchoolClass>("/api/v1/academic/classes", { params });
}

/** Fetches the classes still running. */
export async function fetchClassOptions(params: ClassOptionRequest): Promise<Option[]> {
  return browserRequest<Option[]>("/api/v1/academic/classes/options", { params });
}

/** Fetches one class. */
export async function fetchClass(id: number): Promise<SchoolClass> {
  return browserRequest<SchoolClass>(`/api/v1/academic/classes/${id}`);
}

/** Creates a class. */
export async function createClass(body: CreateClassRequest): Promise<SchoolClass> {
  return browserRequest<SchoolClass>("/api/v1/academic/classes", { method: "POST", body });
}

/** Changes a class. */
export async function updateClass(id: number, body: UpdateClassRequest): Promise<SchoolClass> {
  return browserRequest<SchoolClass>(`/api/v1/academic/classes/${id}`, { method: "PUT", body });
}

/** Moves a class between the running and finished states. */
export async function changeClassStatus(id: number, status: ClassStatus): Promise<SchoolClass> {
  return browserRequest<SchoolClass>(`/api/v1/academic/classes/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}
