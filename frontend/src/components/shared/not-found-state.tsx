import { SearchX } from "lucide-react";

import { AppButton } from "./app-button";
import { FullPageState } from "./full-page-state";

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
    <FullPageState
      icon={<SearchX aria-hidden="true" className="size-6" />}
      eyebrow="Lỗi 404"
      title="Không tìm thấy trang"
      description="Đường dẫn này không tồn tại hoặc đã được di chuyển."
      action={<AppButton href={returnHref}>{returnLabel}</AppButton>}
    />
  );
}
