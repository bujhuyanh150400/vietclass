import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createUpstreamHeaders, sanitizeLoginPayload } from "@/lib/api/browser-proxy";
import { SESSION_COOKIE_NAME } from "@/modules/auth/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEVELOPMENT_API_BASE_URL = "http://127.0.0.1:8000/api/v1";
const UPSTREAM_TIMEOUT_MS = 10_000;
const FORWARDED_RESPONSE_HEADERS = [
  "cache-control",
  "content-disposition",
  "content-type",
  "etag",
  "expires",
  "location",
  "retry-after",
  "vary",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
] as const;

type RouteContext = { params: Promise<{ path: string[] }> };

type HttpMethod = "DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT";

/** Proxies browser API calls through the frontend origin without exposing the bearer token. */
async function proxyRequest(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const routePath = path.join("/");
  const isLogin = routePath === "auth/login";
  const isLogout = routePath === "auth/logout";
  const isCurrentUser = routePath === "auth/me";

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
    const upstreamUrl = buildUpstreamUrl(path, new URL(request.url).search);
    const body = hasRequestBody(request) ? await request.arrayBuffer() : undefined;
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: createUpstreamHeaders(request, isLogin ? null : token),
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (isLogin && upstreamResponse.ok) {
      return createLoginResponse(upstreamResponse, request);
    }

    const response = createProxyResponse(upstreamResponse);

    if (isLogout || (isCurrentUser && upstreamResponse.status === 401)) {
      clearSessionCookie(response, request);
    }

    return response;
  } catch {
    const response = NextResponse.json(
      { message: "Dịch vụ API tạm thời không khả dụng." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );

    if (isLogout) {
      clearSessionCookie(response, request);
    }

    return response;
  }
}

/** Returns the login identity without ever serializing the token into the browser response. */
async function createLoginResponse(
  upstreamResponse: Response,
  request: Request,
): Promise<Response> {
  let payload: unknown;

  try {
    payload = await upstreamResponse.json();
  } catch {
    return NextResponse.json(
      { message: "Dịch vụ xác thực trả về phản hồi không hợp lệ." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  const session = sanitizeLoginPayload(payload);
  const expiresAt = session === null ? null : new Date(session.expiresAt);

  if (session === null || expiresAt === null || Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json(
      { message: "Dịch vụ xác thực trả về phản hồi không hợp lệ." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = NextResponse.json(session.body, {
    status: upstreamResponse.status,
    headers: { "Cache-Control": "no-store" },
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: session.token,
    expires: expiresAt,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
  });

  return response;
}

/** Forwards status/body and only the response headers the browser needs to render it. */
function createProxyResponse(upstreamResponse: Response): NextResponse {
  const headers = new Headers();

  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstreamResponse.headers.get(name);

    if (value !== null) {
      headers.set(name, value);
    }
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}

/** Builds an API URL from route segments, keeping the configured upstream private to Next.js. */
function buildUpstreamUrl(path: string[], search: string): string {
  const configured = process.env.API_BASE_URL?.trim();

  if (configured === undefined || configured === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("API_BASE_URL is required in production.");
    }

    return `${DEVELOPMENT_API_BASE_URL}/${path.map(encodeURIComponent).join("/")}${search}`;
  }

  return `${configured.replace(/\/+$/, "")}/${path.map(encodeURIComponent).join("/")}${search}`;
}

/** Only requests with bodies are read so GET/HEAD remain valid fetch requests. */
function hasRequestBody(request: Request): request is Request & { method: HttpMethod } {
  return request.method !== "GET" && request.method !== "HEAD" && request.body !== null;
}

/** Deletes the frontend session cookie without forwarding or accepting an API cookie. */
function clearSessionCookie(response: NextResponse, request: Request): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
  });
}

function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

export function GET(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export function POST(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export function PUT(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export function PATCH(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export function DELETE(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export function HEAD(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}
