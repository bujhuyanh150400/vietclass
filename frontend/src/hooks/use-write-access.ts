"use client";

import { useCurrentUser, type UserRole } from "@/modules/identity";

/**
 * The roles allowed to change data, as the API's own permission defaults have
 * them: writing belongs to the administrator alone, while a teacher gets the read
 * permissions of the modules they appear in.
 *
 * Listing the roles rather than negating a single one keeps this readable if a
 * future role is given write access, and keeps the answer in one place instead of
 * one `role === 0` per screen.
 */
const WRITE_ROLES: readonly UserRole[] = [0];

/**
 * Answers whether the signed-in role may use the write controls of a screen, so
 * a role without the permission is never shown a button that only ends in `403`.
 *
 * This is a presentation decision and nothing more. The API stays the authority:
 * every write endpoint checks its own permission, so hiding a control removes a
 * dead end rather than a defence. That also means the answer here is deliberately
 * coarser than the server's — the server resolves per-user permission overrides
 * on top of the role defaults, and the session payload carries only the role, so
 * an individually granted exception is not visible to this hook.
 *
 * An unresolved role answers `false`, which is why a caller can gate on the
 * result alone: a control that appears and is then taken away is worse than one
 * that appears a moment late, and the read path of every screen renders either
 * way. The same fallback covers a failed session request, so a transient outage
 * degrades the screen to read-only instead of offering writes it cannot perform.
 */
export function useWriteAccess(): boolean {
  // Enabled unconditionally: every caller renders under `app/(protected)`, whose
  // layout has already redirected anyone arriving without a session cookie. The
  // hook's opt-in flag exists for the public pages, where the server has not seen
  // a cookie and a session request would be a guess.
  const session = useCurrentUser(true);
  const role = session.data?.role;

  return role !== undefined && WRITE_ROLES.includes(role);
}
