"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import { AppButton } from "./app-button";
import { FullPageState } from "./full-page-state";

/**
 * Renders a safe recovery action after an unexpected render failure, without
 * exposing internal error details to the visitor.
 */
export function RouteErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <FullPageState
      tone="destructive"
      icon={<TriangleAlert aria-hidden="true" className="size-6" />}
      title="Không thể hiển thị trang này"
      description="Đã xảy ra sự cố không mong muốn. Vui lòng thử lại."
      action={
        <AppButton type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Thử lại
        </AppButton>
      }
    />
  );
}
