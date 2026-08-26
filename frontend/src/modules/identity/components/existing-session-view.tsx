import { Loader2 } from "lucide-react";
import { type ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import type { ExistingSessionViewModel } from "../hooks/use-existing-session";

/**
 * Renders session-recovery feedback or the login content supplied by its
 * container, without querying, redirecting, or classifying API errors.
 */
export function ExistingSessionView({
  viewModel,
  children,
}: {
  viewModel: ExistingSessionViewModel;
  children: ReactNode;
}) {
  if (viewModel.kind === "checking") {
    return (
      <div
        aria-live="polite"
        role="status"
        className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
      >
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (viewModel.kind === "service-failure") {
    return (
      <div className="grid gap-4">
        <Alert variant="destructive">
          <AlertTitle>Không kiểm tra được phiên đăng nhập</AlertTitle>
          <AlertDescription>{viewModel.message}</AlertDescription>
        </Alert>
        <Button
          type="button"
          variant="outline"
          onClick={viewModel.onRetry}
          disabled={viewModel.isRetrying}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
