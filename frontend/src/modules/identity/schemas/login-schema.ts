import { z } from "zod";

/**
 * Validates login form input before any request leaves the browser and again in
 * the login route. The username is trimmed because surrounding whitespace is
 * never meaningful, while the password is left byte-for-byte intact. Type-level
 * messages are set so a missing or wrong-typed field reports the same Vietnamese
 * copy as an empty one.
 */
export const loginSchema = z.object({
  username: z
    .string({ error: "Vui lòng nhập tên đăng nhập." })
    .trim()
    .min(1, "Vui lòng nhập tên đăng nhập.")
    .max(50, "Tên đăng nhập không được vượt quá 50 ký tự."),
  password: z
    .string({ error: "Vui lòng nhập mật khẩu." })
    .min(1, "Vui lòng nhập mật khẩu.")
    .max(255, "Mật khẩu không được vượt quá 255 ký tự."),
  remember: z.boolean({ error: "Giá trị ghi nhớ đăng nhập không hợp lệ." }).default(false),
});

/** Input accepted by the login form before defaults are applied. */
export type LoginFormInput = z.input<typeof loginSchema>;

/** Login payload after validation, with `remember` always present. */
export type LoginFormValues = z.output<typeof loginSchema>;
