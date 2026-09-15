import { ApiClientError } from "@/lib/api/api-client-error";
import { browserRequest } from "@/lib/api/browser-request";

import type { CurrentUser, LoginCredentials, LoginResponse } from "../types/auth";

/** Every identity call goes straight to the Laravel API on this app's own origin. */
const BASE = "/api/v1/auth";

/**
 * Submits credentials to Laravel and returns the resulting identity. Laravel puts
 * the bearer token in an HttpOnly cookie the browser cannot read; the copy it also
 * returns in the body is there for non-browser clients and is dropped here.
 */
export async function login(credentials: LoginCredentials): Promise<CurrentUser> {
  const payload = await browserRequest<LoginResponse>(`${BASE}/login`, {
    method: "POST",
    body: credentials,
  });

  return payload.user;
}

/**
 * Recovers the identity behind the existing session cookie, which is how the
 * browser learns whether a stored session is still usable.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return browserRequest<CurrentUser>(`${BASE}/me`, { method: "GET" });
}

/**
 * Ends the browser session: Laravel revokes the token behind the cookie and clears
 * the cookie itself. Only a no-content success counts, so an unexpected response
 * body is not mistaken for a completed logout.
 */
export async function logout(): Promise<void> {
  const result = await browserRequest<undefined>(`${BASE}/logout`, {
    method: "DELETE",
  });

  // Response parsing yields `undefined` only for a `204`; any other success
  // shape means Laravel did not complete the logout it promised.
  if (result !== undefined) {
    throw ApiClientError.upstreamFailure();
  }
}
