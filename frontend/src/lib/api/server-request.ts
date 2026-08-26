import "server-only";

import axios, { type AxiosResponse } from "axios";

import { ApiClientError } from "./api-client-error";
import { parseApiResponse } from "./parse-api-response";

/** Base URL used only when `API_BASE_URL` is absent outside production. */
const DEVELOPMENT_BASE_URL = "http://127.0.0.1:8000/api/v1";

/** Longest a single upstream API call may take before it is abandoned. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Request options accepted by the server-only Laravel request helper. */
type ServerRequestInit = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * Resolves the Laravel API base URL without a trailing slash. A missing value
 * is tolerated during local development and rejected as a service failure in
 * production, so no request is ever sent to an unintended host.
 */
function resolveBaseUrl(): string {
  const configured = process.env.API_BASE_URL?.trim();

  if (configured !== undefined && configured !== "") {
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw ApiClientError.serviceUnavailable();
  }

  return DEVELOPMENT_BASE_URL;
}

/**
 * Calls the Laravel API from server code and returns its unwrapped payload.
 * Axios bypasses Next's fetch cache entirely, so every call is already
 * uncached, and the call is abandoned after the fixed timeout, so a slow or
 * unreachable API becomes a service failure instead of a hang.
 */
export async function serverRequest<T>(
  path: string,
  init: ServerRequestInit = {},
): Promise<T> {
  const baseURL = resolveBaseUrl();

  let response: AxiosResponse<unknown>;

  try {
    response = await axios.request<unknown>({
      baseURL,
      url: path,
      method: init.method ?? "GET",
      data: init.body,
      headers: { Accept: "application/json", ...init.headers },
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });
  } catch {
    // Network failures and timeouts must not surface the URL, headers, or body.
    throw ApiClientError.serviceUnavailable();
  }

  return parseApiResponse<T>({ status: response.status, data: response.data });
}
