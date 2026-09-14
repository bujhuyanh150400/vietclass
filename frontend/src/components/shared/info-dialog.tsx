"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/index";

/**
 * Renders an informational dialog on the OpenDesign mock's own dialog chrome: a
 * tinted header band carrying the title and close control, a plain body for
 * content, and a tinted footer band for actions — reproducing the mock's
 * `.dialog-head` / `.dialog-body` / `.dialog-actions` (`assets/app.css`), which
 * shadcn's plain `DialogContent` does not: that primitive is one untinted panel
 * with a close control floated in a corner, not three bordered bands.
 *
 * A shared primitive rather than a per-screen dialog, so a future "show me the
 * detail" or "show me the full list" dialog reuses this chrome instead of
 * re-deriving the header and footer bands from scratch. It wraps `DialogContent`
 * rather than replacing it, so it costs nothing to existing dialogs that render
 * their own header directly.
 */
export function InfoDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Announced with the dialog for assistive technology; the mock's header
   *  carries no visible subtitle, so this stays screen-reader only. */
  description: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "gap-0 overflow-hidden rounded-sheet p-0 shadow-xl sm:max-w-lg",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 rounded-t-sheet border-b border-vc-rule bg-vc-tint px-6 py-[19px]">
          <DialogTitle>{title}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Đóng hộp thoại">
              <X aria-hidden="true" />
            </Button>
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">{description}</DialogDescription>

        <div className="px-6 py-[23px]">{children}</div>

        {footer === undefined ? null : (
          // Unlike the header, the mock's own footer band (`.dialog-actions`) sits
          // on `--surface` — the same near-white as the body and the dialog panel
          // itself — so it stays untinted here too, with only the divider above it.
          <div className="flex flex-wrap items-center justify-end gap-2.5 rounded-b-sheet border-t border-vc-rule px-6 py-4">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Renders the one "quiet" close button an information-only dialog needs.
 *
 * The mock's shared `.btn.quiet` is a transparent-background, 44px control —
 * distinct from shadcn's `outline` variant, which paints a solid background at
 * 36px — so the mock's geometry is reproduced here with an explicit override
 * rather than by adding a new variant to the shared `Button` used everywhere.
 */
export function InfoDialogCloseAction({ label = "Đóng" }: { label?: string }) {
  return (
    <DialogClose asChild>
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-control border-vc-rule bg-transparent px-4 hover:border-foreground hover:bg-vc-tint hover:text-foreground"
      >
        {label}
      </Button>
    </DialogClose>
  );
}
