"use client";

import { CircleHelp, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** How long typing settles before the search is applied, in milliseconds. */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Renders the compact list toolbar row: a keyword search box — with an optional
 * tooltip explaining what it searches — plus whatever controls a screen supplies
 * on the right, typically a Filter, Sort, and View popover.
 *
 * The search box keeps its own draft value and reports it after a pause, so a list
 * is not refetched on every keystroke. It re-syncs when the applied term changes
 * from outside, such as the browser's back button or a removed condition tag.
 */
export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  searchHelpText,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel: string;
  searchHelpText?: ReactNode;
  children?: ReactNode;
}) {
  const [draft, setDraft] = useState(search);
  const [appliedSearch, setAppliedSearch] = useState(search);

  // Re-sync during render rather than in an effect: when the applied term changes
  // from outside, adjusting here avoids the extra committed render an effect would
  // cause.
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
  }, [draft, onSearchChange, search]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="relative w-full sm:w-64">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
          className={`h-8 ${searchHelpText ? "pr-8" : ""} pl-8 text-xs shadow-none`}
        />
        {searchHelpText ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Các trường có thể tìm kiếm"
                  className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <CircleHelp aria-hidden="true" className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-72">
                {searchHelpText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>

      {children}
    </div>
  );
}
