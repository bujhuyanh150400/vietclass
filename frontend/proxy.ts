import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/modules/identity/server";

/**
 * Guards `/dashboard` optimistically. Only the presence of the session cookie is
 * checked — no upstream call and no role parsing happen here — and the requested
 * path is carried to `/login` as `returnTo` so the protected layout can perform
 * the authoritative token verification.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "returnTo",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: "/dashboard/:path*",
};
