import type { UserRole } from "@/modules/identity";

/** File-library category calculated by the API from the validated extension. */
export type FileCategory =
  | "image"
  | "pdf"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "text";

/** Existing file-link enum values exposed by the API. */
export type FileLinkType = 0;

/** One private file as its safe API resource exposes it. */
export type ManagedFile = {
  id: number;
  owner: { id: number; display_name: string; role: UserRole };
  original_name: string;
  display_name: string;
  category: FileCategory;
  extension: string;
  mime_type: string;
  size_bytes: number;
  is_linked: boolean;
  link_types: FileLinkType[];
  trashed_at: string | null;
  created_at: string | null;
  content_url: string;
};

/** One administrator-selectable file owner. */
export type FileOwnerOption = {
  id: number;
  label: string;
};

/** Usage and quota for one resolved file owner. */
export type FileUsage = {
  owner_id: number;
  used_bytes: number;
  quota_bytes: number;
  remaining_bytes: number;
  exceeded: boolean;
};

/** Byte quotas keyed by the persisted Laravel role names. */
export type FileQuotaMap = {
  admin: number;
  teacher: number;
  student: number;
  guardian: number;
};
