import type { Metadata } from "next";
import { cookies } from "next/headers";

import { LoginContainer } from "@/modules/identity";
import { SESSION_COOKIE_NAME } from "@/modules/identity/server";

export const metadata: Metadata = {
  title: "Đăng nhập",
};

/**
 * Renders the sign-in route. Only whether a session cookie exists is read here —
 * never its value — then the container handles session recovery and form state.
 */
export default async function LoginPage() {
  const cookieStore = await cookies();

  return <LoginContainer hasSessionCookie={cookieStore.has(SESSION_COOKIE_NAME)} />;
}
