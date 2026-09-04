/** Numeric role stored on a Laravel user record. */
export type UserRole = 0 | 1 | 2 | 3;

/**
 * The authenticated identity as the Laravel API exposes it. `is_active` keeps
 * the API's snake_case because it is part of the wire contract.
 */
export type CurrentUser = {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  profile_id: number | null;
  avatar: AvatarValue;
};

/** Login response returned by Laravel before the token is stored in a cookie. */
export type LoginResponse = {
  token: string;
  expires_at: string;
  user: CurrentUser;
};

/** Credentials submitted by the login form. */
export type LoginCredentials = {
  username: string;
  password: string;
  remember: boolean;
};
import type { AvatarValue } from "@/modules/avatar";
