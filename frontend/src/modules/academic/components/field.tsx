"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/index";

/**
 * Wraps one form control with its label, optional hint, and validation message.
 *
 * It reproduces the accessibility contract the login form established: the message
 * carries a stable id, the control points at it through `aria-describedby`, and an
 * invalid control is marked with `aria-invalid`. The control itself is passed in,
 * so this works for an input, a select, or a textarea alike.
 */
export function Field({
  name,
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={name} className={cn(error !== undefined && "text-destructive")}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        ) : null}
      </Label>

      {children}

      {hint !== undefined && error === undefined ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error === undefined ? null : (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Builds the accessibility attributes a control inside `Field` must carry, so the
 * wiring is written once instead of repeated on every input.
 */
export function fieldAria(name: string, error?: string, hint?: string) {
  const describedBy = error !== undefined ? `${name}-error` : hint !== undefined ? `${name}-hint` : undefined;

  return {
    id: name,
    "aria-invalid": error !== undefined,
    "aria-describedby": describedBy,
  } as const;
}
