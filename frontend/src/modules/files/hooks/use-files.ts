"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchFile,
  fetchFileOwnerOptions,
  fetchFiles,
  fetchFileUsage,
  permanentlyDeleteFile,
  renameFile,
  restoreFile,
  trashFile,
  uploadFile,
  type UploadProgressHandler,
} from "../api";
import { fileQueryKeys } from "./file-query-keys";
import type {
  FileListParams,
  FileOwnerOptionsRequest,
  FileUsageRequest,
  RenameFileRequest,
  UploadFileRequest,
} from "../types/file-requests";

/** One upload together with optional browser transfer controls. */
export type UploadFileMutation = {
  request: UploadFileRequest;
  onProgress?: UploadProgressHandler;
  signal?: AbortSignal;
};

/** Fetches one filtered page of visible files. */
export function useFileList(params: FileListParams) {
  return useQuery({
    queryKey: fileQueryKeys.list(params),
    queryFn: () => fetchFiles(params),
  });
}

/** Fetches safe metadata for a single visible file. */
export function useFile(id: number) {
  return useQuery({
    queryKey: fileQueryKeys.detail(id),
    queryFn: () => fetchFile(id),
    enabled: id > 0,
  });
}

/** Fetches one owner-specific usage record. */
export function useFileUsage(params: FileUsageRequest = {}, enabled = true) {
  return useQuery({
    queryKey: fileQueryKeys.usage(params),
    queryFn: () => fetchFileUsage(params),
    enabled,
  });
}

/** Fetches the administrator owner picker values. */
export function useFileOwnerOptions(params: FileOwnerOptionsRequest = {}, enabled = true) {
  return useQuery({
    queryKey: fileQueryKeys.owners(params),
    queryFn: () => fetchFileOwnerOptions(params),
    enabled,
  });
}

/** Sends one multipart upload and refreshes every affected file cache only after success. */
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ request, onProgress, signal }: UploadFileMutation) =>
      uploadFile(request, onProgress, signal),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileQueryKeys.root() });
    },
  });
}

/** Renames a file and refreshes its library metadata only after success. */
export function useRenameFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: RenameFileRequest }) => renameFile(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileQueryKeys.root() });
    },
  });
}

/** Moves one file to trash and refreshes file and owner usage caches after success. */
export function useTrashFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trashFile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileQueryKeys.root() });
    },
  });
}

/** Restores one file and refreshes file and owner usage caches after success. */
export function useRestoreFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreFile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileQueryKeys.root() });
    },
  });
}

/** Permanently deletes one file and refreshes file and owner usage caches after success. */
export function usePermanentlyDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permanentlyDeleteFile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileQueryKeys.root() });
    },
  });
}
