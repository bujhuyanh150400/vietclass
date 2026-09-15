"use client";

import { useState } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { isApiClientError } from "@/lib/api/api-client-error";

import { AvatarEditor } from "../components/avatar-editor";
import { AvatarDraftError, useSaveProfileAvatar } from "../hooks/use-save-profile-avatar";
import type { AvatarDraft, AvatarValue } from "../types/avatar";

/** Reduces refusals, API failures, and transport failures to one display-safe sentence. */
function messageFor(error: unknown): string {
  if (error instanceof AvatarDraftError) {
    return error.message;
  }

  return isApiClientError(error) ? error.message : "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.";
}

/**
 * Owns the save behind the standalone profile avatar editor.
 *
 * The two steps a stored avatar takes — upload the image, then point the profile at
 * it — live in `useSaveProfileAvatar`, because the student edit screen persists the
 * avatar the same way from inside its own form.
 *
 * `current` is held in state rather than read from the prop, because the prop is the
 * page's own server data and the save that changes it is this component's: keeping the
 * result is what makes the portrait show the new face before the page refetches.
 */
export function ProfileAvatarEditorContainer({
  profileId,
  ownerUserId,
  initialAvatar,
  name = "Ảnh đại diện",
}: {
  profileId: number;
  ownerUserId?: number | null;
  initialAvatar: AvatarValue;
  /** Whose avatar this is, for the initials shown when there is no picture. */
  name?: string;
}) {
  // A stored file belongs to a user. Without one there is nothing to own an upload,
  // so the picker drops its upload tab and offers only a generated face.
  const canUpload = typeof ownerUserId === "number" && ownerUserId > 0;
  const avatar = useSaveProfileAvatar();
  const showToast = useToast();
  const [current, setCurrent] = useState<AvatarValue>(initialAvatar);
  const [draft, setDraft] = useState<AvatarDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Persists the pending choice and keeps whatever the profile now holds. */
  async function saveAvatar(): Promise<void> {
    if (draft === null) {
      return;
    }

    setError(null);

    try {
      setCurrent(await avatar.save({ profileId, ownerUserId, draft }));
      setDraft(null);
      showToast({ title: "Đã cập nhật ảnh đại diện." });
    } catch (reason) {
      setError(messageFor(reason));
    }
  }

  return (
    <AvatarEditor
      current={current}
      name={name}
      draft={draft}
      canUpload={canUpload}
      onDraftChange={(next) => {
        setError(null);
        setDraft(next);
      }}
      onSave={() => void saveAvatar()}
      isPending={avatar.isPending}
      error={error}
    />
  );
}
