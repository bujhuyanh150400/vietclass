import { Loader2 } from "lucide-react";
import { type ReactNode } from "react";

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
        className="flex items-center gap-2.5 py-10 text-[0.9rem] text-vc-text-muted"
      >
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (viewModel.kind === "service-failure") {
    return (
      <div className="grid gap-5">
        <div
          role="alert"
          className="rounded-[3px] border-2 border-vc-ember bg-vc-surface-raised px-4 py-3.5 shadow-[3px_3px_0_0_var(--vc-ember)]"
        >
          <p className="text-[0.9rem] font-bold text-vc-ember">
            Không kiểm tra được phiên đăng nhập
          </p>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-vc-text-muted">
            {viewModel.message}
          </p>
        </div>
        <button
          type="button"
          onClick={viewModel.onRetry}
          disabled={viewModel.isRetrying}
          className="vc-key inline-flex h-12 w-full items-center justify-center gap-2.5 bg-vc-surface-raised text-[0.9rem] font-bold text-vc-text hover:bg-vc-line/8"
        >
          {viewModel.isRetrying ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Thử lại
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
