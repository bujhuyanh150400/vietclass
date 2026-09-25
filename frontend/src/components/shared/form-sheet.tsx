"use client";

import type { BaseSyntheticEvent, ReactNode } from "react";

import { cn } from "@/lib/utils/index";

import { FormError } from "./form-error";

/**
 * Renders a form as one sheet, the way `ListSheet` renders a list as one.
 *
 * A long form reads as a single document rather than a stack of cards: the
 * sections sit inside one bordered sheet and are separated by rules, and the
 * submit row is the sheet's own bottom edge instead of a detached button row
 * floating beneath it. On a phone that row sticks to the bottom of the viewport,
 * so a fifteen-field form never hides its own submit button behind a scroll.
 *
 * This is the counterpart to `FormShell`, which keeps the button row outside the
 * content and suits the shorter card-shaped screens. The alert lives above the
 * sheet in both, and is announced politely so a refusal reaches a screen reader
 * without interrupting whatever it is reading.
 *
 * Presentational: it holds no form state of its own.
 */
export function FormSheet({
  onSubmit,
  alertMessage,
  actions,
  className,
  children,
}: {
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  alertMessage: string | null;
  actions: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} noValidate className={cn("grid gap-6", className)}>
      {alertMessage === null ? null : <FormError message={alertMessage} />}

      {/* Deliberately not clipped, for the same two reasons `ListSheet` is not: a
          popover opened inside has to escape it, and `overflow: hidden` would make
          this the containing block for the sticky submit row and kill it. Anything
          with a background of its own therefore rounds its own outer corners. */}
      <div className="rounded-sheet border border-vc-rule bg-card shadow-vc-sheet">
        {children}

        <div className="flex min-h-[78px] flex-wrap items-center justify-end gap-2.5 rounded-b-sheet border-t border-vc-rule bg-card px-5 py-4 max-md:sticky max-md:bottom-0 max-md:z-10 max-md:px-4 max-md:py-3.5 max-md:[box-shadow:0_-5px_20px_var(--vc-shell-rule)] lg:px-8">
          {actions}
        </div>
      </div>
    </form>
  );
}
