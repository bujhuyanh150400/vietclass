import { ApiClientError } from "@/lib/api/api-client-error";
import { browserRequest } from "@/lib/api/browser-request";

import type { CurrentUser, LoginCredentials, LoginResponse } from "../types/auth";

/** Every identity call goes through the same-origin Next.js BFF. */
const BASE = "/api/v1/auth";

/**
 * Submits credentials to the same-origin Next.js BFF and returns the resulting identity.
 * The BFF stores the bearer token in an HttpOnly frontend cookie.
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
 * Ends the browser session: the BFF revokes Laravel's bearer token and clears the
 * HttpOnly frontend cookie. Only a no-content success counts, so an unexpected
 * response body is not mistaken for a completed logout.
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
