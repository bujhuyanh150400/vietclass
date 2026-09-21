"use client";

import Image from "next/image";
import { RefreshCw, WifiOff } from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";

/** Reloads the current document after the visitor asks to retry the connection. */
function handleRetry(): void {
  window.location.reload();
}

/** Replaces application content with the approved accessible offline surface. */
export function OfflinePage() {
  return (
    <main
      role="status"
      aria-live="assertive"
      className="grid min-h-svh w-full place-items-center bg-vc-paper bg-[linear-gradient(var(--vc-shell-rule-ink)_1px,transparent_1px),linear-gradient(90deg,var(--vc-shell-rule-ink)_1px,transparent_1px)] bg-[size:22px_22px] px-4 py-6 text-vc-ink sm:px-8 sm:py-10"
    >
      <section className="grid min-h-[calc(100svh-3rem)] w-full max-w-5xl place-items-center rounded-sheet border border-vc-rule bg-vc-surface-raised p-5 shadow-vc-sheet sm:min-h-[calc(100svh-5rem)] sm:p-12">
        <article className="grid w-full max-w-[500px] justify-items-center gap-0 rounded-panel border border-vc-rule bg-vc-surface-raised p-6 text-center shadow-vc-sheet sm:p-11">
          <div className="border-b border-vc-rule pb-5">
            <BrandMark tone="paper" />
          </div>

          <Image
            src="/images/error.webp"
            alt="Chú cú VietClasses hoa mắt vì mất kết nối Internet"
            width={160}
            height={160}
            priority
            className="my-5 size-36 object-contain [image-rendering:pixelated] sm:size-40"
          />

          <div className="inline-flex items-center gap-1.5 rounded-control border border-vc-rule bg-vc-tint px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.02em] text-vc-text-muted">
            <WifiOff aria-hidden="true" className="size-3.5" />
            MẠNG NGOẠI TUYẾN
          </div>

          <h1 className="mt-3 text-[clamp(24px,3vw,30px)] font-semibold leading-[1.3] tracking-[-0.025em]">
            Không có kết nối Internet
          </h1>
          <p className="mt-2 max-w-[39ch] text-[13px] leading-6 text-vc-text-muted">
            Dữ liệu và các thao tác tạm thời chưa khả dụng. Kiểm tra kết nối mạng rồi thử lại.
          </p>

          <Button
            type="button"
            onClick={handleRetry}
            className="mt-6 h-11 rounded-control border border-vc-wood font-semibold shadow-vc-raised has-[>svg]:px-[15px]"
          >
            <RefreshCw aria-hidden="true" className="size-[18px]" />
            Thử lại
          </Button>

          <p className="mt-6 border-t border-vc-rule pt-4 text-[11px] leading-[1.65] text-vc-text-muted">
            Trạng thái này chỉ xuất hiện sau khi ứng dụng đã tải. Làm mới trang khi đang ngoại tuyến chưa được hỗ trợ.
          </p>
        </article>
      </section>
    </main>
  );
}
