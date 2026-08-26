import "server-only";

import { ApiClientError } from "@/lib/api/api-client-error";
import { serverRequest } from "@/lib/api/server-request";

import {
  currentUserSchema,
  loginResponseSchema,
} from "../schemas/auth-response-schema";
import type { CurrentUser, LoginCredentials, LoginResult } from "../types/auth";

/**
 * Builds the bearer authorization header for a Laravel request. The value is
 * used only to make the call and is never returned, logged, or attached to an
 * error.
 */
function bearerHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Exchanges credentials for a Laravel bearer token. Token, expiry, and user data
 * are all validated before the result is returned, so a malformed upstream
 * payload becomes a service failure instead of an unusable session.
 */
export async function authenticate(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  const payload = await serverRequest<unknown>("/auth/login", {
    method: "POST",
    body: {
      username: credentials.username,
      password: credentials.password,
      remember: credentials.remember,
    },
  });

  const parsed = loginResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw ApiClientError.upstreamFailure();
  }

  if (Number.isNaN(new Date(parsed.data.expires_at).getTime())) {
    throw ApiClientError.upstreamFailure();
  }

  return {
    user: parsed.data.user,
    token: parsed.data.token,
    expiresAt: parsed.data.expires_at,
  };
}

/**
 * Resolves the identity behind a bearer token, which is how server code proves a
 * stored session cookie is still valid. A rejected token keeps Laravel's `401`
 * so callers can distinguish it from a service outage.
 */
export async function fetchCurrentUser(token: string): Promise<CurrentUser> {
  const payload = await serverRequest<unknown>("/auth/me", {
    method: "GET",
    headers: bearerHeaders(token),
  });

  const parsed = currentUserSchema.safeParse(payload);

  if (!parsed.success) {
    throw ApiClientError.upstreamFailure();
  }

  return parsed.data;
}

/**
 * Revokes the single Laravel token behind the current session so logging out
 * ends the server-side session as well as the local cookie.
 */
export async function revokeCurrentToken(token: string): Promise<void> {
  await serverRequest<void>("/auth/logout", {
    method: "DELETE",
    headers: bearerHeaders(token),
  });
}
