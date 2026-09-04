import { browserApiUrl, browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type {
  AvatarSelection,
  AvatarValue,
  FileListParams,
  FileOwnerOptionsRequest,
  FileUsageRequest,
  RenameFileRequest,
  UploadFileRequest,
} from "../types/file-requests";
import type { FileOwnerOption, FileUsage, ManagedFile } from "../types/files";

/** Upload progress reported by Axios while Laravel receives a multipart file. */
export type UploadProgressHandler = (loaded: number, total: number | undefined) => void;

/** Fetches one page from the private file library. */
export async function fetchFiles(params: FileListParams): Promise<Page<ManagedFile>> {
  return browserRequestList<ManagedFile>("/api/v1/files", { params });
}

/** Fetches safe metadata for one visible file. */
export async function fetchFile(id: number): Promise<ManagedFile> {
  return browserRequest<ManagedFile>(`/api/v1/files/${id}`);
}

/** Fetches administrators' selectable file owners. */
export async function fetchFileOwnerOptions(
  params: FileOwnerOptionsRequest = {},
): Promise<FileOwnerOption[]> {
  return browserRequest<FileOwnerOption[]>("/api/v1/files/owner-options", { params });
}

/** Fetches the resolved owner's current quota usage. */
export async function fetchFileUsage(
  params: FileUsageRequest = {},
): Promise<FileUsage> {
  return browserRequest<FileUsage>("/api/v1/files/usage", { params });
}

/** Sends one file directly to Laravel while preserving browser progress and cancellation. */
export async function uploadFile(
  request: UploadFileRequest,
  onProgress?: UploadProgressHandler,
  signal?: AbortSignal,
): Promise<ManagedFile> {
  const body = new FormData();
  body.append("file", request.file);

  if (request.display_name) {
    body.append("display_name", request.display_name);
  }

  if (request.owner_user_id) {
    body.append("owner_user_id", String(request.owner_user_id));
  }

  return browserRequest<ManagedFile>("/api/v1/files", {
    method: "POST",
    body,
    signal,
    onUploadProgress: onProgress,
  });
}

/** Renames a visible active file without changing its storage coordinates. */
export async function renameFile(id: number, body: RenameFileRequest): Promise<ManagedFile> {
  return browserRequest<ManagedFile>(`/api/v1/files/${id}`, { method: "PUT", body });
}

/** Moves one active unlinked file to the 30-day trash. */
export async function trashFile(id: number): Promise<void> {
  await browserRequest<undefined>(`/api/v1/files/${id}`, { method: "DELETE" });
}

/** Restores one trashed file to the active library. */
export async function restoreFile(id: number): Promise<ManagedFile> {
  return browserRequest<ManagedFile>(`/api/v1/files/${id}/restore`, { method: "POST" });
}

/** Permanently deletes one trashed, unlinked file. */
export async function permanentlyDeleteFile(id: number): Promise<void> {
  await browserRequest<undefined>(`/api/v1/files/${id}/permanent`, { method: "DELETE" });
}

/** Builds the authorized content endpoint URL; the API redirects it to a short-lived storage URL. */
export function fileContentUrl(id: number, download = false): string {
  return browserApiUrl(`/api/v1/files/${id}/content${download ? "?download=1" : ""}`);
}

/** Replaces one profile's avatar selection independently from profile details. */
export async function updateProfileAvatar(
  profileId: number,
  avatar: AvatarSelection,
): Promise<AvatarValue> {
  return browserRequest<AvatarValue>(`/api/v1/profiles/${profileId}/avatar`, {
    method: "PUT",
    body: { avatar },
  });
}
