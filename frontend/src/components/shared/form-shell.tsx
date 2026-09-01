"use client";

import Link from "next/link";
import type { BaseSyntheticEvent, ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Renders the frame every create and edit screen shares: the fields, a
 * form-level message when the API refuses for a reason no single field owns, and
 * the submit and cancel controls.
 *
 * The message is announced politely so a refusal reaches a screen reader without
 * interrupting whatever it is reading.
 *
 * Presentational: it holds no form state of its own.
 */
export function FormShell({
  onSubmit,
  alertMessage,
  isSubmitting,
  submitLabel,
  cancelHref,
  children,
}: {
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  alertMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  cancelHref: string;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      {alertMessage === null ? null : (
        <Alert variant="destructive" aria-live="polite">
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">{children}</CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu…" : submitLabel}
        </Button>
        <Button type="button" variant="ghost" asChild disabled={isSubmitting}>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
