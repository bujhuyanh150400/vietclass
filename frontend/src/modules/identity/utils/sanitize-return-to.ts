/** Destination used whenever a requested return path is absent or not allowed. */
export const DEFAULT_RETURN_TO = "/dashboard";

/** Fixed local base used only to parse a candidate path; it is never navigated to. */
const LOCAL_BASE = "http://localhost";

/** Characters that URL parsing strips or reinterprets, hiding a foreign origin. */
const UNSAFE_CHARACTERS = /[\u0000-\u001f\u007f\\]/;

/**
 * Reduces an untrusted `returnTo` value to a safe in-app destination. Only a
 * single-slash-rooted path inside `/dashboard` is accepted, with its query and
 * hash preserved; absolute URLs, protocol-relative paths, backslash and control
 * character tricks, and every other application path fall back to `/dashboard`.
 */
export function sanitizeReturnTo(value: string | null | undefined): string {
  if (typeof value !== "string") {
    return DEFAULT_RETURN_TO;
  }

  const candidate = value.trim();

  if (candidate === "" || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_RETURN_TO;
  }

  if (UNSAFE_CHARACTERS.test(candidate)) {
    return DEFAULT_RETURN_TO;
  }

  let parsed: URL;

  try {
    parsed = new URL(candidate, LOCAL_BASE);
  } catch {
    return DEFAULT_RETURN_TO;
  }

  if (parsed.origin !== LOCAL_BASE) {
    return DEFAULT_RETURN_TO;
  }

  const { pathname, search, hash } = parsed;

  if (pathname !== DEFAULT_RETURN_TO && !pathname.startsWith(`${DEFAULT_RETURN_TO}/`)) {
    return DEFAULT_RETURN_TO;
  }

  return `${pathname}${search}${hash}`;
}
