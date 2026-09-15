"use client";

import { useUploadFile } from "@/modules/system";
import { useCurrentUser } from "@/modules/auth";

import { avatarSelectionSchema } from "../schemas/avatar-schema";
import type { AvatarDraft, AvatarSelection, AvatarValue } from "../types/avatar";
import { useUpdateProfileAvatar } from "./use-avatar";

/**
 * Signals a draft the avatar endpoint would refuse, recognised before it is sent.
 *
 * It is a class rather than a plain `Error` so a caller can tell the one refusal it
 * can explain precisely from a transport failure it cannot, and print the sentence
 * instead of a generic apology.
 */
export class AvatarDraftError extends Error {}

/**
 * Persists a chosen avatar onto a profile that already exists.
 *
 * A stored avatar is a file id, but every picker hands back the image itself — the
 * same `File` the create screens carry as a multipart part. So an uploaded photo
 * takes two steps: store it in the library, then point the profile at what came
 * back. Both happen here, on save rather than on picking, which is what lets a
 * reader change their mind without leaving a stray file behind.
 *
 * The owner is only declared when an administrator is acting on someone else's
 * profile; a reader editing their own upload owns it by being the one uploading.
 */
export function useSaveProfileAvatar() {
  const currentUser = useCurrentUser(true);
  const upload = useUploadFile();
  const update = useUpdateProfileAvatar();
  const isAdmin = currentUser.data?.role === 0;

  /** Uploads the picked image if there is one, then writes the avatar to the profile. */
  async function save({
    profileId,
    ownerUserId,
    draft,
  }: {
    profileId: number;
    ownerUserId?: number | null;
    draft: AvatarDraft;
  }): Promise<AvatarValue> {
    let selection: AvatarSelection = draft.type === "file" ? { type: "none" } : draft;

    if (draft.type === "file") {
      const stored = await upload.mutateAsync({
        request: { file: draft.file, owner_user_id: isAdmin ? ownerUserId ?? undefined : undefined },
      });

      selection = { type: "file", file_id: stored.id };
    }

    const parsed = avatarSelectionSchema.safeParse(selection);

    if (!parsed.success) {
      throw new AvatarDraftError("Cấu hình ảnh đại diện không hợp lệ.");
    }

    return update.mutateAsync({ profileId, avatar: parsed.data });
  }

  return { save, isPending: upload.isPending || update.isPending };
}
