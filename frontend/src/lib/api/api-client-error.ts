import { isJsonObject } from "./contracts";

/** Copy shown whenever the authentication service cannot be reached or trusted. */
export const SERVICE_FAILURE_MESSAGE =
  "Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại.";

/** Copy used when a rejected request carries no client-safe message of its own. */
export const REQUEST_FAILURE_MESSAGE = "Yêu cầu không hợp lệ.";

/** Status used when the upstream API answered but its response cannot be trusted. */
export const UPSTREAM_FAILURE_STATUS = 502;

/** Status used when the upstream API could not be reached at all. */
export const SERVICE_UNAVAILABLE_STATUS = 503;

/**
 * Removes anything that is not a `field -> string messages` pair, so only
 * validation text the API declared can reach a form or an error message.
 */
function sanitizeFieldErrors(value: unknown): Record<string, string[]> {
  if (!isJsonObject(value)) {
    return {};
  }

  const sanitized: Record<string, string[]> = {};

  for (const [field, messages] of Object.entries(value)) {
    if (!Array.isArray(messages)) {
      continue;
    }

    const texts = messages.filter(
      (message): message is string => typeof message === "string" && message !== "",
    );

    if (texts.length > 0) {
      sanitized[field] = texts;
    }
  }

  return sanitized;
}

/**
 * Carries a failed API request as a status, one message that is safe to display,
 * and sanitized field errors, so no upstream payload, header, or credential can
 * leak through an error object.
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  /**
   * Builds the error from an already client-safe status and message, keeping
   * only validation text that matches the declared field-error shape.
   */
  constructor(status: number, message: string, fieldErrors?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.fieldErrors = sanitizeFieldErrors(fieldErrors);
  }

  /**
   * Builds the error for an upstream response that is malformed or failed with
   * its own server error, hiding the upstream detail behind `502`.
   */
  static upstreamFailure(): ApiClientError {
    return new ApiClientError(UPSTREAM_FAILURE_STATUS, SERVICE_FAILURE_MESSAGE);
  }

  /**
   * Builds the error for a request that never produced a usable response, such
   * as a network failure, a timeout, or missing service configuration.
   */
  static serviceUnavailable(): ApiClientError {
    return new ApiClientError(SERVICE_UNAVAILABLE_STATUS, SERVICE_FAILURE_MESSAGE);
  }

  /**
   * Reports whether the failure is a transient service problem rather than a
   * decision the API made about the request.
   */
  get isServiceFailure(): boolean {
    return (
      this.status === UPSTREAM_FAILURE_STATUS ||
      this.status === SERVICE_UNAVAILABLE_STATUS
    );
  }
}

/**
 * Reports whether an unknown thrown value is an `ApiClientError`.
 */
export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
