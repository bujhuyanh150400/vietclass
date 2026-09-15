/**
 * Query keys for Auth cache entries, kept in one place so login, session
 * recovery, and logout all read and clear exactly the same cache slot.
 */
export const authQueryKeys = {
  /** Cache slot holding the authenticated user. */
  currentUser: () => ["auth", "current-user"] as const,
};
