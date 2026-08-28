"use client";

import { RouteErrorState } from "@/components/shared/route-error-state";

/**
 * Replaces the root document when a failure escapes every route-level error
 * boundary, preserving one safe retry action for the visitor.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="flex min-h-svh flex-col bg-background text-foreground">
        <RouteErrorState onRetry={reset} />
      </body>
    </html>
  );
}
