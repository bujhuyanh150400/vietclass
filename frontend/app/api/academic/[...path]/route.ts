import { NextResponse, type NextRequest } from "next/server";

import { isApiClientError } from "@/lib/api/api-client-error";
import { serverRequestRaw } from "@/lib/api/server-request";
import { SESSION_COOKIE_NAME } from "@/modules/identity/server";

/**
 * The Laravel paths this route may reach, anchored so nothing outside the academic
 * module can be called through it. This is what keeps the route a scoped forwarder
 * rather than a general proxy for the whole API.
 */
const ALLOWED_PATHS: RegExp[] = [
  /^subjects(\/options|\/\d+(\/active)?)?$/,
  /^teachers(\/options|\/\d+(\/account|\/password)?)?$/,
  /^classes(\/options|\/\d+(\/status|\/enrollments|\/available-students)?)?$/,
  /^students(\/\d+(\/account|\/password)?)?$/,
  /^enrollments\/\d+(\/transfer|\/leave)?$/,
];

/** Methods a browser may forward through this route. */
type ForwardableMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Reports whether a requested path is one this route is allowed to forward.
 */
function isAllowed(path: string): boolean {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}

/**
 * Forwards one browser request to Laravel with the bearer token taken from the
 * session cookie, and returns Laravel's status and body unchanged because both
 * sides already share the same envelope.
 *
 * A missing cookie, or a token Laravel rejects, clears the cookie and answers
 * `401`, so an expired session ends here rather than looping through the app.
 */
async function forward(
  request: NextRequest,
  segments: string[],
  method: ForwardableMethod,
): Promise<NextResponse> {
  const path = segments.join("/");

  if (!isAllowed(path)) {
    return NextResponse.json({ message: "Không tìm thấy tài nguyên." }, { status: 404 });
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token === undefined || token === "") {
    const response = NextResponse.json({ message: "Chưa xác thực." }, { status: 401 });
    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  }

  let body: unknown;

  if (method !== "GET" && method !== "DELETE") {
    try {
      body = await request.json();
    } catch {
      body = undefined;
    }
  }

  try {
    const result = await serverRequestRaw(`/${path}${request.nextUrl.search}`, {
      method,
      body,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (result.status === 401) {
      const expired = NextResponse.json({ message: "Chưa xác thực." }, { status: 401 });
      expired.cookies.delete(SESSION_COOKIE_NAME);

      return expired;
    }

    return result.status === 204
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    // Only a request that never reached Laravel arrives here; every answer it did
    // give, including its errors, is forwarded above untouched.
    if (isApiClientError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    throw error;
  }
}

/** Forwards a read request for one academic resource. */
export async function GET(request: NextRequest, context: RouteContext<"/api/academic/[...path]">) {
  const { path } = await context.params;

  return forward(request, path, "GET");
}

/** Forwards a create request for one academic resource. */
export async function POST(request: NextRequest, context: RouteContext<"/api/academic/[...path]">) {
  const { path } = await context.params;

  return forward(request, path, "POST");
}

/** Forwards a full-replacement update for one academic resource. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/academic/[...path]">) {
  const { path } = await context.params;

  return forward(request, path, "PUT");
}

/** Forwards a partial update for one academic resource. */
export async function PATCH(request: NextRequest, context: RouteContext<"/api/academic/[...path]">) {
  const { path } = await context.params;

  return forward(request, path, "PATCH");
}

/** Forwards a delete request for one academic resource. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/academic/[...path]">) {
  const { path } = await context.params;

  return forward(request, path, "DELETE");
}
