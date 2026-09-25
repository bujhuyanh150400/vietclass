"use client";

import { useEffect, useState } from "react";

import { DEFAULT_DEBOUNCE_MS } from "./use-debounced-value";

/**
 * Keeps an editable search draft local while reporting it after the shared
 * debounce interval. External changes (cleared conditions or browser history)
 * replace the draft immediately.
 */
export function useDebouncedSearch(
  search: string,
  onSearchChange: (value: string) => void,
  delay: number = DEFAULT_DEBOUNCE_MS,
) {
  const [draft, setDraft] = useState(search);
  const [appliedSearch, setAppliedSearch] = useState(search);

  // Keep the input in sync with URL/query state without an extra visible frame.
  if (search !== appliedSearch) {
    setAppliedSearch(search);
    setDraft(search);
  }

  useEffect(() => {
    if (draft === search) {
      return;
    }

    const timer = setTimeout(() => onSearchChange(draft), delay);

    return () => clearTimeout(timer);
  }, [delay, draft, onSearchChange, search]);

  return [draft, setDraft] as const;
}
