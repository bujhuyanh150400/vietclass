"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/index";

import { Field } from "./field";

/** One choice offered by a select field. */
export type SelectChoice = {
  value: number;
  label: string;
};

/**
 * Renders a labelled single-choice field over a fixed set of numeric options.
 *
 * The API's enums and identifiers are numbers while the select primitive works in
 * strings, so the conversion happens here once instead of at every call site.
 */
export function SelectField({
  name,
  label,
  value,
  choices,
  onChange,
  error,
  hint,
  required = false,
  placeholder = "Chọn…",
  disabled = false,
  className,
  triggerClassName,
}: {
  name: string;
  label: string;
  value: number | undefined;
  choices: SelectChoice[];
  onChange: (value: number) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Restates the trigger's own size and radius, for a screen on the design system's control scale. */
  triggerClassName?: string;
}) {
  return (
    <Field
      name={name}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <Select
        value={value === undefined ? undefined : String(value)}
        onValueChange={(next) => onChange(Number(next))}
        disabled={disabled}
      >
        <SelectTrigger
          id={name}
          aria-invalid={error !== undefined}
          aria-describedby={error !== undefined ? `${name}-error` : undefined}
          className={cn("w-full", triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice.value} value={String(choice.value)}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
