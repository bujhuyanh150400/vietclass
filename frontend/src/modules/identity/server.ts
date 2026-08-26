import "server-only";

export {
  authenticate,
  fetchCurrentUser,
  revokeCurrentToken,
} from "./api/identity-server-api";

export {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "./api/session-cookie";
export type { SessionCookieOptions } from "./api/session-cookie";
