"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Asks for confirmation before an action that is hard to undo, and shows whatever
 * the API said when that action is refused.
 *
 * The failure is reported inside the dialog rather than after it closes, because
 * the refusal is about the very thing being confirmed — a subject still used by a
 * running class, or a class whose ending would close its whole roster.
 *
 * Presentational: it renders what it is handed and reports the choice upward.
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  errorMessage,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  errorMessage: string | null;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage === null ? null : (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={isPending}
            onClick={(event) => {
              // The dialog must stay open when the API refuses, so the reason can
              // be read; closing is the container's decision once it succeeds.
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? "Đang xử lý…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
