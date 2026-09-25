"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { AppButton } from "@/components/shared/app-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/index";

/**
 * Renders an informational or confirm dialog on the OpenDesign mock's own
 * dialog chrome: a tinted header band carrying the title and close control, a
 * plain body for content, and a plain footer band for actions — reproducing the mock's
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
  confirmLabel,
  destructive = false,
  errorMessage,
  isPending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Announced with the dialog for assistive technology; shown in the body when no custom content is supplied. */
  description: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  confirmLabel?: string;
  destructive?: boolean;
  errorMessage?: string | null;
  isPending?: boolean;
  onConfirm?: () => void;
}) {
  const hasCustomBody = children !== undefined;
  const dialogFooter = footer !== undefined ? footer : onConfirm === undefined ? null : (
    <>
      <DialogClose asChild>
        <AppButton variant="outline" disabled={isPending}>Hủy</AppButton>
      </DialogClose>
      <AppButton
        variant={destructive ? "destructive" : "default"}
        disabled={isPending}
        onClick={onConfirm}
      >
        {isPending ? "Đang xử lý…" : confirmLabel ?? "Xác nhận"}
      </AppButton>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={onConfirm === undefined ? undefined : (event) => event.preventDefault()}
        onPointerDownOutside={onConfirm === undefined ? undefined : (event) => event.preventDefault()}
        className={cn(
          "gap-0 overflow-hidden rounded-sheet p-0 shadow-xl sm:max-w-lg",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 rounded-t-sheet border-b border-vc-rule bg-vc-tint px-6 py-[19px]">
          <DialogTitle>{title}</DialogTitle>
          {onConfirm === undefined ? (
            <DialogClose asChild>
              <AppButton
                variant="ghost"
                size="icon-sm"
                aria-label="Đóng hộp thoại"
                disabled={isPending}
              >
                <X aria-hidden="true" />
              </AppButton>
            </DialogClose>
          ) : null}
        </div>
        {hasCustomBody ? <DialogDescription className="sr-only">{description}</DialogDescription> : null}

        <div className={cn("px-6 py-[23px]", errorMessage !== undefined && "grid gap-4")}>
          {hasCustomBody ? children : <DialogDescription>{description}</DialogDescription>}
          {errorMessage ? (
            <Alert variant="destructive" aria-live="polite">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        {dialogFooter === null ? null : (
          // Unlike the header, the mock's own footer band (`.dialog-actions`) sits
          // on `--surface` — the same near-white as the body and the dialog panel
          // itself — so it stays untinted here too, with only the divider above it.
          <div className="flex flex-wrap items-center justify-end gap-2.5 rounded-b-sheet border-t border-vc-rule px-6 py-4">
            {dialogFooter}
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
 * distinct from shadcn's `outline` variant, so the mock's geometry is reproduced
 * here with an explicit override on the shared `AppButton`.
 */
export function InfoDialogCloseAction({ label = "Đóng" }: { label?: string }) {
  return (
    <DialogClose asChild>
      <AppButton
        variant="ghost"
        className="h-11 border border-vc-rule bg-transparent px-4 hover:border-foreground hover:bg-vc-tint hover:text-foreground"
      >
        {label}
      </AppButton>
    </DialogClose>
  );
}
