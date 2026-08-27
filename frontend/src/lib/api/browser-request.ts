import axios, { type AxiosResponse } from "axios";

import { ApiClientError } from "./api-client-error";
import type { Page } from "./contracts";
import { parseApiListResponse, parseApiResponse } from "./parse-api-response";

/** Request options accepted by the same-origin browser request helper. */
type BrowserRequestInit = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, unknown>;
};

/**
 * Calls a same-origin BFF route and returns its unwrapped payload. The helper
 * knows nothing about tokens, credentials, or environment configuration; the
 * browser attaches the session cookie itself because the request is same-origin.
 */
export async function browserRequest<T>(
  path: string,
  init: BrowserRequestInit = {},
): Promise<T> {
  const response = await sendBrowserRequest(path, init);

  return parseApiResponse<T>({ status: response.status, data: response.data });
}

/**
 * Calls a same-origin BFF route that answers with a paginated list, returning the
 * rows together with the paging state the list screen needs to render its pager.
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
      url: path,
      method: init.method ?? "GET",
      data: init.body,
      params: init.params,
      headers: { Accept: "application/json" },
      // Every status resolves here instead of axios throwing, so failure
      // handling can reuse the same envelope parsing as a success.
      validateStatus: () => true,
    });
  } catch {
    // A rejected request means the route was never reached; report it as a
    // service failure without echoing the request or its body.
    throw ApiClientError.serviceUnavailable();
  }
}
