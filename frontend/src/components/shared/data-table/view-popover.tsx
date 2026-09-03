"use client";

import { Check, Grid2X2, Table2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** The display modes a list screen may switch between. */
export type ListView = "table" | "grid";

/**
 * Renders the View trigger and its popover: switches between the table and a
 * card grid immediately, with an optional note about how the grid paginates.
 */
export function ViewPopover({
  value,
  onChange,
  note,
  triggerLabel = "Chế độ xem",
}: {
  value: ListView;
  onChange: (view: ListView) => void;
  note?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {value === "table" ? <Table2 aria-hidden="true" /> : <Grid2X2 aria-hidden="true" />}
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1.5">
        {([
          ["table", "Bảng", Table2],
          ["grid", "Thẻ", Grid2X2],
        ] as const).map(([optionValue, label, Icon]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => {
              onChange(optionValue);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs hover:bg-muted"
          >
            <Icon aria-hidden="true" className="size-3.5" />
            <span className="grow">{label}</span>
            {value === optionValue ? <Check aria-hidden="true" className="size-3.5 text-vc-orange-deep" /> : null}
          </button>
        ))}
        {note ? (
          <p className="border-t px-2.5 pt-2 pb-1 text-[11px] text-muted-foreground">{note}</p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
