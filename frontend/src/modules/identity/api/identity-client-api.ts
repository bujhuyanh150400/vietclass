import { ApiClientError } from "@/lib/api/api-client-error";
import { browserRequest } from "@/lib/api/browser-request";

import type { CurrentUser, LoginCredentials } from "../types/auth";

/**
 * Submits credentials to the same-origin login route and returns the resulting
 * identity. The bearer token stays in the HttpOnly cookie the route sets, so it
 * never becomes part of this result.
 */
export function login(credentials: LoginCredentials): Promise<CurrentUser> {
  return browserRequest<CurrentUser>("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
}

/**
 * Recovers the identity behind the existing session cookie, which is how the
 * browser learns whether a stored session is still usable.
 */
export function getCurrentUser(): Promise<CurrentUser> {
  return browserRequest<CurrentUser>("/api/auth/session", { method: "GET" });
}

/**
 * Ends the browser session through the same-origin logout route, which revokes
 * the Laravel token and clears the session cookie. Only a no-content success
 * counts, so an unexpected response body is not mistaken for a completed logout.
 */
export async function logout(): Promise<void> {
  const result = await browserRequest<undefined>("/api/auth/logout", {
    method: "POST",
  });

  // Response parsing yields `undefined` only for a `204`; any other success
  // shape means the route did not complete the logout it promised.
  if (result !== undefined) {
    throw ApiClientError.upstreamFailure();
  }
}
