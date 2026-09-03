import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/** The visual tone of one applied-condition chip. */
export type ConditionTone = "keyword" | "filter" | "sort";

const TONE_CLASSES: Record<ConditionTone, string> = {
  keyword: "border-blue-200 bg-blue-50 text-blue-700",
  filter: "border-orange-200 bg-orange-50 text-vc-orange-deep",
  sort: "border-violet-200 bg-violet-50 text-violet-700",
};

/** Renders one compact, color-coded applied condition with an accessible remove action. */
export function ConditionTag({
  tone,
  label,
  icon,
  onRemove,
}: {
  tone: ConditionTone;
  label: string;
  icon?: ReactNode;
  onRemove: () => void;
}) {
  return (
    <span
      className={`inline-flex h-[22px] items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium ${TONE_CLASSES[tone]}`}
    >
      {icon}
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Bỏ ${label}`}
        className="rounded-sm opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
      >
        <X aria-hidden="true" className="size-3" />
      </button>
    </span>
  );
}

/** Renders the row of applied-condition chips below the toolbar, with a clear-all action. */
export function ConditionsBar({
  onClearAll,
  clearAllLabel = "Xóa tất cả",
  children,
}: {
  onClearAll: () => void;
  clearAllLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5" aria-label="Điều kiện đang áp dụng">
      {children}
      <Button type="button" variant="ghost" size="xs" onClick={onClearAll}>
        {clearAllLabel}
      </Button>
    </div>
  );
}
