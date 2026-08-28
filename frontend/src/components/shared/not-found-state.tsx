import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Renders the consistent recovery screen for a URL that does not resolve to an
 * application page, with a clear route back to a safe destination.
 */
export function NotFoundState({
  returnHref,
  returnLabel,
}: {
  returnHref: string;
  returnLabel: string;
}) {
  return (
    <div className="grid min-h-[50svh] place-items-center px-4 py-10">
      <div className="grid max-w-md justify-items-center gap-5 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <SearchX aria-hidden="true" className="size-6" />
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium text-muted-foreground">Lỗi 404</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Không tìm thấy trang
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Đường dẫn này không tồn tại hoặc đã được di chuyển.
          </p>
        </div>
        <Button asChild>
          <Link href={returnHref}>{returnLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
