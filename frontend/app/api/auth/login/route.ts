import { NextResponse, type NextRequest } from "next/server";
import { flattenError } from "zod";

import { isApiClientError } from "@/lib/api/api-client-error";
import { loginSchema } from "@/modules/identity";
import {
  SESSION_COOKIE_NAME,
  authenticate,
  getSessionCookieOptions,
} from "@/modules/identity/server";

/**
 * Creates a browser session from submitted credentials: validates the request,
 * authenticates against Laravel, stores the bearer token in the HttpOnly session
 * cookie, and returns only the current user so no token reaches the client.
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Dữ liệu không hợp lệ." },
      { status: 422 },
    );
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Dữ liệu không hợp lệ.",
        errors: flattenError(parsed.error).fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const result = await authenticate(parsed.data);

    const response = NextResponse.json({ data: result.user });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      result.token,
      getSessionCookieOptions(result.expiresAt),
    );

    return response;
  } catch (error) {
    if (isApiClientError(error)) {
      return NextResponse.json(
        error.fieldErrors && Object.keys(error.fieldErrors).length > 0
          ? { message: error.message, errors: error.fieldErrors }
          : { message: error.message },
        { status: error.status },
      );
    }

    throw error;
  }
}
