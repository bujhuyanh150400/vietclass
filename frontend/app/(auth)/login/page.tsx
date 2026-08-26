import type { Metadata } from "next";
import { cookies } from "next/headers";

import { LoginScreen } from "@/modules/identity";
import { SESSION_COOKIE_NAME } from "@/modules/identity/server";

export const metadata: Metadata = {
  title: "Đăng nhập",
};

/**
 * Renders the sign-in route. Only whether a session cookie exists is read here —
 * never its value — so the screen can decide between recovering that session and
 * showing the form, while verification stays behind the session endpoint.
 */
export default async function LoginPage() {
  const cookieStore = await cookies();

  return (
    <LoginScreen hasSessionCookie={cookieStore.has(SESSION_COOKIE_NAME)} />
  );
}
