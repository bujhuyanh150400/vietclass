/** Serializable cache keys for local profile-avatar mutations. */
export const avatarQueryKeys = {
  root: () => ["avatar"] as const,
  profile: (profileId: number) => ["avatar", "profile", profileId] as const,
} as const;
