"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fileQueryKeys } from "@/modules/files";
import { identityQueryKeys } from "@/modules/identity";

import { updateProfileAvatar } from "../api/avatar-api";
import { avatarQueryKeys } from "./avatar-query-keys";
import type { AvatarSelection } from "../types/avatar";

/** Updates one profile avatar and refreshes only caches affected by successful persistence. */
export function useUpdateProfileAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, avatar }: { profileId: number; avatar: AvatarSelection }) => updateProfileAvatar(profileId, avatar),
    onSuccess: async (_avatar, { profileId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: identityQueryKeys.currentUser() }),
        queryClient.invalidateQueries({ queryKey: avatarQueryKeys.profile(profileId) }),
        queryClient.invalidateQueries({ queryKey: fileQueryKeys.root() }),
      ]);
    },
  });
}
