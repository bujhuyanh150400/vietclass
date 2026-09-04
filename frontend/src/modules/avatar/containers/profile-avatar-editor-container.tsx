"use client";

import { useCallback, useState } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { isApiClientError } from "@/lib/api/api-client-error";
import { useFileList, useUploadFile, type FilePondProcess } from "@/modules/files";
import { useCurrentUser } from "@/modules/identity";

import { AvatarEditor } from "../components/avatar-editor";
import { useUpdateProfileAvatar } from "../hooks/use-avatar";
import { avatarSelectionSchema } from "../schemas/avatar-schema";
import type { AvatarSelection, AvatarValue } from "../types/avatar";

/** Converts a resource avatar into the direct update payload without carrying a content route back to the API. */
function selectionFromValue(value: AvatarValue): AvatarSelection {
  if (value === null) return { type: "none" };
  if (value.type === "file") return { type: "file", file_id: value.file_id };
  return value;
}

/** Reduces API and transport failures to one display-safe sentence. */
function messageFor(error: unknown): string {
  return isApiClientError(error) ? error.message : "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.";
}

/** Owns the profile-scoped image library, upload flow, avatar update, and cache refreshes. */
export function ProfileAvatarEditorContainer({
  profileId,
  ownerUserId,
  initialAvatar,
}: {
  profileId: number;
  ownerUserId?: number | null;
  initialAvatar: AvatarValue;
}) {
  const currentUser = useCurrentUser(true);
  const isAdmin = currentUser.data?.role === 0;
  const canSelectFile = typeof ownerUserId === "number" && ownerUserId > 0;
  const files = useFileList({ category: "image", trash: "active", per_page: 100, owner_user_id: isAdmin ? ownerUserId ?? undefined : undefined }, canSelectFile && currentUser.isSuccess);
  const upload = useUploadFile();
  const update = useUpdateProfileAvatar();
  const showToast = useToast();
  const [selection, setSelection] = useState<AvatarSelection>(() => selectionFromValue(initialAvatar));
  const [error, setError] = useState<string | null>(null);

  /** Uploads one constrained FilePond image then selects the durable library item without saving the avatar yet. */
  const processUpload = useCallback<FilePondProcess>((file, handlers) => {
    if (!canSelectFile) {
      handlers.error("Hồ sơ này chưa có tài khoản để sở hữu tệp.");
      return;
    }
    const controller = new AbortController();
    void upload.mutateAsync({ request: { file, owner_user_id: isAdmin ? ownerUserId ?? undefined : undefined }, onProgress: handlers.progress, signal: controller.signal })
      .then((uploaded) => { setSelection({ type: "file", file_id: uploaded.id }); handlers.load(String(uploaded.id)); showToast({ title: "Đã tải ảnh lên. Hãy lưu để áp dụng." }); })
      .catch((reason: unknown) => handlers.error(messageFor(reason)));
    return { abort: () => { controller.abort(); handlers.abort(); } };
  }, [canSelectFile, isAdmin, ownerUserId, showToast, upload]);

  /** Validates and persists the current direct union, keeping an uploaded library file if selection fails. */
  async function saveAvatar(): Promise<void> {
    setError(null);
    const parsed = avatarSelectionSchema.safeParse(selection);
    if (!parsed.success) {
      setError("Cấu hình ảnh đại diện không hợp lệ.");
      return;
    }
    try {
      await update.mutateAsync({ profileId, avatar: parsed.data });
      showToast({ title: "Đã cập nhật ảnh đại diện." });
    } catch (reason) {
      setError(messageFor(reason));
    }
  }

  return <AvatarEditor value={selection} availableFiles={files.data?.data ?? []} canSelectFile={canSelectFile} onChange={setSelection} onUpload={processUpload} onSave={() => { void saveAvatar(); }} isPending={upload.isPending || update.isPending} error={error ?? (files.isError ? messageFor(files.error) : null)} />;
}
