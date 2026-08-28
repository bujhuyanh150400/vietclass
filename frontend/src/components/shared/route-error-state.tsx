"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Renders a safe recovery action after an unexpected render failure, without
 * exposing internal error details to the visitor.
 */
export function RouteErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-[50svh] place-items-center px-4 py-10">
      <div className="grid max-w-md justify-items-center gap-5 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert aria-hidden="true" className="size-6" />
        </div>
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Không thể hiển thị trang này
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Đã xảy ra sự cố không mong muốn. Vui lòng thử lại.
          </p>
        </div>
        <Button type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Thử lại
        </Button>
      </div>
    </div>
  );
}
