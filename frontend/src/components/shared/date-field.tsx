"use client";

import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/index";

import { Field } from "./field";

/** Parses the API's `yyyy-MM-dd` string into a `Date`, or `undefined` when unset or malformed. */
function parseValue(value: string): Date | undefined {
  if (value === "") {
    return undefined;
  }

  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

/**
 * Renders a labelled date field backed by a calendar popover.
 *
 * The value/onChange contract stays the plain `yyyy-MM-dd` string the API and the
 * Zod schemas already expect, so this only changes how the date is picked, never
 * the shape of the data flowing through the rest of the form.
 */
export function DateField({
  name,
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
  placeholder = "Chọn ngày…",
  disabled = false,
  className,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseValue(value);

  return (
    <Field
      name={name}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={name}
            disabled={disabled}
            aria-invalid={error !== undefined}
            aria-describedby={error !== undefined ? `${name}-error` : undefined}
            className={cn(
              "w-full justify-start font-normal",
              selected === undefined && "text-muted-foreground",
            )}
          >
            <CalendarIcon />
            {selected === undefined ? placeholder : format(selected, "dd/MM/yyyy", { locale: vi })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(date === undefined ? "" : format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
