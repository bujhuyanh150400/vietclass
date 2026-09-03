import "server-only";

/**
 * Name of the host-only cookie that holds the Laravel bearer token.
 *
 * Laravel issues and clears this cookie (`config/identity.php: session_cookie`);
 * server code here only reads it to decide whether a session exists at all.
 */
export const SESSION_COOKIE_NAME = "vietclass_token";
