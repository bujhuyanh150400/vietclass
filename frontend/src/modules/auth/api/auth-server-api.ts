import "server-only";

import { serverRequest } from "@/lib/api/server-request";

import type { CurrentUser } from "../types/auth";

/**
 * Builds the bearer authorization header for a Laravel request. The value is
 * used only to make the call and is never returned, logged, or attached to an
 * error.
 */
function bearerHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Resolves the identity behind a bearer token, which is how server code proves a
 * stored session cookie is still valid. A rejected token keeps Laravel's `401`
 * so callers can distinguish it from a service outage.
 */
export async function fetchCurrentUser(token: string): Promise<CurrentUser> {
  return serverRequest<CurrentUser>("/auth/me", {
    method: "GET",
    headers: bearerHeaders(token),
  });
}
