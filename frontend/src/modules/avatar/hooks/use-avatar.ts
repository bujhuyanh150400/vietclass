"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProfileAvatar } from "../api/avatar-api";
import type { AvatarSelection } from "../types/avatar";

/**
 * Updates one profile avatar and refreshes every cache once it is persisted.
 *
 * The same avatar is drawn by the account menu, the people lists and the file
 * library, so naming the affected keys here would only make this shared hook
 * depend on every feature module that renders a profile.
 */
export function useUpdateProfileAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, avatar }: { profileId: number; avatar: AvatarSelection }) => updateProfileAvatar(profileId, avatar),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
