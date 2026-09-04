import type { FileCategory, FileLinkType, FileQuotaMap } from "./files";

/** Query filters accepted by the file-library index endpoint. */
export type FileListParams = {
  search?: string;
  category?: FileCategory;
  owner_user_id?: number;
  uploaded_from?: string;
  uploaded_to?: string;
  trash?: "active" | "trashed";
  link_type?: FileLinkType;
  page?: number;
  per_page?: number;
  sort?: "id" | "original_name" | "display_name" | "size_bytes" | "created_at";
  direction?: "asc" | "desc";
};

/** Query filters accepted by the administrator file-owner picker. */
export type FileOwnerOptionsRequest = {
  q?: string;
  limit?: number;
};

/** An optional administrator owner selection used by the usage endpoint. */
export type FileUsageRequest = {
  owner_user_id?: number;
};

/** One browser file and the metadata Laravel accepts with it. */
export type UploadFileRequest = {
  file: File;
  display_name?: string;
  owner_user_id?: number;
};

/** The one mutable metadata field of an existing file. */
export type RenameFileRequest = {
  display_name: string;
};

/** Complete replacement of the role byte quotas. */
export type UpdateFileQuotasRequest = {
  quotas: FileQuotaMap;
};

/** The only local DiceBear styles the API accepts. */
export type DiceBearStyle = "lorelei" | "notionists" | "thumbs";

/** Scalar values permitted inside the server-validated DiceBear option object. */
export type DiceBearOptionValue = string | number | boolean;

/** A local DiceBear configuration without an untyped JSON boundary. */
export type DiceBearOptions = Record<string, DiceBearOptionValue>;

/** One persisted DiceBear avatar value. */
export type DiceBearAvatar = {
  type: "dicebear";
  style: DiceBearStyle;
  seed: string;
  options: DiceBearOptions;
};

/** Avatar value the profile endpoint returns. */
export type AvatarValue =
  | null
  | { type: "file"; file_id: number; content_url: string }
  | DiceBearAvatar;

/** Avatar selection accepted by the profile update endpoint. */
export type AvatarSelection =
  | { type: "none" }
  | { type: "file"; file_id: number }
  | DiceBearAvatar;
