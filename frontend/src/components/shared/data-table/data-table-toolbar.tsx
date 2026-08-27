"use client";

import { Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** How long typing settles before the search is applied, in milliseconds. */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Renders the controls above a list: a search box, any filters the screen supplies,
 * and its primary action.
 *
 * The search box keeps its own draft value and reports it after a pause, so a list
 * is not refetched on every keystroke. It re-syncs when the applied term changes
 * elsewhere, such as the browser's back button.
 */
export function DataTableToolbar({
  search,
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  filters,
  action,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  filters?: ReactNode;
  action?: ReactNode;
}) {
  const [draft, setDraft] = useState(search);
  const [appliedSearch, setAppliedSearch] = useState(search);

  // Re-sync during render rather than in an effect: when the applied term changes
  // from outside — the back button, or a cleared filter — adjusting here avoids the
  // extra committed render an effect would cause.
  if (search !== appliedSearch) {
    setAppliedSearch(search);
    setDraft(search);
  }

  useEffect(() => {
    if (draft === search) {
      return;
    }

    const timer = setTimeout(() => onSearchChange(draft), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft, search, onSearchChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="list-search" className="text-xs text-muted-foreground">
            {searchLabel}
          </Label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="list-search"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 sm:w-72"
            />
          </div>
        </div>
        {filters}
      </div>
      {action}
    </div>
  );
}
