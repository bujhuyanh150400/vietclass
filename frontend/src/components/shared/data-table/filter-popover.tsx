"use client";

import { Filter } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Renders the Filter trigger and its popover shell: a title, a reset action, and
 * whatever filter fields the screen supplies as children.
 *
 * What counts as a filter — grade level, room status, account state — is entirely
 * up to the screen; this only owns the chrome the same way on every list.
 */
export function FilterPopover({
  count,
  onClear,
  children,
  title = "Bộ lọc",
  note,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
  title?: string;
  note?: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={count > 0 ? "border-vc-orange/35 bg-orange-50 text-vc-orange-deep hover:bg-orange-100" : undefined}
        >
          <Filter aria-hidden="true" />
          {title}
          {count > 0 ? (
            <span className="grid size-4 place-items-center rounded-full bg-vc-orange text-[10px] font-semibold text-white">
              {count}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-3">
        <div className="flex items-center justify-between gap-3">
          <PopoverTitle className="text-sm">{title}</PopoverTitle>
          <Button type="button" variant="ghost" size="xs" className="text-vc-orange-deep" onClick={onClear}>
            Đặt lại
          </Button>
        </div>

        {children}

        {note ? <p className="pt-2 text-[11px] text-muted-foreground">{note}</p> : null}
      </PopoverContent>
    </Popover>
  );
}

/** Groups one filter's label and controls inside a FilterPopover. */
export function FilterSection({
  label,
  last = false,
  children,
}: {
  label: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={last ? "grid gap-2 pt-3" : "grid gap-2 border-b py-3"}>
      <p className="text-xs font-medium">{label}</p>
      {children}
    </div>
  );
}
