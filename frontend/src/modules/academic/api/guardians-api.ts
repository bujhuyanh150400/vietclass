import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { Guardian, GuardianOption } from "../types/academic";
import type { DeleteGuardianRequest, GuardianRequest } from "../types/academic-requests";

/** Query parameters accepted by the guardian list endpoint. */
export type GuardianListParams = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "full_name" | "created_at";
  direction?: "asc" | "desc";
};

/** Fetches one page of role-pure guardians. */
export async function fetchGuardians(params: GuardianListParams): Promise<Page<Guardian>> {
  return browserRequestList<Guardian>("/api/v1/academic/guardians", { params });
}

/** Fetches one guardian profile. */
export async function fetchGuardian(id: number): Promise<Guardian> {
  return browserRequest<Guardian>(`/api/v1/academic/guardians/${id}`);
}

/** Creates one guardian profile and complete roster. */
export async function createGuardian(body: GuardianRequest): Promise<Guardian> {
  return browserRequest<Guardian>("/api/v1/academic/guardians", { method: "POST", body });
}

/** Updates one guardian profile and complete roster. */
export async function updateGuardian(id: number, body: GuardianRequest): Promise<Guardian> {
  return browserRequest<Guardian>(`/api/v1/academic/guardians/${id}`, { method: "PUT", body });
}

/** Deletes one guardian profile and its links. */
export async function deleteGuardian(id: number, body: DeleteGuardianRequest): Promise<void> {
  await browserRequest<undefined>(`/api/v1/academic/guardians/${id}`, { method: "DELETE", body });
}

/** Fetches existing guardians for student roster mutation. */
export async function fetchGuardianOptions(params: GuardianOptionParams): Promise<GuardianOption[]> {
  return browserRequest<GuardianOption[]>("/api/v1/academic/guardians/options", { params });
}

/** Query parameters accepted by the guardian option endpoint. */
export type GuardianOptionParams = { q?: string; limit?: number };
