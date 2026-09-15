import { type ReactNode } from "react";

import { Label } from "@/components/ui/label";

/**
 * Wraps one login control in the shared sprite block used across the sign-in
 * form: label above, a hard-outlined field body that carries the focus and
 * invalid states for whatever it contains, and the field's error message below.
 * Keeping those states on the wrapper lets the input itself stay unstyled, so a
 * plain field and one with a trailing button read as the same object.
 */
export function LoginFieldShell({
  inputId,
  label,
  error,
  children,
}: {
  inputId: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const isInvalid = error !== undefined;

  return (
    <div className="grid gap-2">
      <Label
        htmlFor={inputId}
        className="text-[0.8rem] font-semibold tracking-[0.01em] text-vc-text"
      >
        {label}
      </Label>

      <div className="vc-field" data-invalid={isInvalid}>
        {children}
      </div>

      {isInvalid ? (
        <p
          id={`${inputId}-error`}
          className="text-[0.8rem] font-medium text-vc-ember"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Class list that strips an input back to bare text inside a field shell. */
export const LOGIN_INPUT_CLASS =
  "h-12 w-full rounded-none border-0 bg-transparent px-3.5 text-[0.95rem] text-vc-text shadow-none ring-0 outline-none md:text-[0.95rem] placeholder:text-vc-text-muted/60 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent";
