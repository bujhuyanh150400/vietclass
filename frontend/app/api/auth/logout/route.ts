import { NextResponse, type NextRequest } from "next/server";

import { isApiClientError } from "@/lib/api/api-client-error";
import {
  SESSION_COOKIE_NAME,
  revokeCurrentToken,
} from "@/modules/identity/server";

/**
 * Ends the browser session. Laravel token revocation is attempted when a cookie
 * exists, but the local cookie is always cleared so logout completes even when
 * the upstream call fails, and repeating it without a cookie is a no-op.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token !== undefined && token !== "") {
    try {
      await revokeCurrentToken(token);
    } catch (error) {
      // Local logout must still succeed, so a failed revocation is recorded with
      // only its status and route; the token, headers, and upstream body are
      // never logged.
      const status = isApiClientError(error) ? error.status : "unknown";
      console.warn(
        `Logout revocation failed for POST /api/auth/logout (status ${status}).`,
      );
    }
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}
