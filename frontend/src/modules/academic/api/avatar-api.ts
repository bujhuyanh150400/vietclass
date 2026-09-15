import { updateProfileAvatar as requestProfileAvatarUpdate } from "@/modules/system";

import type { AvatarSelection, AvatarValue } from "../types/avatar";

/** Sends the direct avatar union that UpdateProfileAvatarRequest maps into its avatar field. */
export async function updateProfileAvatar(profileId: number, avatar: AvatarSelection): Promise<AvatarValue> {
  return requestProfileAvatarUpdate(profileId, avatar);
}
