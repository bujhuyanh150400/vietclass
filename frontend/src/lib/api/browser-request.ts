import axios, { type AxiosResponse } from "axios";

import { ApiClientError } from "./api-client-error";
import type { Page } from "./contracts";
import { parseApiListResponse, parseApiResponse } from "./parse-api-response";

/**
 * Origin the API is served from, without a trailing slash. The API lives on its own
 * subdomain, so the browser needs an absolute origin; an empty value leaves every
 * path relative for a deployment that puts the API behind this app's own origin.
 */
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_ORIGIN ?? "").replace(/\/+$/, "");

/** Resolves an API path against the configured browser API origin without exposing storage URLs. */
export function browserApiUrl(path: string): string {
  return `${API_ORIGIN}${path}`;
}

/** Request options accepted by the browser request helper. */
type BrowserRequestInit = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  onUploadProgress?: (loaded: number, total: number | undefined) => void;
};

/**
 * Calls the API and returns its unwrapped payload. The helper knows nothing about
 * tokens; the browser attaches the HttpOnly session cookie itself, which it will do
 * cross-origin only because the API allows credentials for this exact origin.
 */
export async function browserRequest<T>(
  path: string,
  init: BrowserRequestInit = {},
): Promise<T> {
  const response = await sendBrowserRequest(path, init);

  return parseApiResponse<T>({ status: response.status, data: response.data });
}

/**
 * Calls an API endpoint that answers with a paginated list, returning the rows
 * together with the paging state the list screen needs for its pager.
 */
export async function browserRequestList<T>(
  path: string,
  init: BrowserRequestInit = {},
): Promise<Page<T>> {
  const response = await sendBrowserRequest(path, init);

  return parseApiListResponse<T>({ status: response.status, data: response.data });
}

/**
 * Performs the request itself, leaving every status for the caller's parser and
 * turning an unreachable route into a service failure that echoes nothing.
 */
async function sendBrowserRequest(
  path: string,
  init: BrowserRequestInit,
): Promise<AxiosResponse<unknown>> {
  try {
    return await axios.request<unknown>({
      baseURL: API_ORIGIN,
      url: path,
      method: init.method ?? "GET",
      data: init.body,
      params: init.params,
      signal: init.signal,
      onUploadProgress: init.onUploadProgress
        ? (event) => init.onUploadProgress?.(event.loaded, event.total)
        : undefined,
      headers: { Accept: "application/json" },
      // XHR omits cookies unless credentials are requested, and the session cookie
      // is the only thing authenticating this call. Cross-origin this also makes the
      // browser require the API to name this origin and allow credentials.
      withCredentials: true,
      // Every status resolves here instead of axios throwing, so failure
      // handling can reuse the same envelope parsing as a success.
      validateStatus: () => true,
    });
  } catch {
    // A rejected request means the API was never reached; report it as a
    // service failure without echoing the request or its body.
    throw ApiClientError.serviceUnavailable();
  }
}
