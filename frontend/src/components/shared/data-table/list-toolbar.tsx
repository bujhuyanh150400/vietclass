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
import { cn } from "@/lib/utils/index";

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
 *
 * `align` picks between the two places the row lives. The default `end` trails
 * the controls at the right edge, above a table that owns its own card. `start`
 * is the row printed along the top of a list sheet, where search leads and the
 * controls sit beside it; there `searchClassName` widens the box, since the
 * sheet gives it room a floating toolbar does not.
 *
 * `size` sets the search box's geometry. `sm` is the 32px chip that trails a
 * table's card. `control` is the 44px field a list sheet uses, matching the
 * height and 5px radius of the Filter, Sort, and View triggers beside it — at 32px
 * the search would sit visibly short against them.
 */
export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  searchHelpText,
  align = "end",
  size = "sm",
  searchClassName,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel: string;
  searchHelpText?: ReactNode;
  /** Where the row sits: trailing a table, or leading a list sheet. */
  align?: "start" | "end";
  /** The search box's geometry: a trailing chip, or a sheet's full-height field. */
  size?: "sm" | "control";
  /** Replaces the search box's default width, for a sheet-width search. */
  searchClassName?: string;
  children?: ReactNode;
}) {
  const control = size === "control";
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
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        align === "start" ? "justify-start" : "justify-end",
      )}
    >
      <div className={cn("relative", searchClassName ?? "w-full sm:w-64")}>
        <Search
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
            control ? "left-3 size-[17px]" : "left-2.5 size-3.5",
          )}
        />
        <Input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
          className={cn(
            "text-xs shadow-none md:text-xs",
            searchHelpText && (control ? "pr-9" : "pr-8"),
            control ? "h-11 rounded-control pl-[38px]" : "h-8 pl-8",
          )}
        />
        {searchHelpText ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Các trường có thể tìm kiếm"
                  className={cn(
                    "absolute top-1/2 grid -translate-y-1/2 place-items-center text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    control
                      ? "right-2.5 size-7 rounded-control"
                      : "right-1.5 size-6 rounded-md",
                  )}
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
