"use client";

import type { BaseSyntheticEvent, ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Renders the frame every schedule dialog shares: the heading, an optional notice
 * explaining what the operation will do, a form-level message when the API refuses
 * for a reason no single field owns, the fields, and the controls.
 *
 * A fixed schedule is edited from the class it belongs to rather than on a page of
 * its own, so these are dialogs rather than full screens; the frame is shared so
 * the four of them cannot drift apart.
 *
 * Presentational: it holds no form state of its own.
 */
export function ScheduleDialogShell({
  title,
  description,
  notice,
  alertMessage,
  isSubmitting,
  submitLabel,
  destructive = false,
  wide = false,
  onSubmit,
  onClose,
  children,
}: {
  title: string;
  description: string;
  /** What the operation will do, when that is not obvious from the fields. */
  notice?: ReactNode;
  alertMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  destructive?: boolean;
  /**
   * Widens the dialog into two columns of fields, and lets it scroll rather than
   * be clipped on a short viewport — the slot form has eight fields.
   */
  wide?: boolean;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className={wide ? "max-h-[90dvh] overflow-y-auto sm:max-w-2xl" : undefined}>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {notice === undefined ? null : (
            <Alert>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          )}

          {alertMessage === null ? null : (
            <Alert variant="destructive" aria-live="polite">
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}

          <div className={wide ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>{children}</div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
