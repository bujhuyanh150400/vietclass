/**
 * Query keys for Identity cache entries, kept in one place so login, session
 * recovery, and logout all read and clear exactly the same cache slot.
 */
export const identityQueryKeys = {
  /** Cache slot holding the authenticated user. */
  currentUser: () => ["identity", "current-user"] as const,
};
