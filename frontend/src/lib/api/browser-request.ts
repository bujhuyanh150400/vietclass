import axios, { type AxiosResponse } from "axios";

import { ApiClientError } from "./api-client-error";
import { parseApiResponse } from "./parse-api-response";

/** Request options accepted by the same-origin browser request helper. */
type BrowserRequestInit = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
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
  let response: AxiosResponse<unknown>;

  try {
    response = await axios.request<unknown>({
      url: path,
      method: init.method ?? "GET",
      data: init.body,
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

  return parseApiResponse<T>({ status: response.status, data: response.data });
}
