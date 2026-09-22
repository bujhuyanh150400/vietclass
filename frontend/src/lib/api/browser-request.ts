import axios, { type AxiosResponse } from "axios";

import { ApiClientError } from "./api-client-error";
import type { Page } from "./contracts";
import { parseApiListResponse, parseApiResponse } from "./parse-api-response";

/** Resolves API paths against the same-origin Next.js BFF. */
export function browserApiUrl(path: string): string {
  return path;
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
 * Calls the same-origin Next.js BFF and returns its unwrapped payload. The browser
 * sends the HttpOnly frontend session cookie automatically; the BFF attaches the
 * bearer token only on the server-to-server request to Laravel.
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
      url: browserApiUrl(path),
      method: init.method ?? "GET",
      data: init.body,
      params: init.params,
      signal: init.signal,
      onUploadProgress: init.onUploadProgress
        ? (event) => init.onUploadProgress?.(event.loaded, event.total)
        : undefined,
      headers: { Accept: "application/json" },
      // This request is same-origin; the HttpOnly frontend cookie is sent to Next.js,
      // never to Laravel directly.
      withCredentials: false,
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
