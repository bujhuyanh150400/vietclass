/**
 * Shape of every successful response returned by the Laravel API and by the
 * same-origin BFF routes that forward it.
 */
export type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

/**
 * Shape of every client-safe error response, where `errors` carries per-field
 * validation messages for a `422`.
 */
export type ApiFailure = {
  message: string;
  errors?: Record<string, string[]>;
};

/**
 * Reports whether a parsed body is a plain JSON object, so callers can inspect
 * its properties without trusting an array, primitive, or `null`.
 */
export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reports whether a parsed body carries the success envelope's `data` key.
 */
export function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  return isJsonObject(value) && "data" in value;
}
