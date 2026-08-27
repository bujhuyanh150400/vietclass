/**
 * Shape of every successful response returned by the Laravel API and by the
 * same-origin BFF routes that forward it.
 */
export type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

/**
 * Paging state the API reports beside every list, in the API's own snake_case
 * because it is part of the wire contract.
 */
export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** One page of a list: the rows plus the paging state that describes them. */
export type Page<T> = {
  data: T[];
  meta: PageMeta;
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

/**
 * Reports whether a value has every paging field a list envelope must carry, so a
 * malformed `meta` is caught before it reaches a pager.
 */
export function isPageMeta(value: unknown): value is PageMeta {
  return (
    isJsonObject(value) &&
    typeof value.current_page === "number" &&
    typeof value.per_page === "number" &&
    typeof value.total === "number" &&
    typeof value.last_page === "number"
  );
}
