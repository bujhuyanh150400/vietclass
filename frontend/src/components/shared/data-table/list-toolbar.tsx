"use client";

import { CircleHelp, Search } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { cn } from "@/lib/utils/index";

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
 * the search would sit visibly short against them. Control-sized toolbars also
 * share the same responsive width so every academic list aligns.
 */
export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  searchLabel,
  searchHelpText,
  align = "end",
  size = "sm",
  searchClassName,
  filters,
  action,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel: string;
  searchLabel?: string;
  searchHelpText?: ReactNode;
  /** Where the row sits: trailing a table, or leading a list sheet. */
  align?: "start" | "end";
  /** The search box's geometry: a trailing chip, or a sheet's full-height field. */
  size?: "sm" | "control";
  /** Replaces the search box's default width, for a sheet-width search. */
  searchClassName?: string;
  /** Optional legacy filter slot kept in the same shared toolbar renderer. */
  filters?: ReactNode;
  /** Optional primary action placed after the filter slot. */
  action?: ReactNode;
  children?: ReactNode;
}) {
  const control = size === "control";
  const defaultSearchClassName = control
    ? "w-full min-w-0 sm:w-[min(420px,42vw)] sm:min-w-[260px]"
    : "w-full sm:w-64";
  const [draft, setDraft] = useDebouncedSearch(search, onSearchChange);

  const searchControl = (
    <div className={cn("relative", searchClassName ?? defaultSearchClassName)}>
      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          control ? "left-3 size-[17px]" : "left-2.5 size-3.5",
        )}
      />
      <Input
        id={searchLabel ? "list-search" : undefined}
        type="search"
        size={control ? "control" : "compact"}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchAriaLabel}
        className={cn(
          "text-xs shadow-none md:text-xs",
          searchHelpText && (control ? "pr-9" : "pr-8"),
          control ? "pl-[38px]" : "pl-8",
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
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-2",
        align === "start" ? "justify-start" : "justify-end",
      )}
    >
      {searchLabel ? (
        <div className="grid gap-1.5">
          <Label htmlFor="list-search" className="text-xs text-muted-foreground">
            {searchLabel}
          </Label>
          {searchControl}
        </div>
      ) : (
        searchControl
      )}
      {filters}
      {action}
      {children}
    </div>
  );
}
