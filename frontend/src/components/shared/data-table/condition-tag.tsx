import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/index";

/**
 * The visual tone of one applied-condition chip.
 *
 * The three colour-coded tones say what kind of condition a chip is at a glance
 * on a dense toolbar. `neutral` is for a conditions bar that already sits inside
 * a list sheet, where the chips are grouped under their own heading and colour
 * would compete with the rows below rather than clarify anything.
 */
export type ConditionTone = "keyword" | "filter" | "sort" | "neutral";

/** Colour and geometry for each tone. `neutral` is the taller sheet-bar chip. */
const TONE_CLASSES: Record<ConditionTone, string> = {
  keyword: "h-[22px] gap-1 px-1.5 text-[11px] border-blue-200 bg-blue-50 text-blue-700",
  filter: "h-[22px] gap-1 px-1.5 text-[11px] border-orange-200 bg-orange-50 text-vc-orange-deep",
  sort: "h-[22px] gap-1 px-1.5 text-[11px] border-violet-200 bg-violet-50 text-violet-700",
  neutral:
    "min-h-[30px] shrink-0 gap-1.5 rounded-control py-1 pr-1 pl-2.5 text-xs font-semibold border-vc-rule bg-card text-foreground",
};

/**
 * Renders one applied condition as a removable chip.
 *
 * `caption` names which control produced the condition, so a bar of chips reads
 * as "Khối: 9" rather than a bare "9" whose meaning depends on remembering
 * which filter was touched.
 *
 * The value is capped and ellipsised rather than printed in full: a keyword is
 * free text a reader can paste any length of, and an uncapped chip would push
 * the rest of the bar — including the way back out — off the side.
 */
export function ConditionTag({
  tone,
  label,
  caption,
  icon,
  onRemove,
}: {
  tone: ConditionTone;
  label: string;
  caption?: string;
  icon?: ReactNode;
  onRemove: () => void;
}) {
  const neutral = tone === "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        TONE_CLASSES[tone],
      )}
    >
      {icon}
      {caption ? <small className="font-medium text-muted-foreground">{caption}</small> : null}
      <span className="max-w-[16rem] truncate" title={label}>
        {label}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Bỏ ${caption ? `${caption} ` : ""}${label}`}
        className={cn(
          "rounded-sm opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none",
          neutral &&
            "grid size-6 place-items-center rounded-control text-muted-foreground opacity-100 hover:bg-vc-tint hover:text-foreground",
        )}
      >
        <X aria-hidden="true" className={neutral ? "size-3.5" : "size-3"} />
      </button>
    </span>
  );
}

/**
 * Renders the row of applied-condition chips with a clear-all action.
 *
 * `align` picks between the two places this row lives. The default `end` is the
 * chips trailing a right-aligned toolbar. `start` is the full-width bar inside a
 * list sheet: a heading, then chips that scroll sideways rather than wrapping
 * into a second row that would push the table down as conditions accumulate.
 *
 * Only the chips scroll. Clear-all stays outside that track, because it is the
 * way back out of the conditions being scrolled past — scrolling it off the edge
 * would hide the control precisely when there are enough conditions to need it.
 */
export function ConditionsBar({
  onClearAll,
  clearAllLabel = "Xóa tất cả",
  heading,
  align = "end",
  children,
}: {
  onClearAll: () => void;
  clearAllLabel?: string;
  heading?: string;
  align?: "start" | "end";
  children: ReactNode;
}) {
  const inline = align === "start";

  const clearAll = (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={onClearAll}
      className={cn(inline && "shrink-0 underline underline-offset-[3px]")}
    >
      {clearAllLabel}
    </Button>
  );

  const headingLabel = heading ? (
    <span className="shrink-0 text-xs font-semibold text-muted-foreground">{heading}</span>
  ) : null;

  if (!inline) {
    return (
      <div
        className="flex flex-wrap items-center justify-end gap-1.5"
        aria-label="Điều kiện đang áp dụng"
      >
        {headingLabel}
        {children}
        {clearAll}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[7px]" aria-label="Điều kiện đang áp dụng">
      <div className="flex min-w-0 grow items-center gap-[7px] overflow-x-auto">
        {headingLabel}
        {children}
      </div>
      {clearAll}
    </div>
  );
}
