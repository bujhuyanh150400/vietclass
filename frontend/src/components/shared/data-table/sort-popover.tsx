"use client";

import { ArrowUpDown, Check } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/index";

import { COMPACT_BADGE, COMPACT_LABEL, COMPACT_TRIGGER } from "./toolbar-control";

/** One selectable choice in a SortPopover. */
export type SortOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

/**
 * Renders the Sort trigger and its popover menu.
 *
 * Picking a choice applies it immediately and closes the menu — there is no
 * separate "Apply" step, matching every other control on the toolbar.
 */
export function SortPopover<T extends string>({
  value,
  options,
  onChange,
  isActive,
  triggerLabel = "Sắp xếp",
  compact = false,
}: {
  value: T;
  options: SortOption<T>[];
  onChange: (value: T) => void;
  isActive: boolean;
  triggerLabel?: string;
  /** Renders the taller sheet-toolbar trigger that sheds its label when narrow. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            compact && COMPACT_TRIGGER,
            isActive && "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
          )}
        >
          <ArrowUpDown aria-hidden="true" />
          {compact ? <span className={COMPACT_LABEL}>{triggerLabel}</span> : triggerLabel}
          {isActive ? (
            <span
              className={cn(
                "grid size-4 place-items-center rounded-full bg-violet-600 text-[10px] font-semibold text-white",
                compact && COMPACT_BADGE,
              )}
            >
              1
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs hover:bg-muted"
          >
            {option.icon}
            <span className="grow">{option.label}</span>
            {value === option.value ? <Check aria-hidden="true" className="size-3.5 text-violet-600" /> : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
