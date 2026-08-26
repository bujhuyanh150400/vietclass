import "server-only";

/** Name of the host-only cookie that holds the Laravel bearer token. */
export const SESSION_COOKIE_NAME = "vietclass_session";

/** Attributes applied whenever the session cookie is written or removed. */
export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  expires: Date;
};

/**
 * Builds the session cookie attributes for a Laravel token expiry. The cookie is
 * host-only with no `Domain`, unreadable from JavaScript, and marked `Secure`
 * only in production so local HTTP development still works.
 */
export function getSessionCookieOptions(expiresAt: string): SessionCookieOptions {
  const expires = new Date(expiresAt);

  if (Number.isNaN(expires.getTime())) {
    throw new Error("The session cookie requires a valid expiry timestamp.");
  }

  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}
