import { NextResponse, type NextRequest } from "next/server";

import { isApiClientError } from "@/lib/api/api-client-error";
import { SESSION_COOKIE_NAME, fetchCurrentUser } from "@/modules/identity/server";

/**
 * Recovers the current user for an existing session cookie. A missing, expired,
 * or rejected cookie is removed and answered with `401`, while an unreachable
 * Laravel keeps the cookie so the session survives a transient outage.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token === undefined || token === "") {
    const response = NextResponse.json(
      { message: "Chưa xác thực." },
      { status: 401 },
    );
    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  }

  try {
    const user = await fetchCurrentUser(token);

    return NextResponse.json({ data: user });
  } catch (error) {
    if (isApiClientError(error)) {
      const response = NextResponse.json(
        { message: error.message },
        { status: error.status },
      );

      if (!error.isServiceFailure) {
        response.cookies.delete(SESSION_COOKIE_NAME);
      }

      return response;
    }

    throw error;
  }
}
