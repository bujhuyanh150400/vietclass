import type { FileListParams, FileOwnerOptionsRequest, FileUsageRequest } from "../types/file-requests";

/** Serializable cache keys for every browser-side file-library query. */
export const fileQueryKeys = {
  root: () => ["files"] as const,
  list: (params: FileListParams) => ["files", "list", params] as const,
  detail: (id: number) => ["files", "detail", id] as const,
  usageRoot: () => ["files", "usage"] as const,
  usage: (params: FileUsageRequest) => ["files", "usage", params] as const,
  ownersRoot: () => ["files", "owners"] as const,
  owners: (params: FileOwnerOptionsRequest) => ["files", "owners", params] as const,
} as const;

/** Serializable cache keys for the System-owned quota map. */
export const fileQuotaQueryKeys = {
  root: () => ["system", "file-quotas"] as const,
};
