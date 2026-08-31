"use client";

import { useEffect, useState } from "react";

/** How long typing settles before a debounced value is reported, in milliseconds. */
export const DEFAULT_DEBOUNCE_MS = 400;

/**
 * Reports a value only once it has stopped changing for `delay` milliseconds.
 *
 * Typing into a search box should not fire one request per keystroke; this keeps
 * the input itself responsive while the value the caller reacts to settles. It
 * matches the pause `DataTableToolbar` already applies to list searches, so every
 * search in the app feels the same.
 */
export function useDebouncedValue<T>(value: T, delay: number = DEFAULT_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (value === debounced) {
      return;
    }

    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, debounced, delay]);

  return debounced;
}
