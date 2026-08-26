import { z } from "zod";

/**
 * Validates the user object returned by Laravel so an unexpected payload becomes
 * a service error instead of an unsafe value rendered as an identity.
 */
export const currentUserSchema = z.object({
  id: z.number().int(),
  username: z.string().min(1),
  role: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  is_active: z.boolean(),
});

/**
 * Validates the Laravel login payload, requiring a non-empty bearer token and a
 * parsable expiry so the session cookie can never be issued without both.
 */
export const loginResponseSchema = z.object({
  token: z.string().min(1),
  expires_at: z.string().min(1),
  user: currentUserSchema,
});
