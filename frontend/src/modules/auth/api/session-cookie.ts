import "server-only";

/**
 * Name of the first-party HttpOnly cookie that holds the Laravel bearer token.
 * Server code reads it to verify sessions; browser JavaScript cannot read it.
 */
export const SESSION_COOKIE_NAME = "vietclass_browser_token";
