import { ApiClientError, REQUEST_FAILURE_MESSAGE } from "./api-client-error";
import { isApiSuccess, isJsonObject } from "./contracts";

/** The status and already-parsed body of one axios response. */
export type RawApiResult = { status: number; data: unknown };

/**
 * Converts a rejected response into a client-safe error, preserving the status
 * the API decided on for `401`, `422`, `429`, and other client failures, and
 * collapsing every upstream server error into `502`.
 */
function toClientError(status: number, payload: unknown): ApiClientError {
  if (status >= 500) {
    return ApiClientError.upstreamFailure();
  }

  const message =
    isJsonObject(payload) && typeof payload.message === "string" && payload.message !== ""
      ? payload.message
      : REQUEST_FAILURE_MESSAGE;

  return new ApiClientError(
    status,
    message,
    isJsonObject(payload) ? payload.errors : undefined,
  );
}

/**
 * Unwraps the shared `{ data }` success envelope, returning nothing for a `204`
 * and throwing an `ApiClientError` for every rejected or malformed response, so
 * callers only ever receive validated payload data. Axios has already parsed
 * JSON bodies (or left a non-JSON body as a raw string) by the time this runs.
 */
export function parseApiResponse<T>(result: RawApiResult): T {
  if (result.status === 204) {
    // A no-content success has no envelope to unwrap; `void` callers expect nothing.
    return undefined as T;
  }

  if (result.status < 200 || result.status >= 300) {
    throw toClientError(result.status, result.data);
  }

  if (!isApiSuccess<T>(result.data)) {
    throw ApiClientError.upstreamFailure();
  }

  return result.data.data;
}
