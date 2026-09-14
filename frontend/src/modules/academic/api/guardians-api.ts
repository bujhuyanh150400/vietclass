import { browserRequest } from "@/lib/api/browser-request";

import type { GuardianOption } from "../types/academic";

/** Query parameters accepted by the guardian option endpoint. */
export type GuardianOptionParams = {
  q?: string;
  limit?: number;
};

/** Fetches the guardians already on file that a student may be linked to. */
export async function fetchGuardianOptions(
  params: GuardianOptionParams,
): Promise<GuardianOption[]> {
  return browserRequest<GuardianOption[]>("/api/v1/guardians/options", { params });
}
