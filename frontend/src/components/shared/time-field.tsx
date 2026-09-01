"use client";

import { Input } from "@/components/ui/input";

import { Field, fieldAria } from "./field";

/**
 * Renders a labelled time-of-day field.
 *
 * No screen wires this in yet — every current date field is date-only — but it
 * lives alongside `DateField` so the next feature that needs a time value (for
 * example a class schedule) reuses this instead of reaching for a bare
 * `<input type="time">`. The value is a plain `HH:mm` string, the same shape the
 * native control already produces.
 */
export function TimeField({
  name,
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
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
  disabled?: boolean;
  className?: string;
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
      <Input
        {...fieldAria(name, error, hint)}
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </Field>
  );
}
