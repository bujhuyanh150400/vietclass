import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { Guardian, GuardianOption } from "../types/academic";
import type {
  DeleteGuardianRequest,
  GuardianListRequest,
  GuardianOptionRequest,
  GuardianRequest,
} from "../types/academic-requests";

/** Fetches one page of role-pure guardians. */
export async function fetchGuardians(params: GuardianListRequest): Promise<Page<Guardian>> {
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
export async function fetchGuardianOptions(params: GuardianOptionRequest): Promise<GuardianOption[]> {
  return browserRequest<GuardianOption[]>("/api/v1/academic/guardians/options", { params });
}
