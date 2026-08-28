"use client";

import { RouteErrorState } from "@/components/shared/route-error-state";

/**
 * Catches unexpected rendering failures below the protected layout and lets the
 * user retry the failed route without losing the authenticated shell.
 */
export default function ProtectedError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorState onRetry={reset} />;
}
