import { browserRequest } from "@/lib/api/browser-request";

import type { UpdateFileQuotasRequest } from "../types/file-requests";
import type { FileQuotaMap } from "../types/files";

/** Fetches the complete role quota map. */
export async function fetchFileQuotas(): Promise<FileQuotaMap> {
  const response = await browserRequest<{ quotas: FileQuotaMap }>("/api/v1/system/file-quotas");

  return response.quotas;
}

/** Replaces the complete role quota map. */
export async function updateFileQuotas(
  body: UpdateFileQuotasRequest,
): Promise<FileQuotaMap> {
  const response = await browserRequest<{ quotas: FileQuotaMap }>("/api/v1/system/file-quotas", {
    method: "PUT",
    body,
  });

  return response.quotas;
}
